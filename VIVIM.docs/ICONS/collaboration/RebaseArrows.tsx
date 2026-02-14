import React from 'react';

const RebaseArrows = ({ size = 24, ...props }) => (
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
    <path d="M12 3v18" />
    <path d="M8 7l4-4 4 4" />
    <path d="M8 17l4 4 4-4" />
    <path d="M3 12h18" />
    <path d="M12 8l-4 4 4 4" />
  </svg>
);

export default RebaseArrows;