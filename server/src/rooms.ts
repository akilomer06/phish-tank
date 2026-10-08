import {
  createHash,
  randomBytes,
  randomInt,
  randomUUID,
  timingSafeEqual,
} from 'node:crypto';
import {
  PLAYER_COLORS,
  type ErrorCode,
  type OwnState,
  type Profile,
  type PublicPlayer,
  type PublicPhaseState,
  type RoomSettings,
  type RoomSnapshot,
  type Session,
} from '@phish-tank/shared';

export class RoomError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
  ) {
    super(message);
  }
}
export interface Member extends PublicPlayer {
  tokenHash: Buffer;
  socketId: string | null;
  connectedAt: number;
  sequence: number;
  disconnectedAt: number | null;
  own: OwnState;
}
export interface Room {
  code: string;
  hostId: string;
  creatorKey: string;
  players: Map<string, Member>;
  spectators: Map<string, string>;
  settings: RoomSettings;
  state: PublicPhaseState;
  endsAt: number | null;
  pausedAt: number | null;
  round: number;
  touchedAt: number;
}
export interface RoomStore {
  get(code: string): Room | undefined;
  set(room: Room): void;
  delete(code: string): void;
  values(): Iterable<Room>;
}
export class MemoryRoomStore implements RoomStore {
  private rooms = new Map<string, Room>();
  get(code: string) {
    return this.rooms.get(code);
  }
  set(room: Room) {
    this.rooms.set(room.code, room);
  }
  delete(code: string) {
    this.rooms.delete(code);
  }
  values() {
    return this.rooms.values();
  }
}
export interface Membership {
  code: string;
  id: string;
  role: 'player' | 'spectator';
}
export interface RoomOptions {
  now?: () => number;
  idleMs?: number;
  graceMs?: number;
  maxRoomsPerIp?: number;
  profanity?: string[];
}
const hashToken = (token: string) =>
  createHash('sha256').update(token).digest();
