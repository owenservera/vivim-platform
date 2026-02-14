import React from 'react';

const GraphDensity = ({ size = 24, ...props }) => (
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
    <circle cx="8" cy="8" r="1" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="16" cy="16" r="1" />
    <circle cx="10" cy="16" r="1" />
    <circle cx="14" cy="8" r="1" />
    <circle cx="8" cy="14" r="1" />
    <circle cx="16" cy="10" r="1" />
  </svg>
);

export default GraphDensity;