import { motion } from 'framer-motion';
import { type ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className = '', glow = false }: CardProps) {
  return (
    <div className={`bg-white/[0.025] border border-white/[0.07] rounded-2xl ${glow ? 'shadow-[0_0_30px_rgba(99,102,241,0.08)]' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function AnimatedCard({ children, className = '', ...props }: CardProps & { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (props as any).delay || 0 }}
      className={`bg-white/[0.025] border border-white/[0.07] rounded-2xl ${className}`}
    >
      {children}
    </motion.div>
  );
}
