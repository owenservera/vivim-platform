import React from 'react';

const StorageDisk = ({ size = 24, ...props }) => (
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
    <rect x="2" y="6" width="20" height="12" rx="2" />
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v4" />
    <path d="M12 19v4" />
    <path d="M4.22 10.22l2.82-2.82" />
    <path d="M16.78 13.78l2.82-2.82" />
  </svg>
);

export default StorageDisk;