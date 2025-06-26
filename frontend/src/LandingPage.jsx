import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, SignedOut } from '@clerk/clerk-react';
import './App.css';

export default function LandingPage() {
  const [displayedText, setDisplayedText] = useState('');
  const fullText = 'ML Interview Prepper';
  const [showButtons, setShowButtons] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const navigate = useNavigate();

  // Redirect if already signed in
  const { isSignedIn } = useAuth ? useAuth() : { isSignedIn: false };
  useEffect(() => {
    if (isSignedIn) {
      navigate('/app', { replace: true });
    }
  }, [isSignedIn, navigate]);

  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 90);
      return () => clearTimeout(timeout);
    } else {
      setTimeout(() => setShowButtons(true), 400);
    }
  }, [displayedText, fullText]);

  // Handle button click with fade-out and delay
  const handleButtonClick = (path) => {
    setFadeOut(true);
    setTimeout(() => {
      navigate(path);
    }, 600); // 600ms matches fade-out duration
  };

  return (
    <div
      className={`landing-bg dark-mode${fadeOut ? ' fade-out' : ''}`}
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: 'var(--bg-color)', transition: 'background 0.5s' }}
    >
      <h1
        className="landing-title landing-gradient-title"
        style={{
          fontFamily: 'Product Sans, sans-serif',
          fontWeight: 700,
          fontSize: '4.2rem',
          letterSpacing: '0.04em',
          textAlign: 'center',
          marginBottom: '2.5rem',
          minHeight: '3.5em',
          textShadow: '0 4px 32px #2563eb33',
          whiteSpace: 'pre',
          borderRight: '0.12em solid var(--primary-color)',
          animation: 'blink-caret 0.8s step-end infinite',
          background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 40%, #ff9800 70%, #ffb347 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          color: 'transparent',
        }}
      >
        {displayedText}
      </h1>
      <SignedOut>
        {showButtons && (
          <div className="landing-btn-group" style={{ display: 'flex', gap: '2.5rem', marginTop: '1.5rem', animation: 'fadeInUp 1s' }}>
            <button
              className="landing-btn"
              style={{
                background: 'linear-gradient(90deg, #2563eb 0%, #60a5fa 100%)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '1.3rem',
                padding: '0.9em 2.5em',
                border: 'none',
                borderRadius: '2em',
                boxShadow: '0 2px 16px 0 rgba(37,99,235,0.18)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                outline: 'none',
                letterSpacing: '0.03em',
                position: 'relative',
                overflow: 'hidden',
                zIndex: 2,
              }}
              onClick={() => handleButtonClick('/sign-in')}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Sign In
            </button>
            <button
              className="landing-btn"
              style={{
                background: 'linear-gradient(90deg, #ff9800 0%, #ffb347 100%)',
                color: '#23272f',
                fontWeight: 700,
                fontSize: '1.3rem',
                padding: '0.9em 2.5em',
                border: 'none',
                borderRadius: '2em',
                boxShadow: '0 2px 16px 0 rgba(255,152,0,0.18)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                outline: 'none',
                letterSpacing: '0.03em',
                position: 'relative',
                overflow: 'hidden',
                zIndex: 2,
              }}
              onClick={() => handleButtonClick('/sign-up')}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.07)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              Sign Up
            </button>
          </div>
        )}
      </SignedOut>
      <style>{`
        @keyframes blink-caret {
          0%, 100% { border-color: transparent; }
          50% { border-color: var(--primary-color); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-out {
          animation: fadeOutLanding 0.6s forwards;
        }
        @keyframes fadeOutLanding {
          to { opacity: 0; transform: scale(0.98); }
        }
      `}</style>
    </div>
  );
} 