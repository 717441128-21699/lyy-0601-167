import { create } from 'zustand';
import {
  SimulationTask,
  TaskStatus,
  WarningRecord,
  User,
  ThresholdConfig,
  DailyStats,
  SystemStatus,
  StrategyRecommendation,
  AdjustmentLog,
} from '../types';
import { generateMockTasks, mockUsers, mockDailyStats, mockNetworkData } from '../data/mockData';
import { DEFAULT_THRESHOLDS, DEFAULT_VIRUS_PARAMS, DEFAULT_INTERVENTIONS, DEFAULT_POPULATION } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { runSimulation } from '../engine/SEIR';
import { WarningDetector } from '../engine/warning';
import { generateStrategyRecommendations } from '../engine/strategy';

interface TaskStore {
  tasks: SimulationTask[];
  currentTask: SimulationTask | null;
  isLoading: boolean;
  error: string | null;

  fetchTasks: () => void;
  getTask: (id: string) => SimulationTask | undefined;
  createTask: (data: Partial<SimulationTask>) => SimulationTask;
  updateTask: (id: string, updates: Partial<SimulationTask>) => void;
  deleteTask: (id: string) => void;
  setCurrentTask: (task: SimulationTask | null) => void;

  startSimulation: (taskId: string) => void;
  pauseSimulation: (taskId: string) => void;
  rollbackTask: (taskId: string, reason: string) => void;
  runSimulationIteration: (taskId: string) => void;
  finishSimulation: (taskId: string) => void;

  submitForApproval: (taskId: string) => void;
  approveTask: (taskId: string, level: 1 | 2, approver: string, comment: string) => void;
  rejectTask: (taskId: string, level: 1 | 2, approver: string, comment: string) => void;

  strategies: StrategyRecommendation[];
  generateStrategies: (taskId: string) => void;
  applyWarningStrategy: (taskId: string, warningId: string, strategy: Record<string, unknown>) => void;
}

interface WarningStore {
  warnings: WarningRecord[];
  unreadCount: number;

  fetchWarnings: (taskId?: string) => void;
  addWarnings: (warnings: WarningRecord[]) => void;
  reviewWarning: (warningId: string, result: 'approved' | 'rejected', comment: string, reviewer: string) => void;
  markAsRead: (warningId: string) => void;
  markAllAsRead: () => void;
}

interface UserStore {
  currentUser: User | null;
  users: User[];
  isAuthenticated: boolean;

  login: (email: string, password: string) => boolean;
  logout: () => void;
  fetchUsers: () => void;
}

interface SystemStore {
  thresholds: ThresholdConfig;
  dailyStats: DailyStats[];
  systemStatus: SystemStatus;
  notification: { type: 'success' | 'error' | 'warning' | 'info'; message: string } | null;

  updateThresholds: (thresholds: Partial<ThresholdConfig>) => void;
  fetchDailyStats: () => void;
  pauseSystem: (reason: string) => void;
  resumeSystem: () => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  hideNotification: () => void;
  checkPeakDeviation: (taskId: string) => void;
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  strategies: [],

  fetchTasks: () => {
    set({ isLoading: true });
    setTimeout(() => {
      const tasks = generateMockTasks();
      set({ tasks, isLoading: false });
    }, 300);
  },

  getTask: (id: string) => {
    return get().tasks.find(t => t.id === id);
  },

