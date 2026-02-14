import React from 'react';

const SearchAdvanced = ({ size = 24, ...props }) => (
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
    <circle cx="11" cy="11" r="8" />
    <path d="M21 21l-4.35-4.35" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
    <path d="M8 8h2" />
    <path d="M14 16h2" />
  </svg>
);

export default SearchAdvanced;