import React, { useEffect, useState } from "react";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Outlet, Link, Navigate } from "react-router-dom";

export function Layout() {
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

  return <div className="app-layout">
    <header className="app-header">
        <div className="header-content">
            <h1>ML Interview Prepper</h1>
            <nav>
                <SignedIn>
                    <Link to="/">Generate Preperation Challenge</Link>
                    <Link to="/history">History</Link>
                    <UserButton />
                </SignedIn>
                <button
                  className="mode-toggle-btn"
                  aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
                  onClick={() => setDarkMode(dm => !dm)}
                  style={{
                    marginLeft: '1rem',
                    background: 'none',
                    cursor: 'pointer',
                    fontSize: '1.1rem',
                    padding: '0.4rem 0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    color: 'var(--text-color)',
                    position: 'relative',
                  }}
                >
                  <span className="mode-toggle-icon">{darkMode ? '🌙' : '☀️'}</span>
                  <span style={{fontWeight: 500}}>{darkMode ? 'Dark' : 'Light'}</span>
                  <span className="mode-toggle-tooltip" style={{marginLeft: '0.5em', fontSize: '0.95em', opacity: 0.85, display: 'flex', alignItems: 'center', gap: '0.2em'}}>
                    <span style={{fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace'}}>⌘</span>
                    <span style={{fontSize: '0.9em', margin: '0 0.1em'}}>/</span>
                    <span style={{fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace'}}>Ctrl</span>
                    <span style={{fontSize: '0.9em', margin: '0 0.1em'}}>+</span>
                    <span style={{fontFamily: 'SF Mono, Menlo, Monaco, Consolas, monospace'}}>J</span>
                  </span>
                </button>
            </nav>
        </div>
    </header>

    <main className="app-main">
        <SignedOut>
            <Navigate to="/sign-in" replace/>
        </SignedOut>
        <SignedIn>
            <Outlet />  
        </SignedIn>
    </main>
  </div>;
}

// The <Outlet /> component in React Router is a placeholder that renders the child route elements. 
// In this layout, <Outlet /> is where the content of the nested routes (like the challenge generator or history panel) will appear, 
// depending on the current route. It allows you to define a common layout (like the header and navigation) 
// while swapping out the main content based on the route.
