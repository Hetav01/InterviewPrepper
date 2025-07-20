import React, { useEffect, useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Outlet, Link, Navigate } from "react-router-dom";
import LogoBot from '../utils/LogoBot.jsx';
import { useSessionTimeout } from '../utils/SessionManager.js';

export function Layout() {
  // Initialize session timeout
  useSessionTimeout();
  
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage or system preference
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('theme');
      if (stored) return stored === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Keyboard shortcut: Ctrl+J or Cmd+J
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        setDarkMode(dm => !dm);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="app-layout">
      <header className="app-header">
        <div className="header-content">
          <div style={{ display: "flex", alignItems: "center", gap: "0.7em" }}>
            <LogoBot
              className="navbar-logo"
              gradientId="logo-gradient-navbar"
              size="2.3em"
            />
            <h1 style={{ margin: 0 }}>IntrVw.</h1>
          </div>
          <nav>
            <SignedIn>
              <Link to="/app">Ace your IntrVw!</Link>
              <Link to="/history">History</Link>
              <Link to="/about">About</Link>
              <a href="#" className="portfolio-link">
                My Portfolio!
              </a>
              <UserButton />
            </SignedIn>
            <button
              className="mode-toggle-slider"
              aria-label={
                darkMode ? "Switch to light mode" : "Switch to dark mode"
              }
              onClick={() => setDarkMode((dm) => !dm)}
              type="button"
              tabIndex={0}
              style={{
                marginLeft: "1rem",
                background: "none",
                border: "none",
                padding: 0,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                position: "relative",
              }}
            >
              <span className="visually-hidden">
                {darkMode ? "Switch to light mode" : "Switch to dark mode"}
              </span>
              <div className="slider-track">
                <span
                  className="slider-icon slider-icon-left"
                  aria-hidden="true"
                  style={{ opacity: darkMode ? 0.5 : 1 }}
                >
                  🌙
                </span>
                <span
                  className="slider-icon slider-icon-right"
                  aria-hidden="true"
                  style={{ opacity: darkMode ? 1 : 0.5 }}
                >
                  ☀️
                </span>
                <span
                  className={`slider-handle${darkMode ? " right" : ""}`}
                ></span>
              </div>
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        <SignedOut>
          <Navigate to="/sign-in" replace />
        </SignedOut>
        <SignedIn>
          <Outlet />
        </SignedIn>
      </main>
      <footer>
        <a
          className="global-copyright"
          href=""
          target="_blank"
          rel="noopener noreferrer"
        >
          Hetav Patel <span className="copyright-symbol">©</span> 2025
        </a>
      </footer>
    </div>
  );
}

// The <Outlet /> component in React Router is a placeholder that renders the child route elements. 
// In this layout, <Outlet /> is where the content of the nested routes (like the challenge generator or history panel) will appear, 
// depending on the current route. It allows you to define a common layout (like the header and navigation) 
// while swapping out the main content based on the route.
