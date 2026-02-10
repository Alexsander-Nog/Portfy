interface LogoProps {
  className?: string;
  variant?: 'full' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  inverted?: boolean;
}

export function Logo({ className = '', variant = 'full', size = 'md', inverted = false }: LogoProps) {
  const sizes = {
    sm: { height: 'h-8', text: 'text-xl' },
    md: { height: 'h-10', text: 'text-2xl' },
    lg: { height: 'h-14', text: 'text-4xl' },
  };

  const currentSize = sizes[size];

  if (variant === 'icon') {
    return (
      <div className={`${currentSize.height} aspect-square flex items-center justify-center ${className}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Galaxy background circle */}
          <defs>
            <linearGradient id="galaxyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2d2550" />
              <stop offset="50%" stopColor="#a21d4c" />
              <stop offset="100%" stopColor="#7a1538" />
            </linearGradient>
            <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {/* Background circle */}
          <circle cx="50" cy="50" r="48" fill="url(#galaxyGradient)" />
          
          {/* Stars */}
          <circle cx="25" cy="25" r="2" fill="white" opacity="0.8" />
          <circle cx="75" cy="30" r="1.5" fill="white" opacity="0.6" />
          <circle cx="30" cy="70" r="1" fill="white" opacity="0.7" />
          <circle cx="70" cy="75" r="1.5" fill="white" opacity="0.5" />
          
          {/* Letter P */}
          <path
            d="M35 30 L35 70 M35 30 L50 30 Q58 30 58 40 Q58 50 50 50 L35 50"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Stylized portfolio folder icon overlay */}
          <path
            d="M55 45 L70 45 L70 65 L55 65 Z"
            fill="white"
            opacity="0.9"
          />
          <path
            d="M55 45 L60 40 L65 40 L70 45"
            fill="white"
            opacity="0.7"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className={`${currentSize.height} aspect-square flex items-center justify-center`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="galaxyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#2d2550" />
              <stop offset="50%" stopColor="#a21d4c" />
              <stop offset="100%" stopColor="#7a1538" />
            </linearGradient>
          </defs>
          
          <circle cx="50" cy="50" r="48" fill="url(#galaxyGradient)" />
          
          {/* Stars */}
          <circle cx="25" cy="25" r="2" fill="white" opacity="0.8" />
          <circle cx="75" cy="30" r="1.5" fill="white" opacity="0.6" />
          <circle cx="30" cy="70" r="1" fill="white" opacity="0.7" />
          <circle cx="70" cy="75" r="1.5" fill="white" opacity="0.5" />
          
          {/* Letter P */}
          <path
            d="M35 30 L35 70 M35 30 L50 30 Q58 30 58 40 Q58 50 50 50 L35 50"
            stroke="white"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          
          {/* Portfolio folder */}
          <path
            d="M55 45 L70 45 L70 65 L55 65 Z"
            fill="white"
            opacity="0.9"
          />
          <path
            d="M55 45 L60 40 L65 40 L70 45"
            fill="white"
            opacity="0.7"
          />
        </svg>
      </div>
      <span className={`${currentSize.text} font-bold ${inverted ? 'text-white' : 'bg-gradient-to-r from-[#2d2550] via-[#a21d4c] to-[#7a1538] bg-clip-text text-transparent'}`}>
        Portfy
      </span>
    </div>
  );
}