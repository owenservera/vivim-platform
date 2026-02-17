/**
 * Device Detection Utility
 * 
 * Provides utilities to detect device type (mobile/desktop) and 
 * manage device-specific UI preferences.
 */

export type DeviceType = 'mobile' | 'desktop' | 'tablet';

export interface DeviceInfo {
  type: DeviceType;
  userAgent: string;
  isMobile: boolean;
  isDesktop: boolean;
  isTablet: boolean;
  width: number;
  height: number;
  prefersReducedMotion: boolean;
  prefersDarkMode: boolean;
}

/**
 * Detect device type based on user agent and screen dimensions
 */
export function detectDevice(): DeviceInfo {
  const userAgent = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Check for mobile devices
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent) && 
                   (width < 768 || height < 768);
  
  // Check for tablets
  const isTablet = /ipad|android(?!.*mobile)|tablet|kindle|silk/i.test(userAgent) || 
                   (width >= 768 && width <= 1024);
  
  // Desktop is fallback
  const isDesktop = !isMobile && !isTablet;
  
  let deviceType: DeviceType = 'desktop';
  if (isMobile) deviceType = 'mobile';
  else if (isTablet) deviceType = 'tablet';
  
  // Check user preferences
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  return {
    type: deviceType,
    userAgent,
    isMobile,
    isDesktop,
    isTablet,
    width,
    height,
    prefersReducedMotion,
    prefersDarkMode
  };
}

/**
 * Check if the current device is mobile
 */
export function isMobileDevice(): boolean {
  return detectDevice().isMobile;
}

/**
 * Check if the current device is desktop
 */
export function isDesktopDevice(): boolean {
  return detectDevice().isDesktop;
}

/**
 * Check if the current device is tablet
 */
export function isTabletDevice(): boolean {
  return detectDevice().isTablet;
}

/**
 * Get the current device type
 */
export function getDeviceType(): DeviceType {
  return detectDevice().type;
}

/**
 * Hook for React components to get device information
 */
export function useDevice(): DeviceInfo {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(detectDevice());
  
  useEffect(() => {
    const handleResize = () => {
      setDeviceInfo(detectDevice());
    };
    
    // Listen for window resize
    window.addEventListener('resize', handleResize);
    
    // Listen for preference changes
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      setDeviceInfo(prev => ({ ...prev, prefersDarkMode: e.matches }));
    };
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setDeviceInfo(prev => ({ ...prev, prefersReducedMotion: e.matches }));
    };
    
    darkModeQuery.addEventListener('change', handleDarkModeChange);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      darkModeQuery.removeEventListener('change', handleDarkModeChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);
  
  return deviceInfo;
}

import { useState, useEffect } from 'react';