import React from 'react';

export default function EmptyStateIcon({ size = 24, color = "currentColor", className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <style>
        {`
          @keyframes eyeOpenShutLeft {
            0%, 85%, 100% { 
              transform: scaleY(1);
              opacity: 1;
            }
            90%, 95% { 
              transform: scaleY(0.1);
              opacity: 0.3;
            }
          }
          @keyframes eyeOpenShutRight {
            0%, 80%, 100% { 
              transform: scaleY(1);
              opacity: 1;
            }
            88%, 93% { 
              transform: scaleY(0.1);
              opacity: 0.3;
            }
          }
          @keyframes eyebrowLeft {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-1px); }
          }
          @keyframes eyebrowRight {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-1px); }
          }
          .eye-left {
            animation: eyeOpenShutLeft 3.5s ease-in-out infinite;
            transform-origin: center;
          }
          .eye-right {
            animation: eyeOpenShutRight 3.2s ease-in-out infinite;
            transform-origin: center;
          }
          .eyebrow-left {
            animation: eyebrowLeft 4s ease-in-out infinite;
          }
          .eyebrow-right {
            animation: eyebrowRight 3.5s ease-in-out infinite;
          }
        `}
      </style>
      
      {/* Left eyebrow */}
      <path 
        d="M7 8 Q9 6 11 8" 
        stroke={color} 
        strokeWidth="1.5" 
        fill="none" 
        className="eyebrow-left"
      />
      
      {/* Right eyebrow */}
      <path 
        d="M13 8 Q15 6 17 8" 
        stroke={color} 
        strokeWidth="1.5" 
        fill="none" 
        className="eyebrow-right"
      />
      
      {/* Left eye */}
      <circle 
        cx="9" 
        cy="12" 
        r="2" 
        fill={color} 
        className="eye-left"
      />
      
      {/* Right eye */}
      <circle 
        cx="15" 
        cy="12" 
        r="2" 
        fill={color} 
        className="eye-right"
      />
    </svg>
  );
} 