import React from 'react';

const VaultsenseSimilarity = ({ size = 24, ...props }) => (
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
    <circle cx="12" cy="12" r="10" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
    <path d="M16 16l4 4" />
    <path d="M8 8l-4-4" />
    <path d="M16 8l4-4" />
    <path d="M8 16l-4 4" />
  </svg>
);

export default VaultsenseSimilarity;