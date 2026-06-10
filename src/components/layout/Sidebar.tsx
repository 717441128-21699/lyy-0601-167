import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  Activity,
  AlertTriangle,
  Sparkles,
  FileBarChart,
  CheckSquare,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Biohazard,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useUserStore } from '../../store';
import { USER_ROLE_LABELS } from '../../constants';

const menuItems = [
  { path: '/dashboard', label: '工作台', icon: LayoutDashboard },
  { path: '/tasks', label: '任务管理', icon: ListTodo },
  { path: '/monitor', label: '实时监控', icon: Activity },
  { path: '/warnings', label: '预警复核', icon: AlertTriangle },
  { path: '/strategy', label: '策略优化', icon: Sparkles },
  { path: '/reports', label: '报告中心', icon: FileBarChart },
  { path: '/approvals', label: '审批中心', icon: CheckSquare },
  { path: '/performance', label: '性能看板', icon: BarChart3 },
  { path: '/settings', label: '系统设置', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser, logout } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen bg-slate-900/95 border-r border-slate-700/50 backdrop-blur-xl z-40 transition-all duration-300 flex flex-col',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
            <Biohazard className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <h1 className="text-white font-bold text-lg leading-tight">EpiSim</h1>
              <p className="text-slate-400 text-xs">传播动力学平台</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                      isActive
                        ? 'bg-cyan-500/20 text-cyan-400 shadow-lg shadow-cyan-500/10'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    )
                  }
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-110')} />
                  {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
          {!collapsed ? (
            <>
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-medium">
                  {currentUser?.name.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">
                  {currentUser?.name || '用户'}
                </p>
                <p className="text-slate-400 text-xs truncate">
                  {currentUser?.role ? USER_ROLE_LABELS[currentUser.role] : ''}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="text-slate-400 hover:text-white transition-colors"
                title="退出登录"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <span className="text-white text-sm font-medium">
                {currentUser?.name.charAt(0) || 'U'}
              </span>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
