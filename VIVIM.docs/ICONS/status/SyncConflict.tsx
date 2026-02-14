import React from 'react';

const SyncConflict = ({ size = 24, ...props }) => (
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
    <path d="M17.47 17.48A7 7 0 0 1 3 12" />
    <path d="M2 8c1.6 3.6 4.7 6.4 8 7.5" />
    <path d="M12 2a10 10 0 0 1 8 8c0 2.1-.6 4.1-1.6 5.8" />
    <circle cx="12" cy="12" r="3" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

export default SyncConflict;