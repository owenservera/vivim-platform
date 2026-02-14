import React from 'react';

const MergeArrows = ({ size = 24, ...props }) => (
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
    <path d="M8 12h8" />
    <path d="M12 8l4 4-4 4" />
    <path d="M16 16H8" />
    <path d="M12 12l-4-4 4-4" />
  </svg>
);

export default MergeArrows;