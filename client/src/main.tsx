import React, { Suspense, lazy, useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import {
  LazyMotion,
  domAnimation,
  MotionConfig,
  AnimatePresence,
  m,
} from 'framer-motion';
import { Button, ErrorState, Modal, Skeleton } from './components/ui';
import { Icon } from './components/Icon';
import { usePreferences } from './lib/preferences';
import { silenceAudio } from './lib/feedback';
import './styles.css';

const Landing = lazy(() => import('./pages/Landing'));
const Join = lazy(() => import('./pages/Join'));
const Gallery = lazy(() => import('./pages/Gallery'));
const Lobby = lazy(() => import('./pages/Lobby'));

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <main className="page-container">
        <ErrorState
          title="Something slipped the net."
          description="Reload the page to get back into the tank."
          onRetry={() => window.location.reload()}
        />
      </main>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const [route, setRoute] = useState(
    window.location.pathname + window.location.search,
  );
  const [credits, setCredits] = useState(false);
  const muted = usePreferences((state) => state.muted);
  const toggleMute = usePreferences((state) => state.toggleMute);
  useEffect(() => {
    const navigate = () =>
      setRoute(window.location.pathname + window.location.search);
    window.addEventListener('popstate', navigate);
    return () => window.removeEventListener('popstate', navigate);
  }, []);
  function navigate(url: string) {
    window.history.pushState(null, '', url);
    setRoute(url);
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  useEffect(() => {
    document.getElementById('page-heading')?.focus({ preventScroll: true });
  }, [route]);
  const path = route.split('?')[0];
  const roomRoute = path?.match(/^\/(room|screen|watch)\/([A-Za-z]{4})$/);
  return (
    <LazyMotion features={domAnimation}>
      <MotionConfig reducedMotion="user">
        <div className="app-shell">
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <div className="ambient-background" aria-hidden="true">
            <i />
            <i />
            <i />
          </div>
          <header className="site-header">
            <a
              className="brand"
              href="/"
              aria-label="Phish Tank home"
              onClick={(event) => {
                event.preventDefault();
                navigate('/');
              }}
            >
              <span className="brand-mark">
                <span className="brand-at" aria-hidden="true">
                  @
                </span>
                <Icon name="fish" size={30} />
              </span>
              <span>
                PHISH<span className="text-green">TANK</span>
                <span className="brand-dot">™</span>
              </span>
            </a>
            <nav aria-label="Main navigation">
              <a className="how-link" href="/#how-it-works">
                How to play <span>↗</span>
              </a>
              <span className="header-status">
                <span className="status-dot" /> FRIENDS. PHONES. TRUST ISSUES.
              </span>
              <Button
                variant="ghost"
                className="icon-button sound-button"
                aria-label={muted ? 'Unmute sound' : 'Mute sound'}
                aria-pressed={muted}
                onClick={() => {
                  if (!muted) silenceAudio();
                  toggleMute();
                }}
              >
                <Icon name={muted ? 'muted' : 'sound'} />
              </Button>
            </nav>
          </header>
          <ErrorBoundary>
            <Suspense
              fallback={
                <main
                  className="page-container loading-page"
                  aria-label="Loading page"
                >
                  <Skeleton height={40} width="60%" />
                  <Skeleton height={160} />
                  <Skeleton height={56} width="50%" />
                </main>
              }
            >
              <AnimatePresence mode="wait">
                <m.main
                  id="main-content"
                  key={path}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  {path === '/' ? (
                    <Landing navigate={navigate} />
                  ) : path === '/join' ? (
                    <Join route={route} navigate={navigate} />
                  ) : path === '/components' ? (
                    <Gallery />
                  ) : roomRoute ? (
                    <Lobby
                      code={roomRoute[2]!.toUpperCase()}
                      mode={
                        roomRoute[1] === 'room'
                          ? 'player'
                          : roomRoute[1] === 'screen'
                            ? 'screen'
                            : 'watch'
                      }
                      navigate={navigate}
                    />
                  ) : (
                    <div className="page-container">
                      <ErrorState
                        title="You’re swimming off the map."
                        description="That page doesn’t exist. Your crew is back this way."
                      />
                      <Button onClick={() => navigate('/')}>
                        Back to the tank <Icon name="arrow" />
                      </Button>
                    </div>
                  )}
                </m.main>
              </AnimatePresence>
            </Suspense>
          </ErrorBoundary>
          <footer className="site-footer">
            <span>
              <span className="status-dot" /> A LITTLE CHAOS. A LITTLE CYBER
              SMART.
            </span>
            <div>
              <button onClick={() => setCredits(true)}>Why this matters</button>
              <a
                href="/components"
                onClick={(event) => {
                  event.preventDefault();
                  navigate('/components');
                }}
              >
                Design system
              </a>
              <span className="build-label">LOBBY / V0.2</span>
            </div>
          </footer>
          <Modal
            open={credits}
            onClose={() => setCredits(false)}
            title="Get fooled here. Not out there."
          >
            <p>
              Phish Tank turns the tricks behind scams into a party game.
              Playing the attacker helps you notice urgency, false authority,
              and suspicious requests.
            </p>
            <p>
              Every persona is fictional. Every scam is training content. Always
              use made-up passwords.
            </p>
            <div className="credits-facts">
              <span>
                <Icon name="shield" /> No accounts
              </span>
              <span>
                <Icon name="eye" /> No analytics
              </span>
              <span>
                <Icon name="lock" /> No real credentials
              </span>
            </div>
            <p className="muted small">
              An original game with a Neon Terminal Arcade identity. Fonts:
              Google Fonts. Audio: original synthesized tones.
            </p>
            <Button className="full-width" onClick={() => setCredits(false)}>
              Back to the good kind of trouble
            </Button>
          </Modal>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
