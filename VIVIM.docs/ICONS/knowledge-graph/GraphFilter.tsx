import React from 'react';

const GraphFilter = ({ size = 24, ...props }) => (
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
    <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" />
    <circle cx="12" cy="12" r="1" />
  </svg>
);

export default GraphFilter;