import React, { useState } from 'react';

interface DynamicRentalLogoProps {
  customLogoUrl?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const DynamicRentalLogo: React.FC<DynamicRentalLogoProps> = ({
  customLogoUrl,
  size = 'md',
}) => {
  const [imgError, setImgError] = useState(false);

  if (customLogoUrl && !imgError) {
    return (
      <div className="flex items-center gap-3" id="custom-brand-logo">
        <img
          src={customLogoUrl}
          alt="Dynamic Rental Logo"
          onError={() => setImgError(true)}
          className={`${
            size === 'sm' ? 'h-8' : size === 'lg' ? 'h-14' : 'h-10 sm:h-11'
          } w-auto object-contain`}
          referrerPolicy="no-referrer"
        />
      </div>
    );
  }

  // Official Vector Reproduction of dynamicrental.info Logo
  return (
    <div className="flex items-center gap-2.5 sm:gap-3 select-none" id="vector-brand-logo">
      {/* DR Emblem Icon */}
      <div className="relative flex items-center justify-center">
        <svg
          className={`${
            size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-14 h-14' : 'w-11 h-11'
          } overflow-visible`}
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
      <div className="flex flex-col leading-none">
        <span className="text-white font-black tracking-wider text-sm sm:text-base uppercase font-sans">
          DYNAMIC
        </span>
        <span className="text-slate-200 font-extrabold tracking-widest text-xs sm:text-sm uppercase font-sans text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-white to-cyan-300">
          RENTAL
        </span>
      </div>
    </div>
  );
};

