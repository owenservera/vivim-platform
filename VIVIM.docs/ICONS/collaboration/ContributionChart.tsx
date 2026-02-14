import React from 'react';

const ContributionChart = ({ size = 24, ...props }) => (
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
    <path d="M20 21v-4a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v4" />
    <path d="M12 9v10" />
    <path d="M16 13v6" />
    <path d="M8 13v6" />
    <path d="M4 3h16" />
    <path d="M6 3v4" />
    <path d="M10 3v4" />
    <path d="M14 3v4" />
    <path d="M18 3v4" />
  </svg>
);

export default ContributionChart;