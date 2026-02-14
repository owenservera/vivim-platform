import React from 'react';

const IdentityCard = ({ size = 24, ...props }) => (
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
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
    <circle cx="8" cy="15" r="1" />
    <path d="M16 14h.01" />
    <path d="M19 14h.01" />
  </svg>
);

export default IdentityCard;