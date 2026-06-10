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
import {
  saveTasks,
  loadTasks,
  saveWarnings,
  loadWarnings,
  saveSystemStatus,
  loadSystemStatus,
} from '../db';

interface TaskStore {
  tasks: SimulationTask[];
  currentTask: SimulationTask | null;
  isLoading: boolean;
  error: string | null;
  baselinePeaks: Record<string, number>;

  fetchTasks: () => Promise<void>;
  getTask: (id: string) => SimulationTask | undefined;
  createTask: (data: Partial<SimulationTask>) => SimulationTask | null;
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

  persist: () => void;
}

interface WarningStore {
  warnings: WarningRecord[];
  unreadCount: number;

  fetchWarnings: (taskId?: string) => Promise<void>;
  addWarnings: (warnings: WarningRecord[]) => void;
  reviewWarning: (warningId: string, result: 'approved' | 'rejected', comment: string, reviewer: string) => void;
  markAsRead: (warningId: string) => void;
  markAllAsRead: () => void;
  persist: () => void;
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
  persist: () => void;
}

const _persistAll = () => {
  try {
    const taskState = useTaskStore.getState();
    const warnState = useWarningStore.getState();
    const sysState = useSystemStore.getState();
    saveTasks(taskState.tasks);
    saveWarnings(warnState.warnings);
    saveSystemStatus(sysState.systemStatus, taskState.baselinePeaks);
  } catch (e) {
    console.error('persist error:', e);
  }
};

const withPersist = <T extends (...args: any[]) => any>(fn: T) =>
  ((...args: Parameters<T>) => {
    const r = fn(...args);
    setTimeout(_persistAll, 0);
    return r;
  }) as T;

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  currentTask: null,
  isLoading: false,
  error: null,
  strategies: [],
  baselinePeaks: {},

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      let tasks = await loadTasks();
      if (tasks.length === 0) {
        tasks = generateMockTasks();
        await saveTasks(tasks);
      }
      set({ tasks, isLoading: false });
    } catch (e) {
      const tasks = generateMockTasks();
      set({ tasks, isLoading: false });
    }
  },

  getTask: (id: string) => {
    return get().tasks.find(t => t.id === id);
  },

  createTask: withPersist((data) => {
    if (useSystemStore.getState().systemStatus.isPaused) {
      useSystemStore.getState().showNotification('error', '系统已暂停，无法创建新任务');
      return null;
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
  }),

  updateTask: withPersist((id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: new Date() } : t
      ),
      currentTask: state.currentTask?.id === id
        ? { ...state.currentTask, ...updates, updatedAt: new Date() }
        : state.currentTask,
    }));
  }),

  deleteTask: withPersist((id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      currentTask: state.currentTask?.id === id ? null : state.currentTask,
      baselinePeaks: Object.fromEntries(Object.entries(state.baselinePeaks).filter(([k]) => k !== id)),
    }));
  }),

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

  pauseSimulation: withPersist((taskId) => {
    get().updateTask(taskId, { status: 'model_building' });
  }),

  rollbackTask: withPersist((taskId, reason) => {
    get().updateTask(taskId, { status: 'rollback' });
  }),

  submitForApproval: withPersist((taskId) => {
    get().updateTask(taskId, { approvalStatus: 'pending' });
  }),

  approveTask: withPersist((taskId, level, approver, comment) => {
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
      currentTask: state.currentTask?.id === taskId
        ? {
            ...state.currentTask,
            approvalStatus: newStatus,
            approvalHistory: [...state.currentTask.approvalHistory, approvalRecord],
          }
        : state.currentTask,
    }));
  }),

  rejectTask: withPersist((taskId, level, approver, comment) => {
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
      currentTask: state.currentTask?.id === taskId
        ? {
            ...state.currentTask,
            status: 'completed',
            approvalStatus: 'rejected',
            approvalHistory: [...state.currentTask.approvalHistory, approvalRecord],
          }
        : state.currentTask,
    }));
  }),

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

  applyWarningStrategy: withPersist((taskId, warningId, strategy) => {
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
  }),

  persist: _persistAll,
}));

