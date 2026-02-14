import React from 'react';

const GraphReset = ({ size = 24, ...props }) => (
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
    <path d="M2.5 2v6h6" />
    <path d="M21.5 22v-6h-6" />
    <path d="M22 11.5A10 10 0 0 0 2 11.5a10 10 0 0 0 20 0z" />
  </svg>
);

export default GraphReset;