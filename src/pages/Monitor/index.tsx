import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Pause,
  Play,
  RotateCcw,
  Clock,
  Thermometer,
  Users,
  Heart,
} from 'lucide-react';
import { useTaskStore } from '../../store';
import { Card, StatusBadge, ProgressBar } from '../../components/ui/StatusBadge';
import { InfectionCurveChart } from '../../components/charts/InfectionCurveChart';
import { R0Chart } from '../../components/charts/R0Chart';
import { ResourceGauge } from '../../components/charts/ResourceGauge';
import { motion } from 'framer-motion';

export default function Monitor() {
  const { id } = useParams<{ id: string }>();
  const { tasks, getTask, startSimulation, pauseSimulation } = useTaskStore();
  const [task, setTask] = useState(getTask(id || tasks[0]?.id) || tasks[0]);

  useEffect(() => {
    if (!task) {
      return;
    }

    const interval = setInterval(() => {
      const updatedTask = getTask(task.id);
      if (updatedTask) {
        setTask({ ...updatedTask });
      }
    }, 500);

    return () => clearInterval(interval);
  }, [task?.id]);

  useEffect(() => {
    if (task && task.status === 'pending_validation') {
      startSimulation(task.id);
    }
  }, [task?.id]);

  if (!task) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-400">
        <Activity className="w-8 h-8 mr-2 animate-spin" />
        加载中...
      </div>
    );
  }

  const currentDay = task.currentIteration || 0;
  const progress = (currentDay / task.totalDays) * 100;

  const latestData = task.results?.timeSeries || [];
  const latestPoint = latestData[latestData.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">实时监控</h1>
            <StatusBadge status={task.status} />
          </div>
          <p className="text-slate-400 mt-1">{task.name}</p>
        </div>
        <div className="flex items-center gap-3">
          {task.status === 'iterating' ? (
            <button
              onClick={() => pauseSimulation(task.id)}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
            >
              <Pause className="w-4 h-4" />
              暂停模拟
            </button>
          ) : (
            <button
              onClick={() => startSimulation(task.id)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
            >
              <Play className="w-4 h-4" />
              开始模拟
            </button>
          )}
          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            重置
          </button>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-white font-medium">模拟进度</span>
          </div>
          <span className="text-slate-400 text-sm">
            第 {currentDay} 天 / 共 {task.totalDays} 天
          </span>
        </div>
        <ProgressBar value={progress} color="cyan" />
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {latestPoint ? latestPoint.infected.toLocaleString() : '-'}
          </p>
          <p className="text-slate-400 text-sm">当前感染人数</p>
        </Card>
        <Card className="text-center">
          <Thermometer className="w-8 h-8 text-orange-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {latestPoint ? latestPoint.severe.toLocaleString() : '-'}
          </p>
          <p className="text-slate-400 text-sm">重症人数</p>
        </Card>
        <Card className="text-center">
          <Heart className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">
            {latestPoint ? latestPoint.recovered.toLocaleString() : '-'}
          </p>
          <p className="text-slate-400 text-sm">累计康复</p>
        </Card>
        <Card className="text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">{task.warnings.length}</p>
          <p className="text-slate-400 text-sm">预警数</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title="感染传播曲线" subtitle="SEIR 模型实时数据">
            <InfectionCurveChart data={task.results?.timeSeries || []} height={350} />
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="R0 基本传染数" subtitle="实时追踪传播能力">
            <R0Chart data={task.results?.r0Evolution || []} height={180} />
          </Card>

          <Card title="医疗资源占用" subtitle="重症床位使用率">
            <ResourceGauge value={latestPoint?.resourceUsage || 0} />
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="参数配置" subtitle="本次模拟使用的参数">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <p className="text-slate-400 text-sm">初始 R0</p>
              <p className="text-xl font-bold text-cyan-400">{task.params.r0}</p>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <p className="text-slate-400 text-sm">潜伏期</p>
              <p className="text-xl font-bold text-white">{task.params.incubationPeriod} 天</p>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <p className="text-slate-400 text-sm">传染期</p>
              <p className="text-xl font-bold text-white">{task.params.infectiousPeriod} 天</p>
            </div>
            <div className="p-3 bg-slate-900/50 rounded-lg">
              <p className="text-slate-400 text-sm">重症率</p>
              <p className="text-xl font-bold text-orange-400">{(task.params.severeRate * 100).toFixed(1)}%</p>
            </div>
          </div>
        </Card>

        <Card title="预警记录" subtitle="实时预警信息">
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {task.warnings.length > 0 ? (
              task.warnings.map((warning) => (
                <div
                  key={warning.id}
                  className={`p-3 rounded-lg border ${
                    warning.level === 'critical'
                      ? 'bg-red-500/10 border-red-500/30'
                      : warning.level === 'high'
                      ? 'bg-orange-500/10 border-orange-500/30'
                      : 'bg-yellow-500/10 border-yellow-500/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm font-medium">{warning.message}</span>
                    <span className="text-slate-400 text-xs">第 {warning.iteration} 天</span>
                  </div>
                  <p className="text-slate-400 text-xs mt-1">
                    触发时间：{new Date(warning.triggeredAt).toLocaleTimeString('zh-CN')}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>暂无预警记录</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
