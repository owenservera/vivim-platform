import React from 'react';

const TextIndent = ({ size = 24, ...props }) => (
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
    <polyline points="3,8 7,12 3,16" />
    <line x1="21" y1="12" x2="11" y2="12" />
    <line x1="21" y1="6" x2="11" y2="6" />
    <line x1="21" y1="18" x2="11" y2="18" />
  </svg>
);

export default TextIndent;