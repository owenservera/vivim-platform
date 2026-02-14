import React from 'react';

const SignaturePen = ({ size = 24, ...props }) => (
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
    <path d="M14 2c1.1 0 2 .9 2 2v5l-1-.75L14 8l-1 .75V4c0-1.1.9-2 2-2z" />
    <path d="M12 10l-2 2-4-4 2-2" />
    <path d="M6 14l-2 2 4 4 2-2" />
  </svg>
);

export default SignaturePen;