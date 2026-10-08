import { create } from 'zustand';
import { setRoomSoundEnabled } from './feedback';
import { io, type Socket } from 'socket.io-client';
import { z } from 'zod';
import {
  roomCodeSchema,
  type Ack,
  type ClientToServerEvents,
  type ErrorCode,
  type EventPayload,
  type EventResults,
  type IncomingEvent,
  type OwnState,
  type Profile,
  type RoomSnapshot,
  type ServerToClientEvents,
  type Session,
} from '@phish-tank/shared';

const endpoint =
  (import.meta.env.VITE_SERVER_URL as string | undefined)?.replace(/\/$/, '') ||
  undefined;
const sessionKey = `phish-tank-session:${endpoint ?? 'same-origin'}`;
const sessionSchema = z.object({
  code: roomCodeSchema,
  playerId: z.string().uuid(),
  token: z.string().min(32).max(256),
});
export function savedSession(): Session | null {
  try {
    const value = sessionSchema.safeParse(
      JSON.parse(localStorage.getItem(sessionKey) ?? 'null'),
    );
    return value.success ? value.data : null;
  } catch {
    return null;
  }
}
function saveSession(session: Session | null) {
  try {
    if (session) localStorage.setItem(sessionKey, JSON.stringify(session));
    else localStorage.removeItem(sessionKey);
  } catch {
    /* The live connection still works when storage is disabled. */
  }
}
export class ConnectionError extends Error {
  constructor(
    public readonly code: ErrorCode | 'CONNECTION_FAILED',
    message: string,
  ) {
    super(message);
  }
}
type Status =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'expired'
  | 'error'
  | 'replaced';
