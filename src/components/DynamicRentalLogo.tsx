import React, { useState } from 'react';

interface DynamicRentalLogoProps {
  customLogoUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const DynamicRentalLogo: React.FC<DynamicRentalLogoProps> = ({
  customLogoUrl,
  size = 'md',
  className = '',
}) => {
  const [imgError, setImgError] = useState(false);

  // If custom logo image is provided (e.g. uploaded logo or /public/logo.png)
  if (customLogoUrl && !imgError) {
    const heightClass =
      size === 'sm'
        ? 'h-9 sm:h-10'
        : size === 'lg'
        ? 'h-16 sm:h-20'
        : size === 'xl'
        ? 'h-20 sm:h-24'
        : 'h-12 sm:h-14 md:h-16'; // Standard normal prominent navbar logo size

    return (
      <div className={`flex items-center gap-3 ${className}`} id="custom-brand-logo">
        <img
          src={customLogoUrl}
          alt="Dynamic Rental Logo"
          onError={() => setImgError(true)}
          className={`${heightClass} w-auto max-w-[260px] sm:max-w-[340px] object-contain transition-all rounded-md`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Official High-Definition Vector Reproduction of Dynamic Rental Logo
  const iconSizeClass =
    size === 'sm'
      ? 'w-9 h-9'
      : size === 'lg'
      ? 'w-16 h-16 sm:w-20 sm:h-20'
      : size === 'xl'
      ? 'w-20 h-20 sm:w-24 sm:h-24'
      : 'w-12 h-12 sm:w-14 sm:h-14 md:w-15 md:h-15';

  const titleClass =
    size === 'sm'
      ? 'text-sm font-black'
      : size === 'lg'
      ? 'text-xl sm:text-2xl font-black'
      : size === 'xl'
      ? 'text-2xl sm:text-3xl font-black'
      : 'text-base sm:text-lg md:text-xl font-black';

  const subtitleClass =
    size === 'sm'
      ? 'text-[10px] font-extrabold tracking-widest'
      : size === 'lg'
      ? 'text-xs sm:text-sm font-extrabold tracking-widest'
      : size === 'xl'
      ? 'text-sm sm:text-base font-extrabold tracking-widest'
      : 'text-xs sm:text-sm font-extrabold tracking-widest';

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3.5 select-none ${className}`} id="vector-brand-logo">
      {/* DR Emblem Icon */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg
          className={`${iconSizeClass} overflow-visible drop-shadow-md`}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cyan Wave Swooshes (Top dynamic wave lines matching dynamicrental.info) */}
          <path
            d="M36 28 C 48 16, 75 14, 96 20 C 85 24, 70 25, 52 30 C 44 32, 38 30, 36 28 Z"
            fill="#38bdf8"
          />
          <path
            d="M38 34 C 52 24, 76 22, 94 28 C 82 32, 68 33, 50 37 C 42 39, 38 36, 38 34 Z"
            fill="#0284c7"
          />
          <path
            d="M40 40 C 56 31, 78 30, 92 35 C 79 38, 66 40, 52 43 C 44 45, 40 42, 40 40 Z"
            fill="#22d3ee"
          />

          {/* Letter 'D' */}
          <path
            d="M12 24 L28 24 C 36 24, 42 30, 42 40 C 42 50, 36 56, 28 56 L12 56 Z"
            fill="#ffffff"
          />
          <path
            d="M20 31 L27 31 C 32 31, 35 34, 35 40 C 35 46, 32 49, 27 49 L20 49 Z"
            fill="#0a0a0c"
          />

          {/* Letter 'R' */}
          <path
            d="M18 52 L36 52 C 43 52, 48 57, 48 64 C 48 69, 44 73, 39 75 L49 92 L38 92 L30 78 L26 78 L26 92 L18 92 Z"
            fill="#ffffff"
          />
          <path
            d="M26 58 L34 58 C 38 58, 41 60, 41 64 C 41 68, 38 70, 34 70 L26 70 Z"
            fill="#0a0a0c"
          />
        </svg>
      </div>

      {/* Brand Text: DYNAMIC RENTAL */}
      <div className="flex flex-col leading-tight">
        <span className={`text-white uppercase font-sans tracking-wider ${titleClass}`}>
          DYNAMIC
        </span>
        <span className={`text-cyan-400 uppercase font-sans ${subtitleClass} text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-white`}>
          RENTAL
        </span>
      </div>
    </div>
  );
};


