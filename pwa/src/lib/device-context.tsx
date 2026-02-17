/**
 * Device Context Provider
 * 
 * Provides device information and device-specific settings
 * throughout the application.
 */

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { DeviceInfo, DeviceType, detectDevice } from './device-detection';

interface DeviceContextType {
  device: DeviceInfo;
  deviceType: DeviceType;
  forceDeviceType: (type: DeviceType) => void;
  resetDeviceType: () => void;
  isForced: boolean;
}

const DeviceContext = createContext<DeviceContextType | undefined>(undefined);

interface DeviceProviderProps {
  children: ReactNode;
}

export const DeviceProvider: React.FC<DeviceProviderProps> = ({ children }) => {
  const [device, setDevice] = useState<DeviceInfo>(detectDevice());
  const [forcedDeviceType, setForcedDeviceType] = useState<DeviceType | null>(null);
  
  // Load saved device preference from localStorage
  useEffect(() => {
    try {
      const savedDevicePreference = localStorage.getItem('device_type_preference');
      if (savedDevicePreference && ['mobile', 'desktop', 'tablet'].includes(savedDevicePreference)) {
        setForcedDeviceType(savedDevicePreference as DeviceType);
      }
    } catch (error) {
      console.warn('Failed to load device preference from localStorage:', error);
    }
  }, []);
  
  // Update device info on resize
  useEffect(() => {
    const handleResize = () => {
      setDevice(detectDevice());
    };
    
    window.addEventListener('resize', handleResize);
    
    // Listen for preference changes
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      setDevice(prev => ({ ...prev, prefersDarkMode: e.matches }));
    };
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setDevice(prev => ({ ...prev, prefersReducedMotion: e.matches }));
    };
    
    darkModeQuery.addEventListener('change', handleDarkModeChange);
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      darkModeQuery.removeEventListener('change', handleDarkModeChange);
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, []);
  
  const forceDeviceType = (type: DeviceType) => {
    setForcedDeviceType(type);
    try {
      localStorage.setItem('device_type_preference', type);
    } catch (error) {
      console.warn('Failed to save device preference to localStorage:', error);
    }
  };
  
  const resetDeviceType = () => {
    setForcedDeviceType(null);
    try {
      localStorage.removeItem('device_type_preference');
    } catch (error) {
      console.warn('Failed to remove device preference from localStorage:', error);
    }
  };
  
  const effectiveDeviceType = forcedDeviceType || device.type;
  const isForced = forcedDeviceType !== null;
  
  return (
    <DeviceContext.Provider
      value={{
        device,
        deviceType: effectiveDeviceType,
        forceDeviceType,
        resetDeviceType,
        isForced
      }}
    >
      {children}
    </DeviceContext.Provider>
  );
};

export const useDeviceContext = (): DeviceContextType => {
  const context = useContext(DeviceContext);
  if (context === undefined) {
    throw new Error('useDeviceContext must be used within a DeviceProvider');
  }
  return context;
};

export default DeviceProvider;