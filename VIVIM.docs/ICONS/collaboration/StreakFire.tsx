import React from 'react';

const StreakFire = ({ size = 24, ...props }) => (
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
    <path d="M12 2c1.5 0 3.5 1.5 4 4 .5 2.5-.5 4-1.5 6s-3 3-3 3 .5 2.5 3 3 4-1.5 4-4c0-2.5-1.5-4-2.5-6s-2-3-2-3 .5-2.5 2-3 3 1.5 3 4c0 2.5-1 4-2 6s-2 3-2 3" />
  </svg>
);

export default StreakFire;