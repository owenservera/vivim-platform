import React from 'react';

const InfluenceWaves = ({ size = 24, ...props }) => (
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
    <path d="M2 12s2-8 10-8 10 8 10 8-2 8-10 8-10-8-10-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default InfluenceWaves;