interface ClientState {
  status: Status;
  room: RoomSnapshot | null;
  own: OwnState | null;
  session: Session | null;
  role: 'player' | 'spectator';
  error: string | null;
  clockOffset: number;
  latency: number | null;
  reactions: { id: number; emoji: string; x: number; at: number }[];
}
export const useRoom = create<ClientState>(() => ({
  status: 'idle',
  room: null,
  own: null,
  session: null,
  role: 'player',
  error: null,
  clockOffset: 0,
  latency: null,
  reactions: [],
}));
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let target: {
  code: string;
  role: 'player' | 'spectator';
  session?: Session;
} | null = null;
let clockTimer: ReturnType<typeof setInterval> | undefined;
let cleanupTimer: ReturnType<typeof setTimeout> | undefined;
let reactionTimer: ReturnType<typeof setInterval> | undefined;
let bestRtt = Infinity;
let reactionId = 0;
let retainCount = 0;
let epoch = 0;
let entering = false;
export function roomAction<E extends IncomingEvent>(
  event: E,
  payload: EventPayload<E>,
): Promise<EventResults[E]> {
  const current = socket;
  if (!current?.connected)
    return Promise.reject(
      new ConnectionError(
        'CONNECTION_FAILED',
        'Connection lost. We’re reconnecting you.',
      ),
    );
  return new Promise((resolve, reject) => {
    const listener = (
      error: Error | null,
      result: Ack<EventResults[E]> | undefined,
    ) => {
      if (error || !result) {
        reject(
          new ConnectionError(
            'CONNECTION_FAILED',
            'The server took too long. Please try again.',
          ),
        );
        return;
      }
      if (!result.ok)
        reject(new ConnectionError(result.error.code, result.error.message));
      else resolve(result.data);
    };
    // Preserve the event/payload relationship across Socket.IO's conditional tuple type.
    const timed = current.timeout(8000);
    timed.emit<E>(
      ...([event, payload, listener] as unknown as Parameters<
        typeof timed.emit<E>
      >),
    );
  });
}
async function syncClock(connectionEpoch: number) {
  try {
    const sentAt = Date.now();
    const result = await roomAction('clock:ping', { sentAt });
    const received = Date.now();
    const rtt = received - sentAt;
    if (connectionEpoch !== epoch) return;
    if (rtt <= bestRtt || useRoom.getState().latency === null) {
      bestRtt = rtt;
      useRoom.setState({
        clockOffset: result.serverNow - (sentAt + received) / 2,
        latency: Math.round(rtt / 2),
      });
    }
  } catch {
    /* Reconnection owns network errors; clock sync retries later. */
  }
}
function expire(message: string, status: 'expired' | 'replaced' = 'expired') {
  if (target?.role === 'player' && status !== 'replaced') saveSession(null);
  target = null;
  closeTransport();
  useRoom.setState({
    status,
    error: message,
    room: null,
    own: null,
    session: null,
    reactions: [],
  });
}
function onVisible() {
  if (target && document.visibilityState === 'visible') {
    bestRtt = Infinity;
    void syncClock(epoch);
    socket?.connect();
  }
}
function onOnline() {
  if (target) socket?.connect();
}
function openTransport(): Promise<void> {
  if (socket?.connected) return Promise.resolve();
  if (!socket) {
    const connectionEpoch = ++epoch;
    bestRtt = Infinity;
    socket = io(endpoint, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 700,
      reconnectionDelayMax: 4000,
      timeout: 8000,
      transports: ['websocket', 'polling'],
    });
    const current = socket;
    current.on('room:state', (room) => {
      if (entering || (target && room.code === target.code)) {
        setRoomSoundEnabled(room.settings.sound);
        useRoom.setState({ room, status: 'connected', error: null });
      }
    });
    current.on('player:state', (own) => {
      if (
        entering ||
        (target?.role === 'player' && own.playerId === target.session?.playerId)
      )
        useRoom.setState({ own });
    });
    current.on('room:expired', () => expire('Room expired, start a new one.'));
    current.on('session:replaced', () => {
      expire(
        'Your player is now connected in another tab. Continue there, or join as a new player.',
        'replaced',
      );
    });
    current.on('server:error', (error) =>
      useRoom.setState({ error: error.message }),
    );
    current.on('reaction:received', ({ emoji }) =>
      useRoom.setState((state) => ({
        reactions: [
          ...state.reactions.slice(-23),
          {
            id: ++reactionId,
            emoji,
            x: 10 + Math.random() * 80,
            at: Date.now(),
          },
        ],
      })),
    );
    current.on('disconnect', () => {
      if (
        connectionEpoch === epoch &&
        !['expired', 'replaced'].includes(useRoom.getState().status)
      )
        useRoom.setState({
          status: 'reconnecting',
          error: 'Connection lost. Reconnecting automatically…',
        });
    });
    current.on('connect_error', () => {
      if (connectionEpoch === epoch)
        useRoom.setState({
          status: target ? 'reconnecting' : 'error',
          error:
            'Can’t reach the room server. Check your connection and try again.',
        });
    });
    current.on('connect', () => {
      void syncClock(connectionEpoch);
      const intent = target;
      if (!intent) {
        useRoom.setState({ status: 'connected', error: null });
        return;
      }
      useRoom.setState({ status: 'connecting', error: null });
      const restore =
        intent.role === 'player' && intent.session
          ? roomAction('room:resume', {
              code: intent.code,
              token: intent.session.token,
            })
          : roomAction('room:watch', { code: intent.code });
      void restore.catch((error: unknown) => {
        if (connectionEpoch !== epoch || target !== intent) return;
        if (
          error instanceof ConnectionError &&
          ['ROOM_EXPIRED', 'ROOM_NOT_FOUND'].includes(error.code)
        )
          expire(error.message);
        else
          useRoom.setState({
            status: 'error',
            error:
              error instanceof Error
                ? error.message
                : 'Could not restore this room.',
          });
      });
    });
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);
    clockTimer = setInterval(() => {
      bestRtt = Infinity;
      void syncClock(connectionEpoch);
    }, 20000);
    reactionTimer = setInterval(
      () =>
        useRoom.setState((state) =>
          state.reactions.length
            ? {
                reactions: state.reactions.filter(
                  (r) => Date.now() - r.at < 3000,
                ),
              }
            : state,
        ),
      1000,
    );
  }
  const current = socket;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new ConnectionError(
          'CONNECTION_FAILED',
          'Can’t reach the room server. Check your connection and try again.',
        ),
      );
    }, 10000);
    function cleanup() {
      clearTimeout(timer);
      current.off('connect', connected);
    }
    function connected() {
      cleanup();
      resolve();
    }
    current.once('connect', connected);
    current.connect();
  });
}
function closeTransport() {
  setRoomSoundEnabled(true);
  ++epoch;
  clearInterval(clockTimer);
  clearInterval(reactionTimer);
  document.removeEventListener('visibilitychange', onVisible);
  window.removeEventListener('online', onOnline);
  socket?.removeAllListeners();
  socket?.disconnect();
  socket = null;
}
export async function enterRoom(
  profile: Profile,
  code?: string,
): Promise<Session> {
  // Starting another entry explicitly releases any former seat owned by this tab.
  if (socket?.connected && target) await roomAction('room:leave', {});
  closeTransport();
  target = null;
  saveSession(null);
  useRoom.setState({
    status: 'connecting',
    room: null,
    own: null,
    session: null,
    role: 'player',
    error: null,
    latency: null,
  });
  try {
    await openTransport();
    entering = true;
    const session = code
      ? await roomAction('room:join', { ...profile, code })
      : await roomAction('room:create', profile);
    target = { code: session.code, role: 'player', session };
    saveSession(session);
    useRoom.setState({ session, role: 'player' });
    return session;
  } catch (error) {
    closeTransport();
    useRoom.setState({
      status: 'error',
      error:
        error instanceof Error ? error.message : 'Could not enter the room.',
    });
    throw error;
  } finally {
    entering = false;
  }
}
export function retainRoom(code: string, role: 'player' | 'spectator') {
  clearTimeout(cleanupTimer);
  retainCount++;
  if (target?.code !== code || target.role !== role) {
    closeTransport();
    const session = role === 'player' ? savedSession() : null;
    if (role === 'player' && session?.code !== code) {
      useRoom.setState({
        status: 'expired',
        room: null,
        own: null,
        error:
          'No saved player for this room. Join with your alias to take a seat.',
        session: null,
        role,
      });
      target = null;
    } else {
      target = { code, role, ...(session ? { session } : {}) };
      useRoom.setState({
        room: null,
        own: null,
        session,
        role,
        status: 'connecting',
        error: null,
        latency: null,
      });
      void openTransport().catch(() => {});
    }
  } else if (!socket) {
    useRoom.setState({ status: 'connecting' });
    void openTransport().catch(() => {});
  }
  return () => {
    retainCount = Math.max(0, retainCount - 1);
    cleanupTimer = setTimeout(() => {
      if (!retainCount) closeTransport();
    }, 0);
  };
}
export async function leaveRoom() {
  try {
    if (socket?.connected && target) await roomAction('room:leave', {});
  } finally {
    if (target?.role === 'player') saveSession(null);
    target = null;
    closeTransport();
    useRoom.setState({
      room: null,
      own: null,
      session: null,
      status: 'idle',
      error: null,
      reactions: [],
    });
  }
}
export function retryConnection() {
  if (socket?.connected && target) {
    closeTransport();
  }
  void openTransport().catch(() => {});
}
