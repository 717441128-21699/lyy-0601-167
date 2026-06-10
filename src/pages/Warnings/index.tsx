import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Check,
  X,
  Clock,
  Filter,
  Search,
  ChevronDown,
  MessageSquare,
  User,
  ArrowRight,
  BarChart3,
  TrendingUp,
  Activity,
} from 'lucide-react';
import { useWarningStore, useTaskStore, useUserStore, useSystemStore } from '../../store';
import { Card, WarningBadge } from '../../components/ui/StatusBadge';
import { WarningLevel, WarningType, SimulationSnapshot } from '../../types';
import { WARNING_TYPE_LABELS, WARNING_LEVEL_LABELS } from '../../constants';
import { motion } from 'framer-motion';

export default function Warnings() {
  const { warnings, fetchWarnings, reviewWarning, markAsRead } = useWarningStore();
  const { tasks, applyWarningStrategy, updateTask } = useTaskStore();
  const { currentUser } = useUserStore();
  const { showNotification } = useSystemStore();
  const [selectedWarning, setSelectedWarning] = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [levelFilter, setLevelFilter] = useState<WarningLevel | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<WarningType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchWarnings();
  }, []);

  const filteredWarnings = warnings.filter((warning) => {
    const matchesLevel = levelFilter === 'all' || warning.level === levelFilter;
    const matchesType = typeFilter === 'all' || warning.type === typeFilter;
    const matchesSearch = warning.message.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesLevel && matchesType && matchesSearch;
  });

  const groupByTask = filteredWarnings.reduce<Record<string, typeof filteredWarnings>>((acc, w) => {
    if (!acc[w.taskId]) acc[w.taskId] = [];
    acc[w.taskId].push(w);
    return acc;
  }, {});
  Object.keys(groupByTask).forEach((taskId) => {
    groupByTask[taskId].sort((a, b) => new Date(a.triggeredAt).getTime() - new Date(b.triggeredAt).getTime());
  });

  const toggleGroup = (taskId: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const getTaskName = (taskId: string) => {
    return tasks.find(t => t.id === taskId)?.name || '未知任务';
  };

  const handleReview = (warningId: string, result: 'approved' | 'rejected') => {
    if (!reviewComment.trim()) {
      showNotification('error', '请填写复核意见');
      return;
    }

    reviewWarning(warningId, result, reviewComment, currentUser?.id || 'user1');

    const warning = warnings.find(w => w.id === warningId);
    if (warning) {
      const task = tasks.find(t => t.id === warning.taskId);
      if (task) {
        const updatedTaskWarnings = task.warnings.map(w =>
          w.id === warningId
            ? {
                ...w,
                reviewed: true,
                reviewedBy: currentUser?.id || 'user1',
                reviewedAt: new Date(),
                reviewResult: result,
                reviewComment: reviewComment,
              }
            : w
        );
        updateTask(task.id, { warnings: updatedTaskWarnings });
      }
    }

    if (result === 'approved') {
      if (warning) {
        const strategy = {
          isolation: { enabled: true, coverage: 0.8, complianceRate: 0.9 },
          vaccination: { enabled: true, dailyCapacity: 100000, efficacy: 0.75, priorityGroups: ['elderly', 'medical'] },
        };
        applyWarningStrategy(warning.taskId, warningId, strategy);
      }
      showNotification('success', '已确认预警，已自动生成隔离与疫苗接种方案并重新模拟');
    } else {
      showNotification('success', '已驳回预警');
    }

    setSelectedWarning(null);
    setReviewComment('');
  };

  const levelOptions = [
    { value: 'all', label: '全部级别' },
    ...Object.entries(WARNING_LEVEL_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const typeOptions = [
    { value: 'all', label: '全部类型' },
    ...Object.entries(WARNING_TYPE_LABELS).map(([value, label]) => ({ value, label })),
  ];

  const selectedWarningData = warnings.find(w => w.id === selectedWarning);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">预警复核中心</h1>
          <p className="text-slate-400 mt-1">
            处理系统触发的预警，进行专业复核与决策
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-sm font-medium">
            待复核: {warnings.filter(w => !w.reviewed).length}
          </span>
        </div>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="搜索预警内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as WarningLevel | 'all')}
              className="h-10 px-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            >
              {levelOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as WarningType | 'all')}
              className="h-10 px-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            >
              {typeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {Object.entries(groupByTask).map(([taskId, taskWarnings]) => (
              <div key={taskId} className="border border-slate-700/50 rounded-xl overflow-hidden">
                <div
                  onClick={() => toggleGroup(taskId)}
                  className="flex items-center justify-between p-3 bg-slate-800/60 cursor-pointer hover:bg-slate-800/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <ChevronDown
                      className={`w-4 h-4 text-slate-400 transition-transform ${collapsedGroups[taskId] ? '-rotate-90' : ''}`}
                    />
                    <span className="text-white font-medium text-sm">{getTaskName(taskId)}</span>
                  </div>
                  <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded text-xs font-medium">
                    {taskWarnings.length} 条预警
                  </span>
                </div>

                {!collapsedGroups[taskId] && (
                  <div className="p-3 space-y-0">
                    {taskWarnings.map((warning, idx) => (
                      <div
                        key={warning.id}
                        onClick={() => setSelectedWarning(warning.id)}
                        className="relative flex gap-3 cursor-pointer group"
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ring-2 ${
                              warning.level === 'critical'
                                ? 'bg-red-400 ring-red-400/30'
                                : warning.level === 'high'
                                ? 'bg-orange-400 ring-orange-400/30'
                                : warning.level === 'medium'
                                ? 'bg-yellow-400 ring-yellow-400/30'
                                : 'bg-blue-400 ring-blue-400/30'
                            }`}
                          />
                          {idx < taskWarnings.length - 1 && (
                            <div className="w-0.5 flex-1 bg-slate-700/50 my-1" />
                          )}
                        </div>

                        <div
                          className={`flex-1 pb-3 pl-1 rounded-lg p-2 transition-all ${
                            selectedWarning === warning.id
                              ? 'bg-cyan-500/10 ring-1 ring-cyan-500/30'
                              : 'group-hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle
                              className={`w-3.5 h-3.5 ${
                                warning.level === 'critical'
                                  ? 'text-red-400'
                                  : warning.level === 'high'
                                  ? 'text-orange-400'
                                  : warning.level === 'medium'
                                  ? 'text-yellow-400'
                                  : 'text-blue-400'
                              }`}
                            />
                            <span className="text-xs font-medium text-slate-300">
                              {warning.type === 'r0_threshold' ? 'R0' : warning.type === 'resource_overflow' ? '资源' : '峰值'}
                            </span>
                            <span className="text-slate-500 text-xs">
                              {new Date(warning.triggeredAt).toLocaleString('zh-CN')}
                            </span>
                          </div>
                          <p className="text-white text-sm line-clamp-2">{warning.message}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {warning.reviewed ? (
                              <span
                                className={`text-xs px-1.5 py-0.5 rounded ${
                                  warning.reviewResult === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : 'bg-red-500/20 text-red-400'
                                }`}
                              >
                                {warning.reviewResult === 'approved' ? '已确认' : '已驳回'}
                              </span>
                            ) : (
                              <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                                待复核
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {filteredWarnings.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>没有找到匹配的预警</p>
              </div>
            )}
          </div>

          <div className="bg-slate-900/30 rounded-xl border border-slate-700/50 p-6">
            {selectedWarningData ? (
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">预警详情</h3>
                    <WarningBadge level={selectedWarningData.level} />
                  </div>
                  <p className="text-white">{selectedWarningData.message}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400 text-sm">当前值</p>
                    <p className="text-xl font-bold text-white mt-1">
                      {selectedWarningData.value.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <p className="text-slate-400 text-sm">阈值</p>
                    <p className="text-xl font-bold text-red-400 mt-1">
                      {selectedWarningData.threshold.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <Clock className="w-4 h-4" />
                    触发时间: {new Date(selectedWarningData.triggeredAt).toLocaleString('zh-CN')}
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    触发迭代: 第 {selectedWarningData.iteration} 天
                  </div>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    <User className="w-4 h-4" />
                    所属任务: {getTaskName(selectedWarningData.taskId)}
                  </div>
                </div>

                {selectedWarningData.reviewed && (
                  <div className="p-4 bg-slate-800/50 rounded-lg">
                    <h4 className="text-white font-medium mb-2">复核记录</h4>
                    <p className="text-slate-400 text-sm">
                      复核人: {selectedWarningData.reviewedBy}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">
                      意见: {selectedWarningData.reviewComment}
                    </p>
                  </div>
                )}

                {selectedWarningData.reviewed && selectedWarningData.reviewResult === 'approved' && (() => {
                  const task = tasks.find(t => t.id === selectedWarningData.taskId);
                  if (!task) return null;

                  if (!task.preAdjustmentSnapshot || !task.results) {
                    return (
                      <div className="p-4 bg-slate-800/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <BarChart3 className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-white font-medium">策略调整前后对比</h4>
                        </div>
                        <p className="text-slate-500 text-sm">调整前数据未记录</p>
                      </div>
                    );
                  }

                  const before = task.preAdjustmentSnapshot;
                  const after = task.results;

                  const pctChange = (b: number, a: number) => {
                    if (b === 0) return 0;
                    return ((a - b) / b) * 100;
                  };

                  const comparisonItems = [
                    { label: '峰值感染人数', before: before.peakInfection, after: after.peakInfection, lower: true },
                    { label: '总感染人数', before: before.totalInfected, after: after.totalInfected, lower: true },
                    { label: '总康复人数', before: before.totalRecovered, after: after.totalRecovered, lower: false },
                    { label: '总死亡人数', before: before.totalDeaths, after: after.totalDeaths, lower: true },
                  ];

                  const interventionKeys = ['isolation', 'vaccination', 'travelRestriction', 'socialDistancing'] as const;
                  const interventionLabels: Record<string, string> = {
                    isolation: '隔离措施',
                    vaccination: '疫苗接种',
                    travelRestriction: '旅行限制',
                    socialDistancing: '社交距离',
                  };
                  const interventionChanges = interventionKeys
                    .filter((key) => before.interventions[key].enabled !== task.interventions[key].enabled)
                    .map((key) => ({
                      key,
                      label: interventionLabels[key],
                      wasEnabled: before.interventions[key].enabled,
                      nowEnabled: task.interventions[key].enabled,
                    }));

                  return (
                    <div className="p-4 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-2 mb-4">
                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                        <h4 className="text-white font-medium">策略调整前后对比</h4>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-slate-400 mb-2 px-1">
                        <span>指标</span>
                        <span className="text-center">调整前</span>
                        <span className="text-center">调整后</span>
                      </div>
                      <div className="space-y-2">
                        {comparisonItems.map((item) => {
                          const change = pctChange(item.before, item.after);
                          const isPositive = item.lower ? change < 0 : change > 0;
                          return (
                            <div key={item.label} className="grid grid-cols-3 gap-2 p-2 bg-slate-900/50 rounded-lg text-sm">
                              <span className="text-slate-300 flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-slate-500" />
                                {item.label}
                              </span>
                              <span className="text-center text-slate-400">
                                {item.before.toLocaleString()}
                              </span>
                              <span className="text-center flex items-center justify-center gap-1">
                                <span className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                                  {item.after.toLocaleString()}
                                </span>
                                {change !== 0 && (
                                  <span className={`text-xs ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                                    ({change > 0 ? '+' : ''}{change.toFixed(1)}%)
                                  </span>
                                )}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {interventionChanges.length > 0 && (
                        <div className="mt-4">
                          <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                            <Activity className="w-3 h-3" />
                            干预措施变更
                          </div>
                          <div className="space-y-1.5">
                            {interventionChanges.map((change) => (
                              <div
                                key={change.key}
                                className="flex items-center justify-between p-2 bg-slate-900/50 rounded-lg text-sm"
                              >
                                <span className="text-slate-300">{change.label}</span>
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-red-400">
                                    {change.wasEnabled ? '启用' : '禁用'}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-slate-500" />
                                  <span className={change.nowEnabled ? 'text-emerald-400' : 'text-red-400'}>
                                    {change.nowEnabled ? '启用' : '禁用'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <Link
                        to={`/tasks/${task.id}`}
                        className="mt-4 flex items-center gap-1 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        查看任务详情
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })()}

                {!selectedWarningData.reviewed && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <MessageSquare className="w-4 h-4 inline mr-2" />
                        复核意见
                      </label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="请输入专业复核意见..."
                        className="w-full h-24 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleReview(selectedWarningData.id, 'approved')}
                        className="flex-1 flex items-center justify-center gap-2 h-10 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors font-medium"
                      >
                        <Check className="w-4 h-4" />
                        确认预警
                      </button>
                      <button
                        onClick={() => handleReview(selectedWarningData.id, 'rejected')}
                        className="flex-1 flex items-center justify-center gap-2 h-10 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                      >
                        <X className="w-4 h-4" />
                        驳回预警
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-20">
                <ChevronDown className="w-12 h-12 mb-3 opacity-50" />
                <p>请选择左侧预警查看详情</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
