import React, { useState, useEffect } from "react";

const AnimatedNumber = ({ value, duration = 1500, delay = 0 }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        if (value === 0) {
            setDisplayValue(0);
            return;
        }

        let animationId;
        let timeoutId;
        
        const startAnimation = () => {
            let startTime = null;
            const startValue = 0;
            const endValue = value;

            const animate = (currentTime) => {
                if (startTime === null) startTime = currentTime;
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ultra-smooth easing function (ease-out-quart)
                const easeOutQuart = 1 - Math.pow(1 - progress, 4);
                
                // Calculate current value with precise interpolation
                const currentValue = startValue + (endValue - startValue) * easeOutQuart;
                
                // Use different rounding strategies based on value and progress
                let smoothValue;
                if (endValue <= 10) {
                    // For small numbers, use continuous rounding for ultra-smooth effect
                    smoothValue = Math.round(currentValue);
                } else if (progress < 0.1) {
                    // Start very slowly for larger numbers
                    smoothValue = Math.floor(currentValue);
                } else {
                    // Smooth progression for larger numbers
                    smoothValue = Math.round(currentValue);
                }
                
                setDisplayValue(smoothValue);

                if (progress < 1) {
                    animationId = requestAnimationFrame(animate);
                } else {
                    // Ensure we end exactly at the target value
                    setDisplayValue(endValue);
                }
            };

            animationId = requestAnimationFrame(animate);
        };

        // Add delay for staggered effect
        if (delay > 0) {
            timeoutId = setTimeout(startAnimation, delay);
        } else {
            startAnimation();
        }

        // Cleanup function
        return () => {
            if (animationId) {
                cancelAnimationFrame(animationId);
            }
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    }, [value, duration, delay]);

    return <span>{displayValue}</span>;
};

export default AnimatedNumber; 