import React from 'react';

const BranchActive = ({ size = 24, ...props }) => (
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
    <circle cx="6" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M6 9v6" />
    <path d="M18 12h-6" />
    <circle cx="18" cy="12" r="3" />
  </svg>
);

export default BranchActive;