import React, { createContext, useContext, useState, useEffect } from 'react';
import LoadingScreen, { QuickLoadingScreen, FullPageLoadingScreen } from './LoadingScreen.jsx';

// Create the loading context
const LoadingContext = createContext();

// Custom hook to use the loading context
export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

// Loading provider component
export function LoadingProvider({ children }) {
  const [loadingStates, setLoadingStates] = useState({
    app: false,
    page: false,
    quick: false,
    fullPage: false
  });
  
  const [loadingConfig, setLoadingConfig] = useState({
    message: "Loading...",
    showProgress: false,
    progress: 0,
    timeout: 0
  });

  // Show loading screen
  const showLoading = (type = 'app', config = {}) => {
    setLoadingStates(prev => ({
      ...prev,
      [type]: true
    }));
    
    if (config) {
      setLoadingConfig(prev => ({
        ...prev,
        ...config
      }));
    }
  };

  // Hide loading screen
  const hideLoading = (type = 'app') => {
    setLoadingStates(prev => ({
      ...prev,
      [type]: false
    }));
  };

  // Show app loading (for main app initialization)
  const showAppLoading = (config = {}) => {
    showLoading('app', {
      message: "Initializing IntrVw...",
      showProgress: true,
      timeout: 0,
      ...config
    });
  };

  // Show page loading (for route changes)
  const showPageLoading = (config = {}) => {
    showLoading('page', {
      message: "Loading page...",
      showProgress: false,
      timeout: 3000,
      ...config
    });
  };

  // Show quick loading (for fast operations)
  const showQuickLoading = (config = {}) => {
    showLoading('quick', {
      message: "Loading...",
      timeout: 2000,
      ...config
    });
  };

  // Show full page loading (for major operations)
  const showFullPageLoading = (config = {}) => {
    showLoading('fullPage', {
      message: "Preparing your interview experience...",
      showProgress: true,
      timeout: 0,
      ...config
    });
  };

  // Update progress
  const updateProgress = (progress) => {
    setLoadingConfig(prev => ({
      ...prev,
      progress
    }));
  };

  // Auto-hide loading after timeout
  useEffect(() => {
    Object.entries(loadingStates).forEach(([type, isVisible]) => {
      if (isVisible && loadingConfig.timeout > 0) {
        const timer = setTimeout(() => {
          hideLoading(type);
        }, loadingConfig.timeout);
        
        return () => clearTimeout(timer);
      }
    });
  }, [loadingStates, loadingConfig.timeout]);

  const value = {
    loadingStates,
    loadingConfig,
    showLoading,
    hideLoading,
    showAppLoading,
    showPageLoading,
    showQuickLoading,
    showFullPageLoading,
    updateProgress
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      
      {/* Render loading screens based on state */}
      {loadingStates.app && (
        <LoadingScreen
          message={loadingConfig.message}
          showProgress={loadingConfig.showProgress}
          progress={loadingConfig.progress}
          onComplete={() => hideLoading('app')}
          timeout={loadingConfig.timeout}
        />
      )}
      
      {loadingStates.page && (
        <LoadingScreen
          message={loadingConfig.message}
          showLogo={false}
          showProgress={loadingConfig.showProgress}
          progress={loadingConfig.progress}
          onComplete={() => hideLoading('page')}
          timeout={loadingConfig.timeout}
        />
      )}
      
      {loadingStates.quick && (
        <QuickLoadingScreen
          message={loadingConfig.message}
        />
      )}
      
      {loadingStates.fullPage && (
        <FullPageLoadingScreen
          message={loadingConfig.message}
          showProgress={loadingConfig.showProgress}
        />
      )}
    </LoadingContext.Provider>
  );
}

// Higher-order component to wrap components with loading functionality
export function withLoading(Component) {
  return function WrappedComponent(props) {
    const loading = useLoading();
    
    return (
      <Component {...props} loading={loading} />
    );
  };
}

// Hook for automatic page loading on route changes
export function usePageLoading() {
  const { showPageLoading, hideLoading } = useLoading();
  
  useEffect(() => {
    // Show loading when component mounts (route change)
    showPageLoading();
    
    // Hide loading after a short delay to ensure content is ready
    const timer = setTimeout(() => {
      hideLoading('page');
    }, 500);
    
    return () => {
      clearTimeout(timer);
      hideLoading('page');
    };
  }, []);
}

// Hook for automatic loading on async operations
export function useAsyncLoading(asyncFunction, dependencies = []) {
  const { showQuickLoading, hideLoading } = useLoading();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = async (...args) => {
    setIsLoading(true);
    showQuickLoading();
    
    try {
      const data = await asyncFunction(...args);
      setResult(data);
      setError(null);
      return data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsLoading(false);
      hideLoading('quick');
    }
  };

  return { execute, result, error, isLoading };
} 