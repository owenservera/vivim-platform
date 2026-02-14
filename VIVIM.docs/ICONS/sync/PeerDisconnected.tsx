import React from 'react';

const PeerDisconnected = ({ size = 24, ...props }) => (
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
    <circle cx="5" cy="5" r="2" />
    <circle cx="19" cy="5" r="2" />
    <circle cx="5" cy="19" r="2" />
    <circle cx="19" cy="19" r="2" />
    <path d="M5 7v10" />
    <path d="M7 5h10" />
    <path d="M7 19h10" />
    <path d="M19 7v10" />
    <path d="M15 9l-6 6" />
    <path d="M9 9l6 6" />
  </svg>
);

export default PeerDisconnected;