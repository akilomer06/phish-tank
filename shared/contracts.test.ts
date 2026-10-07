import { describe, expect, it } from 'vitest';
import {
  AVATARS,
  EVENT_PHASES,
  incomingSchemas,
  joinSchema,
  nameSchema,
  roomCodeSchema,
} from './src/index.js';

describe('boundary validation', () => {
  it('normalizes copied room codes and trimmed aliases', () => {
    expect(
      joinSchema.parse({
        code: ' tide ',
        name: ' Byte Bandit ',
        avatar: AVATARS[0],
      }),
    ).toEqual({ code: 'TIDE', name: 'Byte Bandit', avatar: '🐸' });
  });
  it.each(['ABC', 'ABCDE', '1234', '<img', 'A B C D'])(
    'rejects invalid code %s',
    (code) => expect(roomCodeSchema.safeParse(code).success).toBe(false),
  );
  it.each(['', 'abcdefghijklmnop', '<script>', 'name\nnext'])(
    'rejects unsafe or invalid alias %s',
    (name) => expect(nameSchema.safeParse(name).success).toBe(false),
  );
  it('permits international aliases', () =>
    expect(nameSchema.safeParse('आरव').success).toBe(true));
  it('rejects forged authority and out-of-range settings', () => {
    expect(
      incomingSchemas['password:submit'].safeParse({
        password: 'fake only',
        score: 300,
      }).success,
    ).toBe(false);
    expect(
      incomingSchemas['jury:vote'].safeParse({
        messageId: 'one',
        vote: 'SCAM',
        playerId: 'other',
      }).success,
    ).toBe(false);
    expect(
      incomingSchemas['lobby:settings'].safeParse({
        rounds: 4,
        difficulty: 'Easy',
        sound: true,
      }).success,
    ).toBe(false);
  });
  it('bounds training messages and rejects markup', () => {
    for (const text of ['x'.repeat(281), '<script>alert(1)</script>', ''])
      expect(
        incomingSchemas['hacker:scam'].safeParse({ text, tactic: 'Fear' })
          .success,
      ).toBe(false);
  });
  it('requires a phase policy for every inbound event', () =>
    expect(Object.keys(incomingSchemas).sort()).toEqual(
      Object.keys(EVENT_PHASES).sort(),
    ));
});
