import React from 'react';

const MessageAi = ({ size = 24, ...props }) => (
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
    <path d="M12 8V4H8" />
    <rect x="4" y="4" width="16" height="16" rx="2" />
    <path d="M8 8h8" />
    <path d="M8 12h6" />
    <path d="M16 20a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2" />
  </svg>
);

export default MessageAi;