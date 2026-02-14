import React from 'react';

const StorageCache = ({ size = 24, ...props }) => (
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
    <path d="M20 7h-4a2 2 0 0 0-2 2v9a2 2 0 0 1-2 2H6" />
    <path d="M15 2v4" />
    <path d="M18 15a6 6 0 0 0-6-6 6 6 0 0 0-6 6c0 1.7.7 3.2 1.8 4.2" />
  </svg>
);

export default StorageCache;