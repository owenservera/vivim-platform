import React from 'react';

const AcuAtom = ({ size = 24, ...props }) => (
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
    <circle cx="12" cy="12" r="2" />
    <path d="M2 12c0 4.4 3.6 8 8 8s8-3.6 8-8-3.6-8-8-8-8 3.6-8 8z" />
    <path d="M20 12c0 4.4-3.6 8-8 8s-8-3.6-8-8 3.6-8 8-8 8 3.6 8 8z" />
  </svg>
);

export default AcuAtom;