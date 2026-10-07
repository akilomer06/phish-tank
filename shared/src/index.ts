import { z } from 'zod';

export const PHASES = [
  'LOBBY',
  'PERSONA',
  'PASSWORD',
  'CRACK_RACE',
  'HACKER',
  'JURY',
  'BOSS',
  'RESULTS',
] as const;
export const phaseSchema = z.enum(PHASES);
export type Phase = z.infer<typeof phaseSchema>;
export const AVATARS = [
  '🐸',
  '👾',
  '🦊',
  '🐙',
  '🤖',
  '👻',
  '🐱',
  '🦈',
  '🍄',
  '🦆',
  '🐼',
  '⚡',
] as const;
export const REACTIONS = ['🔥', '💀', '😂', '🧠', '👀', '🛡️'] as const;
export const PLAYER_COLORS = [
  'green',
  'cyan',
  'magenta',
  'amber',
  'violet',
] as const;
export type Accent = (typeof PLAYER_COLORS)[number];
export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z]{4}$/, 'Enter all 4 letters of your room code.');
export const nameSchema = z
  .string()
  .trim()
  .min(1, 'Your alias needs at least 1 character.')
  .max(14, 'Keep your alias to 14 characters.')
  .regex(
    /^[\p{L}\p{N}_ .-]+$/u,
    'Use letters, numbers, spaces, dots, dashes or underscores.',
  );
export const profileSchema = z
  .object({ name: nameSchema, avatar: z.enum(AVATARS) })
  .strict();
export const settingsSchema = z
  .object({
    rounds: z.number().int().min(1).max(3),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
    sound: z.boolean(),
  })
  .strict();
export const joinSchema = profileSchema
  .extend({ code: roomCodeSchema })
  .strict();
export type Profile = z.infer<typeof profileSchema>;
export type RoomSettings = z.infer<typeof settingsSchema>;
const empty = z.object({}).strict();
const trainingText = z
  .string()
  .trim()
  .min(1)
  .max(280)
  .refine(
    (value) =>
      !/[<>]/u.test(value) &&
      [...value].every(
        (char) => char.charCodeAt(0) >= 32 || char === '\n' || char === '\t',
      ),
    'Use plain text only.',
  );
const password = z
  .string()
  .min(1)
  .max(128)
  .regex(/^[\x20-\x7E]+$/, 'Use printable characters.');

/** This is the single registry for inbound events. No event accepts a player id or score. */
export const incomingSchemas = {
  'room:create': profileSchema,
  'room:join': joinSchema,
  'room:resume': z
    .object({ code: roomCodeSchema, token: z.string().min(32).max(256) })
    .strict(),
  'room:watch': z.object({ code: roomCodeSchema }).strict(),
  'room:leave': empty,
  'lobby:ready': z.object({ ready: z.boolean() }).strict(),
  'lobby:settings': settingsSchema,
  'lobby:add-bots': z
    .object({ count: z.number().int().min(1).max(10) })
    .strict(),
  'game:start': empty,
  'password:submit': z.object({ password }).strict(),
  'hacker:guess': z.object({ guess: password }).strict(),
  'hacker:hint': empty,
  'hacker:scam': z
    .object({
      text: trainingText,
      tactic: z.enum(['Urgency', 'Authority', 'Reward', 'Fear', 'Personal']),
    })
    .strict(),
  'jury:vote': z
    .object({
      messageId: z.string().min(1).max(80),
      vote: z.enum(['REAL', 'SCAM']),
    })
    .strict(),
  'boss:answer': z
    .object({
      stepId: z.string().min(1).max(80),
      optionId: z.string().min(1).max(80),
    })
    .strict(),
  'game:again': empty,
  'reaction:send': z.object({ emoji: z.enum(REACTIONS) }).strict(),
  'clock:ping': z
    .object({ sentAt: z.number().finite().nonnegative() })
    .strict(),
} as const;
export type IncomingEvent = keyof typeof incomingSchemas;
export type EventPayload<E extends IncomingEvent> = z.infer<
  (typeof incomingSchemas)[E]
>;
export const EVENT_PHASES: Record<IncomingEvent, readonly Phase[] | 'ANY'> = {
  'room:create': 'ANY',
  'room:join': ['LOBBY'],
  'room:resume': 'ANY',
  'room:watch': 'ANY',
  'room:leave': 'ANY',
  'lobby:ready': ['LOBBY'],
  'lobby:settings': ['LOBBY'],
  'lobby:add-bots': ['LOBBY'],
  'game:start': ['LOBBY'],
  'password:submit': ['PASSWORD'],
  'hacker:guess': ['HACKER'],
  'hacker:hint': ['HACKER'],
  'hacker:scam': ['HACKER'],
  'jury:vote': ['JURY'],
  'boss:answer': ['BOSS'],
  'game:again': ['RESULTS'],
  'reaction:send': 'ANY',
  'clock:ping': 'ANY',
};
export type ErrorCode =
  | 'INVALID_INPUT'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'GAME_STARTED'
  | 'ROOM_EXPIRED'
  | 'UNAUTHORIZED'
  | 'WRONG_PHASE'
  | 'ALREADY_SUBMITTED'
  | 'TOO_LATE'
  | 'RATE_LIMITED'
  | 'NOT_READY';
