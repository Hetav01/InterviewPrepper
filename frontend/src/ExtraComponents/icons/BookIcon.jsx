import React from 'react';

export default function BookIcon({ size = 24, color = "currentColor", className = "" }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M18 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V4C20 2.9 19.1 2 18 2ZM18 20H6V4H18V20ZM9 6H15V8H9V6ZM9 10H15V12H9V10ZM9 14H15V16H9V14Z" fill={color}/>
    </svg>
  );
} 