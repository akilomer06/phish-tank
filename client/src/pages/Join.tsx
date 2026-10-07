import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ClipboardEvent,
} from 'react';
import {
  AVATARS,
  PLAYER_COLORS,
  joinSchema,
  profileSchema,
  type Profile,
} from '@phish-tank/shared';
import { Avatar, Badge, Button, Card, Modal, Toast } from '../components/ui';
import { Icon } from '../components/Icon';
import { usePreferences } from '../lib/preferences';
import { playSound } from '../lib/feedback';

export default function Join({
  route,
  navigate,
}: {
  route: string;
  navigate: (url: string) => void;
}) {
  const params = new URLSearchParams(route.split('?')[1]);
  const creating = params.get('mode') === 'create';
  const saved = usePreferences((state) => state.profile);
  const saveProfile = usePreferences((state) => state.saveProfile);
  const [name, setName] = useState(saved.name);
  const [avatar, setAvatar] = useState<Profile['avatar']>(saved.avatar);
  const [code, setCode] = useState(() =>
    (params.get('code') ?? '')
      .toUpperCase()
      .replace(/[^A-Z]/g, '')
      .slice(0, 4)
      .split(''),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState(() => {
    try {
      return localStorage.getItem('phish-tank-training-notice') !== 'seen';
    } catch {
      return true;
    }
  });
  const [review, setReview] = useState(false);
  const [toast, setToast] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const nameInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    document.title = `${creating ? 'Create your player' : 'Join your crew'} — Phish Tank`;
    return () => {
      document.title = 'Phish Tank — Trust issues. Now a party game.';
    };
  }, [creating]);
  function dismissNotice() {
    try {
      localStorage.setItem('phish-tank-training-notice', 'seen');
    } catch {
      /* Notice will appear again if storage is blocked. */
    }
    setNotice(false);
  }
  function putCode(index: number, value: string) {
    const letters = value.toUpperCase().replace(/[^A-Z]/g, '');
    setCode((current) => {
      const next = Array.from({ length: 4 }, (_, i) => current[i] ?? '');
      if (!letters) next[index] = '';
      else
        letters
          .slice(0, 4 - index)
          .split('')
          .forEach((letter, offset) => {
            next[index + offset] = letter;
          });
      return next;
    });
    if (letters) inputs.current[Math.min(3, index + letters.length)]?.focus();
    setErrors((current) => ({ ...current, code: '' }));
  }
  function pasteCode(event: ClipboardEvent<HTMLInputElement>, index: number) {
    event.preventDefault();
    putCode(index, event.clipboardData.getData('text'));
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = creating
      ? profileSchema.safeParse({ name, avatar })
      : joinSchema.safeParse({ code: code.join(''), name, avatar });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues)
        next[String(issue.path[0])] = issue.message;
      setErrors(next);
      if (next.code) inputs.current[0]?.focus();
      else nameInput.current?.focus();
      void playSound('fail');
      return;
    }
    setErrors({});
    saveProfile({ name: parsed.data.name, avatar: parsed.data.avatar });
    setName(parsed.data.name);
    setReview(true);
    void playSound('success');
  }
  return (
    <div className="join-page page-container">
      <Button
        variant="ghost"
        className="back-button"
        onClick={() => navigate('/')}
      >
        <Icon name="back" size={18} /> Back to the tank
      </Button>
      <div className="join-layout">
        <aside className="join-intro">
          <Badge color="cyan">
            {creating
              ? 'EVERY CREW NEEDS A RINGLEADER'
              : 'YOUR GROUP CHAT, BUT SHADIER'}
          </Badge>
          <h1 id="page-heading" tabIndex={-1}>
            {creating ? 'Gather your' : 'Your crew is'}
            <br />
            <span className="text-green">
              {creating ? 'usual suspects.' : 'looking sus.'}
            </span>
          </h1>
          <p>
            {creating
              ? 'Pick an alias. Choose your alter ego.'
              : 'Got a room code? Pick your cover identity.'}
            <br />
            Leave your real-life secrets at the door.
          </p>
          <div className="identity-preview">
            <div className="identity-heading mono">
              <span>PLAYER_ID</span>
              <Icon name="shield" size={16} />
            </div>
            <Avatar emoji={avatar} size="large" />
            <strong>{name.trim() || 'Your alter ego'}</strong>
            <span className="mono">CLEARANCE: QUESTIONABLE</span>
            <div className="identity-bars" aria-hidden="true">
              ▍▍▏▌▎▍▏▍▌▏▎▍▍▌▏
            </div>
            <Badge color="cyan">FICTIONAL IDENTITY</Badge>
          </div>
          <div className="join-safety">
            <Icon name="lock" />
            <span>
              Your friends can steal your points.
              <br />
              Keep your real passwords to yourself.
            </span>
          </div>
        </aside>
        <Card className="join-form-card">
          <div className="form-header">
            <span className="eyebrow">// PLAYER SETUP</span>
            <span className="mono muted">01 / 02</span>
          </div>
          <h2>{creating ? 'Meet your alter ego.' : 'Enter the tank.'}</h2>
          <form noValidate onSubmit={submit}>
            {!creating && (
              <fieldset className="code-field">
                <legend>
                  Room code <span>ASK YOUR HOST</span>
                </legend>
                <div className="code-boxes">
                  {Array.from({ length: 4 }, (_, i) => (
                    <input
                      key={i}
                      ref={(node) => {
                        inputs.current[i] = node;
                      }}
                      aria-label={`Room code letter ${i + 1}`}
                      aria-invalid={Boolean(errors.code)}
                      aria-describedby={errors.code ? 'code-error' : undefined}
                      inputMode="text"
                      autoComplete="off"
                      autoCapitalize="characters"
                      spellCheck={false}
                      value={code[i] ?? ''}
                      placeholder="–"
                      onChange={(event) => putCode(i, event.target.value)}
                      onPaste={(event) => pasteCode(event, i)}
                      onFocus={(event) => event.target.select()}
                      onKeyDown={(event) => {
                        if (event.key === 'Backspace' && !code[i] && i > 0)
                          inputs.current[i - 1]?.focus();
                        if (event.key === 'ArrowLeft' && i > 0) {
                          event.preventDefault();
                          inputs.current[i - 1]?.focus();
                        }
                        if (event.key === 'ArrowRight' && i < 3) {
                          event.preventDefault();
                          inputs.current[i + 1]?.focus();
                        }
                      }}
                    />
                  ))}
                </div>
                {errors.code && (
                  <p id="code-error" className="field-error" role="alert">
                    {errors.code}
                  </p>
                )}
              </fieldset>
            )}
            <div className="form-field">
              <label htmlFor="player-name">
                Your alias <span>{name.length}/14</span>
              </label>
              <input
                id="player-name"
                ref={nameInput}
                value={name}
                maxLength={14}
                placeholder="e.g. Byte Bandit"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'name-error' : 'name-hint'}
                onChange={(event) => {
                  setName(event.target.value);
                  setErrors((current) => ({ ...current, name: '' }));
                }}
              />
              {errors.name ? (
                <p id="name-error" className="field-error" role="alert">
                  {errors.name}
                </p>
              ) : (
                <p id="name-hint" className="field-hint">
                  A fake name. A very real reputation.
                </p>
              )}
            </div>
            <fieldset className="avatar-field">
              <legend>Choose your accomplice</legend>
              <div className="avatar-grid">
                {AVATARS.map((emoji, index) => (
                  <button
                    type="button"
                    key={emoji}
                    className={`avatar-option ${avatar === emoji ? 'avatar-selected' : ''}`}
                    aria-label={`Choose ${['frog', 'alien', 'fox', 'octopus', 'robot', 'ghost', 'cat', 'shark', 'mushroom', 'duck', 'panda', 'lightning'][index]} avatar`}
                    aria-pressed={avatar === emoji}
                    onClick={() => {
                      setAvatar(emoji);
                      void playSound('tap');
                    }}
                  >
                    <Avatar
                      emoji={emoji}
                      color={PLAYER_COLORS[index % PLAYER_COLORS.length]}
                    />
                    {avatar === emoji && (
                      <span className="avatar-check">
                        <Icon name="check" size={12} />
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </fieldset>
            <Button type="submit" className="full-width submit-profile">
              Save player profile <Icon name="arrow" />
            </Button>
            <p className="foundation-notice">
              <Icon name="code" size={16} />
              <span>
                Foundation preview. Live room connections arrive in Stage 2.
              </span>
            </p>
          </form>
        </Card>
      </div>
      <Modal
        open={notice}
        onClose={dismissNotice}
        title="Keep it fake. Keep it fun."
      >
        <div className="notice-illustration">
          <Icon name="shield" size={48} />
        </div>
        <p>Use a fake password for your persona. Never type a real one.</p>
        <p className="muted">
          The people, passwords, and scam messages in Phish Tank are all part of
          a simulation.
        </p>
        <Button className="full-width" onClick={dismissNotice}>
          Fake passwords only. Got it. <Icon name="check" />
        </Button>
      </Modal>
      <Modal
        open={review}
        onClose={() => setReview(false)}
        title="Your alter ego is saved."
      >
        <div className="saved-profile">
          <Avatar emoji={avatar} size="large" />
          <h3>{name}</h3>
          <Badge color="cyan">PLAYER PROFILE READY</Badge>
        </div>
        <p>
          Your profile is saved on this device.{' '}
          {creating ? 'Creating a live room' : `Connecting to ${code.join('')}`}{' '}
          will be available in Stage 2.
        </p>
        <Button
          className="full-width"
          onClick={() => {
            setReview(false);
            setToast('Profile saved. Looking suspicious already.');
          }}
        >
          Keep this identity <Icon name="check" />
        </Button>
      </Modal>
      {toast && <Toast message={toast} onDismiss={() => setToast('')} />}
    </div>
  );
}
