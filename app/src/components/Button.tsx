import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

const variants = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20',
  secondary: 'bg-white/[0.06] hover:bg-white/[0.10] text-slate-200 border border-white/[0.08]',
  ghost: 'hover:bg-white/[0.06] text-slate-300',
  danger: 'bg-red-600/80 hover:bg-red-500 text-white shadow-lg shadow-red-500/20',
  success: 'bg-emerald-600/80 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-sm rounded-xl gap-2',
};

export function Button({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }: ButtonProps) {
  return (
    <motion.button
      whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
      whileTap={!disabled && !loading ? { scale: 0.97 } : {}}
      className={`inline-flex items-center justify-center font-medium transition-all duration-150 cursor-pointer select-none disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...(props as any)}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : icon}
      {children}
    </motion.button>
  );
}
