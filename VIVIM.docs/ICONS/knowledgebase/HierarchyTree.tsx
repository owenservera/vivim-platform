import React from 'react';

const HierarchyTree = ({ size = 24, ...props }) => (
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
    <path d="M21 12h-8" />
    <path d="M21 4h-8" />
    <path d="M21 20h-8" />
    <path d="M13 4v16" />
    <path d="M3 12h8" />
    <path d="M3 4h8" />
    <path d="M3 20h8" />
    <path d="M11 4v16" />
    <circle cx="21" cy="12" r="1" />
    <circle cx="21" cy="4" r="1" />
    <circle cx="21" cy="20" r="1" />
    <circle cx="3" cy="12" r="1" />
    <circle cx="3" cy="4" r="1" />
    <circle cx="3" cy="20" r="1" />
  </svg>
);

export default HierarchyTree;