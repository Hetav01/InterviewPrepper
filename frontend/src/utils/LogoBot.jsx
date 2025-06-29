import React from 'react';

export default function LogoBot({ className = '', style = {}, gradientId = 'logo-gradient', size = 90 }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 240 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
    >
      <defs>
        <linearGradient id={gradientId} x1="60" y1="80" x2="180" y2="200" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2563eb" />
          <stop offset="0.4" stopColor="#60a5fa" />
          <stop offset="0.7" stopColor="#ff9800" />
          <stop offset="1" stopColor="#ffb347" />
        </linearGradient>
      </defs>
      <path d="M60 140 Q60 80 120 80 Q180 80 180 140" stroke={`url(#${gradientId})`} strokeWidth="12" fill="none" strokeLinecap="round" />
      <path d="M60 170 Q60 200 120 200 Q140 200 150 194" stroke={`url(#${gradientId})`} strokeWidth="12" fill="none" strokeLinecap="round" />
      <circle cx="95" cy="130" r="9" fill={`url(#${gradientId})`} />
      <circle cx="145" cy="130" r="9" fill={`url(#${gradientId})`} />
      <line x1="120" y1="54" x2="120" y2="80" stroke={`url(#${gradientId})`} strokeWidth="12" strokeLinecap="round" />
      <circle cx="120" cy="42" r="12" fill="none" stroke={`url(#${gradientId})`} strokeWidth="8" />
      <polyline points="120,180 150,210 210,130" fill="none" stroke={`url(#${gradientId})`} strokeWidth="14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
} 