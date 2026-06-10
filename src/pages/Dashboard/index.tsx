import { useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckSquare,
  ListTodo,
  TrendingUp,
  Clock,
  Zap,
  FileBarChart,
  ChevronRight,
} from 'lucide-react';
import { useTaskStore, useWarningStore } from '../../store';
import { StatCard, Card, StatusBadge } from '../../components/ui/StatusBadge';
import { InfectionCurveChart } from '../../components/charts/InfectionCurveChart';
import { R0Chart } from '../../components/charts/R0Chart';
import { ResourceGauge } from '../../components/charts/ResourceGauge';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const { tasks, fetchTasks } = useTaskStore();
  const { warnings, fetchWarnings, unreadCount } = useWarningStore();

  useEffect(() => {
    fetchTasks();
    fetchWarnings();
  }, []);

  const stats = {
    totalTasks: tasks.length,
    runningTasks: tasks.filter(t => ['iterating', 'model_building', 'initializing', 'strategy_optimizing'].includes(t.status)).length,
    pendingWarnings: unreadCount,
    pendingApprovals: tasks.filter(t => t.approvalStatus === 'pending').length,
  };

  const recentTasks = tasks.slice(0, 5);
  const recentWarnings = warnings.slice(0, 3);

  const chartData = [
    { day: 0, susceptible: 140000000, exposed: 5000, infected: 2000, recovered: 0, deceased: 0, severe: 200, r0: 2.5, resourceUsage: 0.2 },
    { day: 10, susceptible: 135000000, exposed: 15000, infected: 8000, recovered: 2000, deceased: 50, severe: 800, r0: 2.3, resourceUsage: 0.25 },
    { day: 20, susceptible: 125000000, exposed: 35000, infected: 25000, recovered: 15000, deceased: 300, severe: 3000, r0: 2.1, resourceUsage: 0.4 },
    { day: 30, susceptible: 110000000, exposed: 60000, infected: 55000, recovered: 50000, deceased: 1200, severe: 6500, r0: 1.8, resourceUsage: 0.6 },
    { day: 40, susceptible: 95000000, exposed: 75000, infected: 85000, recovered: 120000, deceased: 3000, severe: 10000, r0: 1.5, resourceUsage: 0.78 },
    { day: 50, susceptible: 85000000, exposed: 65000, infected: 95000, recovered: 200000, deceased: 5500, severe: 11000, r0: 1.3, resourceUsage: 0.82 },
    { day: 60, susceptible: 78000000, exposed: 45000, infected: 80000, recovered: 280000, deceased: 8000, severe: 9000, r0: 1.1, resourceUsage: 0.7 },
    { day: 70, susceptible: 73000000, exposed: 25000, infected: 55000, recovered: 350000, deceased: 10000, severe: 6000, r0: 0.9, resourceUsage: 0.5 },
    { day: 80, susceptible: 70000000, exposed: 12000, infected: 30000, recovered: 400000, deceased: 11500, severe: 3500, r0: 0.7, resourceUsage: 0.35 },
    { day: 90, susceptible: 68000000, exposed: 5000, infected: 15000, recovered: 430000, deceased: 12500, severe: 1800, r0: 0.5, resourceUsage: 0.2 },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">工作台</h1>
          <p className="text-slate-400 mt-1">欢迎回来，实时掌握模拟任务运行状态</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm">
            <Clock className="w-4 h-4 inline mr-1" />
            {new Date().toLocaleDateString('zh-CN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
        </div>
      </div>

      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="总任务数"
          value={stats.totalTasks}
          icon={<ListTodo className="w-6 h-6" />}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          label="运行中任务"
          value={stats.runningTasks}
          icon={<Activity className="w-6 h-6" />}
          trend={{ value: 3, isPositive: true }}
        />
        <StatCard
          label="待处理预警"
          value={stats.pendingWarnings}
          icon={<AlertTriangle className="w-6 h-6" />}
          trend={{ value: 5, isPositive: false }}
        />
        <StatCard
          label="待审批任务"
          value={stats.pendingApprovals}
          icon={<CheckSquare className="w-6 h-6" />}
          trend={{ value: 2, isPositive: false }}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div variants={item} className="lg:col-span-2">
          <Card title="感染趋势概览" subtitle="最近一次模拟的传播曲线">
            <InfectionCurveChart data={chartData} height={320} />
          </Card>
        </motion.div>

        <motion.div variants={item} className="space-y-6">
          <Card title="R0 实时监测" subtitle="基本传染数变化趋势">
            <R0Chart
              data={[2.5, 2.4, 2.3, 2.1, 1.9, 1.7, 1.5, 1.3, 1.1, 0.9, 0.7, 0.5]}
              height={160}
              showThresholds={false}
            />
          </Card>

          <Card title="医疗资源占用" subtitle="当前重症床位使用率">
            <ResourceGauge value={0.65} />
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={item}>
          <Card
            title="最近任务"
            headerAction={
              <Link
                to="/tasks"
                className="text-cyan-400 text-sm hover:text-cyan-300 flex items-center gap-1"
              >
                查看全部
                <ChevronRight className="w-4 h-4" />
              </Link>
            }
          >
            <div className="space-y-3">
              {recentTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 bg-slate-900/30 rounded-lg hover:bg-slate-900/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                      <Zap className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{task.name}</p>
                      <p className="text-slate-400 text-xs">
                        创建于 {task.createdAt.toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item}>
          <Card
            title="最新预警"
            headerAction={
              <Link
                to="/warnings"
                className="text-cyan-400 text-sm hover:text-cyan-300 flex items-center gap-1"
              >
                全部预警
                <ChevronRight className="w-4 h-4" />
              </Link>
            }
          >
            <div className="space-y-3">
              {recentWarnings.length > 0 ? (
                recentWarnings.map((warning) => (
                  <div
                    key={warning.id}
                    className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {warning.message}
                      </p>
                      <p className="text-slate-400 text-xs">
                        {warning.triggeredAt.toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <FileBarChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无预警记录</p>
                </div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
