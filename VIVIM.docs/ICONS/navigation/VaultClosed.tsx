import React from 'react';

const VaultClosed = ({ size = 24, ...props }) => (
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
    <rect x="2" y="8" width="20" height="12" rx="3" />
    <path d="M12 14v2" />
    <circle cx="12" cy="12" r="2" />
  </svg>
);

export default VaultClosed;