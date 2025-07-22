# IntrVu Frontend - Modern React Interview Preparation Interface

## Overview

A cutting-edge React application built with Vite that delivers an exceptional user experience for interview preparation. Features a sophisticated UI with real-time interactions, smooth animations, and responsive design that works seamlessly across all devices.

## Tech Stack

### Core Technologies
- **React 18**: Latest React with hooks and concurrent features
- **Vite**: Lightning-fast build tool and dev server
- **React Router**: Client-side routing with lazy loading

### UI & Styling
- **CSS3**: Custom CSS with modern features (Grid, Flexbox, Animations)
- **Vanta.js**: Interactive 3D backgrounds using Three.js
- **Responsive Design**: Mobile-first approach with breakpoint optimization

### Authentication & State
- **Clerk**: Modern authentication with social logins
- **React Context**: Global state management for loading states
- **Local Storage**: Persistent user preferences and onboarding

## Project Structure

```
frontend/src/
├── components/          # Reusable UI components
│   └── OnboardingModal.jsx
├── ExtraComponents/     # Feature-specific components
│   ├── About.jsx
│   ├── TechStackAnimation.jsx
│   └── icons/          # SVG icon components
├── challenge/          # Interview challenge features
│   ├── ChallengeGenerator.jsx
│   ├── InterviewChallenge.jsx
│   └── ScenarioChallenge.jsx
├── history/           # User history and analytics
│   ├── HistoryPanel.jsx
│   ├── HistoryScoreTracker.jsx
│   └── HistoryStatsCard.jsx
├── layout/            # Layout components
│   └── Layout.jsx
├── utils/             # Utilities and helpers
│   ├── Api.js
│   ├── LoadingContext.jsx
│   └── SessionManager.js
├── auth/              # Authentication components
├── App.jsx            # Main application component
├── LandingPage.jsx    # Landing page with animations
└── main.jsx          # Application entry point
```

## Installation & Setup

### Prerequisites
- Node.js 18+
- npm or yarn
- Modern browser with ES6+ support

### Quick Start
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables (if any...)
Create a `.env` file in the frontend directory:

```env
# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"

# API Configuration
VITE_API_BASE_URL="http://localhost:8000"
```

## Key Features

### User Experience
- **Smooth Animations**: CSS keyframes and transitions
- **Interactive Backgrounds**: Vanta.js 3D effects
- **Responsive Design**: Works on all screen sizes
- **Dark/Light Mode**: Theme switching with persistence

### Interview Features
- **Challenge Generation**: Dynamic question creation
- **Real-time Feedback**: Instant evaluation and scoring
- **Progress Tracking**: Detailed analytics and insights
- **History Management**: Complete challenge history

### Performance Optimizations
- **Code Splitting**: Lazy-loaded components
- **Image Optimization**: Optimized assets and SVGs
- **Bundle Optimization**: Tree shaking and minification

## Development Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Production build
npm run preview      # Preview production build

# Code Quality
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix linting issues

# Testing (when implemented)
npm run test         # Run tests
npm run test:watch   # Watch mode
```

## Component Architecture

### Smart Components
- **ChallengeGenerator**: Main interview interface
- **HistoryPanel**: User progress and analytics
- **OnboardingModal**: New user guidance

### Presentational Components
- **LoadingScreen**: Loading states and animations
- **Icon Components**: Reusable SVG icons
- **Layout Components**: Page structure and navigation

### State Management
- **LoadingContext**: Global loading state
- **SessionManager**: User session handling

## Styling System

### CSS Architecture
- **Custom Properties**: CSS variables for theming
- **BEM Methodology**: Organized class naming
- **Mobile-First**: Responsive design approach

### Theme System
- **Dark/Light Modes**: Automatic theme switching
- **Color Palette**: Consistent brand colors
- **Typography**: Scalable font system

## Performance Features

- **Lazy Loading**: Route-based code splitting
- **Image Optimization**: WebP and responsive images
- **Bundle Analysis**: Optimized bundle sizes
- **Caching**: Efficient resource caching

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+

## Deployment

### Build Process
```bash
npm run build
```

### Deployment Options
- **Vercel**: Zero-config deployment
- **Netlify**: Static site hosting
- **AWS S3**: Cloud hosting

This frontend demonstrates modern React development practices with a focus on performance, user experience, and maintainability. The codebase is production-ready and easily scalable for enterprise use.
