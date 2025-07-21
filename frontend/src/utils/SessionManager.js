import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';

const SESSION_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
const WARNING_TIME = 2 * 60 * 1000; // 2 minutes before timeout
const STORAGE_KEY = 'session_start_time';

export const useSessionTimeout = () => {
    const { signOut, isSignedIn } = useAuth();
    const timeoutRef = useRef(null);
    const warningRef = useRef(null);
    const activityRef = useRef(null);

    const resetSessionTimer = () => {
        // Clear existing timers
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);

        if (!isSignedIn) return;

        // Set session start time
        const startTime = Date.now();
        localStorage.setItem(STORAGE_KEY, startTime.toString());

        // Set warning timer (2 minutes before timeout)
        warningRef.current = setTimeout(() => {
            const remaining = Math.ceil((SESSION_TIMEOUT - WARNING_TIME) / 1000 / 60);
            const shouldContinue = window.confirm(
                `Your session will expire in 2 minutes due to inactivity. You will be automatically signed out.\n\nClick OK to stay signed in, or Cancel to sign out now.`
            );
            
            if (!shouldContinue) {
                handleSignOut();
            }
        }, SESSION_TIMEOUT - WARNING_TIME);

        // Set timeout timer
        timeoutRef.current = setTimeout(() => {
            handleSignOut();
        }, SESSION_TIMEOUT);
    };

    const handleSignOut = async () => {
        localStorage.removeItem(STORAGE_KEY);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (warningRef.current) clearTimeout(warningRef.current);
        
        try {
            await signOut();
            // Force redirect to landing page
            window.location.href = '/';
        } catch (error) {
            console.error('Error signing out:', error);
            // Force redirect anyway
            window.location.href = '/';
        }
    };

    const handleUserActivity = () => {
        if (!isSignedIn) return;

        // Throttle activity detection to avoid excessive timer resets
        if (activityRef.current) return;
        
        activityRef.current = setTimeout(() => {
            activityRef.current = null;
            resetSessionTimer();
        }, 1000); // Reset at most once per second
    };

    useEffect(() => {
        if (!isSignedIn) {
            localStorage.removeItem(STORAGE_KEY);
            return;
        }

        // Check if existing session has expired
        const storedStartTime = localStorage.getItem(STORAGE_KEY);
        if (storedStartTime) {
            const sessionAge = Date.now() - parseInt(storedStartTime);
            if (sessionAge >= SESSION_TIMEOUT) {
                handleSignOut();
                return;
            }
        }

        // Initialize session timer
        resetSessionTimer();

        // Activity event listeners
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, handleUserActivity, { passive: true });
        });

        // Cleanup
        return () => {
            events.forEach(event => {
                document.removeEventListener(event, handleUserActivity);
            });
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (warningRef.current) clearTimeout(warningRef.current);
            if (activityRef.current) clearTimeout(activityRef.current);
        };
    }, [isSignedIn]);

    // Manual session refresh for explicit user actions
    const refreshSession = () => {
        if (isSignedIn) {
            resetSessionTimer();
        }
    };

    return { refreshSession };
};

// Utility to get remaining session time
export const getSessionTimeRemaining = () => {
    const startTime = localStorage.getItem(STORAGE_KEY);
    if (!startTime) return 0;
    
    const elapsed = Date.now() - parseInt(startTime);
    const remaining = Math.max(0, SESSION_TIMEOUT - elapsed);
    return remaining;
};

// Utility to format time remaining
export const formatTimeRemaining = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}; 