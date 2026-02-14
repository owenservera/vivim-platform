import React from 'react';

const TagCloud = ({ size = 24, ...props }) => (
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
    <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0L22 9.41V2z" />
    <circle cx="12" cy="12" r="1" />
    <circle cx="8" cy="8" r="1" />
    <circle cx="16" cy="8" r="1" />
    <circle cx="8" cy="16" r="1" />
    <circle cx="16" cy="16" r="1" />
    <circle cx="12" cy="8" r="1" />
    <circle cx="12" cy="16" r="1" />
    <circle cx="8" cy="12" r="1" />
    <circle cx="16" cy="12" r="1" />
  </svg>
);

export default TagCloud;