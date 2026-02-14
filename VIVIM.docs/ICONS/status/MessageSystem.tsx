import React from 'react';

const MessageSystem = ({ size = 24, ...props }) => (
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
    <path d="M12 2a10 10 0 0 1 10 10c0 4.42-4.38 8-10 8S2 16.42 2 12 6.38 2 12 2z" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export default MessageSystem;