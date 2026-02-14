import React from 'react';

const MoveArrow = ({ size = 24, ...props }) => (
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
    <path d="M18 8L22 12 18 16" />
    <path d="M22 12H2" />
    <path d="M6 6L2 10 6 14" />
    <path d="M2 10h10" />
  </svg>
);

export default MoveArrow;