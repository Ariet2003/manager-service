import { ButtonHTMLAttributes } from 'react';
import Link from 'next/link';

interface NavButtonProps extends ButtonHTMLAttributes<HTMLAnchorElement> {
  href: string;
  icon: React.ReactNode;
  label: string;
}

export function NavButton({ href, icon, label, className = '', ...props }: NavButtonProps) {
  return (
    <Link
      href={href}
      className={`
        flex flex-col items-center justify-center p-6
        bg-white/80 backdrop-blur-sm
        rounded-[20px]
        shadow-[0_2px_12px_rgba(0,0,0,0.08)]
        hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]
        transition-all duration-300 ease-out
        border border-gray-100
        hover:border-violet-100
        hover:bg-white
        group
        ${className}
      `}
      {...props}
    >
      <div className="w-14 h-14 flex items-center justify-center mb-3 text-violet-600 group-hover:text-violet-700 transition-colors">
        {icon}
      </div>
      <span className="text-gray-800 group-hover:text-violet-700 font-medium text-sm transition-colors">
        {label}
      </span>
    </Link>
  );
} 