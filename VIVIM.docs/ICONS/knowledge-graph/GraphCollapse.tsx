import React from 'react';

const GraphCollapse = ({ size = 24, ...props }) => (
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
    <path d="M4 7h5v5" />
    <path d="M15 7h5v5" />
    <path d="M4 17h5v-5" />
    <path d="M15 17h5v-5" />
    <path d="M3 3h6v6H3z" />
    <path d="M15 3h6v6h-6z" />
    <path d="M3 15h6v6H3z" />
    <path d="M15 15h6v6h-6z" />
    <path d="M12 12h.01" />
  </svg>
);

export default GraphCollapse;