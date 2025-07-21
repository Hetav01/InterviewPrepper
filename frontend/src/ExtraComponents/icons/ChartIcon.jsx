import React from 'react';

export default function ChartIcon({ size = 24, color = "currentColor", className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M3 13H7V23H3V13ZM10 9H14V23H10V9ZM17 5H21V23H17V5Z" fill={color}/>
    </svg>
  );
} 