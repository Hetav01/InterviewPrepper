import React, { useEffect, useState } from 'react';
import LogoBot from './LogoBot.jsx';
import './LoadingScreen.css';

export default function LoadingScreen({ 
  message = "Loading...", 
  showLogo = true, 
  showSpinner = true,
  showProgress = false,
  progress = 0,
  onComplete,
  timeout = 3000 
}) {
  const [isVisible, setIsVisible] = useState(true);
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    // Auto-hide after timeout if provided
    if (timeout && timeout > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onComplete) onComplete();
      }, timeout);
      return () => clearTimeout(timer);
    }
  }, [timeout, onComplete]);

  useEffect(() => {
    // Animate progress if enabled
    if (showProgress && progress > 0) {
      const interval = setInterval(() => {
        setProgressValue(prev => {
          if (prev >= progress) {
            clearInterval(interval);
            return progress;
          }
          return prev + 1;
        });
      }, 20);
      return () => clearInterval(interval);
    }
  }, [showProgress, progress]);

  if (!isVisible) return null;

  return (
    <div className="loading-screen">
      <div className="loading-screen-content">
        {showLogo && (
          <div className="loading-logo-container">
            <LogoBot 
              className="loading-logo" 
              gradientId="loading-logo-gradient" 
              size={80} 
            />
          </div>
        )}
        
        <div className="loading-text-container">
          <h2 className="loading-title">IntrVu.</h2>
          <p className="loading-message">{message}</p>
        </div>

        {showSpinner && (
          <div className="loading-spinner-container">
            <div className="loading-spinner"></div>
          </div>
        )}

        {showProgress && (
          <div className="loading-progress-container">
            <div className="loading-progress-bar">
              <div 
                className="loading-progress-fill"
                style={{ width: `${progressValue}%` }}
              ></div>
            </div>
            <span className="loading-progress-text">{progressValue}%</span>
          </div>
        )}

        <div className="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
}

// Simple loading screen for quick loads
export function QuickLoadingScreen({ message = "Loading..." }) {
  return (
    <div className="quick-loading-screen">
      <div className="quick-loading-spinner"></div>
      <p className="quick-loading-text">{message}</p>
    </div>
  );
}

// Full page loading screen with background
export function FullPageLoadingScreen({ 
  message = "Preparing your interview experience...",
  showProgress = true 
}) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="full-page-loading-screen">
      <div className="full-page-loading-bg"></div>
      <div className="full-page-loading-content">
        <div className="full-page-loading-logo">
          <LogoBot 
            className="full-page-logo" 
            gradientId="full-page-logo-gradient" 
            size={120} 
          />
        </div>
        
        <div className="full-page-loading-text">
          <h1 className="full-page-loading-title">IntrVu.</h1>
          <p className="full-page-loading-message">{message}</p>
        </div>

        {showProgress && (
          <div className="full-page-progress-container">
            <div className="full-page-progress-bar">
              <div 
                className="full-page-progress-fill"
                style={{ width: `${Math.min(progress, 100)}%` }}
              ></div>
            </div>
            <span className="full-page-progress-text">
              {Math.round(Math.min(progress, 100))}%
            </span>
          </div>
        )}

        <div className="full-page-loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
} 