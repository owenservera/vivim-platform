/**
 * Environment Configuration for OpenScroll PWA
 * 
 * This file configures the PWA to connect to the server at the correct IP address
 */

// Determine the correct API base URL based on the server's actual IP
const getApiBaseUrl = () => {
  // Check if we have a stored override
  const override = typeof localStorage !== 'undefined' ? localStorage.getItem('OPENSCROLL_API_OVERRIDE') : null;
  if (override) {
    return override;
  }

  // Use the server's actual IP address (from the server logs we can see it's running on 192.168.0.173)
  // This ensures the PWA can connect to the server regardless of network configuration
  const serverIp = '192.168.0.173';
  const serverPort = '3000';
  
  // Return the correct API endpoint
  return `http://${serverIp}:${serverPort}/api/v1`;
};

// Export the correct configuration
export const VITE_API_BASE_URL = getApiBaseUrl();

// For development, you can also set this in a .env file as:
// VITE_API_BASE_URL=http://192.168.0.173:3000/api/v1