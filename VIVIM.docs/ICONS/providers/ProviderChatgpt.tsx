import React from 'react';

const ProviderChatgpt = ({ size = 24, ...props }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M20.42 14.68L21.9 13.2a1.4 1.4 0 0 1 2.1.2l.5.9a1.4 1.4 0 0 1-.2 1.6l-1.5 1.5a1.4 1.4 0 0 1-1.9.2l-.9-.5a1.4 1.4 0 0 1-.2-2zm-4.2-4.2L17.7 9a1.4 1.4 0 0 1 2.1.2l.5.9a1.4 1.4 0 0 1-.2 1.6l-1.5 1.5a1.4 1.4 0 0 1-1.9.2l-.9-.5a1.4 1.4 0 0 1-.2-2zm-4.2-4.2L9.7 5a1.4 1.4 0 0 1 2.1.2l.5.9a1.4 1.4 0 0 1-.2 1.6L10.6 9a1.4 1.4 0 0 1-1.9.2l-.9-.5a1.4 1.4 0 0 1-.2-2zm-4.2-4.2L5.7 1a1.4 1.4 0 0 1 2.1.2l.5.9a1.4 1.4 0 0 1-.2 1.6L6.6 5A1.4 1.4 0 0 1 4.7 5.2L3.8 4.7a1.4 1.4 0 0 1-.2-2zM12 12a6 6 0 0 0 6 6 6 6 0 0 0-6-6z" />
  </svg>
);

export default ProviderChatgpt;