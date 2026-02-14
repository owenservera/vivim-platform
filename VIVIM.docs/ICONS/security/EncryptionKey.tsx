import React from 'react';

const EncryptionKey = ({ size = 24, ...props }) => (
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
    <path d="M15 12a3 3 0 1 0-6 0" />
    <path d="M12 15v5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1" />
    <path d="M12 3v6l3 3" />
  </svg>
);

export default EncryptionKey;