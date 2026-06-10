import { NetworkData, SimulationTask, User, WarningRecord, DailyStats } from '../types';
import { v4 as uuidv4 } from 'uuid';

export const mockCities = [
  { id: 'beijing', name: '北京', population: 21890000, position: { lat: 39.9042, lng: 116.4074 }, medicalCapacity: 120000 },
  { id: 'shanghai', name: '上海', population: 24890000, position: { lat: 31.2304, lng: 121.4737 }, medicalCapacity: 150000 },
  { id: 'guangzhou', name: '广州', population: 18680000, position: { lat: 23.1291, lng: 113.2644 }, medicalCapacity: 95000 },
  { id: 'shenzhen', name: '深圳', population: 17560000, position: { lat: 22.5431, lng: 114.0579 }, medicalCapacity: 85000 },
  { id: 'chengdu', name: '成都', population: 20940000, position: { lat: 30.5728, lng: 104.0668 }, medicalCapacity: 100000 },
  { id: 'hangzhou', name: '杭州', population: 12200000, position: { lat: 30.2741, lng: 120.1551 }, medicalCapacity: 70000 },
  { id: 'wuhan', name: '武汉', population: 13650000, position: { lat: 30.5928, lng: 114.3055 }, medicalCapacity: 78000 },
  { id: 'xian', name: '西安', population: 12950000, position: { lat: 34.3416, lng: 108.9398 }, medicalCapacity: 65000 },
];

export const mockFlowEdges = [
  { from: 'beijing', to: 'shanghai', flowRate: 50000, transportMode: 'air' },
  { from: 'beijing', to: 'guangzhou', flowRate: 35000, transportMode: 'air' },
  { from: 'beijing', to: 'chengdu', flowRate: 25000, transportMode: 'air' },
  { from: 'shanghai', to: 'hangzhou', flowRate: 80000, transportMode: 'rail' },
  { from: 'shanghai', to: 'shenzhen', flowRate: 40000, transportMode: 'air' },
  { from: 'guangzhou', to: 'shenzhen', flowRate: 120000, transportMode: 'rail' },
  { from: 'guangzhou', to: 'chengdu', flowRate: 20000, transportMode: 'air' },
  { from: 'chengdu', to: 'wuhan', flowRate: 30000, transportMode: 'rail' },
  { from: 'chengdu', to: 'xian', flowRate: 25000, transportMode: 'rail' },
  { from: 'wuhan', to: 'shanghai', flowRate: 45000, transportMode: 'rail' },
  { from: 'xian', to: 'beijing', flowRate: 35000, transportMode: 'air' },
  { from: 'hangzhou', to: 'guangzhou', flowRate: 28000, transportMode: 'air' },
];

export const mockNetworkData: NetworkData = {
  cities: mockCities,
  edges: mockFlowEdges,
  totalPopulation: mockCities.reduce((sum, c) => sum + c.population, 0),
};

export const mockUsers: User[] = [
  { id: 'user1', name: '张博士', role: 'epidemiologist', email: 'zhang@cdc.gov.cn', avatar: '' },
  { id: 'user2', name: '李主任', role: 'approver', email: 'li@cdc.gov.cn', avatar: '' },
  { id: 'user3', name: '王指挥', role: 'commander', email: 'wang@cdc.gov.cn', avatar: '' },
  { id: 'user4', name: '陈首席', role: 'chief_scientist', email: 'chen@cdc.gov.cn', avatar: '' },
  { id: 'admin', name: '系统管理员', role: 'admin', email: 'admin@cdc.gov.cn', avatar: '' },
];

export const mockWarnings: WarningRecord[] = [
  {
    id: 'warn1',
    taskId: 'task1',
    level: 'high',
    type: 'r0_threshold',
    message: 'R0值达到 3.2，超过高级预警阈值',
    value: 3.2,
    threshold: 3.0,
    triggeredAt: new Date(Date.now() - 3600000),
    iteration: 45,
    reviewed: false,
  },
  {
    id: 'warn2',
    taskId: 'task1',
    level: 'medium',
    type: 'resource_overflow',
    message: '医疗资源占用率达到 78.5%，超过中级预警阈值',
    value: 0.785,
    threshold: 0.75,
    triggeredAt: new Date(Date.now() - 7200000),
    iteration: 60,
    reviewed: true,
    reviewedBy: 'user1',
    reviewedAt: new Date(Date.now() - 5400000),
    reviewResult: 'approved',
    reviewComment: '确认为正常波动，建议持续监控',
  },
];

