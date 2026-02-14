import React from 'react';

const GraphEdgeDirected = ({ size = 24, ...props }) => (
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
    <circle cx="19" cy="19" r="2" />
    <path d="M5 7l14 10" />
    <path d="M17 17l4 2-2-4" />
  </svg>
);

export default GraphEdgeDirected;