import express from 'express';
import { createServer } from 'node:http';
import { createHmac, randomBytes } from 'node:crypto';
import { isIP } from 'node:net';
import { Server, type Socket } from 'socket.io';
import {
  EVENT_PHASES,
  incomingSchemas,
  type Ack,
  type ClientToServerEvents,
  type EventPayload,
  type EventResults,
  type IncomingEvent,
  type ServerToClientEvents,
} from '@phish-tank/shared';
import {
  MemoryRoomStore,
  RoomError,
  RoomService,
  type RoomOptions,
  type RoomStore,
} from './rooms.js';
import { RateLimiter } from './rate-limit.js';

type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
export interface AppOptions extends RoomOptions {
  origins: string[];
  store?: RoomStore;
  trustProxyHops?: number;
  sweepMs?: number;
}
export function createApplication(options: AppOptions) {
  const app = express();
  const httpServer = createServer(app);
  const rooms = new RoomService(
    options.store ?? new MemoryRoomStore(),
    options,
  );
  const origins = new Set(options.origins);
  const allowed = (origin: string | undefined) =>
    !origin || origins.has(origin);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      maxHttpBufferSize: 8192,
      cors: {
        origin: (origin, callback) => callback(null, allowed(origin)),
        methods: ['GET', 'POST'],
      },
      allowRequest: (request, callback) =>
        callback(null, allowed(request.headers.origin)),
      pingInterval: 10000,
      pingTimeout: 10000,
    },
  );
  app.disable('x-powered-by');
  app.get(['/api/health', '/health'], (_request, response) =>
    response.json({ status: 'ok', stage: 2 }),
  );
  app.use('/api', (_request, response) =>
    response.status(404).json({ error: 'Endpoint not found.' }),
  );
  const perSocket = new RateLimiter(40, 10_000, rooms.now);
  const reactions = new RateLimiter(6, 5_000, rooms.now);
  const connects = new RateLimiter(
    Math.max(80, rooms.maxRoomsPerIp * 10),
    60_000,
    rooms.now,
  );
  const creates = new RateLimiter(
    Math.max(10, rooms.maxRoomsPerIp * 2),
    10 * 60_000,
    rooms.now,
  );
  const attempts = new RateLimiter(
    Math.max(60, rooms.maxRoomsPerIp * 4),
    60_000,
    rooms.now,
  );
  const salt = randomBytes(32);
  function ipKey(socket: GameSocket) {
    const forwarded = socket.handshake.headers['x-forwarded-for'];
    const addresses = [
      ...(typeof forwarded === 'string'
        ? forwarded
            .split(',')
            .map((v) => v.trim())
            .filter((v) => isIP(v))
        : []),
      socket.handshake.address,
    ];
    const address =
      addresses[
        Math.max(0, addresses.length - 1 - (options.trustProxyHops ?? 0))
      ] ?? socket.handshake.address;
    return createHmac('sha256', salt).update(address).digest('hex');
  }
  io.use((socket, next) =>
    connects.allow(ipKey(socket))
      ? next()
      : next(new Error('Too many connection attempts. Try again in a minute.')),
  );
  function publish(code: string) {
    if (!rooms.store.get(code)) return;
    io.to(code).emit('room:state', rooms.snapshot(code));
    for (const player of rooms.room(code).players.values())
      if (player.socketId)
        io.to(player.socketId).emit(
          'player:state',
          structuredClone(player.own),
        );
  }
  io.on('connection', (socket) => {
    const key = ipKey(socket);
    const implemented = new Set<string>();
    socket.onAny((event: string, ...args: unknown[]) => {
      if (implemented.has(event)) return;
      const callback = args.at(-1);
      if (typeof callback !== 'function') return;
      if (!perSocket.allow(socket.id)) {
        callback({
          ok: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Try again shortly.',
          },
        });
        return;
      }
      const schema = Object.hasOwn(incomingSchemas, event)
        ? incomingSchemas[event as IncomingEvent]
        : undefined;
      const valid = schema?.safeParse(args[0]).success;
      callback({
        ok: false,
        error: {
          code: valid ? 'FEATURE_UNAVAILABLE' : 'INVALID_INPUT',
          message: valid
            ? 'That feature is not available in this build.'
            : 'Unknown or invalid request.',
        },
      });
    });
    function register<E extends IncomingEvent>(
      event: E,
      handler: (payload: EventPayload<E>) => EventResults[E],
    ) {
      implemented.add(event);
      const listener = (payload: unknown, callback: unknown) => {
        if (typeof callback !== 'function') return;
        const ack = callback as (value: Ack<EventResults[E]>) => void;
        try {
          if (!perSocket.allow(socket.id))
            throw new RoomError(
              'RATE_LIMITED',
              'Easy on the buttons. Try again in a moment.',
            );
          const parsed = incomingSchemas[event].safeParse(payload);
          if (!parsed.success)
            throw new RoomError(
              'INVALID_INPUT',
              'That request was invalid. Check your input and try again.',
            );
          const membership = rooms.memberships.get(socket.id);
          const phases = EVENT_PHASES[event];
          if (
            membership &&
            phases !== 'ANY' &&
            !phases.includes(rooms.room(membership.code).state.phase)
          )
            throw new RoomError(
              'WRONG_PHASE',
              'That action is not available in this phase.',
            );
          const data = handler(parsed.data as EventPayload<E>);
          ack({ ok: true, data });
          const current = rooms.memberships.get(socket.id);
          if (current && event !== 'clock:ping' && event !== 'reaction:send')
            publish(current.code);
        } catch (error) {
          ack({
            ok: false,
            error:
              error instanceof RoomError
                ? { code: error.code, message: error.message }
                : {
                    code: 'INVALID_INPUT',
                    message: 'The request could not be processed. Try again.',
                  },
          });
        }
      };
      // Socket.IO's conditional listener type loses the E-dependent acknowledgment.
      // The payload is still validated above and the public contract remains typed.
      socket.on(event, listener as Parameters<typeof socket.on<E>>[1]);
    }
    function joinTransport(code: string) {
      void socket.join(code);
    }
    function connectionAttempt() {
      if (!attempts.allow(key))
        throw new RoomError(
          'RATE_LIMITED',
          'Too many room attempts. Try again in a minute.',
        );
    }
    register('room:create', (profile) => {
      if (!creates.allow(key))
        throw new RoomError(
          'RATE_LIMITED',
          'Too many rooms created. Try again later.',
        );
      const session = rooms.create(socket.id, key, profile);
      joinTransport(session.code);
      return session;
    });
    register('room:join', ({ code, ...profile }) => {
      connectionAttempt();
      const session = rooms.join(socket.id, code, profile);
      joinTransport(code);
      return session;
    });
    register('room:resume', ({ code, token }) => {
      connectionAttempt();
      const { session, replacedSocket } = rooms.resume(socket.id, code, token);
      if (replacedSocket && replacedSocket !== socket.id) {
        const old = io.sockets.sockets.get(replacedSocket);
        old?.emit('session:replaced');
        old?.disconnect(true);
      }
      joinTransport(code);
      return session;
    });
    register('room:watch', ({ code }) => {
      connectionAttempt();
      const result = rooms.watch(socket.id, code);
      joinTransport(code);
      return result;
    });
    register('room:leave', () => {
      const code = rooms.leave(socket.id);
      if (code) {
        void socket.leave(code);
        publish(code);
      }
      return undefined;
    });
    register('lobby:ready', ({ ready }) => {
      rooms.ready(socket.id, ready);
      return undefined;
    });
    register('lobby:settings', (settings) => {
      rooms.settings(socket.id, settings);
      return undefined;
    });
    register('game:start', () => rooms.validateStart(socket.id));
    register('clock:ping', ({ sentAt }) => ({
      sentAt,
      serverNow: rooms.now(),
    }));
    register('reaction:send', ({ emoji }) => {
      const member = rooms.memberships.get(socket.id);
      if (!member)
        throw new RoomError(
          'UNAUTHORIZED',
          'Join a room before sending a reaction.',
        );
      if (!reactions.allow(socket.id))
        throw new RoomError('RATE_LIMITED', 'Let that reaction land first.');
      io.to(member.code).emit('reaction:received', {
        emoji,
        senderId: member.id,
      });
      return undefined;
    });
    socket.on('disconnect', () => {
      const code = rooms.leave(socket.id, true);
      if (code) publish(code);
      perSocket.delete(socket.id);
      reactions.delete(socket.id);
    });
  });
  const sweep = setInterval(() => {
    const { expired, changed } = rooms.sweep();
    for (const { code, sockets } of expired)
      for (const id of sockets) {
        const socket = io.sockets.sockets.get(id);
        socket?.emit('room:expired');
        void socket?.leave(code);
      }
    changed.forEach(publish);
    creates.sweep();
    connects.sweep();
    attempts.sweep();
  }, options.sweepMs ?? 1000);
  sweep.unref();
  async function close() {
    clearInterval(sweep);
    for (const room of rooms.store.values()) {
      io.to(room.code).emit('room:expired');
      rooms.expire(room.code);
    }
    await new Promise<void>((resolve) => io.close(() => resolve()));
  }
  return { app, httpServer, io, rooms, publish, close };
}
