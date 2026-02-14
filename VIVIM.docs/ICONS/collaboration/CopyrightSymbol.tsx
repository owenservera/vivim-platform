import React from 'react';

const CopyrightSymbol = ({ size = 24, ...props }) => (
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
    <path d="M12 8c2 0 4 1.34 4 4s-2 4-4 4-4-1.34-4-4 2-4 4-4z" />
  </svg>
);

export default CopyrightSymbol;