import { describe, expect, it } from 'vitest';
import { RoomService } from './src/rooms.js';
import { RateLimiter } from './src/rate-limit.js';

const profile = { name: 'Byte Bandit', avatar: '🐸' as const };
function setup() {
  let now = 1000;
  const service = new RoomService(undefined, { now: () => now });
  const host = service.create('host', 'network', profile);
  return {
    service,
    host,
    advance: (ms: number) => {
      now += ms;
    },
  };
}
describe('authoritative rooms', () => {
  it('creates opaque credentials and keeps secrets out of snapshots', () => {
    const { service, host } = setup();
    expect(host.code).toMatch(/^[A-Z]{4}$/);
    expect(host.token.length).toBeGreaterThan(32);
    const player = service.room(host.code).players.get(host.playerId)!;
    expect(player.tokenHash.toString()).not.toBe(host.token);
    expect(JSON.stringify(service.snapshot(host.code))).not.toMatch(
      /token|socketId|connectedAt|disconnectedAt|persona|target|guessesRemaining/,
    );
  });
  it('suffixes case-insensitive duplicate names within 14 characters', () => {
    const { service, host } = setup();
    service.join('two', host.code, { ...profile, name: 'byte bandit' });
    service.join('three', host.code, profile);
    expect(service.snapshot(host.code).players.map((p) => p.name)).toEqual([
      'Byte Bandit',
      'byte bandit 2',
      'Byte Bandit 3',
    ]);
  });
  it('only the host can change settings and spectators cannot ready up', () => {
    const { service, host } = setup();
    service.join('two', host.code, profile);
    service.watch('screen', host.code);
    expect(() =>
      service.settings('two', { rounds: 3, difficulty: 'Hard', sound: false }),
    ).toThrow('Only the host');
    expect(() => service.ready('screen', true)).toThrow('Only a player');
    service.settings('host', { rounds: 3, difficulty: 'Hard', sound: false });
    expect(service.snapshot(host.code).settings).toEqual({
      rounds: 3,
      difficulty: 'Hard',
      sound: false,
    });
    expect(service.snapshot(host.code).players).toHaveLength(2);
  });
  it('transfers host to the longest continuously connected player', () => {
    const { service, host, advance } = setup();
    advance(100);
    const second = service.join('two', host.code, profile);
    advance(100);
    service.join('three', host.code, profile);
    service.leave('host', true);
    expect(service.snapshot(host.code).hostId).toBe(second.playerId);
    service.resume('host-new', host.code, host.token);
    expect(service.snapshot(host.code).hostId).toBe(second.playerId);
  });
  it('restores identity, ready state, permitted owner state and protects a replaced socket', () => {
    const { service, host, advance } = setup();
    service.ready('host', true);
    service.room(host.code).players.get(host.playerId)!.own.hints = [
      'A fictional hint',
    ];
    service.leave('host', true);
    advance(19000);
    const restored = service.resume('new', host.code, host.token);
    expect(restored.session.playerId).toBe(host.playerId);
    expect(service.member('new').player.ready).toBe(true);
    expect(service.member('new').player.own.hints).toEqual([
      'A fictional hint',
    ]);
    expect(service.resume('newer', host.code, host.token).replacedSocket).toBe(
      'new',
    );
    service.leave('new', true);
    expect(service.member('newer').player.connected).toBe(true);
    expect(() => service.ready('new', false)).toThrow('Only a player');
  });
  it('rejects expired and forged sessions and reclaims empty rooms', () => {
    const { service, host, advance } = setup();
    expect(() => service.resume('bad', host.code, 'x'.repeat(43))).toThrow(
      'reconnect window',
    );
    service.leave('host', true);
    advance(20000);
    expect(() => service.resume('late', host.code, host.token)).toThrow(
      'reconnect window',
    );
    service.sweep();
    expect(service.store.get(host.code)).toBeUndefined();
    expect(() => service.resume('restart', host.code, host.token)).toThrow(
      'Room expired',
    );
  });
  it('limits rooms per network, names and membership per socket', () => {
    const service = new RoomService(undefined, {
      maxRoomsPerIp: 1,
      profanity: ['blocked'],
    });
    expect(() =>
      service.create('bad', 'network', { ...profile, name: 'blocked' }),
    ).toThrow('too spicy');
    const session = service.create('one', 'network', profile);
    expect(() => service.create('two', 'network', profile)).toThrow(
      'Too many active',
    );
    expect(() => service.join('one', session.code, profile)).toThrow(
      'Leave your current room',
    );
  });
  it('holds a disconnected slot only for the grace window and caps at 20', () => {
    const { service, host, advance } = setup();
    for (let i = 1; i < 20; i++)
      service.join(`player-${i}`, host.code, profile);
    expect(() => service.join('extra', host.code, profile)).toThrow('full');
    service.leave('player-1', true);
    expect(() => service.join('extra', host.code, profile)).toThrow('full');
    advance(20001);
    service.sweep();
    service.join('extra', host.code, profile);
    expect(service.snapshot(host.code).players).toHaveLength(20);
  });
  it('offers watch-only membership after a game starts and enforces phase guards', () => {
    const { service, host } = setup();
    service.room(host.code).state = { phase: 'PASSWORD', submittedIds: [] };
    expect(() => service.join('late', host.code, profile)).toThrow(
      'already underway',
    );
    service.watch('watcher', host.code);
    expect(service.snapshot(host.code).spectatorCount).toBe(1);
    expect(() => service.ready('host', true)).toThrow(
      'only available in the lobby',
    );
  });
  it('pauses active state on lost quorum and extends the deadline on resume', () => {
    const { service, host, advance } = setup();
    service.join('two', host.code, profile);
    service.join('three', host.code, profile);
    const room = service.room(host.code);
    room.state = { phase: 'PASSWORD', submittedIds: [] };
    room.endsAt = 46000;
    service.leave('host', true);
    expect(service.snapshot(host.code).paused).toBe(true);
    advance(5000);
    service.resume('restored', host.code, host.token);
    expect(service.snapshot(host.code).paused).toBe(false);
    expect(room.endsAt).toBe(51000);
  });
  it('expires idle rooms even if clients remain connected and wipes credentials', () => {
    const { service, host, advance } = setup();
    service.watch('screen', host.code);
    const reference = service.room(host.code).players.get(host.playerId)!;
    advance(30 * 60_000);
    const result = service.sweep();
    expect(result.expired[0]?.sockets).toEqual(['screen', 'host']);
    expect(service.memberships.size).toBe(0);
    expect(reference.tokenHash.every((byte) => byte === 0)).toBe(true);
  });
  it('guards readiness and never fakes the next gameplay stage', () => {
    const { service, host } = setup();
    expect(() => service.validateStart('host')).toThrow('At least 3');
    for (const id of ['two', 'three']) {
      service.join(id, host.code, profile);
      service.ready(id, true);
    }
    service.ready('host', true);
    expect(() => service.validateStart('host')).toThrow('next build');
    expect(service.snapshot(host.code).state.phase).toBe('LOBBY');
  });
});
describe('rate limiter', () => {
  it('limits a burst and replenishes from elapsed wall time', () => {
    let now = 0;
    const limiter = new RateLimiter(2, 1000, () => now);
    expect(limiter.allow('one')).toBe(true);
    expect(limiter.allow('one')).toBe(true);
    expect(limiter.allow('one')).toBe(false);
    expect(limiter.allow('two')).toBe(true);
    now = 1000;
    expect(limiter.allow('one')).toBe(true);
    now = 5000;
    limiter.sweep();
    expect(limiter.allow('one')).toBe(true);
  });
});
