import { useState } from 'react';
import {
  Avatar,
  Badge,
  BottomSheet,
  Button,
  Card,
  CrackBar,
  EmojiReactionBar,
  EmptyState,
  ErrorState,
  LearnCard,
  Modal,
  PlayerChip,
  Podium,
  ProgressBar,
  Skeleton,
  StrengthMeter,
  SwipeCard,
  TimerRing,
  Toast,
  TypewriterText,
} from '../components/ui';
import { Icon } from '../components/Icon';
import { celebrate, playSound, type Sound } from '../lib/feedback';

export default function Gallery() {
  const [overlay, setOverlay] = useState<'modal' | 'sheet' | 'learn' | null>(
    null,
  );
  const [toast, setToast] = useState('');
  const [endsAt, setEndsAt] = useState(() => Date.now() + 20000);
  const [vote, setVote] = useState<string | null>(null);
  const [strength, setStrength] = useState(70);
  return (
    <div className="gallery page-container">
      <div className="gallery-heading">
        <Badge color="violet">INTERACTIVE COMPONENT LAB</Badge>
        <h1 id="page-heading" tabIndex={-1}>
          Neon Terminal Arcade<span className="text-green">.</span>
        </h1>
        <p>
          Every control below is interactive. Sample values are for design
          review only.
        </p>
      </div>
      <div className="gallery-grid">
        <Card>
          <h2>Buttons & badges</h2>
          <div className="component-row">
            <Button onClick={() => setToast('Primary action received.')}>
              Primary <Icon name="arrow" />
            </Button>
            <Button
              variant="secondary"
              onClick={() => setToast('Secondary action received.')}
            >
              Secondary
            </Button>
            <Button
              variant="danger"
              onClick={() => setToast('Danger action received.')}
            >
              Danger
            </Button>
            <Button
              variant="ghost"
              onClick={() => setToast('Ghost action received.')}
            >
              Ghost
            </Button>
            <Button disabled>Disabled</Button>
          </div>
          <div className="component-row">
            <Badge>✓ READY</Badge>
            <Badge color="cyan">INFO</Badge>
            <Badge color="magenta">✕ SCAM</Badge>
            <Badge color="amber">! LOW TIME</Badge>
            <Badge color="violet">BOSS</Badge>
          </div>
        </Card>
        <Card>
          <h2>Player identity</h2>
          <div className="component-row">
            <Avatar emoji="🐸" />
            <Avatar emoji="👾" color="cyan" />
            <Avatar emoji="🦊" color="magenta" />
            <Avatar emoji="👻" color="violet" />
          </div>
          <div className="component-row">
            <PlayerChip name="Byte Bandit" emoji="🐸" host ready />
            <PlayerChip name="Ctrl Alt Defeat" emoji="👾" color="cyan" />
          </div>
          <EmojiReactionBar
            onReact={(emoji) =>
              setToast(`Reaction sent in this demo: ${emoji}`)
            }
          />
        </Card>
        <Card>
          <h2>Server timestamp timer</h2>
          <div className="timer-demo">
            <TimerRing endsAt={endsAt} durationMs={20000} />
            <Button
              variant="secondary"
              onClick={() => setEndsAt(Date.now() + 20000)}
            >
              Restart 20 seconds
            </Button>
          </div>
          <p className="small muted">
            Uses an absolute deadline, including after the tab sleeps.
          </p>
        </Card>
        <Card>
          <h2>Strength & race</h2>
          <label className="range-label" htmlFor="strength">
            Sample strength: {strength}
            <input
              id="strength"
              type="range"
              value={strength}
              onChange={(event) => setStrength(Number(event.target.value))}
            />
          </label>
          <StrengthMeter
            value={strength}
            label={
              strength < 40
                ? 'Easy bait'
                : strength < 70
                  ? 'Getting there'
                  : 'Vault material'
            }
          />
          <CrackBar
            name="Byte Bandit"
            progress={strength}
            complete={strength === 100}
          />
          <ProgressBar value={60} label="Team defense" color="violet" />
        </Card>
        <Card>
          <h2>Anonymous jury card</h2>
          <SwipeCard
            onVote={(next) => {
              setVote(next);
              setToast(`Demo vote recorded: ${next}`);
            }}
            disabled={vote !== null}
          >
            <Badge color="amber">TRAINING CONTENT · SMS</Badge>
            <p className="sample-message">
              Your package is waiting at the campus mailroom. Bring your student
              ID to collect it.
            </p>
            <p className="small muted">
              Swipe left for scam, right for real. Buttons work too.
            </p>
          </SwipeCard>
          {vote && (
            <Button variant="ghost" onClick={() => setVote(null)}>
              You voted {vote}. Reset card <Icon name="arrow" />
            </Button>
          )}
        </Card>
        <Card>
          <h2>Modals & learning</h2>
          <div className="component-row">
            <Button variant="secondary" onClick={() => setOverlay('modal')}>
              Open modal
            </Button>
            <Button variant="secondary" onClick={() => setOverlay('sheet')}>
              Open bottom sheet
            </Button>
            <Button onClick={() => setOverlay('learn')}>Open learn card</Button>
          </div>
          <div className="terminal-sample">
            <span className="text-green">$ </span>
            <TypewriterText text="initializing your trust issues..." />
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              void celebrate();
              void playSound('victory');
            }}
          >
            Test victory reveal ✨
          </Button>
        </Card>
        <Card className="gallery-wide">
          <h2>Podium</h2>
          <Podium
            players={[
              { id: 'one', name: 'Byte Bandit', emoji: '🐸', score: 2450 },
              { id: 'two', name: 'Phish Food', emoji: '👾', score: 2100 },
              { id: 'three', name: 'Scam Likely', emoji: '🦊', score: 1850 },
            ]}
          />
        </Card>
        <Card>
          <h2>Loading & empty</h2>
          <div className="skeleton-demo">
            <Skeleton height={20} width="65%" />
            <Skeleton height={14} />
            <Skeleton height={14} width="80%" />
          </div>
          <EmptyState
            title="A suspiciously empty tank."
            description="Your crew hasn’t arrived yet."
            action={
              <Button
                variant="secondary"
                onClick={() => setToast('Empty-state action received.')}
              >
                Test action
              </Button>
            }
          />
        </Card>
        <Card>
          <h2>Error & feedback</h2>
          <ErrorState
            title="This fish got away."
            description="Example error state. Try again to test recovery feedback."
            onRetry={() =>
              setToast('Retry received. Connection would be checked here.')
            }
          />
          <Button
            variant="secondary"
            onClick={() =>
              setToast('Your profile is looking suspiciously good.')
            }
          >
            Show toast
          </Button>
        </Card>
        <Card className="gallery-wide">
          <h2>Original arcade sounds</h2>
          <p className="muted small">
            Lazy-loaded on tap. Use the global sound toggle to mute.
          </p>
          <div className="component-row">
            {(
              [
                'tap',
                'success',
                'fail',
                'tick',
                'reveal',
                'crack',
                'siren',
                'victory',
              ] satisfies Sound[]
            ).map((sound) => (
              <Button
                key={sound}
                variant="secondary"
                onClick={() => void playSound(sound)}
              >
                {sound}
              </Button>
            ))}
          </div>
        </Card>
      </div>
      <Modal
        open={overlay === 'modal'}
        onClose={() => setOverlay(null)}
        title="Focus stays in the tank."
      >
        <p>
          This dialog traps keyboard focus, closes with Escape, and returns
          focus to the control that opened it.
        </p>
        <label className="form-field">
          Try tabbing here
          <input placeholder="Demo input" />
        </label>
        <Button onClick={() => setOverlay(null)}>Close modal</Button>
      </Modal>
      <BottomSheet
        open={overlay === 'sheet'}
        onClose={() => setOverlay(null)}
        title="A little room for the details."
      >
        <p>
          A mobile-friendly sheet with the same keyboard and focus behavior as
          the dialog.
        </p>
        <Button className="full-width" onClick={() => setOverlay(null)}>
          Got it
        </Button>
      </BottomSheet>
      <LearnCard
        open={overlay === 'learn'}
        onClose={() => setOverlay(null)}
        title="Urgency is the bait."
        lesson="Scammers want you to act before you think."
        tip="Pause. Open the official app yourself to check the request."
      />
      {toast && <Toast message={toast} onDismiss={() => setToast('')} />}
    </div>
  );
}
