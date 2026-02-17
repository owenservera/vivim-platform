/**
 * Responsive Layout Component
 * 
 * Provides device-specific layout adaptations for mobile and desktop views.
 */

import React from 'react';
import { useDeviceContext } from '../../lib/device-context';
import { cn } from '../../lib/utils';

interface ResponsiveLayoutProps {
  children: React.ReactNode;
  className?: string;
  mobileClassName?: string;
  desktopClassName?: string;
  tabletClassName?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  children,
  className,
  mobileClassName,
  desktopClassName,
  tabletClassName,
  padding = 'md',
  maxWidth = 'lg'
}) => {
  const { deviceType } = useDeviceContext();

  // Base padding classes
  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  // Max width classes
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full'
  };

  // Device-specific classes
  const deviceClasses = {
    mobile: mobileClassName || '',
    desktop: desktopClassName || '',
    tablet: tabletClassName || ''
  };

  const combinedClasses = cn(
    'w-full mx-auto',
    paddingClasses[padding],
    maxWidthClasses[maxWidth],
    deviceClasses[deviceType],
    className
  );

  return (
    <div className={combinedClasses}>
      {children}
    </div>
  );
};

export default ResponsiveLayout;