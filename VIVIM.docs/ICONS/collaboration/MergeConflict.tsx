import React from 'react';

const MergeConflict = ({ size = 24, ...props }) => (
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
    <path d="M12 8v4" />
    <path d="M12 16h.01" />
    <path d="M8 12h8" />
    <path d="M15 15l3 3" />
    <path d="M15 9l3-3" />
    <path d="M9 15l-3 3" />
    <path d="M9 9l-3-3" />
  </svg>
);

export default MergeConflict;