  createTask: (data) => {
    if (useSystemStore.getState().systemStatus.isPaused) {
      useSystemStore.getState().showNotification('error', '系统已暂停，无法创建新任务');
      return null as any;
    }

    const newTask: SimulationTask = {
      id: uuidv4(),
      name: data.name || '新模拟任务',
      description: data.description || '',
      status: 'pending_validation',
      createdBy: data.createdBy || 'user1',
      createdAt: new Date(),
      updatedAt: new Date(),
      params: data.params || DEFAULT_VIRUS_PARAMS,
      networkData: data.networkData || mockNetworkData,
      interventions: data.interventions || DEFAULT_INTERVENTIONS,
      population: data.population || DEFAULT_POPULATION,
      warnings: [],
      adjustmentLogs: [],
      approvalStatus: 'not_submitted',
      approvalHistory: [],
      iterations: 1,
      currentIteration: 0,
      totalDays: data.totalDays || 180,
    };

    set((state) => ({
      tasks: [...state.tasks, newTask],
    }));

    return newTask;
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
      ),
      currentTask: state.currentTask?.id === id
        ? { ...state.currentTask, ...updates, updatedAt: new Date() }
        : state.currentTask,
    }));
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      currentTask: state.currentTask?.id === id ? null : state.currentTask,
    }));
  },

  setCurrentTask: (task) => {
    set({ currentTask: task });
  },

  startSimulation: (taskId) => {
    if (useSystemStore.getState().systemStatus.isPaused) {
      useSystemStore.getState().showNotification('error', '系统已暂停，无法启动模拟');
      return;
    }

    const task = get().getTask(taskId);
    if (!task) return;

    get().updateTask(taskId, { status: 'model_building' });

    setTimeout(() => {
      get().updateTask(taskId, { status: 'initializing', currentIteration: 0 });

      setTimeout(() => {
        get().updateTask(taskId, { status: 'iterating' });
        get().runSimulationIteration(taskId);
      }, 800);
    }, 1000);
  },

  runSimulationIteration: (taskId) => {
    const task = get().getTask(taskId);
    if (!task) return;

    const detector = new WarningDetector(taskId, useSystemStore.getState().thresholds);
    let currentDay = 0;
    const totalDays = task.totalDays;

    const step = () => {
      const currentTask = get().getTask(taskId);
      if (!currentTask || currentTask.status !== 'iterating') return;

      const results = runSimulation(
        currentTask.params,
        currentTask.networkData,
        currentTask.interventions,
        currentTask.population,
        currentDay
      );

      if (currentDay > 0) {
        const latestPoint = results.timeSeries[results.timeSeries.length - 1];
        if (latestPoint) {
          const newWarnings = detector.checkTimePoint(latestPoint, currentDay);
          if (newWarnings.length > 0) {
            const updatedWarnings = [...currentTask.warnings, ...newWarnings];
            get().updateTask(taskId, { warnings: updatedWarnings });
            useWarningStore.getState().addWarnings(newWarnings);
          }
        }
      }

      get().updateTask(taskId, {
        currentIteration: currentDay,
        results,
      });

      currentDay += 3;

      if (currentDay <= totalDays) {
        setTimeout(step, 100);
      } else {
        get().finishSimulation(taskId);
      }
    };

    step();
  },

  finishSimulation: (taskId) => {
    const task = get().getTask(taskId);
    if (!task) return;

    get().updateTask(taskId, { status: 'strategy_optimizing' });

    setTimeout(() => {
      get().updateTask(taskId, { status: 'completed' });
      useSystemStore.getState().checkPeakDeviation(taskId);
    }, 1500);
  },

  pauseSimulation: (taskId) => {
    get().updateTask(taskId, { status: 'model_building' });
  },

  rollbackTask: (taskId, reason) => {
    get().updateTask(taskId, { status: 'rollback' });
  },

  submitForApproval: (taskId) => {
    get().updateTask(taskId, { approvalStatus: 'pending' });
  },

  approveTask: (taskId, level, approver, comment) => {
    const task = get().getTask(taskId);
    if (!task) return;

    const pushedToCommandCenter = level === 2;
    const pushedAt = level === 2 ? new Date() : undefined;

    const approvalRecord = {
      id: uuidv4(),
      taskId,
      level,
      status: 'approved' as const,
      approver,
      comment,
      approvedAt: new Date(),
      pushedToCommandCenter,
      pushedAt,
    };

    const newStatus = level === 2 ? 'level2_approved' : 'level1_approved';

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              approvalStatus: newStatus,
              approvalHistory: [...t.approvalHistory, approvalRecord],
            }
          : t
      ),
    }));
  },

  rejectTask: (taskId, level, approver, comment) => {
    const approvalRecord = {
      id: uuidv4(),
      taskId,
      level,
      status: 'rejected' as const,
      approver,
      comment,
      approvedAt: new Date(),
    };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: 'completed',
              approvalStatus: 'rejected',
              approvalHistory: [...t.approvalHistory, approvalRecord],
            }
          : t
      ),
    }));
  },

  generateStrategies: (taskId) => {
    const task = get().getTask(taskId);
    if (!task) return;

    const strategies = generateStrategyRecommendations(
      task.params,
      task.networkData,
      task.population,
      task.results
    );

    set({ strategies });
  },

  applyWarningStrategy: (taskId, warningId, strategy) => {
    const task = get().getTask(taskId);
    if (!task) return;

    const adjustmentLog: AdjustmentLog = {
      id: uuidv4(),
      taskId,
      timestamp: new Date(),
      adjustedBy: 'system',
      adjustmentType: '预警复核自动调整',
      oldValue: '',
      newValue: JSON.stringify(strategy),
      reason: '预警复核确认后自动生成防控方案',
    };

    const updatedInterventions = {
      ...task.interventions,
      isolation: {
        ...task.interventions.isolation,
        enabled: true,
        coverage: 0.8,
        complianceRate: 0.9,
        startTime: task.currentIteration,
      },
      vaccination: {
        ...task.interventions.vaccination,
        enabled: true,
        dailyCapacity: 100000,
        efficacy: 0.75,
        startTime: task.currentIteration + 5,
        priorityGroups: ['elderly', 'medical'],
      },
    };

    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              interventions: updatedInterventions,
              adjustmentLogs: [...t.adjustmentLogs, adjustmentLog],
              status: 'iterating' as TaskStatus,
              currentIteration: 0,
            }
          : t
      ),
      currentTask: state.currentTask?.id === taskId
        ? {
            ...state.currentTask,
            interventions: updatedInterventions,
            adjustmentLogs: [...state.currentTask.adjustmentLogs, adjustmentLog],
            status: 'iterating' as TaskStatus,
            currentIteration: 0,
          }
        : state.currentTask,
    }));

    get().startSimulation(taskId);
  },
}));

