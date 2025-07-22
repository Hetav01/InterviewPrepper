import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, SignedOut } from '@clerk/clerk-react';
import './App.css';
import LogoBot from './utils/LogoBot.jsx';
import NET from 'vanta/dist/vanta.net.min';
import * as THREE from 'three';
import { useLoading } from './utils/LoadingContext.jsx';
import { TargetIcon, LightbulbIcon, ChartIcon } from './ExtraComponents/icons';
// import TechStackAnimation from './ExtraComponents/TechStackAnimation';

export default function LandingPage() {
  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);
  const [displayedText, setDisplayedText] = useState('');
  const fullText = 'IntrVu.';
  const [showButtons, setShowButtons] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);
  const { showPageLoading, hideLoading } = useLoading();

  // Use auth hook consistently
  const { isSignedIn } = useAuth();
  useEffect(() => {
    if (isSignedIn) {
      navigate('/app', { replace: true });
    }
  }, [isSignedIn, navigate]);

  // Show page loading when component mounts
  useEffect(() => {
    showPageLoading({
      message: "Loading landing page...",
      timeout: 1000
    });
  }, []);

  // Vanta NET effect - optimized to not block animations
  useEffect(() => {
    if (!vantaEffect.current) {
      // Delay Vanta initialization to prioritize button animations
      const vantaTimer = setTimeout(() => {
        vantaEffect.current = NET({
          el: vantaRef.current,
          THREE,
          color: 0x3b82f6,
          backgroundColor: 0x0f172a,
          highlightColor: 0x1d4ed8,
          points: 8.0,
          maxDistance: 20.0,
          spacing: 18.0,
          showDots: true,
          mouseControls: true,
          touchControls: true,
          minHeight: 200.00,
          minWidth: 200.00,
        });
      }, 100); // Small delay to prioritize UI animations

      return () => {
        clearTimeout(vantaTimer);
        if (vantaEffect.current) {
          vantaEffect.current.destroy();
          vantaEffect.current = null;
        }
      };
    }
  }, []);

  // Optimized animation sequence
  useEffect(() => {
    if (displayedText.length < fullText.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(fullText.slice(0, displayedText.length + 1));
      }, 60); // Reduced from 80ms for faster text animation
      return () => clearTimeout(timeout);
    } else {
      // Enhanced animation sequence with features
      const descriptionTimer = setTimeout(() => setShowDescription(true), 200);
      const featuresTimer = setTimeout(() => setShowFeatures(true), 400);
      const buttonTimer = setTimeout(() => setShowButtons(true), 600);
      
      return () => {
        clearTimeout(descriptionTimer);
        clearTimeout(featuresTimer);
        clearTimeout(buttonTimer);
      };
    }
  }, [displayedText, fullText]);

  // Faster initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true);
      hideLoading('page'); // Hide page loading when content is ready
    }, 100); // Reduced from 300ms
    return () => clearTimeout(timer);
  }, []);

  // Handle button click with fade-out and delay
  const handleButtonClick = (path) => {
    setFadeOut(true);
    setTimeout(() => {
      // Smoother transition: fade out, then navigate after a short delay
      const redirectTo = () => {
        if (path === "/sign-in") {
          window.location.href = "https://accounts.intrvu.store/sign-in";
        } else if (path === "/sign-up") {
          window.location.href = "https://accounts.intrvu.store/sign-up";
        } else {
          navigate(path);
        }
      };

      // Add a slight delay after fade-out for a smoother transition
      setTimeout(redirectTo, 500); // 250ms after fade-out starts
    }, 600); // 600ms matches fade-out duration
  };

  return (
    <div className="landing-root">
      <div ref={vantaRef} className="landing-vanta-bg" />

      {isLoaded ? (
        <div
          className={`landing-bg dark-mode${
            fadeOut ? " fade-out" : ""
          } fade-in`}
        >
          {/* Logo with gradient */}
          <div className="landing-logo-container">
            <LogoBot
              className="landing-logo-gradient"
              gradientId="logo-gradient-landing"
              size={122}
            />
          </div>

          {/* Enhanced title with better colors */}
          <h1
            className="landing-title landing-gradient-title"
            style={{
              background:
                "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #1e40af 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              color: "transparent",
              fontSize: "3.78rem",
              marginBottom: "0.63rem",
              fontWeight: "700",
              letterSpacing: "-0.02em",
            }}
          >
            {displayedText}
          </h1>

          {/* Enhanced description */}
          {showDescription && (
            <div className="landing-description fade-in-up">
              <p
                style={{
                  color: "#e2e8f0",
                  fontWeight: "500",
                  fontSize: "1.125rem",
                  marginBottom: "0.45rem",
                }}
              >
                Your Multi-Agent AI Interview Coach
              </p>
              <p
                style={{
                  color: "#94a3b8",
                  fontWeight: "400",
                  fontSize: "0.9rem",
                  maxWidth: "540px",
                  lineHeight: "1.6",
                }}
              >
                Master technical interviews with personalized challenges in two distinct modes—<span style={{ fontWeight: 700, color: "#3b82f6"}}>Interview</span> and <span style={{ fontWeight: 700, color: "#3b82f6"}}>Scenario</span>—along with real-time feedback and in-depth insights.
              </p>
            </div>
          )}

          {/* Feature highlights */}
          {showFeatures && (
            <div className="landing-features fade-in-up">
              <div className="feature-grid">
                <div className="feature-item">
                  <div className="feature-icon">
                    <TargetIcon size={26} color="currentColor" />
                  </div>
                  <div className="feature-text">
                    <h3>Personalized Challenges</h3>
                    <p>
                      AI-generated questions tailored to your skill level and
                      target roles
                    </p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <LightbulbIcon size={26} color="currentColor" />
                  </div>
                  <div className="feature-text">
                    <h3>Smart Feedback</h3>
                    <p>
                      Detailed explanations and improvement suggestions for
                      every answer
                    </p>
                  </div>
                </div>
                <div className="feature-item">
                  <div className="feature-icon">
                    <ChartIcon size={26} color="currentColor" />
                  </div>
                  <div className="feature-text">
                    <h3>Progress Tracking</h3>
                    <p>
                      Monitor your performance across different topics and
                      difficulty levels
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reduced spacing before buttons */}
          <div style={{ height: "0.75rem" }}></div>

          <SignedOut>
            {showButtons && (
              <div className="landing-btn-group fade-in-up">
                <button
                  className="landing-btn landing-btn-signin"
                  onClick={() => handleButtonClick("/sign-in")}
                  onMouseEnter={(e) => e.currentTarget.classList.add("hovered")}
                  onMouseLeave={(e) =>
                    e.currentTarget.classList.remove("hovered")
                  }
                >
                  Sign In
                </button>
                <button
                  className="landing-btn landing-btn-signup"
                  onClick={() => handleButtonClick("/sign-up")}
                  onMouseEnter={(e) => e.currentTarget.classList.add("hovered")}
                  onMouseLeave={(e) =>
                    e.currentTarget.classList.remove("hovered")
                  }
                >
                  Sign Up
                </button>
              </div>
            )}
          </SignedOut>

          {/* Trust indicators */}
          {showButtons && (
            <div className="landing-trust fade-in-up">
              <p
                style={{
                  color: "#64748b",
                  fontSize: "0.788rem",
                  marginTop: "1.8rem",
                }}
              >
                Powered by{" "}
                <a
                  href="https://langchain-ai.github.io/langgraph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#3b82f6", textDecoration: "none" }}
                >
                  LangGraph
                </a>{" "}
                and{" "}
                <a
                  href="https://openai.com/api/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "#3b82f6", textDecoration: "none" }}
                >
                  OpenAI
                </a>
                . • No credit card required
              </p>
            </div>
          )}

          {/* Tech Stack Animation - Commented out for now */}
          {/* {showTechStack && <TechStackAnimation />} */}

          {/* Copyright Notice */}
          {/* <div className="landing-copyright">
            Hetav Patel <span className="copyright-symbol">©</span> 2025
          </div> */}
        </div>
      ) : (
        <div className="landing-loading-placeholder"></div>
      )}
    </div>
  );
} 