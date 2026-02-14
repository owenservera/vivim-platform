import React from 'react';

const RankTrophy = ({ size = 24, ...props }) => (
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
    <path d="M12 2v2" />
    <path d="M6 2v2" />
    <path d="M18 2v2" />
    <path d="M16 8a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v6a6 6 0 0 0 12 0V8z" />
    <path d="M12 14v6" />
    <path d="M8 20h8" />
    <path d="M10 20v2" />
    <path d="M14 20v2" />
  </svg>
);

export default RankTrophy;