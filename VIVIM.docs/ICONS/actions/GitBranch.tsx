import React from 'react';

const GitBranch = ({ size = 24, ...props }) => (
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
    <path d="M20 12H10" />
    <path d="M14 18a4 4 0 0 0 0-8" />
  </svg>
);

export default GitBranch;