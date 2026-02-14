import React from 'react';

const ProviderGemini = ({ size = 24, ...props }) => (
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
    <path d="M12 2a10 10 0 0 1 7.7 16.3l-7.7-12.6 7.7-3.7A10 10 0 1 1 12 22z" />
  </svg>
);

export default ProviderGemini;