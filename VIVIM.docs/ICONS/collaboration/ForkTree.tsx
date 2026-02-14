import React from 'react';

const ForkTree = ({ size = 24, ...props }) => (
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
    <circle cx="12" cy="12" r="1" />
    <circle cx="18" cy="6" r="1" />
    <circle cx="6" cy="18" r="1" />
    <circle cx="18" cy="18" r="1" />
    <circle cx="6" cy="6" r="1" />
    <path d="M12 13v6" />
    <path d="M12 11v2" />
    <path d="M13 12h6" />
    <path d="M11 12h-2" />
    <path d="M18 7v4" />
    <path d="M6 17v-4" />
    <path d="M17 17h-4" />
    <path d="M7 7h4" />
  </svg>
);

export default ForkTree;