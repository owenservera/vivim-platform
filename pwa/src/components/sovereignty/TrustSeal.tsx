import React from 'react';
import { Shield, ShieldCheck, ShieldAlert, Fingerprint } from 'lucide-react';

interface TrustSealProps {
  status: 'verified' | 'unverified' | 'tampered';
  size?: number;
  className?: string;
}

/**
 * TrustSeal: Visual feedback for the "Witness Audit" moment.
 * Provides a "Seal of Authenticity" for verified content or a "Glitch" for tampered data.
 */
export const TrustSeal: React.FC<TrustSealProps> = ({ status, size = 16, className = "" }) => {
  if (status === 'tampered') {
    return (
      <div className={`flex items-center gap-1 text-rose-500 animate-pulse ${className}`} title="CRITICAL: Integrity Check Failed">
        <ShieldAlert size={size} />
        <span className="text-[10px] font-black uppercase tracking-tighter">Tampered</span>
      </div>
    );
  }

  if (status === 'verified') {
    return (
      <div className={`flex items-center gap-1 text-teal-500 ${className}`} title="Witness Verified: Cryptographically Signed">
        <div className="relative">
          <ShieldCheck size={size} />
          <div className="absolute inset-0 bg-teal-400/20 blur-md rounded-full animate-pulse" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-tighter">Verified</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 text-gray-400 ${className}`} title="Awaiting Verification">
      <Fingerprint size={size} className="opacity-50" />
      <span className="text-[10px] font-bold uppercase tracking-tighter">Pending</span>
    </div>
  );
};