export function generateMockTasks(): SimulationTask[] {
  return [
    {
      id: 'task1',
      name: '新冠病毒春季传播模拟 - 华南地区',
      description: '基于2026年春季人口流动数据的新冠病毒传播预测，评估开学季影响',
      status: 'iterating',
      createdBy: 'user1',
      createdAt: new Date(Date.now() - 86400000 * 2),
      updatedAt: new Date(Date.now() - 3600000),
      params: {
        r0: 2.8,
        incubationPeriod: 5.2,
        infectiousPeriod: 7.0,
        severeRate: 0.12,
        mortalityRate: 0.015,
        recoveryRate: 0.14,
        transmissionProbability: 0.08,
        latentPeriod: 3.0,
      },
      networkData: mockNetworkData,
      interventions: {
        isolation: { enabled: true, coverage: 0.6, complianceRate: 0.85, startTime: 10 },
        vaccination: { enabled: true, dailyCapacity: 80000, efficacy: 0.7, priorityGroups: ['elderly', 'medical'], startTime: 20 },
        travelRestriction: { enabled: false, restrictionLevel: 0, startTime: 0 },
        socialDistancing: { enabled: true, intensity: 0.3, startTime: 7 },
      },
      population: {
        initialInfected: 500,
        ageDistribution: [0.15, 0.25, 0.3, 0.2, 0.1],
      },
      warnings: mockWarnings,
      adjustmentLogs: [],
      approvalStatus: 'not_submitted',
      approvalHistory: [],
      iterations: 1,
      currentIteration: 75,
      totalDays: 180,
    },
    {
      id: 'task2',
      name: '流感病毒年度流行预测',
      description: '2026年度季节性流感传播预测与疫苗效果评估',
      status: 'completed',
      createdBy: 'user1',
      createdAt: new Date(Date.now() - 86400000 * 7),
      updatedAt: new Date(Date.now() - 86400000 * 3),
      params: {
        r0: 1.8,
        incubationPeriod: 2.5,
        infectiousPeriod: 5.0,
        severeRate: 0.05,
        mortalityRate: 0.005,
        recoveryRate: 0.2,
        transmissionProbability: 0.05,
        latentPeriod: 1.5,
      },
      networkData: mockNetworkData,
      interventions: {
        isolation: { enabled: false, coverage: 0, complianceRate: 0, startTime: 0 },
        vaccination: { enabled: true, dailyCapacity: 100000, efficacy: 0.6, priorityGroups: ['elderly', 'children'], startTime: 0 },
        travelRestriction: { enabled: false, restrictionLevel: 0, startTime: 0 },
        socialDistancing: { enabled: false, intensity: 0, startTime: 0 },
      },
      population: {
        initialInfected: 1000,
        ageDistribution: [0.15, 0.25, 0.3, 0.2, 0.1],
      },
      warnings: [],
      adjustmentLogs: [],
      approvalStatus: 'level2_approved',
      approvalHistory: [
        { id: 'appr1', taskId: 'task2', level: 1, status: 'approved', approver: 'user2', comment: '数据合理，建议通过', approvedAt: new Date(Date.now() - 86400000 * 5) },
        { id: 'appr2', taskId: 'task2', level: 2, status: 'approved', approver: 'user4', comment: '模型参数设置合理，结果可信', approvedAt: new Date(Date.now() - 86400000 * 4) },
      ],
      iterations: 1,
      currentIteration: 180,
      totalDays: 180,
      results: {
        timeSeries: generateMockTimeSeries(180, 1.8),
        cityData: [],
        peakInfection: 850000,
        peakTime: 45,
        totalInfected: 15000000,
        totalRecovered: 14850000,
        totalDeaths: 75000,
        r0Evolution: Array(180).fill(0).map((_, i) => 1.8 * (1 - i / 360)),
        medicalResourceUsage: Array(180).fill(0).map((_, i) => 0.3 + Math.sin(i / 20) * 0.15),
      },
    },
    {
      id: 'task3',
      name: '新型病毒输入风险评估',
      description: '评估新型变异病毒从境外输入后的传播风险与防控策略',
      status: 'pending_validation',
      createdBy: 'user1',
      createdAt: new Date(Date.now() - 3600000 * 3),
      updatedAt: new Date(Date.now() - 3600000 * 2),
      params: {
        r0: 3.5,
        incubationPeriod: 4.0,
        infectiousPeriod: 8.0,
        severeRate: 0.18,
        mortalityRate: 0.03,
        recoveryRate: 0.125,
        transmissionProbability: 0.1,
        latentPeriod: 2.5,
      },
      networkData: mockNetworkData,
      interventions: {
        isolation: { enabled: true, coverage: 0.8, complianceRate: 0.9, startTime: 5 },
        vaccination: { enabled: false, dailyCapacity: 0, efficacy: 0, priorityGroups: [], startTime: 0 },
        travelRestriction: { enabled: true, restrictionLevel: 0.8, startTime: 0 },
        socialDistancing: { enabled: true, intensity: 0.6, startTime: 3 },
      },
      population: {
        initialInfected: 50,
        ageDistribution: [0.15, 0.25, 0.3, 0.2, 0.1],
      },
      warnings: [],
      adjustmentLogs: [],
      approvalStatus: 'not_submitted',
      approvalHistory: [],
      iterations: 1,
      currentIteration: 0,
      totalDays: 180,
    },
    {
      id: 'task4',
      name: '国庆假期传播风险模拟',
      description: '国庆黄金周大规模人口流动下的病毒传播风险评估',
      status: 'strategy_optimizing',
      createdBy: 'user1',
      createdAt: new Date(Date.now() - 86400000 * 3),
      updatedAt: new Date(Date.now() - 86400000),
      params: {
        r0: 2.5,
        incubationPeriod: 5.0,
        infectiousPeriod: 6.5,
        severeRate: 0.1,
        mortalityRate: 0.01,
        recoveryRate: 0.15,
        transmissionProbability: 0.07,
        latentPeriod: 3.0,
      },
      networkData: mockNetworkData,
      interventions: {
        isolation: { enabled: true, coverage: 0.5, complianceRate: 0.8, startTime: 10 },
        vaccination: { enabled: true, dailyCapacity: 60000, efficacy: 0.65, priorityGroups: ['elderly'], startTime: 15 },
        travelRestriction: { enabled: false, restrictionLevel: 0, startTime: 0 },
        socialDistancing: { enabled: false, intensity: 0, startTime: 0 },
      },
      population: {
        initialInfected: 200,
        ageDistribution: [0.15, 0.25, 0.3, 0.2, 0.1],
      },
      warnings: [],
      adjustmentLogs: [],
      approvalStatus: 'not_submitted',
      approvalHistory: [],
      iterations: 1,
      currentIteration: 180,
      totalDays: 180,
    },
    {
      id: 'task5',
      name: '医疗资源压力测试',
      description: '极端情况下医疗资源承载能力压力测试',
      status: 'error',
      createdBy: 'user1',
      createdAt: new Date(Date.now() - 86400000 * 5),
      updatedAt: new Date(Date.now() - 86400000 * 4),
      params: {
        r0: 4.0,
        incubationPeriod: 3.5,
        infectiousPeriod: 9.0,
        severeRate: 0.25,
        mortalityRate: 0.05,
        recoveryRate: 0.11,
        transmissionProbability: 0.12,
        latentPeriod: 2.0,
      },
      networkData: mockNetworkData,
      interventions: {
        isolation: { enabled: false, coverage: 0, complianceRate: 0, startTime: 0 },
        vaccination: { enabled: false, dailyCapacity: 0, efficacy: 0, priorityGroups: [], startTime: 0 },
        travelRestriction: { enabled: false, restrictionLevel: 0, startTime: 0 },
        socialDistancing: { enabled: false, intensity: 0, startTime: 0 },
      },
      population: {
        initialInfected: 5000,
        ageDistribution: [0.15, 0.25, 0.3, 0.2, 0.1],
      },
      warnings: [],
      adjustmentLogs: [],
      approvalStatus: 'not_submitted',
      approvalHistory: [],
      iterations: 1,
      currentIteration: 30,
      totalDays: 180,
    },
  ];
}

