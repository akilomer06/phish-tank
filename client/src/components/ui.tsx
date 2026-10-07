import {
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { REACTIONS, type Accent } from '@phish-tank/shared';
import { feedback, playSound } from '../lib/feedback';
import { Icon } from './Icon';

export function Button({
  variant = 'primary',
  className = '',
  children,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}) {
  return (
    <button
      {...props}
      className={`button button-${variant} ${className}`}
      onClick={(event) => {
        feedback();
        onClick?.(event);
      }}
    >
      {children}
    </button>
  );
}
export function Card({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={`card ${className}`}>
      {children}
    </div>
  );
}
export function Badge({
  children,
  color = 'green',
}: {
  children: ReactNode;
  color?: Accent;
}) {
  return <span className={`badge accent-${color}`}>{children}</span>;
}
export function Avatar({
  emoji,
  color = 'green',
  size = 'normal',
  label,
}: {
  emoji: string;
  color?: Accent;
  size?: 'small' | 'normal' | 'large';
  label?: string;
}) {
  return (
    <span
      className={`avatar avatar-${size} accent-${color}`}
      role="img"
      aria-label={label ?? emoji}
    >
      {emoji}
    </span>
  );
}
export function PlayerChip({
  name,
  emoji,
  color = 'green',
  host = false,
  ready = false,
}: {
  name: string;
  emoji: string;
  color?: Accent;
  host?: boolean;
  ready?: boolean;
}) {
  return (
    <span className="player-chip">
      <Avatar emoji={emoji} color={color} size="small" />
      <span>{name}</span>
      {host && (
        <span title="Host" aria-label="Host" role="img">
          <Icon name="crown" size={16} />
        </span>
      )}
      {ready && (
        <span
          title="Ready"
          aria-label="Ready"
          role="img"
          className="text-green"
        >
          <Icon name="check" size={16} />
        </span>
      )}
    </span>
  );
}

export function TimerRing({
  endsAt,
  durationMs,
  clockOffset = 0,
}: {
  endsAt: number;
  durationMs: number;
  clockOffset?: number;
}) {
  const [now, setNow] = useState(Date.now);
  const previous = useRef<number | null>(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    function update() {
      setNow(Date.now());
      if (Date.now() + clockOffset < endsAt) timer = setTimeout(update, 200);
    }
    update();
    return () => clearTimeout(timer);
  }, [endsAt, clockOffset]);
  const seconds = Math.max(0, Math.ceil((endsAt - now - clockOffset) / 1000));
  useEffect(() => {
    if (seconds > 0 && seconds <= 5 && previous.current !== seconds)
      void playSound('tick');
    previous.current = seconds;
  }, [seconds]);
  const progress = Math.max(
    0,
    Math.min(1, (endsAt - now - clockOffset) / Math.max(1, durationMs)),
  );
  return (
    <div
      className={`timer-ring ${seconds < 5 ? 'timer-critical' : seconds < 10 ? 'timer-warning' : ''} ${reduced ? 'no-pulse' : ''}`}
      role="timer"
      aria-label={`${seconds} seconds remaining`}
    >
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle className="timer-track" cx="60" cy="60" r="53" />
        <circle
          cx="60"
          cy="60"
          r="53"
          strokeDasharray={333}
          strokeDashoffset={333 * (1 - progress)}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <span className="timer-number">
        {seconds}
        <small>SECONDS</small>
      </span>
      <span className="sr-only" aria-live="polite">
        {seconds <= 5
          ? `${seconds} seconds left`
          : seconds <= 10
            ? '10 seconds or less'
            : ''}
      </span>
    </div>
  );
}
export function ProgressBar({
  value,
  label,
  color = 'green',
}: {
  value: number;
  label: string;
  color?: Accent;
}) {
  const safe = Math.round(Math.min(100, Math.max(0, value)));
  return (
    <div className={`progress-wrap accent-${color}`}>
      <div className="meter-label">
        <span>{label}</span>
        <span>{safe}%</span>
      </div>
      <div
        className="progress-track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ transform: `scaleX(${safe / 100})` }} />
      </div>
    </div>
  );
}
export function StrengthMeter({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="strength-meter">
      <div className="meter-label">
        <span>Password strength</span>
        <strong>{label}</strong>
      </div>
      <div
        className="segments"
        role="meter"
        aria-label={`Password strength: ${label}`}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        {Array.from({ length: 10 }, (_, i) => (
          <span
            key={i}
            className={
              i < Math.ceil(value / 10)
                ? value < 40
                  ? 'lit weak'
                  : value < 70
                    ? 'lit fair'
                    : 'lit strong'
                : ''
            }
          />
        ))}
      </div>
    </div>
  );
}
export function CrackBar({
  name,
  progress,
  complete,
}: {
  name: string;
  progress: number;
  complete: boolean;
}) {
  return (
    <div className={`crack-bar ${complete ? 'cracked' : ''}`}>
      <div className="meter-label">
        <strong>{name}</strong>
        <Badge color={complete ? 'magenta' : 'cyan'}>
          {complete ? '✕ CRACKED' : '◇ HOLDING'}
        </Badge>
      </div>
      <ProgressBar
        value={progress}
        label={complete ? 'Crack complete' : 'Attack progress'}
        color={complete ? 'magenta' : 'cyan'}
      />
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  sheet = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  sheet?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
    if (!open) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = original;
      if (dialog.open) dialog.close();
    };
  }, [open]);
  return (
    <dialog
      ref={ref}
      className={`modal ${sheet ? 'bottom-sheet' : ''}`}
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') return;
        const focusable = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex="0"]',
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const box = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          )
            onClose();
        }
      }}
    >
      <div className="modal-header">
        <h2 id={titleId}>{title}</h2>
        <Button
          variant="ghost"
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <Icon name="close" />
        </Button>
      </div>
      {children}
    </dialog>
  );
}
export function BottomSheet(props: Omit<Parameters<typeof Modal>[0], 'sheet'>) {
  return <Modal {...props} sheet />;
}
export function LearnCard({
  open,
  onClose,
  title,
  lesson,
  tip,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  lesson: string;
  tip: string;
}) {
  return (
    <BottomSheet open={open} onClose={onClose} title={title}>
      <Badge color="cyan">A LITTLE LESS HACKABLE</Badge>
      <p className="learn-lesson">{lesson}</p>
      <Card className="learn-tip">
        <Icon name="shield" />
        <div>
          <strong>Do this instead</strong>
          <p>{tip}</p>
        </div>
      </Card>
      <Button className="full-width" onClick={onClose}>
        Got it <Icon name="check" />
      </Button>
    </BottomSheet>
  );
}
export function Toast({
  message,
  onDismiss,
  tone = 'success',
}: {
  message: string;
  onDismiss: () => void;
  tone?: 'success' | 'error';
}) {
  const callback = useRef(onDismiss);
  useEffect(() => {
    callback.current = onDismiss;
  }, [onDismiss]);
  useEffect(() => {
    const timer = setTimeout(() => callback.current(), 4500);
    return () => clearTimeout(timer);
  }, [message]);
  return (
    <div
      className={`toast toast-${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon name={tone === 'success' ? 'check' : 'bolt'} />
      <span>{message}</span>
      <Button
        variant="ghost"
        className="icon-button"
        aria-label="Dismiss notification"
        onClick={onDismiss}
      >
        <Icon name="close" size={18} />
      </Button>
    </div>
  );
}
export function EmojiReactionBar({
  onReact,
}: {
  onReact: (emoji: (typeof REACTIONS)[number]) => void;
}) {
  const labels = [
    'Fire',
    'Dead laughing',
    'Laugh',
    'Big brain',
    'Watching',
    'Protected',
  ];
  return (
    <div className="reaction-bar" aria-label="Send a reaction">
      {REACTIONS.map((emoji, i) => (
        <Button
          key={emoji}
          variant="ghost"
          aria-label={`React: ${labels[i]}`}
          onClick={() => onReact(emoji)}
        >
          {emoji}
        </Button>
      ))}
    </div>
  );
}
export interface PodiumEntry {
  id: string;
  name: string;
  emoji: string;
  score: number;
}
export function Podium({ players }: { players: PodiumEntry[] }) {
  const reduced = useReducedMotion();
  return (
    <div className="podium" aria-label="Top three players">
      {[1, 0, 2].map((index) => {
        const player = players[index];
        if (!player) return null;
        return (
          <m.div
            key={player.id}
            className={`podium-place podium-place-${index + 1}`}
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduced ? 0 : index * 0.15, type: 'spring' }}
          >
            <Avatar
              emoji={player.emoji}
              color={index === 0 ? 'green' : index === 1 ? 'cyan' : 'violet'}
            />
            <strong>{player.name}</strong>
            <span className="mono">{player.score.toLocaleString()} pts</span>
            <div className="podium-block">
              <span>{index + 1}</span>
              {index === 0 && <Icon name="crown" size={24} />}
            </div>
          </m.div>
        );
      })}
    </div>
  );
}
export function TypewriterText({
  text,
  speed = 35,
}: {
  text: string;
  speed?: number;
}) {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const started = Date.now();
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const next = Math.min(
        text.length,
        Math.floor((Date.now() - started) / Math.max(1, speed)),
      );
      setCount(next);
      if (next < text.length) timer = setTimeout(tick, Math.max(16, speed));
    };
    timer = setTimeout(tick, 0);
    return () => clearTimeout(timer);
  }, [text, speed, reduced]);
  return (
    <span className="typewriter">
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {reduced ? text : text.slice(0, count)}
        <span className="type-cursor">▋</span>
      </span>
    </span>
  );
}
export function SwipeCard({
  children,
  onVote,
  disabled = false,
}: {
  children: ReactNode;
  onVote: (vote: 'REAL' | 'SCAM') => void;
  disabled?: boolean;
}) {
  const [direction, setDirection] = useState<'REAL' | 'SCAM' | null>(null);
  const reduced = useReducedMotion();
  const choose = (vote: 'REAL' | 'SCAM') => {
    if (!disabled) {
      feedback();
      onVote(vote);
      setDirection(null);
    }
  };
  return (
    <div className="swipe-wrap">
      <m.div
        className={`card swipe-card ${direction ? `swipe-${direction.toLowerCase()}` : ''}`}
        drag={disabled || reduced ? false : 'x'}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        onDrag={(_event, info) =>
          setDirection(
            info.offset.x > 35 ? 'REAL' : info.offset.x < -35 ? 'SCAM' : null,
          )
        }
        onDragEnd={(_event, info) => {
          if (Math.abs(info.offset.x) > 90)
            choose(info.offset.x > 0 ? 'REAL' : 'SCAM');
          setDirection(null);
        }}
        style={{ touchAction: 'pan-y' }}
      >
        <span className="swipe-wash" aria-hidden="true">
          {direction}
        </span>
        {children}
      </m.div>
      <div className="vote-actions">
        <Button
          variant="danger"
          onClick={() => choose('SCAM')}
          disabled={disabled}
        >
          <Icon name="close" /> SCAM
        </Button>
        <Button onClick={() => choose('REAL')} disabled={disabled}>
          <Icon name="check" /> REAL
        </Button>
      </div>
    </div>
  );
}
export function Skeleton({
  width = '100%',
  height = 20,
}: {
  width?: CSSProperties['width'];
  height?: number;
}) {
  return (
    <div
      className="skeleton"
      style={{ width, height }}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading…</span>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="state-panel">
      <span className="state-icon">
        <Icon name="users" size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title: string;
  description: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state-panel error-state" role="alert">
      <span className="state-icon">
        <Icon name="bolt" size={28} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again <Icon name="arrow" />
        </Button>
      )}
    </div>
  );
}
