import React from 'react';

const GraphCommunities = ({ size = 24, ...props }) => (
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
    <circle cx="9" cy="9" r="6" />
    <circle cx="15" cy="15" r="6" />
    <path d="M9 15h6" />
    <path d="M12 12v6" />
    <path d="M12 6v2" />
  </svg>
);

export default GraphCommunities;