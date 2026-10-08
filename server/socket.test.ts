import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { io, type Socket } from 'socket.io-client';
import type { AddressInfo } from 'node:net';
import type {
  Ack,
  EventPayload,
  EventResults,
  IncomingEvent,
  RoomSnapshot,
} from '@phish-tank/shared';
import { createApplication } from './src/app.js';

let runtime: ReturnType<typeof createApplication>;
let url: string;
let clients: Socket[];
const profile = { name: 'Bandit', avatar: '🐸' as const };
async function connect(origin = 'http://allowed.test') {
  const client = io(url, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false,
    extraHeaders: { Origin: origin },
  });
  clients.push(client);
  await new Promise<void>((resolve, reject) => {
    client.once('connect', () => resolve());
    client.once('connect_error', reject);
  });
  return client;
}
function emit<E extends IncomingEvent>(
  client: Socket,
  event: E,
  payload: EventPayload<E>,
): Promise<Ack<EventResults[E]>> {
  return new Promise((resolve, reject) =>
    client
      .timeout(2000)
      .emit(
        event,
        payload,
        (error: Error | null, result: Ack<EventResults[E]>) =>
          error ? reject(error) : resolve(result),
      ),
  );
}
function data<T>(result: Ack<T>) {
  if (!result.ok) throw new Error(result.error.message);
  return result.data;
}
beforeEach(async () => {
  clients = [];
  runtime = createApplication({
    origins: ['http://allowed.test'],
    sweepMs: 25,
  });
  await new Promise<void>((resolve) =>
    runtime.httpServer.listen(0, '127.0.0.1', resolve),
  );
  url = `http://127.0.0.1:${(runtime.httpServer.address() as AddressInfo).port}`;
});
afterEach(async () => {
  clients.forEach((client) => client.disconnect());
  await runtime.close();
});
describe('real Socket.IO contract', () => {
  it('broadcasts lobby changes to players and screen without private fields', async () => {
    const host = await connect();
    const guest = await connect();
    const screen = await connect();
    const session = data(await emit(host, 'room:create', profile));
    const snapshots: RoomSnapshot[] = [];
    const privateMessages: unknown[] = [];
    screen.on('room:state', (value: RoomSnapshot) => snapshots.push(value));
    screen.on('player:state', (value: unknown) => privateMessages.push(value));
    await emit(screen, 'room:watch', { code: session.code });
    const guestSession = data(
      await emit(guest, 'room:join', { ...profile, code: session.code }),
    );
    await emit(guest, 'lobby:ready', { ready: true });
    await expect
      .poll(
        () =>
          snapshots.at(-1)?.players.find((p) => p.id === guestSession.playerId)
            ?.ready,
      )
      .toBe(true);
    expect(snapshots.at(-1)?.players.map((p) => p.name)).toEqual([
      'Bandit',
      'Bandit 2',
    ]);
    expect(JSON.stringify(snapshots)).not.toContain(session.token);
    expect(JSON.stringify(snapshots)).not.toMatch(
      /tokenHash|socketId|creatorKey/,
    );
    expect(privateMessages).toEqual([]);
    expect(await emit(screen, 'lobby:ready', { ready: true })).toMatchObject({
      ok: false,
      error: { code: 'UNAUTHORIZED' },
    });
    expect(
      await emit(guest, 'lobby:settings', {
        rounds: 3,
        difficulty: 'Hard',
        sound: false,
      }),
    ).toMatchObject({ ok: false, error: { code: 'UNAUTHORIZED' } });
    await emit(host, 'lobby:settings', {
      rounds: 3,
      difficulty: 'Hard',
      sound: false,
    });
    await expect.poll(() => snapshots.at(-1)?.settings.rounds).toBe(3);
  });
  it('restores a disconnected owner and hands host to a connected guest', async () => {
    const host = await connect();
    const guest = await connect();
    const session = data(await emit(host, 'room:create', profile));
    const second = data(
      await emit(guest, 'room:join', { ...profile, code: session.code }),
    );
    await emit(host, 'lobby:ready', { ready: true });
    host.disconnect();
    await expect
      .poll(() => runtime.rooms.snapshot(session.code).hostId)
      .toBe(second.playerId);
    const restored = await connect();
    const own = new Promise<unknown>((resolve) =>
      restored.once('player:state', resolve),
    );
    expect(
      data(
        await emit(restored, 'room:resume', {
          code: session.code,
          token: session.token,
        }),
      ).playerId,
    ).toBe(session.playerId);
    expect(await own).toMatchObject({ playerId: session.playerId });
    expect(
      runtime.rooms
        .snapshot(session.code)
        .players.find((p) => p.id === session.playerId)?.ready,
    ).toBe(true);
  });
  it('rejects malformed payloads and bursts without changing state', async () => {
    const client = await connect();
    const session = data(await emit(client, 'room:create', profile));
    const invalid = await new Promise((resolve) =>
      client.emit('lobby:ready', { ready: true, playerId: 'forged' }, resolve),
    );
    expect(invalid).toMatchObject({
      ok: false,
      error: { code: 'INVALID_INPUT' },
    });
    expect(runtime.rooms.snapshot(session.code).players[0]?.ready).toBe(false);
    const results = await Promise.all(
      Array.from({ length: 50 }, () =>
        emit(client, 'clock:ping', { sentAt: Date.now() }),
      ),
    );
    expect(
      results.some(
        (result) => !result.ok && result.error.code === 'RATE_LIMITED',
      ),
    ).toBe(true);
  });
  it('rejects untrusted browser origins on websocket handshakes', async () => {
    await expect(connect('http://untrusted.test')).rejects.toThrow();
  });
  it('answers clock sync, delivers spectator reactions and reports missing rooms', async () => {
    const host = await connect();
    const spectator = await connect();
    const session = data(await emit(host, 'room:create', profile));
    await emit(spectator, 'room:watch', { code: session.code });
    const received = new Promise<unknown>((resolve) =>
      host.once('reaction:received', resolve),
    );
    await emit(spectator, 'reaction:send', { emoji: '🔥' });
    expect(await received).toMatchObject({ emoji: '🔥' });
    const before = Date.now();
    const pong = data(await emit(host, 'clock:ping', { sentAt: 1234 }));
    expect(pong.sentAt).toBe(1234);
    expect(pong.serverNow).toBeGreaterThanOrEqual(before);
    const stranger = await connect();
    expect(
      await emit(stranger, 'room:resume', {
        code: 'ZZZZ',
        token: 'x'.repeat(43),
      }),
    ).toMatchObject({ ok: false, error: { code: 'ROOM_EXPIRED' } });
  });
  it('notifies every connected client when an idle room expires', async () => {
    const client = await connect();
    const session = data(await emit(client, 'room:create', profile));
    const expired = new Promise<void>((resolve) =>
      client.once('room:expired', resolve),
    );
    runtime.rooms.room(session.code).touchedAt = Date.now() - 31 * 60_000;
    await expired;
    expect(runtime.rooms.store.get(session.code)).toBeUndefined();
  });
});
