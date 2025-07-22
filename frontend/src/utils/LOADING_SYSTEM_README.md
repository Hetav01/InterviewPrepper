# Loading System Documentation

## Overview

The loading system provides a consistent, performant loading experience across all pages of the IntrVu application. It includes multiple loading screen types optimized for different use cases.

## Components

### 1. LoadingScreen
The main loading component with customizable options:
- Logo display
- Custom messages
- Progress bars
- Spinner animations
- Auto-timeout functionality

### 2. QuickLoadingScreen
Lightweight loading screen for fast operations:
- Minimal UI
- Quick spinner
- Short timeout

### 3. FullPageLoadingScreen
Comprehensive loading screen for major operations:
- Full-screen overlay
- Animated background
- Progress tracking
- Branded experience

## Usage

### Basic Setup

The loading system is already integrated into the main App component. All components can access loading functionality through the `useLoading` hook.

```jsx
import { useLoading } from '../utils/LoadingContext.jsx';

function MyComponent() {
  const { 
    showLoading, 
    hideLoading, 
    showAppLoading, 
    showPageLoading, 
    showQuickLoading, 
    showFullPageLoading,
    updateProgress 
  } = useLoading();

  // Use loading functions as needed
}
```

### Loading Types

#### 1. App Loading (Initial Load)
```jsx
const { showAppLoading, hideLoading } = useLoading();

useEffect(() => {
  showAppLoading({
    message: "Initializing IntrVu...",
    showProgress: true,
    timeout: 0
  });
  
  // Your initialization logic
  initializeApp().then(() => {
    hideLoading('app');
  });
}, []);
```

#### 2. Page Loading (Route Changes)
```jsx
const { showPageLoading, hideLoading } = useLoading();

useEffect(() => {
  showPageLoading({
    message: "Loading page...",
    timeout: 1000
  });
  
  // Hide when content is ready
  const timer = setTimeout(() => {
    hideLoading('page');
  }, 500);
  
  return () => clearTimeout(timer);
}, []);
```

#### 3. Quick Loading (Fast Operations)
```jsx
const { showQuickLoading, hideLoading } = useLoading();

const handleQuickOperation = async () => {
  showQuickLoading({ message: "Processing..." });
  
  try {
    await someQuickOperation();
  } finally {
    hideLoading('quick');
  }
};
```

#### 4. Full Page Loading (Major Operations)
```jsx
const { showFullPageLoading, hideLoading, updateProgress } = useLoading();

const handleMajorOperation = async () => {
  showFullPageLoading({
    message: "Generating challenges...",
    showProgress: true
  });
  
  try {
    // Update progress as needed
    updateProgress(25);
    await step1();
    
    updateProgress(50);
    await step2();
    
    updateProgress(100);
    await step3();
  } finally {
    hideLoading('fullPage');
  }
};
```

### Automatic Page Loading

Use the `usePageLoading` hook for automatic page loading on route changes:

```jsx
import { usePageLoading } from '../utils/LoadingContext.jsx';

function MyPage() {
  usePageLoading(); // Automatically shows/hides page loading
  
  return <div>Page content</div>;
}
```

### Async Operations with Loading

Use the `useAsyncLoading` hook for automatic loading on async operations:

```jsx
import { useAsyncLoading } from '../utils/LoadingContext.jsx';

function MyComponent() {
  const { execute, result, error, isLoading } = useAsyncLoading(
    async (param) => {
      // Your async function
      return await apiCall(param);
    }
  );

  const handleClick = () => {
    execute('some-param');
  };

  return (
    <div>
      <button onClick={handleClick}>Load Data</button>
      {result && <div>{result}</div>}
    </div>
  );
}
```

## Configuration Options

### LoadingScreen Props
- `message`: Custom loading message
- `showLogo`: Show/hide the IntrVu logo
- `showSpinner`: Show/hide the spinner animation
- `showProgress`: Enable progress bar
- `progress`: Progress percentage (0-100)
- `onComplete`: Callback when loading completes
- `timeout`: Auto-hide timeout in milliseconds

### Loading Context Methods
- `showLoading(type, config)`: Show any loading type
- `hideLoading(type)`: Hide specific loading type
- `showAppLoading(config)`: Show app initialization loading
- `showPageLoading(config)`: Show page loading
- `showQuickLoading(config)`: Show quick loading
- `showFullPageLoading(config)`: Show full page loading
- `updateProgress(progress)`: Update progress percentage

## Performance Optimizations

1. **Lazy Loading**: Loading screens are only rendered when needed
2. **Animation Optimization**: Uses CSS transforms and opacity for smooth animations
3. **Reduced Motion**: Respects user's motion preferences
4. **Accessibility**: High contrast mode support and screen reader friendly
5. **Responsive Design**: Optimized for all screen sizes

## Best Practices

1. **Use Appropriate Loading Type**:
   - App loading: Initial app startup
   - Page loading: Route changes
   - Quick loading: Fast operations (< 2 seconds)
   - Full page loading: Major operations (> 2 seconds)

2. **Set Reasonable Timeouts**:
   - Quick loading: 1-2 seconds
   - Page loading: 2-3 seconds
   - App loading: No timeout (manual control)
   - Full page loading: No timeout (manual control)

3. **Provide Meaningful Messages**:
   - Be specific about what's happening
   - Use action-oriented language
   - Keep messages concise

4. **Handle Errors Gracefully**:
   - Always hide loading on error
   - Provide user feedback
   - Allow retry options

## Examples

### Challenge Generation
```jsx
const generateChallenge = async () => {
  showFullPageLoading({
    message: "Generating interview challenges...",
    showProgress: true
  });
  
  try {
    updateProgress(25);
    const challenges = await api.generateChallenges();
    
    updateProgress(75);
    await processChallenges(challenges);
    
    updateProgress(100);
    setChallenges(challenges);
  } catch (error) {
    setError(error.message);
  } finally {
    hideLoading('fullPage');
  }
};
```

### Data Fetching
```jsx
const fetchUserData = async () => {
  showQuickLoading({ message: "Loading user data..." });
  
  try {
    const data = await api.getUserData();
    setUserData(data);
  } catch (error) {
    setError("Failed to load user data");
  } finally {
    hideLoading('quick');
  }
};
```

## Troubleshooting

### Loading Screen Not Showing
1. Ensure component is wrapped in `LoadingProvider`
2. Check that `useLoading` hook is called correctly
3. Verify loading type is valid ('app', 'page', 'quick', 'fullPage')

### Loading Screen Not Hiding
1. Call `hideLoading()` in finally block
2. Check for errors in loading logic
3. Verify timeout settings

### Performance Issues
1. Use appropriate loading type for operation duration
2. Avoid showing loading for very fast operations
3. Consider using `useAsyncLoading` for automatic management

## CSS Customization

The loading screens use CSS custom properties for easy theming:

```css
:root {
  --loading-primary-color: #3b82f6;
  --loading-secondary-color: #1d4ed8;
  --loading-background: #111827;
  --loading-text-color: #9ca3af;
}
```

Override these variables to customize the appearance across all loading screens. 