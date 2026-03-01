import React, { useMemo } from 'react';

interface TotemProps {
  did: string;
  size?: number;
  className?: string;
}

/**
 * Totem: A procedurally generated visual identity derived from a DID.
 * Grounded in the "Identity Genesis" moment.
 */
export const Totem: React.FC<TotemProps> = ({ did, size = 64, className = "" }) => {
  const hash = useMemo(() => {
    // Simple hash function for the DID string
    let h = 0;
    for (let i = 0; i < did.length; i++) {
      h = ((h << 5) - h) + did.charCodeAt(i);
      h |= 0;
    }
    return Math.abs(h);
  }, [did]);

  const generateStyles = useMemo(() => {
    const hue = hash % 360;
    const saturation = 60 + (hash % 30);
    const lightness = 40 + (hash % 20);
    
    // Derived colors
    const primary = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    const secondary = `hsl(${(hue + 40) % 360}, ${saturation}%, ${lightness + 10}%)`;
    const accent = `hsl(${(hue - 40) % 360}, ${saturation + 10}%, ${lightness - 10}%)`;
    
    // Geometric variations
    const rotation = hash % 360;
    const borderRadius = (hash % 50) + '%';
    const scale = 0.8 + (hash % 40) / 100;

    return { primary, secondary, accent, rotation, borderRadius, scale };
  }, [hash]);

  return (
    <div 
      className={`relative flex items-center justify-center overflow-hidden bg-gray-900 shadow-inner ${className}`}
      style={{ 
        width: size, 
        height: size, 
        borderRadius: '24%',
        border: `2px solid ${generateStyles.primary}44`
      }}
    >
      {/* Background Pulse */}
      <div 
        className="absolute inset-0 opacity-20 animate-pulse"
        style={{ background: `radial-gradient(circle at center, ${generateStyles.accent}, transparent)` }}
      />
      
      {/* The Core Totem */}
      <div 
        className="relative transition-transform duration-1000 ease-in-out"
        style={{ 
          width: '70%', 
          height: '70%', 
          backgroundColor: generateStyles.primary,
          borderRadius: generateStyles.borderRadius,
          transform: `rotate(${generateStyles.rotation}deg) scale(${generateStyles.scale})`,
          boxShadow: `0 0 20px ${generateStyles.primary}66`
        }}
      >
        {/* Inner Geometric Detail */}
        <div 
          className="absolute inset-2 border-2 border-white/30"
          style={{ 
            borderRadius: (hash % 2 === 0) ? '50%' : '10%',
            transform: `rotate(${-generateStyles.rotation * 2}deg)`
          }}
        />
        
        {/* Accent "Eye" */}
        <div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg"
          style={{ backgroundColor: generateStyles.accent }}
        />
      </div>

      {/* Decorative Orbits */}
      <div 
        className="absolute inset-0 border border-dashed border-white/10 rounded-full animate-[spin_10s_linear_infinite]"
      />
    </div>
  );
};
