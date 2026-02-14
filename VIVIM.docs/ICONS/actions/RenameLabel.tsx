import React from 'react';

const RenameLabel = ({ size = 24, ...props }) => (
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
    <path d="M12 5v14" />
    <path d="M5 12h14" />
    <path d="M5 5h14v14H5z" />
    <path d="M15 8h2" />
    <path d="M15 12h4" />
    <path d="M15 16h2" />
  </svg>
);

export default RenameLabel;