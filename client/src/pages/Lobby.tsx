import { useEffect, useState } from 'react';
import { m, useReducedMotion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import type { RoomSettings } from '@phish-tank/shared';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmojiReactionBar,
  ErrorState,
  Modal,
  ProgressBar,
  Skeleton,
  Toast,
} from '../components/ui';
import { Icon } from '../components/Icon';
import {
  leaveRoom,
  retainRoom,
  retryConnection,
  roomAction,
  useRoom,
} from '../lib/room-client';
import '../lobby.css';

export default function Lobby({
  code,
  mode,
  navigate,
}: {
  code: string;
  mode: 'player' | 'screen' | 'watch';
  navigate: (url: string) => void;
}) {
  const state = useRoom();
  const { room, session, status } = state;
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState('');
  const [share, setShare] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const reduced = useReducedMotion();
  const bigScreen = mode === 'screen';
  const spectator = mode !== 'player';
  const invite = `${window.location.origin}/join?code=${code}`;
  useEffect(
    () => retainRoom(code, spectator ? 'spectator' : 'player'),
    [code, spectator],
  );
  useEffect(() => {
    document.title = `${code} · ${bigScreen ? 'Big Screen' : 'The waiting tank'} — Phish Tank`;
    return () => {
      document.title = 'Phish Tank — Trust issues. Now a party game.';
    };
  }, [code, bigScreen]);
  async function action(run: () => Promise<unknown>) {
    if (pending) return;
    setPending(true);
    try {
      await run();
    } catch (error) {
      setToast(
        error instanceof Error
          ? error.message
          : 'That action didn’t land. Try again.',
      );
    } finally {
      setPending(false);
    }
  }
  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(invite);
      setToast('Invite copied. Send it to your usual suspects.');
    } catch {
      setShare(true);
    }
  }
  if (['expired', 'replaced', 'error'].includes(status) && !room)
    return (
      <div className="page-container room-error-page">
        <ErrorState
          title={
            status === 'expired'
              ? 'This tank has drained.'
              : status === 'replaced'
                ? 'You’ve moved tanks.'
                : 'Connection trouble.'
          }
          description={state.error ?? 'Could not connect to this room.'}
          onRetry={status === 'error' ? retryConnection : undefined}
        />
        <div className="component-row">
          <Button onClick={() => navigate('/join?mode=create')}>
            Create a new room
          </Button>
          <Button
            variant="secondary"
            onClick={() => navigate(`/join?code=${code}`)}
          >
            Join with an alias
          </Button>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Back home
          </Button>
        </div>
      </div>
    );
  if (!room || room.code !== code)
    return (
      <div className="page-container loading-page">
        <Badge color="cyan">CONNECTING TO {code}</Badge>
        <h1 id="page-heading" tabIndex={-1}>
          Finding your crew…
        </h1>
        <Skeleton height={180} />
        <p role="status">
          {state.error ?? 'Opening a secure connection to the room.'}
        </p>
        {state.error && <Button onClick={retryConnection}>Try again</Button>}
        <Button variant="ghost" onClick={() => navigate('/')}>
          Back home
        </Button>
      </div>
    );
  const me = room.players.find((p) => p.id === session?.playerId);
  const host = !spectator && room.hostId === me?.id;
  const connected = room.players.filter((p) => p.connected);
  const ready = connected.filter((p) => p.ready).length;
  const canStart =
    host &&
    connected.length >= 3 &&
    ready === connected.length &&
    room.capabilities.gameplay;
  const enabled = status === 'connected' && !pending;
  function settings(patch: Partial<RoomSettings>) {
    void action(() =>
      roomAction('lobby:settings', { ...room!.settings, ...patch }),
    );
  }
  return (
    <div
      className={`lobby-page page-container ${bigScreen ? 'big-screen' : ''}`}
    >
      {status !== 'connected' && (
        <div className="connection-banner" role="alert">
          <Icon name="bolt" />
          <span>
            {state.error ?? 'Reconnecting to your room…'} Your seat is held for
            20 seconds.
          </span>
          <Button variant="ghost" onClick={retryConnection}>
            Reconnect
          </Button>
        </div>
      )}
      <div className="lobby-topline">
        <Badge color={spectator ? 'cyan' : 'green'}>
          <span className="status-dot" />
          {bigScreen
            ? 'BIG SCREEN · LIVE'
            : spectator
              ? 'SPECTATOR · LIVE'
              : 'YOUR CREW IS CONNECTED'}
        </Badge>
        <span className="connection-quality mono">
          {state.latency !== null
            ? `SYNCED · ${state.latency}ms`
            : 'SYNCING CLOCK…'}
        </span>
        {!bigScreen && (
          <Button variant="ghost" onClick={() => setConfirmLeave(true)}>
            <Icon name="back" size={16} /> Leave room
          </Button>
        )}
      </div>
      <div className="lobby-heading">
        <div>
          <p className="eyebrow">// THE WAITING TANK</p>
          <h1 id="page-heading" tabIndex={-1}>
            The usual <span className="text-green">suspects.</span>
          </h1>
          <p>
            {spectator
              ? 'Front-row seats to the chaos. Watch the crew assemble.'
              : 'Invite your friends. Pick your rules. Look innocent.'}
          </p>
        </div>
        <div className="room-count">
          <strong>
            {connected.length}
            <span>/20</span>
          </strong>
          <span className="mono">PLAYERS CONNECTED</span>
        </div>
      </div>
      <div className="lobby-layout">
        <section className="lobby-main" aria-labelledby="crew-title">
          <Card className="crew-card">
            <div className="crew-card-heading">
              <h2 id="crew-title">
                Inside the tank <Badge color="cyan">{ready} READY</Badge>
              </h2>
              <span className="muted small">
                {room.spectatorCount} watching
              </span>
            </div>
            <div
              className="player-grid"
              aria-live="polite"
              aria-relevant="additions text"
            >
              {room.players.map((player, index) => (
                <m.article
                  className={`player-tile ${player.connected ? '' : 'player-offline'}`}
                  key={player.id}
                  initial={reduced ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.25,
                    delay: reduced ? 0 : index * 0.04,
                  }}
                  data-player-id={player.id}
                >
                  <div className="player-tile-top">
                    <Avatar emoji={player.avatar} color={player.color} />
                    <div className="player-markers">
                      {player.id === room.hostId && (
                        <span
                          className="host-marker"
                          aria-label="Host"
                          role="img"
                          title="Host"
                        >
                          <Icon name="crown" size={18} />
                        </span>
                      )}
                      {player.id === me?.id && !spectator && (
                        <span className="you-marker mono">YOU</span>
                      )}
                    </div>
                  </div>
                  <h3>{player.name}</h3>
                  <span
                    className={`player-ready ${player.ready && player.connected ? 'text-green' : ''}`}
                  >
                    {!player.connected
                      ? '◷ Reconnecting'
                      : player.ready
                        ? '✓ Ready for trouble'
                        : '◇ Getting ready'}
                  </span>
                </m.article>
              ))}
              {connected.length < 3 && (
                <div className="invite-tile">
                  <Icon name="users" size={28} />
                  <strong>{3 - connected.length} more to make a crew</strong>
                  <span>Good company. Bad intentions.</span>
                  {!bigScreen && (
                    <Button variant="ghost" onClick={() => void copyInvite()}>
                      Invite friends <Icon name="arrow" size={16} />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </Card>
          {!bigScreen && (
            <Card className="lobby-rules">
              <div className="crew-card-heading">
                <h2>
                  {host ? 'You make the rules.' : 'The rules of the tank.'}
                </h2>
                <Badge color="violet">
                  {host ? 'HOST CONTROLS' : 'HOST DECIDES'}
                </Badge>
              </div>
              <div className="settings-grid">
                <fieldset disabled={!host || !enabled}>
                  <legend>Rounds</legend>
                  <div className="segmented-control">
                    {[1, 2, 3].map((rounds) => (
                      <button
                        key={rounds}
                        type="button"
                        aria-label={`${rounds} ${rounds === 1 ? 'round' : 'rounds'}`}
                        aria-pressed={room.settings.rounds === rounds}
                        onClick={() => settings({ rounds })}
                      >
                        {rounds}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset disabled={!host || !enabled}>
                  <legend>Difficulty</legend>
                  <div className="segmented-control">
                    {(['Easy', 'Medium', 'Hard'] as const).map((difficulty) => (
                      <button
                        type="button"
                        key={difficulty}
                        aria-pressed={room.settings.difficulty === difficulty}
                        onClick={() => settings({ difficulty })}
                      >
                        {difficulty}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
              <div className="sound-setting">
                <div>
                  <strong>Room sounds</strong>
                  <p>Arcade effects for the crew. Your own mute always wins.</p>
                </div>
                <button
                  type="button"
                  className="toggle"
                  role="switch"
                  aria-label="Room sounds"
                  aria-checked={room.settings.sound}
                  disabled={!host || !enabled}
                  onClick={() => settings({ sound: !room.settings.sound })}
                >
                  <span />
                </button>
              </div>
            </Card>
          )}
          {bigScreen && (
            <div className="screen-rules">
              <Badge color="cyan">
                {room.settings.rounds}{' '}
                {room.settings.rounds === 1 ? 'ROUND' : 'ROUNDS'}
              </Badge>
              <Badge color="violet">
                {room.settings.difficulty.toUpperCase()}
              </Badge>
              <Badge>
                {ready}/{connected.length} READY
              </Badge>
            </div>
          )}
        </section>
        <aside className="lobby-sidebar">
          <Card className="invite-card">
            <p className="eyebrow">THE SECRET HANDSHAKE</p>
            <span
              className="giant-room-code"
              data-testid="room-code"
              aria-label={`Room code ${code.split('').join(' ')}`}
            >
              {code}
            </span>
            <p>Scan it. Join it. Deny everything.</p>
            <div className="qr-wrap">
              <QRCodeSVG
                value={invite}
                size={160}
                level="M"
                title={`Join room ${code}`}
                marginSize={2}
              />
            </div>
            <span className="qr-caption mono">SCAN WITH YOUR PHONE</span>
            {!bigScreen && (
              <>
                <Button
                  className="full-width"
                  variant="secondary"
                  onClick={() => void copyInvite()}
                >
                  <Icon name="copy" /> Copy invite link
                </Button>
                <a
                  className="button button-ghost full-width"
                  href={`/screen/${code}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="external" /> Open Big Screen
                </a>
              </>
            )}
          </Card>
          {!bigScreen && (
            <div className="lobby-tip">
              <Icon name="shield" />
              <p>
                Keep your secrets fictional.
                <br />
                Keep your friends guessing.
              </p>
            </div>
          )}
        </aside>
      </div>
      <div className="lobby-bottom">
        <div className="ready-summary">
          <strong>
            {connected.length < 3
              ? 'A few more suspects needed.'
              : ready < connected.length
                ? 'Waiting for the crew to ready up.'
                : 'Your crew is ready.'}
          </strong>
          <ProgressBar
            label="Ready check"
            value={connected.length ? (ready / connected.length) * 100 : 0}
          />
        </div>
        {!spectator && (
          <Button
            variant={me?.ready ? 'secondary' : 'primary'}
            disabled={!enabled}
            aria-pressed={me?.ready ?? false}
            onClick={() =>
              void action(() =>
                roomAction('lobby:ready', { ready: !me?.ready }),
              )
            }
          >
            {me?.ready ? 'Not ready yet' : 'I’m ready'}
            <Icon name="check" />
          </Button>
        )}
        {host && (
          <Button
            disabled={!enabled || !canStart}
            onClick={() => void action(() => roomAction('game:start', {}))}
          >
            Start game <Icon name="bolt" />
          </Button>
        )}
      </div>
      {!room.capabilities.gameplay && (
        <p className="lobby-build-note">
          Live lobby preview · Gameplay arrives in the next build.
        </p>
      )}
      {!bigScreen && (
        <div className="lobby-reactions">
          <span className="eyebrow">SAY IT WITH AN EMOJI</span>
          <EmojiReactionBar
            onReact={(emoji) => {
              if (status === 'connected')
                void roomAction('reaction:send', { emoji }).catch(
                  (error: unknown) =>
                    setToast(
                      error instanceof Error
                        ? error.message
                        : 'Reaction could not be sent.',
                    ),
                );
            }}
          />
        </div>
      )}
      <div className="emoji-rain" aria-hidden="true">
        {state.reactions.map((reaction) => (
          <m.span
            key={reaction.id}
            style={{ left: `${reaction.x}%` }}
            initial={reduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
            animate={reduced ? { opacity: 0 } : { y: -250, opacity: 0 }}
            transition={{ duration: 2.8 }}
          >
            {reaction.emoji}
          </m.span>
        ))}
      </div>
      <span className="sr-only" role="status">
        {room.players.length} players in the room. {ready} ready.
      </span>
      <Modal
        open={share}
        onClose={() => setShare(false)}
        title="Invite your suspects."
      >
        <p>Copy this link and send it to your group.</p>
        <label className="form-field">
          Room invite
          <input
            readOnly
            value={invite}
            onFocus={(event) => event.target.select()}
          />
        </label>
        <Button className="full-width" onClick={() => setShare(false)}>
          Done
        </Button>
      </Modal>
      <Modal
        open={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        title="Leaving the tank?"
      >
        <p>
          {host
            ? 'The next connected player will become host.'
            : 'Your seat will be released for someone else.'}
        </p>
        <div className="component-row">
          <Button
            variant="danger"
            onClick={() =>
              void action(async () => {
                await leaveRoom();
                navigate('/');
              })
            }
          >
            Leave room
          </Button>
          <Button variant="secondary" onClick={() => setConfirmLeave(false)}>
            Stay here
          </Button>
        </div>
      </Modal>
      {toast && <Toast message={toast} onDismiss={() => setToast('')} />}
    </div>
  );
}
