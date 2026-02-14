import React from 'react';

const NetworkMesh = ({ size = 24, ...props }) => (
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
    <circle cx="12" cy="12" r="2" />
    <path d="M5 7v10" />
    <path d="M7 5h10" />
    <path d="M7 19h10" />
    <path d="M19 7v10" />
    <path d="M12 14v4" />
    <path d="M12 8v2" />
    <path d="M14 12h4" />
    <path d="M8 12h2" />
  </svg>
);

export default NetworkMesh;