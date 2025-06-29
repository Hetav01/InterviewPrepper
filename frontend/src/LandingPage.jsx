import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, SignedOut } from '@clerk/clerk-react';
import './App.css';
import LogoBot from './utils/LogoBot.jsx';
import NET from 'vanta/dist/vanta.net.min';
import * as THREE from 'three';

export default function LandingPage() {
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);
  const [displayedText, setDisplayedText] = useState('');
  const fullText = 'ML Interview Prepper';
  const [showButtons, setShowButtons] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  // Redirect if already signed in
  const { isSignedIn } = useAuth ? useAuth() : { isSignedIn: false };
  useEffect(() => {
    if (isSignedIn) {
      navigate('/app', { replace: true });
    }
  }, [isSignedIn, navigate]);

  // Vanta NET effect
  useEffect(() => {
    if (!vantaEffect.current) {
      vantaEffect.current = NET({
        el: vantaRef.current,
        THREE,
        color: 0x4f8cff,
        backgroundColor: 0x10131a,
        highlightColor: 0x60a5fa,
        points: 12.0,
        maxDistance: 22.0,
        spacing: 18.0,
        showDots: true,
        mouseControls: true,
        touchControls: true,
        minHeight: 200.00,
        minWidth: 200.00,
      });
    }
    return () => {
      if (vantaEffect.current) {
        vantaEffect.current.destroy();
        vantaEffect.current = null;
      }
    };
  }, []);

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

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  // Handle button click with fade-out and delay
  const handleButtonClick = (path) => {
    setFadeOut(true);
    setTimeout(() => {
      navigate(path);
    }, 600); // 600ms matches fade-out duration
  };

  return (
    <div className="landing-root">
      <div ref={vantaRef} className="landing-vanta-bg" />
      {isLoaded ? (
        <div className={`landing-bg dark-mode${fadeOut ? ' fade-out' : ''} fade-in`}>
          {/* Logo with gradient */}
          <div className="landing-logo-container">
            <LogoBot className="landing-logo-gradient" gradientId="logo-gradient-landing" size={135} />
          </div>
          <h1 className="landing-title landing-gradient-title">{displayedText}</h1>
          <SignedOut>
            {showButtons && (
              <div className="landing-btn-group">
                <button
                  className="landing-btn landing-btn-signin"
                  onClick={() => handleButtonClick('/sign-in')}
                  onMouseEnter={e => e.currentTarget.classList.add('hovered')}
                  onMouseLeave={e => e.currentTarget.classList.remove('hovered')}
                >
                  Sign In
                </button>
                <button
                  className="landing-btn landing-btn-signup"
                  onClick={() => handleButtonClick('/sign-up')}
                  onMouseEnter={e => e.currentTarget.classList.add('hovered')}
                  onMouseLeave={e => e.currentTarget.classList.remove('hovered')}
                >
                  Sign Up
                </button>
              </div>
            )}
          </SignedOut>
          {/* Copyright Notice */}
          <div className="landing-copyright">
            Hetav Patel <span className="copyright-symbol">©</span> 2025
          </div>
        </div>
      ) : (
        <div className="landing-loading-placeholder"></div>
      )}
    </div>
  );
} 