export const useWarningStore = create<WarningStore>((set, get) => ({
  warnings: [],
  unreadCount: 0,

  fetchWarnings: (taskId) => {
    const allWarnings = useTaskStore.getState().tasks.flatMap((t) => t.warnings);
    set({
      warnings: taskId ? allWarnings.filter((w) => w.taskId === taskId) : allWarnings,
      unreadCount: allWarnings.filter((w) => !w.reviewed).length,
    });
  },

  addWarnings: (newWarnings: WarningRecord[]) => {
    set((state) => ({
      warnings: [...state.warnings, ...newWarnings],
      unreadCount: state.unreadCount + newWarnings.filter((w) => !w.reviewed).length,
    }));
  },

  reviewWarning: (warningId, result, comment, reviewer) => {
    set((state) => {
      const updatedWarnings = state.warnings.map((w) =>
        w.id === warningId
          ? {
              ...w,
              reviewed: true,
              reviewedBy: reviewer,
              reviewedAt: new Date(),
              reviewResult: result,
              reviewComment: comment,
            }
          : w
      );

      return {
        warnings: updatedWarnings,
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  },

  markAsRead: (warningId) => {
    set((state) => ({
      warnings: state.warnings.map((w) =>
        w.id === warningId ? { ...w, reviewed: true } : w
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  },

  markAllAsRead: () => {
    set((state) => ({
      warnings: state.warnings.map((w) => ({ ...w, reviewed: true })),
      unreadCount: 0,
    }));
  },
}));

export const useUserStore = create<UserStore>((set) => ({
  currentUser: null,
  users: [],
  isAuthenticated: false,

  login: (email, password) => {
    const user = mockUsers.find((u) => u.email === email);
    if (user) {
      set({ currentUser: user, isAuthenticated: true });
      return true;
    }
    
    set({ currentUser: mockUsers[0], isAuthenticated: true });
    return true;
  },

  logout: () => {
    set({ currentUser: null, isAuthenticated: false });
  },

  fetchUsers: () => {
    set({ users: mockUsers });
  },
}));

export const useSystemStore = create<SystemStore>((set, get) => ({
  thresholds: DEFAULT_THRESHOLDS,
  dailyStats: [],
  systemStatus: {
    isPaused: false,
    consecutivePeakDeviations: 0,
    peakDeviationHistory: [],
  },
  notification: null,

  updateThresholds: (thresholds) => {
    set((state) => ({
      thresholds: { ...state.thresholds, ...thresholds },
    }));
  },

  fetchDailyStats: () => {
    set({ dailyStats: mockDailyStats });
  },

  pauseSystem: (reason) => {
    set((state) => ({
      systemStatus: { ...state.systemStatus, isPaused: true, pauseReason: reason },
    }));
  },

  resumeSystem: () => {
    set((state) => ({
      systemStatus: { ...state.systemStatus, isPaused: false, pauseReason: undefined, consecutivePeakDeviations: 0, peakDeviationHistory: [], lastPeakDeviation: undefined },
    }));
  },

  showNotification: (type, message) => {
    set({ notification: { type, message } });
    setTimeout(() => {
      set({ notification: null });
    }, 3000);
  },

  hideNotification: () => {
    set({ notification: null });
  },

  checkPeakDeviation: (taskId) => {
    const task = useTaskStore.getState().getTask(taskId);
    if (!task || !task.results) return;

    const baselinePeak = task.results.peakInfection * 0.85;
    const currentPeak = task.results.peakInfection;
    const deviation = Math.abs(currentPeak - baselinePeak) / baselinePeak;

    if (deviation >= get().thresholds.peakDeviation) {
      const newCount = get().systemStatus.consecutivePeakDeviations + 1;
      const newHistory = [...get().systemStatus.peakDeviationHistory, deviation];

      if (newCount >= 3) {
        set((state) => ({
          systemStatus: {
            ...state.systemStatus,
            consecutivePeakDeviations: newCount,
            peakDeviationHistory: newHistory,
            lastPeakDeviation: deviation,
          },
        }));
        get().pauseSystem('连续三次峰值偏差超过阈值，系统已自动暂停新任务受理');
        get().showNotification('error', '系统已暂停新任务，请联系首席科学家处理');
      } else {
        set((state) => ({
          systemStatus: {
            ...state.systemStatus,
            consecutivePeakDeviations: newCount,
            peakDeviationHistory: newHistory,
            lastPeakDeviation: deviation,
          },
        }));
      }
    }
  },
}));
