import React from 'react';

const GitForkBranch = ({ size = 24, ...props }) => (
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
    <circle cx="12" cy="12" r="3" />
    <circle cx="19" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <path d="M10.5 10.5l-5.5 5.5" />
    <path d="M13.5 13.5l5.5 5.5" />
  </svg>
);

export default GitForkBranch;