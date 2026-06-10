import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  Play,
  Eye,
  Trash2,
  MoreVertical,
  Download,
} from 'lucide-react';
import { useTaskStore, useSystemStore } from '../../store';
import { StatusBadge, Card } from '../../components/ui/StatusBadge';
import { TaskStatus } from '../../types';
import { TASK_STATUS_LABELS } from '../../constants';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function Tasks() {
  const { tasks, fetchTasks, deleteTask, startSimulation, setCurrentTask } = useTaskStore();
  const { showNotification, systemStatus } = useSystemStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStartSimulation = (taskId: string) => {
    if (systemStatus.isPaused) {
      showNotification('error', '系统已暂停，无法启动新任务');
      return;
    }
    startSimulation(taskId);
    showNotification('success', '模拟任务已启动');
  };

  const handleViewTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setCurrentTask(task);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      deleteTask(taskId);
      showNotification('success', '任务已删除');
    }
  };

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    ...Object.entries(TASK_STATUS_LABELS).map(([value, label]) => ({ value, label })),
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">任务管理</h1>
          <p className="text-slate-400 mt-1">管理所有模拟任务，查看状态和结果</p>
        </div>
        <Link
          to="/tasks/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
        >
          <Plus className="w-5 h-5" />
          新建任务
        </Link>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="搜索任务名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'all')}
              className="h-10 px-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left py-3 px-4 text-slate-400 text-sm font-medium">任务名称</th>
                <th className="text-left py-3 px-4 text-slate-400 text-sm font-medium">状态</th>
                <th className="text-left py-3 px-4 text-slate-400 text-sm font-medium">进度</th>
                <th className="text-left py-3 px-4 text-slate-400 text-sm font-medium">创建时间</th>
                <th className="text-left py-3 px-4 text-slate-400 text-sm font-medium">预警数</th>
                <th className="text-right py-3 px-4 text-slate-400 text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {filteredTasks.map((task) => (
                <tr key={task.id} className="hover:bg-slate-700/20 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                        <Play className="w-5 h-5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{task.name}</p>
                        <p className="text-slate-500 text-sm truncate max-w-xs">
                          {task.description}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={task.status} />
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                          style={{ width: `${(task.currentIteration / task.totalDays) * 100}%` }}
                        />
                      </div>
                      <span className="text-slate-400 text-sm">
                        {Math.round((task.currentIteration / task.totalDays) * 100)}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-400 text-sm">
                    {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true, locale: zhCN })}
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium ${
                        task.warnings.length > 0
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-emerald-500/20 text-emerald-400'
                      }`}
                    >
                      {task.warnings.length} 条
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {task.status === 'pending_validation' && (
                        <button
                          onClick={() => handleStartSimulation(task.id)}
                          className="p-2 text-emerald-400 hover:bg-emerald-500/20 rounded-lg transition-colors"
                          title="开始模拟"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <Link
                        to={`/tasks/${task.id}`}
                        onClick={() => handleViewTask(task.id)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors"
                        title="更多操作"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredTasks.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <Search className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>没有找到匹配的任务</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
