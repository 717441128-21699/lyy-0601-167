import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useSystemStore } from '../../store';
import { cn } from '../../lib/utils';

export function Notification() {
  const { notification, hideNotification } = useSystemStore();

  if (!notification) return null;

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400',
    error: 'bg-red-500/20 border-red-500/30 text-red-400',
    warning: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
    info: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400',
  };

  const Icon = icons[notification.type];

  return (
    <div className="fixed top-20 right-6 z-50 animate-slide-in">
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-xl shadow-xl',
          colors[notification.type]
        )}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        <span className="text-sm font-medium">{notification.message}</span>
        <button
          onClick={hideNotification}
          className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
