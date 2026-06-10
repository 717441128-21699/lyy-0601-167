import { useEffect, useState, useRef } from 'react';
import {
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Zap,
  Target,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Eye,
  Link as LinkIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSystemStore, useTaskStore } from '../../store';
import { Card, StatCard } from '../../components/ui/StatusBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { mockDailyStats } from '../../data/mockData';
import { PeakDeviationRecord } from '../../types';
import * as echarts from 'echarts';

export default function Performance() {
  const { dailyStats, systemStatus, fetchDailyStats } = useSystemStore();
  const { tasks } = useTaskStore();
  const navigate = useNavigate();
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [showDeviationDetail, setShowDeviationDetail] = useState(false);
  const completionChartRef = useRef<HTMLDivElement>(null);
  const warningChartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDailyStats();
  }, []);

  useEffect(() => {
    if (dailyStats.length === 0) return;

    if (completionChartRef.current) {
      const chart = echarts.init(completionChartRef.current, 'dark');
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderColor: 'rgba(71, 85, 105, 0.5)',
          textStyle: { color: '#e2e8f0' },
        },
        legend: {
          data: ['完成率', '任务总数'],
          textStyle: { color: '#94a3b8' },
          top: 0,
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
        xAxis: {
          type: 'category',
          data: dailyStats.map((s) => s.date.slice(5)),
          axisLine: { lineStyle: { color: '#334155' } },
          axisLabel: { color: '#64748b' },
        },
        yAxis: [
          {
            type: 'value',
            name: '完成率(%)',
            max: 100,
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#64748b' },
            splitLine: { lineStyle: { color: '#1e293b' } },
          },
          {
            type: 'value',
            name: '任务数',
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#64748b' },
            splitLine: { show: false },
          },
        ],
        series: [
          {
            name: '完成率',
            type: 'line',
            smooth: true,
            showSymbol: false,
            lineStyle: { color: '#06b6d4', width: 3 },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(6, 182, 212, 0.4)' },
                { offset: 1, color: 'rgba(6, 182, 212, 0.02)' },
              ]),
            },
            data: dailyStats.map((s) => (s.completionRate * 100).toFixed(1)),
          },
          {
            name: '任务总数',
            type: 'bar',
            yAxisIndex: 1,
            barWidth: 12,
            itemStyle: { color: '#8b5cf6', borderRadius: [4, 4, 0, 0] },
            data: dailyStats.map((s) => s.tasksTotal),
          },
        ],
      });

      const handleResize = () => chart.resize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [dailyStats]);

  useEffect(() => {
    if (dailyStats.length === 0) return;

    if (warningChartRef.current) {
      const chart = echarts.init(warningChartRef.current, 'dark');
      chart.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderColor: 'rgba(71, 85, 105, 0.5)',
          textStyle: { color: '#e2e8f0' },
        },
        legend: {
          data: ['预警触发数', '平均提前量(天)'],
          textStyle: { color: '#94a3b8' },
          top: 0,
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: 40, containLabel: true },
        xAxis: {
          type: 'category',
          data: dailyStats.map((s) => s.date.slice(5)),
          axisLine: { lineStyle: { color: '#334155' } },
          axisLabel: { color: '#64748b' },
        },
        yAxis: [
          {
            type: 'value',
            name: '预警数',
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#64748b' },
            splitLine: { lineStyle: { color: '#1e293b' } },
          },
          {
            type: 'value',
            name: '提前量(天)',
            axisLine: { lineStyle: { color: '#334155' } },
            axisLabel: { color: '#64748b' },
            splitLine: { show: false },
          },
        ],
        series: [
          {
            name: '预警触发数',
            type: 'bar',
            barWidth: 12,
            itemStyle: { color: '#f59e0b', borderRadius: [4, 4, 0, 0] },
            data: dailyStats.map((s) => s.warningsTriggered),
          },
          {
            name: '平均提前量(天)',
            type: 'line',
            yAxisIndex: 1,
            smooth: true,
            showSymbol: false,
            lineStyle: { color: '#10b981', width: 2 },
            data: dailyStats.map((s) => s.averageWarningLeadTime.toFixed(1)),
          },
        ],
      });

      const handleResize = () => chart.resize();
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, [dailyStats]);

  const avgCompletion =
    dailyStats.length > 0
      ? dailyStats.reduce((sum, s) => sum + s.completionRate, 0) / dailyStats.length
      : 0;
  const avgWarningLead =
    dailyStats.length > 0
      ? dailyStats.reduce((sum, s) => sum + s.averageWarningLeadTime, 0) / dailyStats.length
      : 0;
  const totalOptimizations =
    dailyStats.length > 0
      ? dailyStats.reduce((sum, s) => sum + s.optimizationsPerformed, 0)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">性能看板</h1>
          <p className="text-slate-400 mt-1">
            监控系统运行指标，持续优化平台性能
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-slate-400" />
          <div className="flex rounded-lg overflow-hidden border border-slate-700">
            {[
              { value: '7d', label: '7天' },
              { value: '30d', label: '30天' },
              { value: '90d', label: '90天' },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setPeriod(item.value as typeof period)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  period === item.value
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {systemStatus.isPaused && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
          <div>
            <p className="text-red-400 font-semibold text-lg">系统已暂停</p>
            {systemStatus.pauseReason && (
              <p className="text-red-300/80 text-sm mt-1 font-medium">{systemStatus.pauseReason}</p>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="平均完成率"
          value={`${(avgCompletion * 100).toFixed(1)}%`}
          icon={<BarChart3 className="w-6 h-6" />}
          trend={{ value: 5.2, isPositive: true }}
        />
        <StatCard
          label="预警平均提前量"
          value={`${avgWarningLead.toFixed(1)} 天`}
          icon={<TrendingUp className="w-6 h-6" />}
          trend={{ value: 12.5, isPositive: true }}
        />
        <StatCard
          label="策略优化次数"
          value={totalOptimizations}
          icon={<Zap className="w-6 h-6" />}
          trend={{ value: 8.3, isPositive: true }}
        />
        <StatCard
          label="连续峰值偏差"
          value={`${systemStatus.consecutivePeakDeviations} 次`}
          icon={<Target className="w-6 h-6" />}
          trend={{ value: 0, isPositive: true }}
          onClick={() => setShowDeviationDetail(true)}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="任务完成率趋势" subtitle="每日任务完成情况统计">
          <div ref={completionChartRef} style={{ height: 300 }} />
        </Card>

        <Card title="预警与提前量" subtitle="预警触发次数与平均提前量">
          <div ref={warningChartRef} style={{ height: 300 }} />
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="系统健康度" subtitle="各项指标健康状态" className="lg:col-span-1">
          <div className="space-y-4">
            {[
              { label: '模拟引擎', status: 'healthy', value: 95 },
              { label: '数据存储', status: 'healthy', value: 88 },
              { label: '预警系统', status: 'warning', value: 72 },
              { label: '审批流程', status: 'healthy', value: 90 },
            ].map((item, i) => (
              <div key={i}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 text-sm">{item.label}</span>
                  <span
                    className={`text-sm font-medium ${
                      item.status === 'healthy' ? 'text-emerald-400' : 'text-yellow-400'
                    }`}
                  >
                    {item.value}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-700/50 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      item.status === 'healthy' ? 'bg-emerald-500' : 'bg-yellow-500'
                    }`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="峰值偏差监控"
          subtitle="连续偏差监测，超3次自动暂停"
          className="lg:col-span-2"
          headerAction={
            systemStatus.peakDeviationHistory.length > 0 ? (
              <button
                onClick={() => setShowDeviationDetail(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                查看详情
              </button>
            ) : undefined
          }
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="text-slate-400 text-sm">当前累计：</span>
            <span className={`text-2xl font-bold ${
              systemStatus.consecutivePeakDeviations >= 3
                ? 'text-red-400'
                : systemStatus.consecutivePeakDeviations > 0
                  ? 'text-yellow-400'
                  : 'text-emerald-400'
            }`}>
              {systemStatus.consecutivePeakDeviations}
            </span>
            <span className="text-slate-500 text-sm">/ 3 次</span>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map((i) => {
              const countedRecords = systemStatus.peakDeviationHistory.filter((r: PeakDeviationRecord) => r.counted);
              const record = countedRecords[i - 1];
              const isTriggered = i <= systemStatus.consecutivePeakDeviations;
              return (
                <div
                  key={i}
                  className={`p-4 rounded-xl text-center ${
                    isTriggered
                      ? 'bg-red-500/20 border border-red-500/30'
                      : 'bg-slate-800/50 border border-slate-700/50'
                  }`}
                >
                  <div
                    className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 ${
                      isTriggered
                        ? 'bg-red-500/30'
                        : 'bg-slate-700/50'
                    }`}
                  >
                    <AlertTriangle
                      className={`w-6 h-6 ${
                        isTriggered
                          ? 'text-red-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </div>
                  <p className="text-white font-medium">第 {i} 次</p>
                  <p
                    className={`text-xs mt-1 ${
                      isTriggered
                        ? 'text-red-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {isTriggered
                      ? record
                        ? `${record.taskName} · 偏差 ${(record.deviationRatio * 100).toFixed(1)}%`
                        : '已触发'
                      : '正常'}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="p-4 bg-slate-900/50 rounded-lg">
            <p className="text-slate-400 text-sm">
              <Activity className="w-4 h-4 inline mr-2" />
              系统阈值：连续3次峰值偏差超过阈值时自动暂停新任务受理，并通知首席科学家介入调查。仅手动恢复后重置计数。
            </p>
          </div>
        </Card>
      </div>

      <AnimatePresence>
        {showDeviationDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-end"
            onClick={() => setShowDeviationDetail(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-3xl h-full bg-slate-900 border-l border-slate-700/50 overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-slate-900/95 backdrop-blur-sm border-b border-slate-700/50">
                <div>
                  <h2 className="text-lg font-bold text-white">峰值偏差记录</h2>
                  <p className="text-slate-400 text-sm mt-0.5">
                    共 {systemStatus.peakDeviationHistory.length} 条记录
                  </p>
                </div>
                <button
                  onClick={() => setShowDeviationDetail(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 py-4">
                {systemStatus.peakDeviationHistory.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    暂无偏差记录
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          <th className="text-left py-3 px-3 text-slate-400 text-xs font-medium uppercase tracking-wider">时间</th>
                          <th className="text-left py-3 px-3 text-slate-400 text-xs font-medium uppercase tracking-wider">任务名称</th>
                          <th className="text-right py-3 px-3 text-slate-400 text-xs font-medium uppercase tracking-wider">基线峰值</th>
                          <th className="text-right py-3 px-3 text-slate-400 text-xs font-medium uppercase tracking-wider">当前峰值</th>
                          <th className="text-right py-3 px-3 text-slate-400 text-xs font-medium uppercase tracking-wider">偏差比例</th>
                          <th className="text-center py-3 px-3 text-slate-400 text-xs font-medium uppercase tracking-wider">计入连续</th>
                        </tr>
                      </thead>
                      <tbody>
                        {systemStatus.peakDeviationHistory.map((record: PeakDeviationRecord, idx: number) => (
                          <tr
                            key={idx}
                            className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="py-3 px-3 text-slate-300 text-sm">
                              {record.timestamp instanceof Date
                                ? record.timestamp.toLocaleString('zh-CN')
                                : new Date(record.timestamp).toLocaleString('zh-CN')}
                            </td>
                            <td className="py-3 px-3">
                              <button
                                onClick={() => navigate(`/tasks/${record.taskId}`)}
                                className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                                {record.taskName}
                              </button>
                            </td>
                            <td className="py-3 px-3 text-slate-300 text-sm text-right">
                              {record.baselinePeak.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-slate-300 text-sm text-right">
                              {record.currentPeak.toLocaleString()}
                            </td>
                            <td className={`py-3 px-3 text-sm text-right font-medium ${
                              record.deviationRatio >= systemStatus.consecutivePeakDeviations ? 'text-red-400' : 'text-yellow-400'
                            }`}>
                              {(record.deviationRatio * 100).toFixed(1)}%
                            </td>
                            <td className="py-3 px-3 text-center">
                              {record.counted ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/20 text-red-400">
                                  是
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-700/50 text-slate-500">
                                  否
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
