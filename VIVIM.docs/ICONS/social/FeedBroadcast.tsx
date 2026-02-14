import React from 'react';

const FeedBroadcast = ({ size = 24, ...props }) => (
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
    <path d="M5.5 20.5c1.7-1.7 5.2-1.7 6.9 0 .3.3.6.6.9.9" />
    <path d="M2 8.5c2.8-2.8 7.3-2.8 10.1 0C15.7 12.1 22 12 22 12" />
    <path d="M12 2v2" />
    <path d="M3.5 16.5c3.5-3.5 9.2-3.5 12.7 0" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default FeedBroadcast;