function generateMockTimeSeries(days: number, baseR0: number) {
  const series = [];
  let susceptible = 140000000;
  let exposed = 5000;
  let infected = 2000;
  let recovered = 0;
  let deceased = 0;
  let severe = 200;

  for (let day = 0; day <= days; day++) {
    const r0 = baseR0 * (1 - recovered / 140000000);
    const resourceUsage = severe / 600000;

    series.push({
      day,
      susceptible: Math.round(susceptible),
      exposed: Math.round(exposed),
      infected: Math.round(infected),
      recovered: Math.round(recovered),
      deceased: Math.round(deceased),
      severe: Math.round(severe),
      r0,
      resourceUsage,
    });

    const beta = r0 * 0.14;
    const newInfected = beta * infected * susceptible / 140000000;
    const newRecovered = infected * 0.14;
    const newSevere = infected * 0.1 - severe * 0.1;
    const newDeaths = severe * 0.02;

    susceptible -= newInfected;
    exposed += newInfected * 0.5;
    infected += newInfected * 0.5 - newRecovered;
    recovered += newRecovered * 0.9;
    severe += newSevere;
    deceased += newDeaths;

    susceptible = Math.max(0, susceptible);
    exposed = Math.max(0, exposed);
    infected = Math.max(0, infected);
    recovered = Math.max(0, recovered);
    deceased = Math.max(0, deceased);
    severe = Math.max(0, severe);
  }

  return series;
}

export const mockDailyStats: DailyStats[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (29 - i));
  return {
    date: date.toISOString().split('T')[0],
    tasksCompleted: 5 + Math.floor(Math.random() * 8),
    tasksTotal: 8 + Math.floor(Math.random() * 6),
    completionRate: 0.6 + Math.random() * 0.35,
    warningsTriggered: 2 + Math.floor(Math.random() * 10),
    averageWarningLeadTime: 2 + Math.random() * 5,
    optimizationsPerformed: 1 + Math.floor(Math.random() * 4),
    peakDeviations: Array(3).fill(0).map(() => 0.05 + Math.random() * 0.2),
  };
});
