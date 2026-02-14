import React from 'react';

const QrCode = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3" y="3" width="5" height="5" rx="1" />
    <rect x="16" y="3" width="5" height="5" rx="1" />
    <rect x="16" y="16" width="5" height="5" rx="1" />
    <path d="M21 16v3a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3" />
    <path d="M3 16h4" />
    <path d="M3 12h2a2 2 0 0 1 2 2v4" />
    <path d="M12 3h4" />
    <path d="M16 3v4" />
    <path d="M12 14v2a2 2 0 0 0 2 2h2" />
  </svg>
);

export default QrCode;