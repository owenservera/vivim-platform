import React from 'react';

const AuthFingerprint = ({ size = 24, ...props }) => (
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
    <path d="M18 12c0 2.4-1.2 4.5-3 5.7" />
    <path d="M9 12c0 2.4 1.2 4.5 3 5.7" />
    <path d="M3 15c0 3.3 2.7 6 6 6" />
    <path d="M15 21c3.3 0 6-2.7 6-6" />
    <path d="M3 9c0-3.3 2.7-6 6-6" />
    <path d="M15 3c3.3 0 6 2.7 6 6" />
    <path d="M12 6c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z" />
  </svg>
);

export default AuthFingerprint;