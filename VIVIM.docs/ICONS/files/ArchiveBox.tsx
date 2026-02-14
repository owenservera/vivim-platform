import React from 'react';

const ArchiveBox = ({ size = 24, ...props }) => (
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
    <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
    <path d="M5 8h14" />
    <path d="M5 12h14" />
    <path d="M5 16h14" />
  </svg>
);

export default ArchiveBox;