export const useWarningStore = create<WarningStore>((set, get) => ({
  warnings: [],
  unreadCount: 0,

  fetchWarnings: async (taskId) => {
    let allWarnings = await loadWarnings();
    if (allWarnings.length === 0) {
      allWarnings = useTaskStore.getState().tasks.flatMap((t) => t.warnings);
      if (allWarnings.length > 0) await saveWarnings(allWarnings);
    }
    set({
      warnings: taskId ? allWarnings.filter((w) => w.taskId === taskId) : allWarnings,
      unreadCount: allWarnings.filter((w) => !w.reviewed).length,
    });
  },

  addWarnings: withPersist((newWarnings: WarningRecord[]) => {
    set((state) => ({
      warnings: [...state.warnings, ...newWarnings],
      unreadCount: state.unreadCount + newWarnings.filter((w) => !w.reviewed).length,
    }));
  }),

  reviewWarning: withPersist((warningId, result, comment, reviewer) => {
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

      const updatedWarning = updatedWarnings.find(w => w.id === warningId);
      if (updatedWarning) {
        const taskStore = useTaskStore.getState();
        const task = taskStore.tasks.find(t => t.warnings.some(w => w.id === warningId));
        if (task) {
          const updatedTaskWarnings = task.warnings.map(w =>
            w.id === warningId ? updatedWarning : w
          );
          taskStore.updateTask(task.id, { warnings: updatedTaskWarnings });
        }
      }

      return {
        warnings: updatedWarnings,
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  }),

  markAsRead: withPersist((warningId) => {
    set((state) => ({
      warnings: state.warnings.map((w) =>
        w.id === warningId ? { ...w, reviewed: true } : w
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
  }),

  markAllAsRead: withPersist(() => {
    set((state) => ({
      warnings: state.warnings.map((w) => ({ ...w, reviewed: true })),
      unreadCount: 0,
    }));
  }),

  persist: _persistAll,
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

  pauseSystem: withPersist((reason) => {
    set((state) => ({
      systemStatus: { ...state.systemStatus, isPaused: true, pauseReason: reason },
    }));
  }),

  resumeSystem: withPersist(() => {
    set((state) => ({
      systemStatus: { ...state.systemStatus, isPaused: false, pauseReason: undefined, consecutivePeakDeviations: 0, peakDeviationHistory: [], lastPeakDeviation: undefined },
    }));
    const taskState = useTaskStore.getState();
    taskState.baselinePeaks = {};
  }),

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

    const peak = task.results.peakInfection;
    const baselinePeaks = useTaskStore.getState().baselinePeaks;
    let baseline: number;

    if (baselinePeaks[taskId]) {
      baseline = baselinePeaks[taskId];
    } else {
      baseline = peak;
      useTaskStore.setState((state) => ({
        baselinePeaks: { ...state.baselinePeaks, [taskId]: peak },
      }));
      setTimeout(() => _persistAll(), 0);
    }

    const deviation = baseline > 0 ? Math.abs(peak - baseline) / baseline : 0;
    const threshold = get().thresholds.peakDeviation;

    if (deviation >= threshold) {
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
        get().pauseSystem(
          `连续三次峰值偏差超过${(threshold * 100).toFixed(0)}%阈值（最近偏差:${(deviation * 100).toFixed(1)}%），系统已自动暂停新任务受理，请联系首席科学家处理`
        );
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
      setTimeout(() => _persistAll(), 0);
    } else {
      if (get().systemStatus.consecutivePeakDeviations > 0) {
        set((state) => ({
          systemStatus: {
            ...state.systemStatus,
            consecutivePeakDeviations: 0,
            peakDeviationHistory: [],
            lastPeakDeviation: undefined,
          },
        }));
        setTimeout(() => _persistAll(), 0);
      }
    }
  },

  persist: _persistAll,
}));

export const initializeStores = async () => {
  const { status, baselinePeaks } = await loadSystemStatus();
  useSystemStore.setState({ systemStatus: status });
  useTaskStore.setState({ baselinePeaks });
  await useTaskStore.getState().fetchTasks();
  await useWarningStore.getState().fetchWarnings();
};
