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
  Send,
  CheckCircle,
  Radio,
  ChevronDown,
  ChevronUp,
  MapPin,
  BarChart3,
  ArrowDown,
  ArrowUp,
} from 'lucide-react';
import { useTaskStore, useSystemStore } from '../../store';
import type { SimulationSnapshot } from '../../types';
import { Card, StatusBadge } from '../../components/ui/StatusBadge';
import { InfectionCurveChart } from '../../components/charts/InfectionCurveChart';
import { R0Chart } from '../../components/charts/R0Chart';
import { ResourceGauge } from '../../components/charts/ResourceGauge';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import jsPDF from 'jspdf';

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tasks, getTask, startSimulation, pauseSimulation, submitForApproval } = useTaskStore();
  const { showNotification } = useSystemStore();
  const [task, setTask] = useState(getTask(id || ''));
  const [activeTab, setActiveTab] = useState<'overview' | 'params' | 'warnings' | 'logs' | 'comparison'>('overview');
  const [showCities, setShowCities] = useState(false);
  const [showEdges, setShowEdges] = useState(false);

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

  const handleSubmitForApproval = () => {
    if (!task) return;
    submitForApproval(task.id);
    showNotification('success', '已提交审批，请等待审批人审核');
  };

  const getApprovalStatusDisplay = () => {
    if (!task) return { text: '未提交', color: 'text-slate-400', level: '' };
    switch (task.approvalStatus) {
      case 'not_submitted':
        return { text: '未提交', color: 'text-slate-400', level: '' };
      case 'pending':
        return { text: '待一级审批', color: 'text-yellow-400', level: '一级' };
      case 'level1_approved':
        return { text: '待二级审批', color: 'text-blue-400', level: '二级' };
      case 'level2_approved':
        return { text: '审批完成', color: 'text-emerald-400', level: '' };
      case 'rejected':
        return { text: '已驳回', color: 'text-red-400', level: '' };
      default:
        return { text: '未知', color: 'text-slate-400', level: '' };
    }
  };

  const canSubmitForApproval =
    task.status === 'completed' &&
    (task.approvalStatus === 'not_submitted' || task.approvalStatus === 'rejected');

  const isPushedToCommandCenter = task.approvalHistory.some(
    (r) => r.pushedToCommandCenter
  );

  const approvalStatusDisplay = getApprovalStatusDisplay();

  const tabs = [
    { id: 'overview', label: '概览', icon: Activity },
    { id: 'params', label: '参数配置', icon: Settings2 },
    { id: 'warnings', label: '预警记录', icon: AlertTriangle },
    { id: 'logs', label: '调整日志', icon: FileText },
    { id: 'comparison', label: '策略对比', icon: BarChart3 },
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
          {canSubmitForApproval && (
            <button
              onClick={handleSubmitForApproval}
              className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
            >
              <Send className="w-4 h-4" />
              提交审批
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
            onClick={() => {
              const doc = new jsPDF();

              doc.setFontSize(20);
              doc.setTextColor(30, 58, 138);
              doc.text('病毒传播模拟综合报告', 105, 25, { align: 'center' });

              doc.setFontSize(12);
              doc.setTextColor(100);
              doc.text(task.name, 105, 35, { align: 'center' });

              doc.setFontSize(14);
              doc.setTextColor(0);
              doc.text('一、基本信息', 20, 55);

              doc.setFontSize(10);
              doc.setTextColor(60);
              doc.text(`任务名称: ${task.name}`, 25, 65);
              doc.text(`创建时间: ${task.createdAt.toLocaleDateString('zh-CN')}`, 25, 73);
              doc.text(`模拟天数: ${task.totalDays} 天`, 25, 81);

              doc.setFontSize(14);
              doc.setTextColor(0);
              doc.text('二、病毒参数', 20, 95);

              doc.setFontSize(10);
              doc.setTextColor(60);
              doc.text(`R0: ${task.params.r0}`, 25, 105);
              doc.text(`潜伏期: ${task.params.incubationPeriod} 天`, 25, 113);
              doc.text(`传染期: ${task.params.infectiousPeriod} 天`, 25, 121);
              doc.text(`重症率: ${(task.params.severeRate * 100).toFixed(1)}%`, 25, 129);

              let yPos = 145;

              if (task.results) {
                doc.setFontSize(14);
                doc.setTextColor(0);
                doc.text('三、模拟结果', 20, yPos);

                yPos += 10;
                doc.setFontSize(10);
                doc.setTextColor(60);
                doc.text(`峰值感染人数: ${task.results.peakInfection.toLocaleString()}`, 25, yPos);
                yPos += 8;
                doc.text(`峰值出现时间: 第 ${task.results.peakTime} 天`, 25, yPos);
                yPos += 8;
                doc.text(`总感染人数: ${task.results.totalInfected.toLocaleString()}`, 25, yPos);
                yPos += 8;
                doc.text(`总康复人数: ${task.results.totalRecovered.toLocaleString()}`, 25, yPos);
                yPos += 8;
                doc.text(`总死亡人数: ${task.results.totalDeaths.toLocaleString()}`, 25, yPos);
                yPos += 16;
              }

              if (task.preAdjustmentSnapshot && task.results) {
                if (yPos > 230) {
                  doc.addPage();
                  yPos = 20;
                }

                doc.setFontSize(14);
                doc.setTextColor(0);
                doc.text('策略调整对比', 20, yPos);
                yPos += 10;

                doc.setFontSize(9);
                doc.setTextColor(0);
                doc.text('指标', 25, yPos);
                doc.text('调整前', 85, yPos);
                doc.text('调整后', 130, yPos);
                doc.text('变化率', 175, yPos);
                yPos += 2;
                doc.setDrawColor(150);
                doc.line(25, yPos, 190, yPos);
                yPos += 5;

                const before = task.preAdjustmentSnapshot;
                const after = task.results;
                const rows = [
                  {
                    label: '峰值感染人数',
                    beforeVal: before.peakInfection,
                    afterVal: after.peakInfection,
                  },
                  {
                    label: '总感染人数',
                    beforeVal: before.totalInfected,
                    afterVal: after.totalInfected,
                  },
                  {
                    label: '总康复人数',
                    beforeVal: before.totalRecovered,
                    afterVal: after.totalRecovered,
                  },
                  {
                    label: '总死亡人数',
                    beforeVal: before.totalDeaths,
                    afterVal: after.totalDeaths,
                  },
                ];

                doc.setTextColor(60);
                for (const row of rows) {
                  if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                  }
                  const pct = row.beforeVal > 0
                    ? (((row.afterVal - row.beforeVal) / row.beforeVal) * 100).toFixed(1)
                    : '0.0';
                  doc.text(row.label, 25, yPos);
                  doc.text(row.beforeVal.toLocaleString(), 85, yPos);
                  doc.text(row.afterVal.toLocaleString(), 130, yPos);
                  doc.text(`${Number(pct) >= 0 ? '+' : ''}${pct}%`, 175, yPos);
                  yPos += 7;
                }
              }

              doc.setFontSize(10);
              doc.setTextColor(150);
              doc.text('EpiSim 病毒传播动力学模拟平台 生成', 105, 280, { align: 'center' });

              doc.save(`${task.name}_报告.pdf`);
              showNotification('success', '报告已导出');
            }}
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
          <p className={`text-lg font-semibold mt-1 ${approvalStatusDisplay.color}`}>
            {approvalStatusDisplay.text}
          </p>
          <p className="text-slate-500 text-xs mt-1">
            {task.approvalHistory.length} 条记录
          </p>
        </Card>
      </div>

      {isPushedToCommandCenter && (
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-400 font-medium">已推送至指挥中心</span>
          {task.approvalHistory.find((r) => r.pushedToCommandCenter)?.pushedAt && (
            <span className="text-slate-400 text-sm ml-2">
              {new Date(
                task.approvalHistory.find((r) => r.pushedToCommandCenter)!.pushedAt!
              ).toLocaleString('zh-CN')}
            </span>
          )}
        </div>
      )}

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

      {activeTab === 'overview' && (
        <div className="space-y-6">
          {task.approvalHistory.length > 0 && (
            <Card title="审批历史">
              <div className="space-y-3">
                {task.approvalHistory.map((record) => (
                  <div
                    key={record.id}
                    className={`p-4 rounded-lg border ${
                      record.status === 'approved'
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            record.level === 1
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-purple-500/20 text-purple-400'
                          }`}
                        >
                          {record.level === 1 ? '一级审批' : '二级审批'}
                        </span>
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
                      {record.approvedAt && (
                        <span className="text-slate-500 text-xs">
                          {new Date(record.approvedAt).toLocaleString('zh-CN')}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-300">{record.approver}</span>
                    </div>
                    {record.comment && (
                      <p className="text-slate-400 text-sm mt-2">{record.comment}</p>
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
            </Card>
          )}

          {task.results && (
            <>
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
            </>
          )}

          {!task.results && (
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
        </div>
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

          <Card title="人口数据" subtitle="人口流动网络信息" className="lg:col-span-2">
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

              <button
                onClick={() => setShowCities(!showCities)}
                className="w-full flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <span className="text-cyan-400 font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  城市清单
                </span>
                {showCities ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {showCities && (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  <div className="grid grid-cols-4 gap-2 px-3 py-1.5 text-xs text-slate-500 font-medium sticky top-0 bg-slate-800">
                    <span>城市名</span>
                    <span>人口</span>
                    <span>医疗容量</span>
                    <span>坐标</span>
                  </div>
                  {task.networkData.cities.map((city) => (
                    <div key={city.id} className="grid grid-cols-4 gap-2 px-3 py-2 bg-slate-900/50 rounded-lg text-sm">
                      <span className="text-white font-medium">{city.name}</span>
                      <span className="text-slate-300">{city.population.toLocaleString()}</span>
                      <span className="text-slate-300">{city.medicalCapacity.toLocaleString()}</span>
                      <span className="text-slate-500 text-xs">{city.position.lat.toFixed(1)}°N, {city.position.lng.toFixed(1)}°E</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowEdges(!showEdges)}
                className="w-full flex items-center justify-between p-3 bg-slate-800/50 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <span className="text-cyan-400 font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  流动路线清单
                </span>
                {showEdges ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>
              {showEdges && (
                <div className="max-h-64 overflow-y-auto space-y-2">
                  <div className="grid grid-cols-4 gap-2 px-3 py-1.5 text-xs text-slate-500 font-medium sticky top-0 bg-slate-800">
                    <span>起点</span>
                    <span>终点</span>
                    <span>流量</span>
                    <span>交通方式</span>
                  </div>
                  {task.networkData.edges.map((edge, idx) => {
                    const fromCity = task.networkData.cities.find(c => c.id === edge.from);
                    const toCity = task.networkData.cities.find(c => c.id === edge.to);
                    return (
                      <div key={idx} className="grid grid-cols-4 gap-2 px-3 py-2 bg-slate-900/50 rounded-lg text-sm">
                        <span className="text-white">{fromCity?.name || edge.from}</span>
                        <span className="text-white">{toCity?.name || edge.to}</span>
                        <span className="text-slate-300">{edge.flowRate.toLocaleString()}</span>
                        <span className="text-slate-500">{edge.transportMode}</span>
                      </div>
                    );
                  })}
                </div>
              )}
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

      {activeTab === 'comparison' && (
        <>
          {task.preAdjustmentSnapshot && task.results ? (
            <div className="space-y-6">
              <Card title="策略调整对比视图">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="text-slate-400 font-medium text-sm border-b border-slate-700/50 pb-2">调整前</h3>
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">峰值感染人数</span>
                      <span className="text-lg font-bold text-red-400">
                        {task.preAdjustmentSnapshot.peakInfection.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">总感染人数</span>
                      <span className="text-lg font-bold text-orange-400">
                        {task.preAdjustmentSnapshot.totalInfected.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">总康复人数</span>
                      <span className="text-lg font-bold text-emerald-400">
                        {task.preAdjustmentSnapshot.totalRecovered.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">总死亡人数</span>
                      <span className="text-lg font-bold text-red-400">
                        {task.preAdjustmentSnapshot.totalDeaths.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                      <span className="text-slate-400">峰值出现时间</span>
                      <span className="text-lg font-bold text-white">
                        第 {task.preAdjustmentSnapshot.peakTime} 天
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-cyan-400 font-medium text-sm border-b border-cyan-500/30 pb-2">调整后</h3>
                    {(() => {
                      const before = task.preAdjustmentSnapshot!;
                      const after = task.results!;
                      const peakChange = after.peakInfection - before.peakInfection;
                      const peakPct = before.peakInfection > 0 ? ((peakChange / before.peakInfection) * 100).toFixed(1) : '0.0';
                      const totalChange = after.totalInfected - before.totalInfected;
                      const totalPct = before.totalInfected > 0 ? ((totalChange / before.totalInfected) * 100).toFixed(1) : '0.0';
                      const recoveredChange = after.totalRecovered - before.totalRecovered;
                      const recoveredPct = before.totalRecovered > 0 ? ((recoveredChange / before.totalRecovered) * 100).toFixed(1) : '0.0';
                      const deathsChange = after.totalDeaths - before.totalDeaths;
                      const deathsPct = before.totalDeaths > 0 ? ((deathsChange / before.totalDeaths) * 100).toFixed(1) : '0.0';
                      const peakTimeChange = after.peakTime - before.peakTime;

                      return (
                        <>
                          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <span className="text-slate-400">峰值感染人数</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-cyan-400">
                                {after.peakInfection.toLocaleString()}
                              </span>
                              <span className={`flex items-center gap-0.5 text-xs font-medium ${peakChange <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {peakChange <= 0 ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                                {Math.abs(Number(peakPct))}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <span className="text-slate-400">总感染人数</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-cyan-400">
                                {after.totalInfected.toLocaleString()}
                              </span>
                              <span className={`flex items-center gap-0.5 text-xs font-medium ${totalChange <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {totalChange <= 0 ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                                {Math.abs(Number(totalPct))}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <span className="text-slate-400">总康复人数</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-cyan-400">
                                {after.totalRecovered.toLocaleString()}
                              </span>
                              <span className={`flex items-center gap-0.5 text-xs font-medium ${recoveredChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {recoveredChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {Math.abs(Number(recoveredPct))}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <span className="text-slate-400">总死亡人数</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-cyan-400">
                                {after.totalDeaths.toLocaleString()}
                              </span>
                              <span className={`flex items-center gap-0.5 text-xs font-medium ${deathsChange <= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {deathsChange <= 0 ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />}
                                {Math.abs(Number(deathsPct))}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                            <span className="text-slate-400">峰值出现时间</span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-bold text-cyan-400">
                                第 {after.peakTime} 天
                              </span>
                              <span className={`flex items-center gap-0.5 text-xs font-medium ${peakTimeChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                {peakTimeChange >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                                {Math.abs(peakTimeChange)}天
                              </span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="调整前感染曲线">
                  <InfectionCurveChart data={task.preAdjustmentSnapshot.timeSeries} height={280} />
                </Card>
                <Card title="调整后感染曲线">
                  <InfectionCurveChart data={task.results.timeSeries} height={280} />
                </Card>
              </div>

              <Card title="干预措施对比">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(() => {
                    const beforeInt = task.preAdjustmentSnapshot!.interventions;
                    const afterInt = task.interventions;
                    const items = [
                      {
                        label: '社交疏离',
                        beforeEnabled: beforeInt.socialDistancing.enabled,
                        afterEnabled: afterInt.socialDistancing.enabled,
                        beforeParam: `强度: ${(beforeInt.socialDistancing.intensity * 100).toFixed(0)}%`,
                        afterParam: `强度: ${(afterInt.socialDistancing.intensity * 100).toFixed(0)}%`,
                        changed: beforeInt.socialDistancing.enabled !== afterInt.socialDistancing.enabled ||
                          beforeInt.socialDistancing.intensity !== afterInt.socialDistancing.intensity,
                      },
                      {
                        label: '病例隔离',
                        beforeEnabled: beforeInt.isolation.enabled,
                        afterEnabled: afterInt.isolation.enabled,
                        beforeParam: `覆盖: ${(beforeInt.isolation.coverage * 100).toFixed(0)}%`,
                        afterParam: `覆盖: ${(afterInt.isolation.coverage * 100).toFixed(0)}%`,
                        changed: beforeInt.isolation.enabled !== afterInt.isolation.enabled ||
                          beforeInt.isolation.coverage !== afterInt.isolation.coverage,
                      },
                      {
                        label: '疫苗接种',
                        beforeEnabled: beforeInt.vaccination.enabled,
                        afterEnabled: afterInt.vaccination.enabled,
                        beforeParam: `${beforeInt.vaccination.dailyCapacity.toLocaleString()} 剂/天`,
                        afterParam: `${afterInt.vaccination.dailyCapacity.toLocaleString()} 剂/天`,
                        changed: beforeInt.vaccination.enabled !== afterInt.vaccination.enabled ||
                          beforeInt.vaccination.dailyCapacity !== afterInt.vaccination.dailyCapacity,
                      },
                      {
                        label: '旅行限制',
                        beforeEnabled: beforeInt.travelRestriction.enabled,
                        afterEnabled: afterInt.travelRestriction.enabled,
                        beforeParam: `等级: ${(beforeInt.travelRestriction.restrictionLevel * 100).toFixed(0)}%`,
                        afterParam: `等级: ${(afterInt.travelRestriction.restrictionLevel * 100).toFixed(0)}%`,
                        changed: beforeInt.travelRestriction.enabled !== afterInt.travelRestriction.enabled ||
                          beforeInt.travelRestriction.restrictionLevel !== afterInt.travelRestriction.restrictionLevel,
                      },
                    ];
                    return items.map((item) => (
                      <div
                        key={item.label}
                        className={`p-4 rounded-lg border ${
                          item.changed
                            ? 'bg-cyan-500/10 border-cyan-500/30'
                            : 'bg-slate-800/50 border-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className={`w-4 h-4 ${item.changed ? 'text-cyan-400' : 'text-slate-500'}`} />
                          <span className="text-white font-medium text-sm">{item.label}</span>
                          {item.changed && (
                            <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400">已变更</span>
                          )}
                        </div>
                        <div className="space-y-1 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-500">调整前</span>
                            <span className={item.beforeEnabled ? 'text-emerald-400' : 'text-slate-500'}>
                              {item.beforeEnabled ? '已启用' : '未启用'}
                            </span>
                          </div>
                          <div className="text-slate-400 pl-2">{item.beforeParam}</div>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-slate-500">调整后</span>
                            <span className={item.afterEnabled ? 'text-emerald-400' : 'text-slate-500'}>
                              {item.afterEnabled ? '已启用' : '未启用'}
                            </span>
                          </div>
                          <div className={`${item.changed ? 'text-cyan-300' : 'text-slate-400'} pl-2`}>
                            {item.afterParam}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </Card>
            </div>
          ) : (
            <Card>
              <div className="text-center py-16 text-slate-500">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">暂无策略调整对比数据</p>
                <p className="text-sm mt-1">确认预警后将自动记录调整前数据</p>
              </div>
            </Card>
          )}
        </>
      )}
    </motion.div>
  );
}
