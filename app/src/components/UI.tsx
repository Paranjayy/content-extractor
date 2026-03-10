import { motion, AnimatePresence } from 'framer-motion';
import { type ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'indigo' | 'green' | 'red' | 'yellow' | 'blue' | 'purple';
  size?: 'sm' | 'md';
}

const colors = {
  indigo: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/20',
  green: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20',
  red: 'bg-red-500/15 text-red-300 border-red-500/20',
  yellow: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/20',
  blue: 'bg-blue-500/15 text-blue-300 border-blue-500/20',
  purple: 'bg-purple-500/15 text-purple-300 border-purple-500/20',
};

const sizes = { sm: 'text-[10px] px-2 py-0.5', md: 'text-xs px-2.5 py-1' };

export function Badge({ children, variant = 'indigo', size = 'sm' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${colors[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  color?: string;
}

export function ProgressBar({ value, label, color = 'bg-indigo-500' }: ProgressBarProps) {
  return (
    <div className="w-full">
      {label && <div className="flex justify-between text-xs text-slate-400 mb-1.5">
        <span>{label}</span>
        <span>{Math.round(value)}%</span>
      </div>}
      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className={`h-full rounded-full ${color} bg-gradient-to-r from-indigo-500 to-purple-500`}
        />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
}

export function StatCard({ label, value, icon, color = 'text-indigo-400' }: StatCardProps) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-slate-500 text-xs">
        {icon}
        <span>{label}</span>
      </div>
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}

export function SectionHeader({ title, subtitle, icon, actions }: SectionHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div className="flex items-center gap-3">
        {icon && <div className="w-9 h-9 rounded-xl bg-indigo-500/15 flex items-center justify-center text-indigo-400">{icon}</div>}
        <div>
          <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

export function EmptyState({ icon, title, description }: { icon: ReactNode; title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-slate-500 mb-4">
        {icon}
      </div>
      <p className="text-slate-400 font-medium">{title}</p>
      {description && <p className="text-slate-600 text-sm mt-1">{description}</p>}
    </div>
  );
}

export function LoadingSpinner({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-white/[0.06]" />
        <div className="w-10 h-10 rounded-full border-2 border-t-indigo-500 absolute inset-0 animate-spin" />
      </div>
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer group">
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 focus:outline-none ${checked ? 'bg-indigo-600' : 'bg-white/[0.1]'}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${checked ? 'translate-x-[18px]' : 'translate-x-0'}`} />
      </button>
      {label && <span className="text-sm text-slate-300 group-hover:text-slate-200 transition-colors">{label}</span>}
    </label>
  );
}

export function Divider({ className = '' }: { className?: string }) {
  return <div className={`h-px bg-white/[0.06] ${className}`} />;
}

export function CodeBlock({ children, className = '' }: { children: string; className?: string }) {
  return (
    <pre className={`bg-black/30 border border-white/[0.06] rounded-xl p-4 font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap break-all ${className}`}>
      {children}
    </pre>
  );
}

export function StatusDot({ online }: { online: boolean }) {
  return (
    <span className="relative flex h-2.5 w-2.5">
      {online && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${online ? 'bg-emerald-500' : 'bg-red-500'}`} />
    </span>
  );
}

export function FadeIn({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, delay }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export function Select({ value, onChange, options, label, className = '' }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-slate-400 mb-1.5">{label}</label>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
      >
        {options.map(o => <option key={o.value} value={o.value} className="bg-[#1a1a2e]">{o.label}</option>)}
      </select>
    </div>
  );
}
