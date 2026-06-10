import { ThresholdConfig, VirusParams, InterventionConfig, PopulationConfig, UserRole } from '../types';

export const TASK_STATUS_LABELS: Record<string, string> = {
  pending_validation: '待校验',
  model_building: '模型构建',
  initializing: '初始化',
  iterating: '传播迭代',
  strategy_optimizing: '策略优化',
  completed: '已完成',
  error: '异常',
  rollback: '异常回退',
};

export const TASK_STATUS_COLORS: Record<string, string> = {
  pending_validation: 'bg-yellow-500',
  model_building: 'bg-blue-500',
  initializing: 'bg-cyan-500',
  iterating: 'bg-green-500',
  strategy_optimizing: 'bg-purple-500',
  completed: 'bg-emerald-500',
  error: 'bg-red-500',
  rollback: 'bg-orange-500',
};

export const WARNING_LEVEL_LABELS: Record<string, string> = {
  low: '低级',
  medium: '中级',
  high: '高级',
  critical: '紧急',
};

export const WARNING_LEVEL_COLORS: Record<string, string> = {
  low: 'text-blue-400 bg-blue-500/20 border-blue-500/30',
  medium: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
  high: 'text-orange-400 bg-orange-500/20 border-orange-500/30',
  critical: 'text-red-400 bg-red-500/20 border-red-500/30',
};

export const WARNING_TYPE_LABELS: Record<string, string> = {
  r0_threshold: 'R0超阈值',
  resource_overflow: '医疗资源溢出',
  peak_anomaly: '峰值异常',
};

export const APPROVAL_STATUS_LABELS: Record<string, string> = {
  pending: '待审批',
  level1_approved: '一级审批通过',
  level2_approved: '二级审批通过',
  rejected: '已驳回',
  not_submitted: '未提交',
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: '系统管理员',
  epidemiologist: '流行病学家',
  approver: '审批人',
  commander: '指挥中心',
  chief_scientist: '首席科学家',
};

export const DEFAULT_THRESHOLDS: ThresholdConfig = {
  r0Warning: { low: 1.5, medium: 2.0, high: 3.0, critical: 4.0 },
  resourceUsage: { low: 0.6, medium: 0.75, high: 0.9, critical: 1.0 },
  peakDeviation: 0.2,
};

export const DEFAULT_VIRUS_PARAMS: VirusParams = {
  r0: 2.5,
  incubationPeriod: 5.2,
  infectiousPeriod: 7.0,
  severeRate: 0.15,
  mortalityRate: 0.02,
  recoveryRate: 0.14,
  transmissionProbability: 0.08,
  latentPeriod: 3.0,
};

export const DEFAULT_INTERVENTIONS: InterventionConfig = {
  isolation: {
    enabled: false,
    coverage: 0.7,
    complianceRate: 0.85,
    startTime: 10,
  },
  vaccination: {
    enabled: false,
    dailyCapacity: 50000,
    efficacy: 0.7,
    priorityGroups: ['elderly', 'medical'],
    startTime: 20,
  },
  travelRestriction: {
    enabled: false,
    restrictionLevel: 0.5,
    startTime: 15,
  },
  socialDistancing: {
    enabled: false,
    intensity: 0.4,
    startTime: 12,
  },
};

export const DEFAULT_POPULATION: PopulationConfig = {
  initialInfected: 100,
  ageDistribution: [0.15, 0.25, 0.3, 0.2, 0.1],
};

export const SIMULATION_DAYS = 180;
export const SIMULATION_ITERATIONS = 1;

export const CHART_COLORS = {
  susceptible: '#3B82F6',
  exposed: '#EAB308',
  infected: '#EF4444',
  recovered: '#10B981',
  deceased: '#6B7280',
  severe: '#F97316',
  r0: '#06B6D4',
  resource: '#8B5CF6',
};

export const NAV_MENU_ITEMS = [
  { path: '/dashboard', label: '工作台', icon: 'LayoutDashboard' },
  { path: '/tasks', label: '任务管理', icon: 'ListTodo' },
  { path: '/monitor', label: '实时监控', icon: 'Activity' },
  { path: '/warnings', label: '预警复核', icon: 'AlertTriangle' },
  { path: '/strategy', label: '策略优化', icon: 'Sparkles' },
  { path: '/reports', label: '报告中心', icon: 'FileBarChart' },
  { path: '/approvals', label: '审批中心', icon: 'CheckSquare' },
  { path: '/performance', label: '性能看板', icon: 'BarChart3' },
  { path: '/settings', label: '系统设置', icon: 'Settings' },
];
