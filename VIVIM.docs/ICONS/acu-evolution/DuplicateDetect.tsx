import React from 'react';

const DuplicateDetect = ({ size = 24, ...props }) => (
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
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
    <path d="M12 8v8" />
    <path d="M8 12h8" />
    <circle cx="12" cy="12" r="3" />
    <path d="M15 15l3 3" />
  </svg>
);

export default DuplicateDetect;