import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, SignedOut } from '@clerk/clerk-react';
import './App.css';
import LogoBot from './utils/LogoBot.jsx';
import NET from 'vanta/dist/vanta.net.min';
import * as THREE from 'three';
// import TechStackAnimation from './ExtraComponents/TechStackAnimation';

export default function LandingPage() {
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);
  const [displayedText, setDisplayedText] = useState('');
  const fullText = 'IntrVw.';
  const [showButtons, setShowButtons] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  // Use auth hook consistently
  const { isSignedIn } = useAuth();
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
        color: 0x3b82f6,
        backgroundColor: 0x111827,
        highlightColor: 0x1e40af,
        points: 10.0,
        maxDistance: 25.0,
        spacing: 20.0,
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
      }, 80);
      return () => clearTimeout(timeout);
    } else {
      setTimeout(() => setShowDescription(true), 300);
      setTimeout(() => setShowButtons(true), 900);
    }
  }, [displayedText, fullText]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 300);
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
          
          {/* Description */}
          {showDescription && (
            <div className="landing-description fade-in-up">
              <p>Master ML interviews with AI-powered practice challenges</p>
            </div>
          )}
          
          {/* Add some spacing before buttons */}
          <div style={{ height: '40px' }}></div>
          
          <SignedOut>
            {showButtons && (
              <div className="landing-btn-group fade-in-up">
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

          {/* Tech Stack Animation - Commented out for now */}
          {/* {showTechStack && <TechStackAnimation />} */}

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