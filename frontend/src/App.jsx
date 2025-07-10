import React from 'react'
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

function App() {
  return <ClerkProviderWithRoutes>
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
  </ClerkProviderWithRoutes>
}

export default App
