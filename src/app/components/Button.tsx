import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  onClick,
  type = 'button',
  disabled = false
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 active:scale-95';
  
  const variants = {
    primary: 'bg-gradient-to-r from-[#a21d4c] to-[#c92563] text-white hover:from-[#c92563] hover:to-[#e94d7a] shadow-lg shadow-[#a21d4c]/30',
    secondary: 'bg-gradient-to-r from-[#2d2550] to-[#1a1534] text-white hover:from-[#1a1534] hover:to-[#0f0b1f]',
    outline: 'border-2 border-[#a21d4c] text-[#a21d4c] hover:bg-[#a21d4c] hover:text-white',
    ghost: 'text-[#2d2550] hover:bg-[#f5f3f7]'
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  };

  return (
    <button 
      onClick={onClick}
      type={type}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabled ? 'opacity-60 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
