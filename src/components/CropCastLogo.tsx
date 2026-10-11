import { Sprout } from 'lucide-react';

interface CropCastLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'auto' | 'light' | 'dark';
}

const SIZE_MAP = {
  sm: { icon: 'h-5 w-5', box: 'h-9 w-9', title: 'text-base', badge: 'text-[10px] px-1.5 py-0.5' },
  md: { icon: 'h-6 w-6', box: 'h-11 w-11', title: 'text-lg', badge: 'text-xs px-2 py-0.5' },
  lg: { icon: 'h-8 w-8', box: 'h-14 w-14', title: 'text-2xl', badge: 'text-sm px-2.5 py-1' },
  xl: { icon: 'h-10 w-10', box: 'h-18 w-18', title: 'text-3xl', badge: 'text-sm px-2.5 py-1' },
};

/**
 * CropCast.AI logo — a 3D leaf emblem with gradient, inner glow,
 * and floating animation. Adapts automatically to light/dark theme.
 */
export default function CropCastLogo({
  size = 'md',
  showText = true,
  variant = 'auto',
}: CropCastLogoProps) {
  const s = SIZE_MAP[size];
  const isDarkVariant = variant === 'dark';

  return (
    <div className="flex items-center gap-3">
      {/* 3D Logo emblem */}
      <div className="relative group">
        {/* Glow halo */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 opacity-40 blur-lg group-hover:opacity-60 transition-opacity duration-500" />

        {/* Main 3D box */}
        <div
          className={`relative ${s.box} flex items-center justify-center rounded-2xl bg-gradient-to-br from-green-500 via-emerald-600 to-teal-700 shadow-lg shadow-green-600/30 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Inner highlight (top-left) */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/30 to-transparent" />
          {/* Inner shadow (bottom-right) */}
          <div className="absolute inset-0 rounded-2xl shadow-inner shadow-black/20" />
          {/* Floating leaf icon */}
          <Sprout className={`${s.icon} text-white relative z-10 drop-shadow-sm`} />
          {/* Floating accent dot */}
          <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-lime-300 ring-2 ring-green-700/50 animate-pulse" />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <h1 className={`${s.title} font-extrabold tracking-tight ${isDarkVariant ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
            Crop<span className="text-green-500">Cast</span>
            <span className={`ml-1 inline-block rounded-full bg-green-500 ${s.badge} font-bold text-white align-middle`}>.AI</span>
          </h1>
        </div>
      )}
    </div>
  );
}
