import React from 'react';

interface BawasluLogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const BawasluLogo: React.FC<BawasluLogoProps> = ({
  className = '',
  showText = true,
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'h-8 w-8',
    md: 'h-11 w-11',
    lg: 'h-16 w-16',
    xl: 'h-20 w-20',
  };

  const textSizes = {
    sm: { title: 'text-xs', subtitle: 'text-[8px]', regional: 'text-[9px]' },
    md: { title: 'text-base sm:text-lg', subtitle: 'text-[9px] sm:text-[10px]', regional: 'text-[10px] sm:text-[11px]' },
    lg: { title: 'text-xl sm:text-2xl', subtitle: 'text-[11px] sm:text-xs', regional: 'text-xs sm:text-sm' },
    xl: { title: 'text-2xl sm:text-3xl', subtitle: 'text-xs sm:text-sm', regional: 'text-sm sm:text-base' },
  };

  return (
    <div className={`inline-flex items-center gap-3.5 select-none ${className}`}>
      {/* 3D Isometric Ballot Box Icon */}
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${iconSizes[size]} shrink-0 transition-transform`}
      >
        {/* Drop shadow / base */}
        <ellipse cx="60" cy="112" rx="42" ry="5" fill="#000000" fillOpacity="0.06" />

        {/* Paper Ballot being cast on top */}
        <polygon
          points="46,12 66,12 58,36 38,36"
          fill="#D32F2F"
        />
        <polygon
          points="46,12 50,14 42,38 38,36"
          fill="#B71C1C"
        />

        {/* Left Face of Ballot Box (Gold/Khaki) */}
        <path
          d="M 18,48 
             L 58,70 
             L 58,104 
             A 6 6 0 0 1 54 109 
             L 22,91 
             A 6 6 0 0 1 18,85 
             Z"
          fill="url(#goldGradient)"
        />

        {/* Right Face of Ballot Box (Red) */}
        <path
          d="M 58,70 
             L 98,48 
             A 6 6 0 0 1 102,54 
             L 102,85 
             A 6 6 0 0 1 98,91 
             L 64,109 
             A 6 6 0 0 1 58,104 
             Z"
          fill="url(#redGradient)"
        />

        {/* Top Face Left (Golden Highlight) */}
        <path
          d="M 18,48 
             L 58,26 
             L 58,42 
             L 38,53 
             Z"
          fill="#D4B07B"
        />

        {/* Top Face Right (Red Highlight) */}
        <path
          d="M 58,26 
             L 98,48 
             L 78,59 
             L 58,42 
             Z"
          fill="#EF5350"
        />

        {/* Center Stylized Opening / Figure */}
        <path
          d="M 58,42 
             L 70,49 
             L 58,70 
             L 46,49 
             Z"
          fill="#FFFFFF"
        />
        <path
          d="M 52,60 
             L 64,60 
             L 60,98 
             L 56,98 
             Z"
          fill="#FFFFFF"
        />

        {/* Gradients */}
        <defs>
          <linearGradient id="goldGradient" x1="18" y1="48" x2="58" y2="109" gradientUnits="userSpaceOnUse">
            <stop stopColor="#C9A265" />
            <stop offset="0.6" stopColor="#B38B4D" />
            <stop offset="1" stopColor="#9C7438" />
          </linearGradient>
          <linearGradient id="redGradient" x1="58" y1="70" x2="102" y2="109" gradientUnits="userSpaceOnUse">
            <stop stopColor="#E53935" />
            <stop offset="0.5" stopColor="#D32F2F" />
            <stop offset="1" stopColor="#B71C1C" />
          </linearGradient>
        </defs>
      </svg>

      {/* Typography from Uploaded Identity */}
      {showText && (
        <div className="flex flex-col text-left leading-tight">
          <span
            className={`font-black tracking-wider uppercase text-slate-950 font-sans ${textSizes[size].title}`}
            style={{ letterSpacing: '0.04em' }}
          >
            BAWASLU
          </span>
          <span
            className={`font-medium tracking-normal text-slate-700 uppercase ${textSizes[size].subtitle}`}
          >
            BADAN PENGAWAS PEMILIHAN UMUM
          </span>
          <span
            className={`font-bold tracking-wide uppercase text-slate-900 ${textSizes[size].regional}`}
          >
            KABUPATEN SUBANG
          </span>
        </div>
      )}
    </div>
  );
};
