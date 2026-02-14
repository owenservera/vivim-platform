import React from 'react';

const GraphCycles = ({ size = 24, ...props }) => (
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
    <path d="M12 2a10 10 0 0 0 0 20 10 10 0 0 0 0-20z" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export default GraphCycles;