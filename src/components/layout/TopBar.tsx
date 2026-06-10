import { Bell, Search, Menu, Zap, AlertOctagon } from 'lucide-react';
import { useState } from 'react';
import { useWarningStore, useSystemStore } from '../../store';
import { useEffect } from 'react';

export function TopBar() {
  const { unreadCount, markAllAsRead } = useWarningStore();
  const { systemStatus } = useSystemStore();
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    useWarningStore.getState().fetchWarnings();
  }, []);

  return (
    <header className="h-16 bg-slate-900/80 border-b border-slate-700/50 backdrop-blur-xl sticky top-0 z-30">
      <div className="h-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button className="lg:hidden text-slate-400 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="搜索任务、报告..."
              className="w-80 h-9 pl-10 pr-4 bg-slate-800/50 border border-slate-700/50 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          {systemStatus.isPaused && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/30 rounded-lg">
              <AlertOctagon className="w-4 h-4 text-red-400 animate-pulse" />
              <span className="text-red-400 text-sm font-medium">系统已暂停</span>
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-9 h-9 rounded-lg bg-slate-800/50 border border-slate-700/50 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full text-white text-xs font-medium flex items-center justify-center">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                <div className="p-4 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">通知中心</h3>
                    <button
                      onClick={markAllAsRead}
                      className="text-cyan-400 text-sm hover:text-cyan-300"
                    >
                      全部已读
                    </button>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <div className="p-4 text-center text-slate-400 text-sm">
                    <Zap className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                    暂无新通知
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-6 bg-slate-700" />

          <div className="text-right">
            {systemStatus.isPaused ? (
              <>
                <p className="text-red-400 text-sm font-medium">系统已暂停</p>
                <p className="text-red-400/70 text-xs">{systemStatus.pauseReason}</p>
              </>
            ) : (
              <>
                <p className="text-emerald-400 text-sm font-medium">系统运行中</p>
                <p className="text-slate-400 text-xs">实时数据同步</p>
              </>
            )}
          </div>

          {systemStatus.consecutivePeakDeviations > 0 && !systemStatus.isPaused && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
              <AlertOctagon className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm font-medium">偏差 {systemStatus.consecutivePeakDeviations}/3</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
