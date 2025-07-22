import React, { useEffect, useState } from 'react'
import './App.css'
import { Routes, Route } from 'react-router-dom'
import ClerkProviderWithRoutes from './auth/ClerkProviderWithRoutes'
import { Layout } from './layout/Layout.jsx'
import { HistoryPanel } from './history/HistoryPanel.jsx'
import { ChallengeGenerator } from './challenge/ChallengeGenerator.jsx'
import { InterviewChallenge } from './challenge/InterviewChallenge.jsx'
import { AuthenticationPage } from './auth/AuthenticationPage.jsx'
import LandingPage from './LandingPage.jsx'
import About from './ExtraComponents/About.jsx'
import { LoadingProvider, useLoading } from './utils/LoadingContext.jsx'

// App content component that uses loading context
function AppContent() {
  const { showAppLoading, hideLoading } = useLoading();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Show app loading on initial load
    showAppLoading({
      message: "Initializing IntrVu...",
      showProgress: true,
      timeout: 0
    });

    // Simulate app initialization
    const initializeApp = async () => {
      try {
        // Simulate loading time for app initialization
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Hide loading and mark as initialized
        hideLoading('app');
        setIsInitialized(true);
      } catch (error) {
        console.error('App initialization failed:', error);
        hideLoading('app');
        setIsInitialized(true);
      }
    };

    initializeApp();
  }, []);

  if (!isInitialized) {
    return null; // Loading screen will be shown by the provider
  }

  return (
    <Routes>
      <Route path= "/sign-in/*" element={<AuthenticationPage />}></Route>
      <Route path='/sign-up' element={<AuthenticationPage />}></Route>
      <Route path="/" element={<LandingPage />}></Route>
      <Route path="/about" element={<About />}></Route>
      <Route element={<Layout />}>
        <Route path="/app" element={<ChallengeGenerator />}></Route>
        <Route path="/history" element={<HistoryPanel />}></Route>
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <LoadingProvider>
      <ClerkProviderWithRoutes>
        <AppContent />
      </ClerkProviderWithRoutes>
    </LoadingProvider>
  );
}

export default App
