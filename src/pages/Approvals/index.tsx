import { useEffect, useState } from 'react';
import {
  CheckSquare,
  Check,
  X,
  Clock,
  User,
  MessageSquare,
  FileBarChart,
  ChevronDown,
  Filter,
  Radio,
} from 'lucide-react';
import { useTaskStore, useUserStore, useSystemStore } from '../../store';
import { Card } from '../../components/ui/StatusBadge';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { APPROVAL_STATUS_LABELS } from '../../constants';

export default function Approvals() {
  const { tasks, fetchTasks, approveTask, rejectTask } = useTaskStore();
  const { currentUser } = useUserStore();
  const { showNotification } = useSystemStore();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [filter, setFilter] = useState<'pending' | 'level1_approved' | 'approved' | 'rejected' | 'all'>('pending');

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'all') return task.approvalStatus !== 'not_submitted';
    if (filter === 'pending') return task.approvalStatus === 'pending';
    if (filter === 'level1_approved') return task.approvalStatus === 'level1_approved';
    if (filter === 'approved') return task.approvalStatus === 'level2_approved';
    if (filter === 'rejected') return task.approvalStatus === 'rejected';
    return true;
  });

  const selectedTask = tasks.find(t => t.id === selectedTaskId);

  const handleApprove = (level: 1 | 2) => {
    if (!selectedTaskId || !approvalComment.trim()) {
      showNotification('error', '请填写审批意见');
      return;
    }

    approveTask(selectedTaskId, level, currentUser?.name || '审批人', approvalComment);
    showNotification('success', `第${level}级审批通过`);
    setApprovalComment('');
  };

  const handleReject = (level: 1 | 2) => {
    if (!selectedTaskId || !approvalComment.trim()) {
      showNotification('error', '请填写驳回理由');
      return;
    }

    rejectTask(selectedTaskId, level, currentUser?.name || '审批人', approvalComment);
    showNotification('warning', `已驳回，任务退回修改`);
    setApprovalComment('');
  };

  const nextApprovalLevel = () => {
    if (!selectedTask) return 1;
    if (selectedTask.approvalStatus === 'pending') return 1;
    if (selectedTask.approvalStatus === 'level1_approved') return 2;
    return 1;
  };

  const isPushedToCommandCenter = selectedTask?.approvalHistory.some(
    (r) => r.pushedToCommandCenter
  ) || false;

  const pushedRecord = selectedTask?.approvalHistory.find(
    (r) => r.pushedToCommandCenter
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">审批中心</h1>
          <p className="text-slate-400 mt-1">
            两级审批流程，确保模拟结果的专业性和准确性
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg text-sm font-medium">
            待审批: {tasks.filter(t => t.approvalStatus === 'pending').length}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Filter className="w-5 h-5 text-slate-400" />
        <div className="flex rounded-lg overflow-hidden border border-slate-700">
          {[
            { value: 'pending', label: '待审批' },
            { value: 'level1_approved', label: '一级已通过' },
            { value: 'approved', label: '已通过' },
            { value: 'rejected', label: '已驳回' },
            { value: 'all', label: '全部' },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setFilter(item.value as typeof filter)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                filter === item.value
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="待审批任务" subtitle="点击查看详情">
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  selectedTaskId === task.id
                    ? 'bg-cyan-500/10 border-cyan-500/30'
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <FileBarChart className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-white font-medium truncate">{task.name}</h4>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          task.approvalStatus === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : task.approvalStatus === 'rejected'
                            ? 'bg-red-500/20 text-red-400'
                            : task.approvalStatus === 'level1_approved'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-emerald-500/20 text-emerald-400'
                        }`}
                      >
                        {APPROVAL_STATUS_LABELS[task.approvalStatus]}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1 line-clamp-1">
                      {task.description}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-slate-500 text-xs">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(task.updatedAt), { addSuffix: true, locale: zhCN })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {task.createdBy}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {filteredTasks.length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>没有相关审批任务</p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          {selectedTask ? (
            <Card title="审批详情">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    {selectedTask.name}
                  </h4>
                  <p className="text-slate-400">{selectedTask.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-slate-900/50 rounded-lg">
                    <p className="text-slate-400 text-sm">初始R0</p>
                    <p className="text-xl font-bold text-cyan-400 mt-1">
                      {selectedTask.params.r0}
                    </p>
                  </div>
                  <div className="p-3 bg-slate-900/50 rounded-lg">
                    <p className="text-slate-400 text-sm">模拟天数</p>
                    <p className="text-xl font-bold text-white mt-1">
                      {selectedTask.totalDays} 天
                    </p>
                  </div>
                </div>

                {isPushedToCommandCenter && (
                  <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                    <Radio className="w-5 h-5 text-emerald-400" />
                    <span className="text-emerald-400 font-medium">已推送至指挥中心</span>
                    {pushedRecord?.pushedAt && (
                      <span className="text-slate-400 text-sm ml-2">
                        {new Date(pushedRecord.pushedAt).toLocaleString('zh-CN')}
                      </span>
                    )}
                  </div>
                )}

                <div>
                  <h5 className="text-white font-medium mb-3">审批进度</h5>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          selectedTask.approvalHistory.some(a => a.level === 1)
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {selectedTask.approvalHistory.some(a => a.level === 1) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          '1'
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">一级审批</p>
                        <p className="text-slate-500 text-xs">
                          {selectedTask.approvalHistory.find(a => a.level === 1)?.approver || '待审批'}
                        </p>
                      </div>
                    </div>

                    <div className="w-px h-6 bg-slate-700 ml-4" />

                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          selectedTask.approvalStatus === 'level2_approved'
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {selectedTask.approvalStatus === 'level2_approved' ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          '2'
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">二级审批</p>
                        <p className="text-slate-500 text-xs">
                          {selectedTask.approvalStatus === 'level2_approved' ? '首席科学家已审批' : '待审批'}
                        </p>
                      </div>
                    </div>

                    <div className="w-px h-6 bg-slate-700 ml-4" />

                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isPushedToCommandCenter
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {isPushedToCommandCenter ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Radio className="w-4 h-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-white text-sm font-medium">推送指挥中心</p>
                        <p className="text-slate-500 text-xs">
                          {isPushedToCommandCenter ? '已推送' : '待推送'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedTask.approvalHistory.length > 0 && (
                  <div>
                    <h5 className="text-white font-medium mb-3">审批历史</h5>
                    <div className="space-y-3">
                      {selectedTask.approvalHistory.map((record) => (
                        <div
                          key={record.id}
                          className="p-3 bg-slate-900/50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-2 py-0.5 rounded font-medium ${
                                  record.level === 1
                                    ? 'bg-blue-500/20 text-blue-400'
                                    : 'bg-purple-500/20 text-purple-400'
                                }`}
                              >
                                {record.level === 1 ? '一级审批' : '二级审批'}
                              </span>
                              <span className="text-white text-sm font-medium">
                                {record.approver}
                              </span>
                            </div>
                            <span
                              className={`text-xs px-2 py-0.5 rounded ${
                                record.status === 'approved'
                                  ? 'bg-emerald-500/20 text-emerald-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {record.status === 'approved' ? '通过' : '驳回'}
                            </span>
                          </div>
                          <p className="text-slate-400 text-sm">{record.comment}</p>
                          {record.approvedAt && (
                            <p className="text-slate-500 text-xs mt-1">
                              {new Date(record.approvedAt).toLocaleString('zh-CN')}
                            </p>
                          )}
                          {record.pushedToCommandCenter && record.pushedAt && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-700/50">
                              <Radio className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 text-xs font-medium">
                                已推送至指挥中心
                              </span>
                              <span className="text-slate-500 text-xs">
                                {new Date(record.pushedAt).toLocaleString('zh-CN')}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTask.approvalStatus !== 'level2_approved' && selectedTask.approvalStatus !== 'rejected' && (
                  <div className="space-y-4 pt-4 border-t border-slate-700/50">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        <MessageSquare className="w-4 h-4 inline mr-2" />
                        审批意见
                      </label>
                      <textarea
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        placeholder="请输入审批意见..."
                        className="w-full h-24 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 resize-none"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApprove(nextApprovalLevel())}
                        className="flex-1 flex items-center justify-center gap-2 h-11 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors font-medium"
                      >
                        <Check className="w-4 h-4" />
                        通过 ({nextApprovalLevel()}级)
                      </button>
                      <button
                        onClick={() => handleReject(nextApprovalLevel())}
                        className="flex-1 flex items-center justify-center gap-2 h-11 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
                      >
                        <X className="w-4 h-4" />
                        驳回
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-16 text-slate-500">
                <ChevronDown className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>请选择左侧任务进行审批</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
