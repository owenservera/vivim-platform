import React from 'react';

const ProviderKimi = ({ size = 24, ...props }) => (
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
    <circle cx="12" cy="12" r="10" />
    <path d="M8 8l8 8M16 8L8 16" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default ProviderKimi;