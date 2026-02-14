import React from 'react';

const ProviderGeneric = ({ size = 24, ...props }) => (
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
    <path d="M9 12l2 2 4-4" />
    <path d="M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" />
  </svg>
);

export default ProviderGeneric;