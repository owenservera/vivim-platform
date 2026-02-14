import React from 'react';

const SyncBattery = ({ size = 24, ...props }) => (
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
    <path d="M12 6v8" />
    <path d="M8 12h8" />
    <path d="M12 16h.01" />
    <path d="M16 6h.01" />
    <path d="M8 6h.01" />
  </svg>
);

export default SyncBattery;