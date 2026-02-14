import React, { forwardRef } from 'react';

// Define the props interface
interface IconProps {
  name: string;
  size?: number;
  filled?: boolean;
  color?: string;
  strokeWidth?: number;
  disabled?: boolean;
  onClick?: () => void;
  ariaLabel?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

// Main Icon component
const Icon = forwardRef<SVGSVGElement, IconProps>(({
  name,
  size = 24,
  filled = false,
  color = 'currentColor',
  strokeWidth = 1.5,
  disabled = false,
  onClick,
  ariaLabel,
  className,
  style,
  children,
  ...props
}, ref) => {
  // In a real implementation, this would dynamically render the appropriate icon
  // based on the name prop. For now, we'll return a generic SVG wrapper.
  
  const handleClick = () => {
    if (onClick && !disabled) {
      onClick();
    }
  };

  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{
        cursor: onClick && !disabled ? 'pointer' : 'default',
        opacity: disabled ? 0.5 : 1,
        ...style
      }}
      onClick={handleClick}
      aria-label={ariaLabel || name}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick && !disabled ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && !disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      {...props}
    >
      {children}
      {/* Placeholder - in a real implementation, we would render the specific icon */}
      <title>{ariaLabel || name}</title>
    </svg>
  );
});

export default Icon;