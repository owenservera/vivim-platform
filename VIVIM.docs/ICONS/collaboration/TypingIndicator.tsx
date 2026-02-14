import React from 'react';

const TypingIndicator = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <circle cx="4" cy="12" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="20" cy="12" r="1" />
  </svg>
);

export default TypingIndicator;