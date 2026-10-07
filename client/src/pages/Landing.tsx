import { useState } from 'react';
import { Badge, Button } from '../components/ui';
import { Icon, type IconName } from '../components/Icon';

const steps: {
  number: string;
  icon: IconName;
  title: string;
  copy: string;
  color: string;
  tag: string;
}[] = [
  {
    number: '01',
    icon: 'users',
    title: 'Assemble your suspects.',
    copy: 'One room. A few phones. Three to twenty friends with questionable intentions.',
    color: 'green',
    tag: 'GET YOUR CREW',
  },
  {
    number: '02',
    icon: 'lock',
    title: 'Be the bad influence.',
    copy: 'Build a password. Crack theirs. Write a scam your best friend might fall for.',
    color: 'cyan',
    tag: 'THINK LIKE A HACKER',
  },
  {
    number: '03',
    icon: 'shield',
    title: 'Trust absolutely nobody.',
    copy: 'Spot the bait, call the bluff, and find out who’s the hardest to hack.',
    color: 'magenta',
    tag: 'SURVIVE THE REVEAL',
  },
];
function TankIllustration() {
  return (
    <div
      className="tank-scene"
      aria-label="Illustration of a neon fish surrounded by fictional scam messages"
      role="img"
    >
      <div className="scene-coordinate mono">
        SIMULATION_001 <span>● LIVE BAIT</span>
      </div>
      <div className="radar radar-outer" />
      <div className="radar radar-middle" />
      <div className="radar radar-inner" />
      <div className="radar-axis axis-x" />
      <div className="radar-axis axis-y" />
      <span className="radar-cross cross-one">+</span>
      <span className="radar-cross cross-two">+</span>
      <svg
        className="hero-fish"
        viewBox="0 0 420 370"
        fill="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient
            id="fish-body"
            x1="95"
            y1="95"
            x2="290"
            y2="290"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#7FFFC4" />
            <stop offset=".55" stopColor="#39FF88" />
            <stop offset="1" stopColor="#15AB66" />
          </linearGradient>
          <linearGradient id="fish-fin" x1="280" y1="150" x2="360" y2="250">
            <stop stopColor="#39FF88" />
            <stop offset="1" stopColor="#0B7044" />
          </linearGradient>
        </defs>
        <path
          d="M179 4v91c0 20-16 36-36 36s-36-16-36-36V75l19 22"
          stroke="#39FF88"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle
          cx="179"
          cy="8"
          r="7"
          fill="#0C1118"
          stroke="#39FF88"
          strokeWidth="3"
        />
        <path
          d="m273 176 82-43-13 70 13 70-82-39"
          fill="url(#fish-fin)"
          stroke="#73FFB0"
          strokeWidth="2"
        />
        <path
          d="M75 204c42-79 137-96 202-34 21 20 21 48 0 68-65 63-160 45-202-34Z"
          fill="url(#fish-body)"
        />
        <path
          d="m180 151 37-42 14 45m-51 102 37 37 14-43"
          fill="#21CB77"
          stroke="#64FFA8"
          strokeWidth="2"
        />
        <path d="M244 172c16 21 16 43 0 65" stroke="#087346" strokeWidth="3" />
        <path d="m202 202 35-18v36l-35-18Z" fill="#139D60" />
        <circle cx="126" cy="190" r="15" fill="#071B12" />
        <circle cx="131" cy="184" r="4" fill="#D8FFED" />
        <path
          d="m89 218 28 5-9 10"
          stroke="#063C25"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="m125 155 18-7m10-3 10-2"
          stroke="#B4FFD3"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <circle
          cx="66"
          cy="142"
          r="6"
          stroke="#39FF88"
          strokeOpacity=".5"
          strokeWidth="2"
        />
        <circle cx="53" cy="117" r="3" fill="#39FF88" fillOpacity=".5" />
      </svg>
      <div className="floating-message message-one">
        <span className="message-icon">₹</span>
        <div>
          <span className="mono">TOTALLY_YOUR_BANK</span>
          <strong>Just need your OTP 😉</strong>
        </div>
        <span className="unread-dot" />
      </div>
      <div className="floating-message message-two">
        <span className="small-lock">
          <Icon name="lock" size={16} />
        </span>
        <div>
          <span className="mono">PASSWORD DETECTED</span>
          <strong>
            rahul2004<span className="text-magenta">_</span>
          </strong>
          <div className="mini-strength">
            <i />
            <i />
            <i />
            <i />
            <i />
          </div>
        </div>
        <span className="weak-tag">YIKES.</span>
      </div>
      <div className="bait-label">
        <Icon name="eye" size={15} /> LOOKS LEGIT. RIGHT?
      </div>
      <div className="scene-bottom mono">
        <span>
          THREAT LEVEL: <b>FRIENDSHIP</b>
        </span>
        <span>[ TRAINING PREVIEW ]</span>
      </div>
    </div>
  );
}
export default function Landing({
  navigate,
}: {
  navigate: (url: string) => void;
}) {
  const [step, setStep] = useState(0);
  return (
    <div className="landing page-container">
      <section className="hero">
        <div className="hero-copy">
          <Badge>
            <span className="status-dot" /> THE CYBERSECURITY PARTY GAME
          </Badge>
          <h1 id="page-heading" tabIndex={-1}>
            Trust issues.
            <br />
            Now a <span className="outlined-word">party</span>
            <br />
            <span className="text-green">game.</span>
            <span className="heading-cursor" aria-hidden="true">
              _
            </span>
          </h1>
          <p className="hero-description">
            Bait your friends. Break their passwords.
            <br className="desktop-break" /> Get a little harder to hack.
          </p>
          <div className="hero-actions">
            <Button onClick={() => navigate('/join?mode=create')}>
              <Icon name="bolt" /> Create a room <Icon name="arrow" />
            </Button>
            <Button variant="secondary" onClick={() => navigate('/join')}>
              Join a room <Icon name="arrow" />
            </Button>
          </div>
          <div className="hero-meta">
            <span>
              <Icon name="users" size={16} /> 3–20 players
            </span>
            <span>
              <Icon name="code" size={16} /> Just your phones
            </span>
            <span>
              <span className="tiny-spark">✳</span> Zero downloads
            </span>
          </div>
          <div className="crew-note">
            <div className="mini-avatars">
              <span>🐸</span>
              <span>👾</span>
              <span>🦊</span>
              <span>👻</span>
            </div>
            <p>
              Made for the group chat.
              <br />
              <strong>Especially the suspicious ones.</strong>
            </p>
          </div>
        </div>
        <TankIllustration />
      </section>
      <section
        className="how-section"
        id="how-it-works"
        aria-labelledby="how-heading"
      >
        <div className="section-heading">
          <div>
            <p className="eyebrow">
              <span>//</span> THE GAME PLAN
            </p>
            <h2 id="how-heading">Good friends. Bad intentions.</h2>
          </div>
          <span className="section-aside mono">
            NO CYBER SKILLS REQUIRED <Icon name="arrow" size={18} />
          </span>
        </div>
        <div className="step-grid">
          {steps.map((item, index) => (
            <article
              key={item.number}
              className={`step-card accent-${item.color} ${index === step ? 'step-active' : ''}`}
            >
              <div className="step-top">
                <span className="step-icon">
                  <Icon name={item.icon} size={24} />
                </span>
                <span className="step-number">{item.number}</span>
              </div>
              <p className="step-tag mono">{item.tag}</p>
              <h3>{item.title}</h3>
              <p>{item.copy}</p>
            </article>
          ))}
        </div>
        <div className="carousel-controls" aria-label="How to play carousel">
          <div>
            {steps.map((item, i) => (
              <button
                key={item.number}
                aria-label={`Show step ${i + 1}: ${item.title}`}
                aria-pressed={step === i}
                onClick={() => setStep(i)}
              >
                <span />
              </button>
            ))}
          </div>
          <Button
            variant="ghost"
            onClick={() => setStep((step + 1) % steps.length)}
          >
            Next step <Icon name="arrow" />
          </Button>
          <span className="sr-only" aria-live="polite">
            Step {step + 1} of 3: {steps[step]?.title}
          </span>
        </div>
      </section>
      <div className="training-note">
        <Icon name="shield" size={20} />
        <p>
          Fake identities. Real instincts.
          <span> A safe place to fall for it before it happens for real.</span>
        </p>
        <span className="mono">100% SIMULATION</span>
      </div>
    </div>
  );
}
