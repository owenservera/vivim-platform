import React from 'react';

const LifecycleCycle = ({ size = 24, ...props }) => (
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
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z" />
    <path d="M12 2a10 10 0 0 0 0 20 10 10 0 0 0 0-20z" />
    <path d="M12 6v6l4 2" />
  </svg>
);

export default LifecycleCycle;