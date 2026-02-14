import React from 'react';

const BreadcrumbNav = ({ size = 24, ...props }) => (
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
    <path d="M3 7h3" />
    <path d="M3 12h3" />
    <path d="M3 17h3" />
    <path d="M8 7h3" />
    <path d="M8 12h3" />
    <path d="M8 17h3" />
    <path d="M13 7h3" />
    <path d="M13 12h3" />
    <path d="M13 17h3" />
    <path d="M18 7h3" />
    <path d="M18 12h3" />
    <path d="M18 17h3" />
    <circle cx="4.5" cy="7" r="1" />
    <circle cx="4.5" cy="12" r="1" />
    <circle cx="4.5" cy="17" r="1" />
    <circle cx="9.5" cy="7" r="1" />
    <circle cx="9.5" cy="12" r="1" />
    <circle cx="9.5" cy="17" r="1" />
    <circle cx="14.5" cy="7" r="1" />
    <circle cx="14.5" cy="12" r="1" />
    <circle cx="14.5" cy="17" r="1" />
    <circle cx="19.5" cy="7" r="1" />
    <circle cx="19.5" cy="12" r="1" />
    <circle cx="19.5" cy="17" r="1" />
  </svg>
);

export default BreadcrumbNav;