export type Ack<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: { code: ErrorCode; message: string } };
export interface Session {
  code: string;
  playerId: string;
  token: string;
}
export interface PublicPlayer extends Profile {
  id: string;
  color: Accent;
  connected: boolean;
  ready: boolean;
  isBot: boolean;
  score: number;
}
export interface Persona {
  firstName: string;
  nickname: string;
  petName: string;
  birthYear: number;
  cricket: string;
  college: string;
  hometown: string;
  food: string;
  movie: string;
  crushInitial: string;
}
export interface RedFlag {
  phrase: string;
  explanation: string;
}
export interface JuryMessage {
  id: string;
  channel: 'SMS' | 'WhatsApp' | 'Email' | 'Call script';
  text: string;
}
export interface JuryReveal {
  messageId: string;
  kind: 'REAL' | 'SCAM';
  authorName: string | null;
  fooled: number;
  redFlags: RedFlag[];
  explanation: string;
}
export interface CrackResult {
  playerId: string;
  maskedPassword: string;
  durationMs: number;
  cracked: boolean;
  survived: boolean;
}
export interface BossStep {
  id: string;
  text: string;
  options: { id: string; text: string }[];
}
export interface SecurityReport {
  playerId: string;
  spotted: number;
  missed: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  fixes: { mistake: string; tip: string }[];
  awards: string[];
}
export type PublicPhaseState =
  | { phase: 'LOBBY' }
  | { phase: 'PERSONA' }
  | { phase: 'PASSWORD'; submittedIds: string[] }
  | { phase: 'CRACK_RACE'; results: CrackResult[] }
  | { phase: 'HACKER'; submittedIds: string[] }
  | {
      phase: 'JURY';
      message: JuryMessage;
      index: number;
      total: number;
      voteCount: number;
      confidence: number;
      reveal: JuryReveal | null;
    }
  | {
      phase: 'BOSS';
      title: string;
      chain: string[];
      step: BossStep;
      defense: number;
      reveal: { correctOptionId: string; explanation: string } | null;
    }
  | { phase: 'RESULTS'; ranking: string[]; reports: SecurityReport[] };
/** Public snapshots exclude tokens, passwords, guess answers and unrevealed authors. */
export interface RoomSnapshot {
  code: string;
  hostId: string;
  players: PublicPlayer[];
  spectatorCount: number;
  settings: RoomSettings;
  round: number;
  endsAt: number | null;
  serverNow: number;
  paused: boolean;
  state: PublicPhaseState;
}
/** Only sent to the authenticated owner, never broadcast to spectators. */
export interface OwnState {
  playerId: string;
  persona: Persona | null;
  target: { playerId: string; persona: Persona } | null;
  passwordSubmitted: boolean;
  scamSubmitted: boolean;
  guessesRemaining: number;
  hints: string[];
  votedMessageIds: string[];
  answeredStepIds: string[];
}
export interface EventResults {
  'room:create': Session;
  'room:join': Session;
  'room:resume': Session;
  'room:watch': { code: string };
  'room:leave': undefined;
  'lobby:ready': undefined;
  'lobby:settings': undefined;
  'lobby:add-bots': undefined;
  'game:start': undefined;
  'password:submit': undefined;
  'hacker:guess': { correct: boolean; attemptsRemaining: number };
  'hacker:hint': { hint: string };
  'hacker:scam': { believability: number };
  'jury:vote': undefined;
  'boss:answer': undefined;
  'game:again': undefined;
  'reaction:send': undefined;
  'clock:ping': { sentAt: number; serverNow: number };
}
export type ClientToServerEvents = {
  [E in IncomingEvent]: (
    payload: EventPayload<E>,
    ack: (result: Ack<EventResults[E]>) => void,
  ) => void;
};
export interface ServerToClientEvents {
  'room:state': (state: RoomSnapshot) => void;
  'player:state': (state: OwnState) => void;
  'room:expired': () => void;
  'reaction:received': (reaction: {
    emoji: (typeof REACTIONS)[number];
    senderId: string;
  }) => void;
  'server:error': (error: { code: ErrorCode; message: string }) => void;
}
