import React from 'react';

const BacktrackPath = ({ size = 24, ...props }) => (
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
    <path d="M9 18l6-6-6-6" />
    <path d="M6 18l6-6-6-6" />
    <path d="M12 18l6-6-6-6" />
  </svg>
);

export default BacktrackPath;