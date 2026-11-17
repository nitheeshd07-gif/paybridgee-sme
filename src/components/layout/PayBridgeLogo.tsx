import React from 'react';

export function PayBridgeLogo({
  compact = false,
  light = false,
}: {
  compact?: boolean;
  light?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-2.5 shrink-0">
      <svg
        width="30"
        height="30"
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-hidden="true"
      >
        <rect
          width="32"
          height="32"
          rx="8"
          fill={light ? '#FFFFFF' : '#142B4A'}
        />
        <path
          d="M7 21.5C7 16.2533 11.0294 12 16 12C20.9706 12 25 16.2533 25 21.5"
          stroke={light ? '#2563EB' : '#60A5FA'}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M11 21.5V16.5M21 21.5V16.5M16 12V8.5"
          stroke={light ? '#142B4A' : '#FFFFFF'}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M6 22H26"
          stroke={light ? '#142B4A' : '#FFFFFF'}
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {!compact && (
        <span
          className={`font-display text-base font-bold tracking-tight whitespace-nowrap ${
            light ? 'text-white' : 'text-[#142B4A]'
          }`}
        >
          PayBridge <span className={light ? 'text-blue-200' : 'text-[#2563EB]'}>SME</span>
        </span>
      )}
    </div>
  );
}
