import React from 'react';

const AppearancePalette = ({ size = 24, ...props }) => (
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
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.8-.1 2.6-.3C17.2 20.4 20 18.4 20 16c0-1.3-.6-2.5-1.6-3.3 1.1-1.5 1.6-3.4 1.1-5.3-.8 1.1-2 1.9-3.4 1.9z" />
  </svg>
);

export default AppearancePalette;