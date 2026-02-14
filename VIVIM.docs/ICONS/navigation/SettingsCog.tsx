import React from 'react';

const SettingsCog = ({ size = 24, ...props }) => (
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
    <circle cx="12" cy="12" r="3" />
    <path d="M12 1v4M12 19v4M4.22 4.22l2.82 2.82M16.95 16.95l2.82 2.82M1 12h4M19 12h4M4.22 19.78l2.82-2.82M16.95 7.05l2.82-2.82" />
  </svg>
);

export default SettingsCog;