import { cn } from '../../lib/utils';
import { TASK_STATUS_LABELS, TASK_STATUS_COLORS, WARNING_LEVEL_LABELS, WARNING_LEVEL_COLORS } from '../../constants';
import { TaskStatus, WarningLevel } from '../../types';

interface StatusBadgeProps {
  status: TaskStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const label = TASK_STATUS_LABELS[status] || status;
  const colorClass = TASK_STATUS_COLORS[status] || 'bg-slate-500';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium text-white',
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', colorClass, 'animate-pulse')} />
      {label}
    </span>
  );
}

interface WarningBadgeProps {
  level: WarningLevel;
  className?: string;
}

export function WarningBadge({ level, className }: WarningBadgeProps) {
  const label = WARNING_LEVEL_LABELS[level] || level;
  const colorClass = WARNING_LEVEL_COLORS[level] || '';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border',
        colorClass,
        className
      )}
    >
      {label}
    </span>
  );
}

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'cyan';
  showLabel?: boolean;
  className?: string;
}

export function ProgressBar({ value, max = 100, color = 'cyan', showLabel = false, className }: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
    cyan: 'bg-cyan-500',
  };

  return (
    <div className={cn('relative w-full', className)}>
      <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="absolute right-0 -top-5 text-xs text-slate-400">
          {percentage.toFixed(1)}%
        </span>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: { value: number; isPositive: boolean };
  className?: string;
  onClick?: () => void;
}

export function StatCard({ label, value, icon, trend, className, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-5 bg-slate-800/50 border border-slate-700/50 rounded-xl backdrop-blur-sm hover:border-slate-600/50 transition-all',
        onClick && 'cursor-pointer hover:border-cyan-500/30 hover:bg-slate-800/70',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-slate-400 text-sm">{label}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p
              className={cn(
                'mt-2 text-sm font-medium',
                trend.isPositive ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
              <span className="text-slate-500 ml-1">较昨日</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

interface CardProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
}

export function Card({ title, subtitle, children, className, headerAction }: CardProps) {
  return (
    <div
      className={cn(
        'bg-slate-800/40 border border-slate-700/50 rounded-xl backdrop-blur-sm overflow-hidden',
        className
      )}
    >
      {(title || headerAction) && (
        <div className="px-5 py-4 border-b border-slate-700/50 flex items-center justify-between">
          <div>
            {title && <h3 className="text-white font-semibold">{title}</h3>}
            {subtitle && <p className="text-slate-400 text-sm mt-0.5">{subtitle}</p>}
          </div>
          {headerAction}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  );
}