export class RoomService {
  readonly memberships = new Map<string, Membership>();
  readonly now: () => number;
  readonly idleMs: number;
  readonly graceMs: number;
  readonly maxRoomsPerIp: number;
  private readonly profanity: Set<string>;
  private sequence = 0;
  constructor(
    readonly store: RoomStore = new MemoryRoomStore(),
    options: RoomOptions = {},
  ) {
    this.now = options.now ?? Date.now;
    this.idleMs = options.idleMs ?? 30 * 60_000;
    this.graceMs = options.graceMs ?? 20_000;
    this.maxRoomsPerIp = options.maxRoomsPerIp ?? 5;
    this.profanity = new Set(
      (options.profanity ?? ['fuck', 'shit', 'bitch', 'asshole']).map((word) =>
        word.toLocaleLowerCase(),
      ),
    );
  }
  private freeSocket(socketId: string) {
    if (this.memberships.has(socketId))
      throw new RoomError(
        'ALREADY_IN_ROOM',
        'Leave your current room before joining another.',
      );
  }
  room(code: string) {
    const room = this.store.get(code);
    if (!room)
      throw new RoomError(
        'ROOM_NOT_FOUND',
        'Room not found. Check those four letters with your host.',
      );
    return room;
  }
  member(socketId: string) {
    const membership = this.memberships.get(socketId);
    if (!membership || membership.role !== 'player')
      throw new RoomError(
        'UNAUTHORIZED',
        'Only a player in this room can do that.',
      );
    const room = this.room(membership.code);
    const player = room.players.get(membership.id);
    if (!player || player.socketId !== socketId)
      throw new RoomError(
        'UNAUTHORIZED',
        'Your player session has changed. Rejoin the room.',
      );
    return { room, player };
  }
  private addPlayer(room: Room, socketId: string, profile: Profile): Session {
    const normalized = profile.name
      .normalize('NFKC')
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 14);
    if (
      normalized
        .toLocaleLowerCase()
        .split(/[\s_.-]+/u)
        .some((word) => this.profanity.has(word))
    )
      throw new RoomError(
        'INVALID_INPUT',
        'That alias is a little too spicy. Try another.',
      );
    const names = new Set(
      [...room.players.values()].map((p) => p.name.toLocaleLowerCase()),
    );
    let name = normalized;
    let suffix = 2;
    while (names.has(name.toLocaleLowerCase())) {
      const ending = ` ${suffix++}`;
      name = normalized.slice(0, 14 - ending.length).trimEnd() + ending;
    }
    const id = randomUUID();
    const token = randomBytes(32).toString('base64url');
    const player: Member = {
      id,
      name,
      avatar: profile.avatar,
      color: PLAYER_COLORS[room.players.size % PLAYER_COLORS.length]!,
      connected: true,
      ready: false,
      isBot: false,
      score: 0,
      tokenHash: hashToken(token),
      socketId,
      connectedAt: this.now(),
      sequence: this.sequence++,
      disconnectedAt: null,
      own: {
        playerId: id,
        persona: null,
        target: null,
        passwordSubmitted: false,
        scamSubmitted: false,
        guessesRemaining: 3,
        hints: [],
        votedMessageIds: [],
        answeredStepIds: [],
      },
    };
    room.players.set(id, player);
    if (!room.hostId) room.hostId = id;
    room.touchedAt = this.now();
    this.memberships.set(socketId, { code: room.code, id, role: 'player' });
    this.presence(room);
    return { code: room.code, playerId: id, token };
  }
  create(socketId: string, creatorKey: string, profile: Profile) {
    this.freeSocket(socketId);
    if (
      [...this.store.values()].filter((room) => room.creatorKey === creatorKey)
        .length >= this.maxRoomsPerIp
    )
      throw new RoomError(
        'RATE_LIMITED',
        'Too many active rooms on this network. Join one or wait for an old room to expire.',
      );
    let code: string;
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    do {
      code = Array.from(
        { length: 4 },
        () => alphabet[randomInt(alphabet.length)],
      ).join('');
    } while (this.store.get(code));
    const room: Room = {
      code,
      hostId: '',
      creatorKey,
      players: new Map(),
      spectators: new Map(),
      settings: { rounds: 1, difficulty: 'Medium', sound: true },
      state: { phase: 'LOBBY' },
      endsAt: null,
      pausedAt: null,
      round: 0,
      touchedAt: this.now(),
    };
    const session = this.addPlayer(room, socketId, profile);
    this.store.set(room);
    return session;
  }
  join(socketId: string, code: string, profile: Profile) {
    this.freeSocket(socketId);
    const room = this.room(code);
    if (room.state.phase !== 'LOBBY')
      throw new RoomError(
        'GAME_STARTED',
        'The game is already underway. Watch the chaos instead.',
      );
    if (room.players.size >= 20)
      throw new RoomError(
        'ROOM_FULL',
        'This tank is full: 20 players. You can still watch.',
      );
    return this.addPlayer(room, socketId, profile);
  }
  resume(
    socketId: string,
    code: string,
    token: string,
  ): { session: Session; replacedSocket: string | null } {
    this.freeSocket(socketId);
    const room = this.store.get(code);
    if (!room)
      throw new RoomError('ROOM_EXPIRED', 'Room expired, start a new one.');
    const tokenHash = hashToken(token);
    const player = [...room.players.values()].find((p) =>
      timingSafeEqual(p.tokenHash, tokenHash),
    );
    if (
      !player ||
      (player.disconnectedAt !== null &&
        this.now() - player.disconnectedAt >= this.graceMs)
    )
      throw new RoomError(
        'ROOM_EXPIRED',
        'Your reconnect window ended. Join again to claim a new seat.',
      );
    const replacedSocket = player.socketId;
    if (replacedSocket) this.memberships.delete(replacedSocket);
    player.socketId = socketId;
    player.connected = true;
    player.connectedAt = this.now();
    player.disconnectedAt = null;
    this.memberships.set(socketId, { code, id: player.id, role: 'player' });
    room.touchedAt = this.now();
    this.presence(room);
    return { session: { code, playerId: player.id, token }, replacedSocket };
  }
  watch(socketId: string, code: string) {
    this.freeSocket(socketId);
    const room = this.room(code);
    if (room.spectators.size >= 100)
      throw new RoomError(
        'ROOM_FULL',
        'The viewing gallery is full. Try again shortly.',
      );
    const id = randomUUID();
    room.spectators.set(socketId, id);
    this.memberships.set(socketId, { code, id, role: 'spectator' });
    room.touchedAt = this.now();
    return { code };
  }
  ready(socketId: string, ready: boolean) {
    const { room, player } = this.member(socketId);
    if (room.state.phase !== 'LOBBY')
      throw new RoomError(
        'WRONG_PHASE',
        'Ready checks are only available in the lobby.',
      );
    player.ready = ready;
    room.touchedAt = this.now();
  }
  settings(socketId: string, settings: RoomSettings) {
    const { room, player } = this.member(socketId);
    if (room.hostId !== player.id)
      throw new RoomError(
        'UNAUTHORIZED',
        'Only the host can change room settings.',
      );
    if (room.state.phase !== 'LOBBY')
      throw new RoomError('WRONG_PHASE', 'Settings lock once a game starts.');
    room.settings = { ...settings };
    room.touchedAt = this.now();
  }
  validateStart(socketId: string): never {
    const { room, player } = this.member(socketId);
    if (room.hostId !== player.id)
      throw new RoomError('UNAUTHORIZED', 'Only the host can start.');
    if (room.state.phase !== 'LOBBY')
      throw new RoomError('WRONG_PHASE', 'The game has already started.');
    const connected = [...room.players.values()].filter((p) => p.connected);
    if (connected.length < 3 || connected.some((p) => !p.ready))
      throw new RoomError(
        'NOT_READY',
        'At least 3 connected players must all be ready.',
      );
    // Do not enter a partial game phase before the gameplay stage is built.
    throw new RoomError(
      'FEATURE_UNAVAILABLE',
      'Your crew is ready. Gameplay arrives in the next build.',
    );
  }
  leave(socketId: string, disconnect = false) {
    const membership = this.memberships.get(socketId);
    if (!membership) return undefined;
    this.memberships.delete(socketId);
    const room = this.store.get(membership.code);
    if (!room) return membership.code;
    if (membership.role === 'spectator') room.spectators.delete(socketId);
    else {
      const player = room.players.get(membership.id);
      if (player?.socketId === socketId) {
        if (disconnect) {
          player.connected = false;
          player.socketId = null;
          player.disconnectedAt = this.now();
        } else {
          player.tokenHash.fill(0);
          room.players.delete(player.id);
        }
      }
    }
    room.touchedAt = this.now();
    this.presence(room);
    return room.code;
  }
  private presence(room: Room) {
    const connected = [...room.players.values()]
      .filter((p) => p.connected)
      .sort((a, b) => a.connectedAt - b.connectedAt || a.sequence - b.sequence);
    const host = room.players.get(room.hostId);
    if (!host?.connected && connected[0]) room.hostId = connected[0].id;
    if (room.state.phase === 'LOBBY' || room.state.phase === 'RESULTS') return;
    if (connected.length < 3 && room.pausedAt === null)
      room.pausedAt = this.now();
    else if (connected.length >= 3 && room.pausedAt !== null) {
      if (room.endsAt !== null) room.endsAt += this.now() - room.pausedAt;
      room.pausedAt = null;
    }
  }
  snapshot(code: string): RoomSnapshot {
    const room = this.room(code);
    return {
      code,
      hostId: room.hostId,
      players: [...room.players.values()].map(
        ({ id, name, avatar, color, connected, ready, isBot, score }) => ({
          id,
          name,
          avatar,
          color,
          connected,
          ready,
          isBot,
          score,
        }),
      ),
      spectatorCount: room.spectators.size,
      settings: { ...room.settings },
      round: room.round,
      endsAt: room.endsAt,
      serverNow: this.now(),
      paused: room.pausedAt !== null,
      state: structuredClone(room.state),
      capabilities: { gameplay: false, bots: false },
    };
  }
  expire(code: string) {
    const room = this.store.get(code);
    if (!room) return [];
    const sockets = [
      ...room.spectators.keys(),
      ...[...room.players.values()].flatMap((p) =>
        p.socketId ? [p.socketId] : [],
      ),
    ];
    for (const socket of sockets) this.memberships.delete(socket);
    for (const player of room.players.values()) {
      player.tokenHash.fill(0);
      player.own = {
        playerId: player.id,
        persona: null,
        target: null,
        passwordSubmitted: false,
        scamSubmitted: false,
        guessesRemaining: 0,
        hints: [],
        votedMessageIds: [],
        answeredStepIds: [],
      };
    }
    room.players.clear();
    room.spectators.clear();
    this.store.delete(code);
    return sockets;
  }
  sweep() {
    const expired: { code: string; sockets: string[] }[] = [];
    const changed: string[] = [];
    for (const room of this.store.values()) {
      for (const player of room.players.values()) {
        if (
          player.disconnectedAt !== null &&
          this.now() - player.disconnectedAt >= this.graceMs
        ) {
          player.tokenHash.fill(0);
          room.players.delete(player.id);
          changed.push(room.code);
        }
      }
      if (!room.players.size || this.now() - room.touchedAt >= this.idleMs)
        expired.push({ code: room.code, sockets: this.expire(room.code) });
      else this.presence(room);
    }
    return {
      expired,
      changed: [...new Set(changed)].filter((code) => this.store.get(code)),
    };
  }
}
