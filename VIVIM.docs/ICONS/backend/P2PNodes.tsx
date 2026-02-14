import React from 'react';

const P2PNodes = ({ size = 24, ...props }) => (
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
    <circle cx="5" cy="12" r="2" />
    <circle cx="19" cy="12" r="2" />
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="19" r="2" />
    <path d="M6.5 8.5l5.5 1.5" />
    <path d="M6.5 15.5l5.5-1.5" />
    <path d="M17.5 8.5l-5.5 1.5" />
    <path d="M17.5 15.5l-5.5-1.5" />
  </svg>
);

export default P2PNodes;