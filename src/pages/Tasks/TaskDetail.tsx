import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Download,
  Share2,
  Clock,
  User,
  Activity,
  AlertTriangle,
  FileText,
  Settings2,
  Shield,
  TrendingUp,
} from 'lucide-react';
import { useTaskStore } from '../../store';
import { Card, StatusBadge } from '../../components/ui/StatusBadge';
import { InfectionCurveChart } from '../../components/charts/InfectionCurveChart';
import { R0Chart } from '../../components/charts/R0Chart';
import { ResourceGauge } from '../../components/charts/ResourceGauge';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, getTask, startSimulation, pauseSimulation } = useTaskStore();
  const [task, setTask] = useState(getTask(id || ''));
  const [activeTab, setActiveTab] = useState<'overview' | 'params' | 'warnings' | 'logs'>('overview');

  useEffect(() => {
    if (!id) return;

    const interval = setInterval(() => {
      const updated = getTask(id);
      if (updated) {
        setTask({ ...updated });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [id]);

  if (!task) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <Activity className="w-8 h-8 mr-2 animate-spin" />
        加载中...
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '概览', icon: Activity },
    { id: 'params', label: '参数配置', icon: Settings2 },
    { id: 'warnings', label: '预警记录', icon: AlertTriangle },
    { id: 'logs', label: '调整日志', icon: FileText },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/tasks')}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{task.name}</h1>
              <StatusBadge status={task.status} />
            </div>
            <p className="text-slate-400 mt-1">{task.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {task.status === 'pending_validation' && (
            <button
              onClick={() => startSimulation(task.id)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
            >
              <Play className="w-4 h-4" />
              开始模拟
            </button>
          )}
          {task.status === 'iterating' && (
            <button
              onClick={() => pauseSimulation(task.id)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              <Pause className="w-4 h-4" />
              暂停
            </button>
          )}
          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
          >
            <Download className="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <p className="text-slate-400 text-sm">创建时间</p>
          <p className="text-lg font-semibold text-white mt-1">
            {task.createdAt.toLocaleDateString('zh-CN')}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true, locale: zhCN })}
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-slate-400 text-sm">模拟进度</p>
          <p className="text-lg font-semibold text-cyan-400 mt-1">
            {Math.round((task.currentIteration / task.totalDays) * 100)}%
          </p>
          <p className="text-slate-500 text-xs mt-1">
            第 {task.currentIteration} / {task.totalDays} 天
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-slate-400 text-sm">预警数</p>
          <p className={`text-lg font-semibold mt-1 ${task.warnings.length > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {task.warnings.length}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            待处理 {task.warnings.filter(w => !w.reviewed).length} 条
          </p>
        </Card>
        <Card className="text-center">
          <p className="text-slate-400 text-sm">审批状态</p>
          <p className="text-lg font-semibold text-purple-400 mt-1">
            {task.approvalStatus === 'not_submitted' ? '未提交' : 
             task.approvalStatus === 'pending' ? '待审批' :
             task.approvalStatus === 'level1_approved' ? '一级通过' :
             task.approvalStatus === 'level2_approved' ? '已完成' : '已驳回'}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            {task.approvalHistory.length} 条记录
          </p>
        </Card>
      </div>

      <div className="flex gap-1 border-b border-slate-700/50">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 -mb-px transition-all ${
                activeTab === tab.id
                  ? 'text-cyan-400 border-b-2 border-cyan-500'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'overview' && task.results && (
        <div className="space-y-6">
          <Card title="感染传播曲线">
            <InfectionCurveChart data={task.results.timeSeries} height={350} />
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="关键指标" className="lg:col-span-1">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-slate-400">峰值感染人数</span>
                  <span className="text-xl font-bold text-red-400">
                    {task.results.peakInfection.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-slate-400">峰值出现时间</span>
                  <span className="text-xl font-bold text-white">
                    第 {task.results.peakTime} 天
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-slate-400">总感染人数</span>
                  <span className="text-xl font-bold text-orange-400">
                    {task.results.totalInfected.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                  <span className="text-slate-400">总康复人数</span>
                  <span className="text-xl font-bold text-emerald-400">
                    {task.results.totalRecovered.toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>

            <Card title="R0 变化趋势" className="lg:col-span-1">
              <R0Chart data={task.results.r0Evolution} height={200} />
            </Card>

            <Card title="医疗资源占用" className="lg:col-span-1">
              <ResourceGauge
                value={task.results.medicalResourceUsage[task.results.medicalResourceUsage.length - 1] || 0}
              />
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'overview' && !task.results && (
        <Card>
          <div className="text-center py-16 text-slate-500">
            <Activity className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">模拟尚未开始</p>
            <p className="text-sm mt-1">启动模拟后，结果将在此展示</p>
            {task.status === 'pending_validation' && (
              <button
                onClick={() => startSimulation(task.id)}
                className="mt-6 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all"
              >
                开始模拟
              </button>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'params' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="病毒参数" subtitle="病原体生物学特性">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <p className="text-slate-400 text-sm">基本传染数 R0</p>
                <p className="text-lg font-bold text-cyan-400">{task.params.r0}</p>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <p className="text-slate-400 text-sm">潜伏期</p>
                <p className="text-lg font-bold text-white">{task.params.incubationPeriod} 天</p>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <p className="text-slate-400 text-sm">传染期</p>
                <p className="text-lg font-bold text-white">{task.params.infectiousPeriod} 天</p>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <p className="text-slate-400 text-sm">重症率</p>
                <p className="text-lg font-bold text-orange-400">{(task.params.severeRate * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <p className="text-slate-400 text-sm">病死率</p>
                <p className="text-lg font-bold text-red-400">{(task.params.mortalityRate * 100).toFixed(2)}%</p>
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <p className="text-slate-400 text-sm">恢复率</p>
                <p className="text-lg font-bold text-emerald-400">{task.params.recoveryRate.toFixed(2)}</p>
              </div>
            </div>
          </Card>

          <Card title="人口数据" subtitle="人口流动网络信息">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-400">覆盖城市数</span>
                <span className="text-white font-medium">{task.networkData.cities.length} 个</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-400">总人口</span>
                <span className="text-white font-medium">{task.networkData.totalPopulation.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-400">流动路线</span>
                <span className="text-white font-medium">{task.networkData.edges.length} 条</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <span className="text-slate-400">初始感染人数</span>
                <span className="text-red-400 font-medium">{task.population.initialInfected}</span>
              </div>
            </div>
          </Card>

          <Card title="干预措施" subtitle="当前启用的防控策略" className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className={`p-4 rounded-lg border ${
                task.interventions.socialDistancing.enabled
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-slate-800/50 border-slate-700/50 opacity-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`w-4 h-4 ${task.interventions.socialDistancing.enabled ? 'text-yellow-400' : 'text-slate-500'}`} />
                  <span className="text-white font-medium text-sm">社交疏离</span>
                </div>
                <p className="text-slate-400 text-xs">
                  强度: {(task.interventions.socialDistancing.intensity * 100).toFixed(0)}%
                </p>
              </div>

              <div className={`p-4 rounded-lg border ${
                task.interventions.isolation.enabled
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-slate-800/50 border-slate-700/50 opacity-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`w-4 h-4 ${task.interventions.isolation.enabled ? 'text-blue-400' : 'text-slate-500'}`} />
                  <span className="text-white font-medium text-sm">病例隔离</span>
                </div>
                <p className="text-slate-400 text-xs">
                  覆盖: {(task.interventions.isolation.coverage * 100).toFixed(0)}%
                </p>
              </div>

              <div className={`p-4 rounded-lg border ${
                task.interventions.vaccination.enabled
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-slate-800/50 border-slate-700/50 opacity-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`w-4 h-4 ${task.interventions.vaccination.enabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="text-white font-medium text-sm">疫苗接种</span>
                </div>
                <p className="text-slate-400 text-xs">
                  {task.interventions.vaccination.dailyCapacity.toLocaleString()} 剂/天
                </p>
              </div>

              <div className={`p-4 rounded-lg border ${
                task.interventions.travelRestriction.enabled
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-slate-800/50 border-slate-700/50 opacity-50'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield className={`w-4 h-4 ${task.interventions.travelRestriction.enabled ? 'text-red-400' : 'text-slate-500'}`} />
                  <span className="text-white font-medium text-sm">旅行限制</span>
                </div>
                <p className="text-slate-400 text-xs">
                  等级: {(task.interventions.travelRestriction.restrictionLevel * 100).toFixed(0)}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'warnings' && (
        <Card title={`预警记录 (${task.warnings.length}条)`}>
          {task.warnings.length > 0 ? (
            <div className="space-y-3">
              {task.warnings.map((warning) => (
                <div
                  key={warning.id}
                  className={`p-4 rounded-lg border ${
                    warning.level === 'critical'
                      ? 'bg-red-500/10 border-red-500/30'
                      : warning.level === 'high'
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle
                        className={`w-5 h-5 ${
                          warning.level === 'critical'
                            ? 'text-red-400'
                            : warning.level === 'high'
                            ? 'text-orange-400'
                            : 'text-yellow-400'
                        }`}
                      />
                      <span className="text-white font-medium">{warning.message}</span>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        warning.reviewed
                          ? warning.reviewResult === 'approved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-red-500/20 text-red-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {warning.reviewed
                        ? warning.reviewResult === 'approved'
                          ? '已确认'
                          : '已驳回'
                        : '待复核'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 text-sm">
                    <span>第 {warning.iteration} 天</span>
                    <span>当前值: {warning.value.toFixed(2)}</span>
                    <span>阈值: {warning.threshold.toFixed(2)}</span>
                  </div>
                  {warning.reviewComment && (
                    <p className="mt-2 text-slate-400 text-sm border-t border-slate-700/50 pt-2">
                      复核意见: {warning.reviewComment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无预警记录</p>
            </div>
          )}
        </Card>
      )}

      {activeTab === 'logs' && (
        <Card title="调整日志">
          {task.adjustmentLogs.length > 0 ? (
            <div className="space-y-4">
              {task.adjustmentLogs.map((log) => (
                <div key={log.id} className="p-4 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{log.adjustmentType}</span>
                    <span className="text-slate-400 text-sm">
                      {new Date(log.timestamp).toLocaleString('zh-CN')}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm">调整人: {log.adjustedBy}</p>
                  <p className="text-slate-400 text-sm mt-1">原因: {log.reason}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无调整记录</p>
            </div>
          )}
        </Card>
      )}
    </motion.div>
  );
}
