import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LogoBot from '../utils/LogoBot.jsx';
import NET from 'vanta/dist/vanta.net.min';
import * as THREE from 'three';

export default function About() {
  const navigate = useNavigate();

  // Ensure dark mode is applied consistently
  useEffect(() => {
    document.body.classList.add('dark-mode');
    return () => {
      // Don't remove dark mode class on cleanup to maintain consistency
    };
  }, []);

  const vantaRef = useRef(null);
  const vantaEffect = useRef(null);

  // Vanta NET effect for background
  useEffect(() => {
    if (!vantaEffect.current) {
      vantaEffect.current = NET({
        el: vantaRef.current,
        THREE,
        color: 0x3b82f6,
        backgroundColor: 0x111827,
        highlightColor: 0x1e40af,
        points: 8.0,
        maxDistance: 20.0,
        spacing: 16.0,
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

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="about-root dark-mode">
      <div ref={vantaRef} className="about-vanta-bg" />
      <div className="about-container">
        {/* Header */}
        <div className="about-header">
          <div className="about-logo-container">
            <LogoBot className="about-logo" gradientId="about-logo-gradient" size={80} />
          </div>
                          <h1 className="about-title">About IntrVw.</h1>
          <button className="about-back-btn" onClick={handleBackToHome}>
            ← Back to Home
          </button>
        </div>

        {/* Content */}
        <div className="about-content">
          <div className="about-section">
            <h2 className="about-section-title">What is IntrVw.?</h2>
            <p className="about-text">
                              IntrVw. is a cutting-edge platform designed to help aspiring machine learning engineers 
              and data scientists ace their technical interviews. Our AI-powered system generates personalized 
              challenges across multiple domains including neural networks, computer vision, natural language 
              processing, and more.
            </p>
          </div>

          <div className="about-section">
            <h2 className="about-section-title">Features</h2>
            <div className="about-features">
              <div className="about-feature-card">
                <div className="about-feature-icon">🧠</div>
                <h3>AI-Generated Questions</h3>
                <p>Dynamic MCQ and scenario-based challenges tailored to your skill level</p>
              </div>
              <div className="about-feature-card">
                <div className="about-feature-icon">📊</div>
                <h3>Difficulty Levels</h3>
                <p>Progressive difficulty from beginner to expert level questions</p>
              </div>
              <div className="about-feature-card">
                <div className="about-feature-icon">🎯</div>
                <h3>Topic Focused</h3>
                <p>Specialized questions on specific ML/DL topics you want to master</p>
              </div>
              <div className="about-feature-card">
                <div className="about-feature-icon">💡</div>
                <h3>Detailed Explanations</h3>
                <p>Comprehensive explanations for every answer to enhance learning</p>
              </div>
              <div className="about-feature-card">
                <div className="about-feature-icon">📈</div>
                <h3>Progress Tracking</h3>
                <p>Monitor your improvement and identify areas for growth</p>
              </div>
              <div className="about-feature-card">
                <div className="about-feature-icon">🚀</div>
                <h3>Real-time Feedback</h3>
                <p>Instant scoring and feedback on scenario-based challenges</p>
              </div>
            </div>
          </div>

          <div className="about-section">
            <h2 className="about-section-title">How It Works</h2>
            <div className="about-steps">
              <div className="about-step">
                <div className="about-step-number">1</div>
                <div className="about-step-content">
                  <h3>Choose Your Topic</h3>
                  <p>Select from a wide range of ML/DL topics or enter your own custom topic</p>
                </div>
              </div>
              <div className="about-step">
                <div className="about-step-number">2</div>
                <div className="about-step-content">
                  <h3>Set Parameters</h3>
                  <p>Configure difficulty level, number of questions, and challenge type</p>
                </div>
              </div>
              <div className="about-step">
                <div className="about-step-number">3</div>
                <div className="about-step-content">
                  <h3>Practice & Learn</h3>
                  <p>Solve challenges and get detailed explanations to improve your understanding</p>
                </div>
              </div>
              <div className="about-step">
                <div className="about-step-number">4</div>
                <div className="about-step-content">
                  <h3>Track Progress</h3>
                  <p>Review your history and identify patterns in your learning journey</p>
                </div>
              </div>
            </div>
          </div>

          <div className="about-section">
            <h2 className="about-section-title">Built For Success</h2>
            <p className="about-text">
              Whether you're preparing for FAANG interviews, startup technical rounds, or simply want to 
                              strengthen your ML fundamentals, IntrVw. provides the comprehensive practice 
              you need to succeed. Our platform is designed with modern web technologies to ensure a 
              smooth, responsive experience across all devices.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="about-footer">
          <p>Created with ❤️ by Hetav Patel</p>
          <p className="about-footer-tech">Powered by React, FastAPI, and AI</p>
        </div>
      </div>
    </div>
  );
} 