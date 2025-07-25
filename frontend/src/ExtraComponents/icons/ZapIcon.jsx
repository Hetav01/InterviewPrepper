import React from 'react';

export default function ZapIcon({ size = 24, color = "currentColor", className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill={color}/>
    </svg>
  );
} 