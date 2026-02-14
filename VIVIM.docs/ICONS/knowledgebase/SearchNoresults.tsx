import React from 'react';

const SearchNoresults = ({ size = 24, ...props }) => (
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
    <path d="M8 8l8 8" />
    <path d="M16 8l-8 8" />
  </svg>
);

export default SearchNoresults;