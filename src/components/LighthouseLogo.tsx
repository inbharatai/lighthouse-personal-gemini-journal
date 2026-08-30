import React from 'react';

interface LighthouseLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animateBeam?: boolean;
}

export const LighthouseLogo: React.FC<LighthouseLogoProps> = ({
  size = 'sm',
  className = '',
  animateBeam = true,
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const dim = sizeMap[size] || sizeMap.sm;

  return (
    <div
      id="lighthouse-logo-container"
      className={`relative inline-flex items-center justify-center shrink-0 ${dim} ${className}`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_0_12px_rgba(245,158,11,0.45)] overflow-visible"
        aria-label="Lighthouse Vault Logo"
      >
        <defs>
          {/* Radial Beacon Glow */}
          <radialGradient id="beaconGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFBEB" stopOpacity="1" />
            <stop offset="25%" stopColor="#FBBF24" stopOpacity="0.85" />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#D97706" stopOpacity="0" />
          </radialGradient>

          {/* Primary Sweeping Light Beam (Right) */}
          <linearGradient id="beamGradRight" x1="0%" y1="50%" x2="100%" y2="50%">
            <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.95" />
            <stop offset="20%" stopColor="#FBBF24" stopOpacity="0.65" />
            <stop offset="60%" stopColor="#F59E0B" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>

          {/* Secondary Counter Light Beam (Left ambient) */}
          <linearGradient id="beamGradLeft" x1="100%" y1="50%" x2="0%" y2="50%">
            <stop offset="0%" stopColor="#FFFBEB" stopOpacity="0.8" />
            <stop offset="30%" stopColor="#FBBF24" stopOpacity="0.35" />
            <stop offset="80%" stopColor="#F59E0B" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </linearGradient>

          {/* Tower Shading Gradients */}
          <linearGradient id="towerBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="35%" stopColor="#F3F4F6" />
            <stop offset="70%" stopColor="#D1D5DB" />
            <stop offset="100%" stopColor="#9CA3AF" />
          </linearGradient>

          <linearGradient id="towerStripe" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#DC2626" />
            <stop offset="40%" stopColor="#EF4444" />
            <stop offset="80%" stopColor="#B91C1C" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>

          <linearGradient id="metalTrim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#374151" />
            <stop offset="50%" stopColor="#1F2937" />
            <stop offset="100%" stopColor="#111827" />
          </linearGradient>

          <linearGradient id="rockBase" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4B5563" />
            <stop offset="100%" stopColor="#1F2937" />
          </linearGradient>

          <filter id="beamBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>

        {/* ================= LIGHT BEAMS EMITTING OUTWARD ================= */}
        {/* Main Sweeping Right Beam */}
        <g className={animateBeam ? 'animate-pulse' : ''} style={{ transformOrigin: '50px 30px' }}>
          {/* Broad Diffused Beam */}
          <polygon
            points="50,30 115,10 120,52"
            fill="url(#beamGradRight)"
            opacity="0.65"
            filter="url(#beamBlur)"
          />
          {/* Core High-Intensity Beam */}
          <polygon
            points="50,30 115,18 118,44"
            fill="url(#beamGradRight)"
            opacity="0.9"
          />
          {/* Ultra-bright centerline ray */}
          <line
            x1="50"
            y1="30"
            x2="116"
            y2="30"
            stroke="#FFFBEB"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity="0.85"
            filter="url(#beamBlur)"
          />

          {/* Left subtle secondary back-beam */}
          <polygon
            points="50,30 -15,15 -18,46"
            fill="url(#beamGradLeft)"
            opacity="0.35"
            filter="url(#beamBlur)"
          />
        </g>

        {/* Ambient Halo behind lantern */}
        <circle
          cx="50"
          cy="30"
          r="16"
          fill="url(#beaconGlow)"
          opacity="0.85"
          className={animateBeam ? 'animate-pulse' : ''}
        />

        {/* ================= LIGHTHOUSE ARCHITECTURAL STRUCTURE ================= */}
        {/* Rocky Coastal Foundation */}
        <path
          d="M26 88 C32 84, 40 85, 50 84 C60 85, 68 84, 74 88 L78 95 C65 97, 35 97, 22 95 Z"
          fill="url(#rockBase)"
        />

        {/* Tower Base Plinth */}
        <path
          d="M33 82 L67 82 L69 88 L31 88 Z"
          fill="url(#metalTrim)"
        />

        {/* Main Conical Tower Body (Tapered) */}
        {/* White Base Layer */}
        <polygon
          points="35,82 65,82 60,44 40,44"
          fill="url(#towerBody)"
        />

        {/* Red Maritime Mid-Band Stripe 1 */}
        <polygon
          points="36.2,74 63.8,74 62.4,63 37.6,63"
          fill="url(#towerStripe)"
        />

        {/* Red Maritime Top-Band Stripe 2 */}
        <polygon
          points="38.7,54 61.3,54 60.3,47 39.7,47"
          fill="url(#towerStripe)"
        />

        {/* Tower Windows */}
        <rect x="48.5" y="66" width="3" height="5" rx="1.5" fill="#1E293B" />
        <rect x="48.5" y="50" width="3" height="4.5" rx="1.5" fill="#FEF08A" opacity="0.9" />

        {/* Gallery / Watch Room Platform (Corbeling) */}
        <path
          d="M37 44 L63 44 L64 41 L36 41 Z"
          fill="url(#metalTrim)"
        />

        {/* Gallery Walkway Safety Railing */}
        <line x1="35" y1="38.5" x2="65" y2="38.5" stroke="#475569" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="37" y1="41" x2="37" y2="38.5" stroke="#475569" strokeWidth="1" />
        <line x1="43" y1="41" x2="43" y2="38.5" stroke="#475569" strokeWidth="1" />
        <line x1="50" y1="41" x2="50" y2="38.5" stroke="#475569" strokeWidth="1" />
        <line x1="57" y1="41" x2="57" y2="38.5" stroke="#475569" strokeWidth="1" />
        <line x1="63" y1="41" x2="63" y2="38.5" stroke="#475569" strokeWidth="1" />

        {/* Lantern Room (Glass Glazing & Glowing Core) */}
        <rect x="41.5" y="24" width="17" height="17" rx="1" fill="#FEF3C7" opacity="0.95" />

        {/* Golden Fresnel Lens Core Bulb */}
        <circle cx="50" cy="31" r="5" fill="#FFFBEB" />
        <circle cx="50" cy="31" r="3" fill="#F59E0B" opacity="0.9" />

        {/* Lantern Room Vertical Astragals (Metal window mullions) */}
        <line x1="45" y1="24" x2="45" y2="41" stroke="#1F2937" strokeWidth="1.2" />
        <line x1="50" y1="24" x2="50" y2="41" stroke="#1F2937" strokeWidth="1.2" />
        <line x1="55" y1="24" x2="55" y2="41" stroke="#1F2937" strokeWidth="1.2" />
        <line x1="41.5" y1="32.5" x2="58.5" y2="32.5" stroke="#1F2937" strokeWidth="1" />

        {/* Roof Cornice */}
        <rect x="40" y="22.5" width="20" height="2" rx="0.5" fill="url(#metalTrim)" />

        {/* Dome Cupola Roof */}
        <path
          d="M41 22.5 C41 15, 59 15, 59 22.5 Z"
          fill="url(#metalTrim)"
        />

        {/* Roof Spire / Ventilator Ball / Lightning Rod */}
        <circle cx="50" cy="13.5" r="1.5" fill="#F59E0B" />
        <line x1="50" y1="13.5" x2="50" y2="8" stroke="#FBBF24" strokeWidth="1" strokeLinecap="round" />

        {/* Concentrated Focal Glow Sparkle */}
        <circle cx="50" cy="30" r="1.8" fill="#FFFFFF" className={animateBeam ? 'animate-ping' : ''} style={{ animationDuration: '2.5s' }} />
      </svg>
    </div>
  );
};
