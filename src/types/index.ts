export type TaskStatus =
  | 'pending_validation'
  | 'model_building'
  | 'initializing'
  | 'iterating'
  | 'strategy_optimizing'
  | 'completed'
  | 'error'
  | 'rollback';

export type ApprovalStatus = 'pending' | 'level1_approved' | 'level2_approved' | 'rejected' | 'not_submitted';

export type WarningLevel = 'low' | 'medium' | 'high' | 'critical';
export type WarningType = 'r0_threshold' | 'resource_overflow' | 'peak_anomaly';

export type UserRole = 'admin' | 'epidemiologist' | 'approver' | 'commander' | 'chief_scientist';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string;
}

export interface VirusParams {
  r0: number;
  incubationPeriod: number;
  infectiousPeriod: number;
  severeRate: number;
  mortalityRate: number;
  recoveryRate: number;
  transmissionProbability: number;
  latentPeriod: number;
}

export interface City {
  id: string;
  name: string;
  population: number;
  position: { lat: number; lng: number };
  medicalCapacity: number;
}

export interface FlowEdge {
  from: string;
  to: string;
  flowRate: number;
  transportMode: string;
}

export interface NetworkData {
  cities: City[];
  edges: FlowEdge[];
  totalPopulation: number;
}

export interface IsolationConfig {
  enabled: boolean;
  coverage: number;
  complianceRate: number;
  startTime: number;
}

export interface VaccinationConfig {
  enabled: boolean;
  dailyCapacity: number;
  efficacy: number;
  priorityGroups: string[];
  startTime: number;
}

export interface TravelRestrictionConfig {
  enabled: boolean;
  restrictionLevel: number;
  startTime: number;
}

export interface SocialDistancingConfig {
  enabled: boolean;
  intensity: number;
  startTime: number;
}

export interface InterventionConfig {
  isolation: IsolationConfig;
  vaccination: VaccinationConfig;
  travelRestriction: TravelRestrictionConfig;
  socialDistancing: SocialDistancingConfig;
}

export interface PopulationConfig {
  initialInfected: number;
  ageDistribution: number[];
}

export interface TimePoint {
  day: number;
  susceptible: number;
  exposed: number;
  infected: number;
  recovered: number;
  deceased: number;
  severe: number;
  r0: number;
  resourceUsage: number;
}

export interface CityResult {
  cityId: string;
  cityName: string;
  peakInfection: number;
  peakTime: number;
  totalInfected: number;
  timeSeries: TimePoint[];
}

export interface InterventionEffect {
  reductionInPeak: number;
  reductionInTotal: number;
  delayInPeak: number;
  costEstimate: number;
}

export interface SimulationResult {
  timeSeries: TimePoint[];
  cityData: CityResult[];
  peakInfection: number;
  peakTime: number;
  totalInfected: number;
  totalRecovered: number;
  totalDeaths: number;
  r0Evolution: number[];
  medicalResourceUsage: number[];
  interventionEffect?: InterventionEffect;
}

export interface WarningRecord {
  id: string;
  taskId: string;
  level: WarningLevel;
  type: WarningType;
  message: string;
  value: number;
  threshold: number;
  triggeredAt: Date;
  iteration: number;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewResult?: 'approved' | 'rejected';
  reviewComment?: string;
}

export interface AdjustmentLog {
  id: string;
  taskId: string;
  timestamp: Date;
  adjustedBy: string;
  adjustmentType: string;
  oldValue: string;
  newValue: string;
  reason: string;
}

export interface ApprovalRecord {
  id: string;
  taskId: string;
  level: 1 | 2;
  status: 'pending' | 'approved' | 'rejected';
  approver: string;
  comment: string;
  approvedAt?: Date;
  pushedToCommandCenter?: boolean;
  pushedAt?: Date;
}

export interface StrategyRecommendation {
  id: string;
  name: string;
  description: string;
  interventions: InterventionConfig;
  predictedEffect: {
    peakReduction: number;
    totalReduction: number;
    costScore: number;
    overallScore: number;
  };
  isRecommended: boolean;
}

export interface SimulationTask {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  params: VirusParams;
  networkData: NetworkData;
  interventions: InterventionConfig;
  population: PopulationConfig;
  results?: SimulationResult;
  warnings: WarningRecord[];
  adjustmentLogs: AdjustmentLog[];
  approvalStatus: ApprovalStatus;
  approvalHistory: ApprovalRecord[];
  peakDeviation?: number;
  iterations: number;
  currentIteration: number;
  totalDays: number;
}

export interface ThresholdConfig {
  r0Warning: { low: number; medium: number; high: number; critical: number };
  resourceUsage: { low: number; medium: number; high: number; critical: number };
  peakDeviation: number;
}

export interface DailyStats {
  date: string;
  tasksCompleted: number;
  tasksTotal: number;
  completionRate: number;
  warningsTriggered: number;
  averageWarningLeadTime: number;
  optimizationsPerformed: number;
  peakDeviations: number[];
}

export interface SystemStatus {
  isPaused: boolean;
  pauseReason?: string;
  consecutivePeakDeviations: number;
  lastPeakDeviation?: number;
  peakDeviationHistory: number[];
}
