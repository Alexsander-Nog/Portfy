import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
}

export function Card({ children, className = '', hover = false, gradient = false }: CardProps) {
  const baseStyles = 'rounded-xl p-6 transition-all duration-300';
  const hoverStyles = hover ? 'hover:shadow-2xl hover:shadow-[#a21d4c]/10 hover:-translate-y-1 cursor-pointer' : '';
  const gradientStyles = gradient 
    ? 'bg-gradient-to-br from-white to-[#f5f3f7] border border-[#e8e3f0]' 
    : 'bg-white border border-[#e8e3f0]';
  const shadowStyles = 'shadow-lg';

  return (
    <div className={`${baseStyles} ${gradientStyles} ${shadowStyles} ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
}
