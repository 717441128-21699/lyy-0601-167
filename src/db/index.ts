import Dexie, { Table } from 'dexie';
import { SimulationTask, WarningRecord, SystemStatus, PeakDeviationRecord } from '../types';

export interface PersistedSystemStatus extends Omit<SystemStatus, 'peakDeviationHistory'> {
  baselinePeaks: Record<string, number>;
  lastPeakDeviation?: number;
  peakDeviationHistory: PeakDeviationRecord[];
}

class EpisimDatabase extends Dexie {
  tasks!: Table<SimulationTask, string>;
  warnings!: Table<WarningRecord, string>;
  systemStatus!: Table<PersistedSystemStatus, string>;

  constructor() {
    super('episim-db');
    this.version(1).stores({
      tasks: 'id, status, approvalStatus, createdAt, updatedAt',
      warnings: 'id, taskId, level, reviewed',
      systemStatus: 'isPaused',
    });
  }
}

export const db = new EpisimDatabase();

export const saveTasks = async (tasks: SimulationTask[]) => {
  try {
    await db.tasks.clear();
    if (tasks.length > 0) {
      await db.tasks.bulkPut(tasks);
    }
  } catch (e) {
    console.error('saveTasks error:', e);
  }
};

export const loadTasks = async (): Promise<SimulationTask[]> => {
  try {
    const tasks = await db.tasks.toArray();
    return tasks.map((t) => ({
      ...t,
      createdAt: new Date(t.createdAt),
      updatedAt: new Date(t.updatedAt),
      warnings: (t.warnings || []).map((w) => ({
        ...w,
        triggeredAt: new Date(w.triggeredAt),
        reviewedAt: w.reviewedAt ? new Date(w.reviewedAt) : undefined,
      })),
      adjustmentLogs: (t.adjustmentLogs || []).map((l) => ({
        ...l,
        timestamp: new Date(l.timestamp),
      })),
      approvalHistory: (t.approvalHistory || []).map((a) => ({
        ...a,
        approvedAt: a.approvedAt ? new Date(a.approvedAt) : undefined,
        pushedAt: a.pushedAt ? new Date(a.pushedAt) : undefined,
      })),
    }));
  } catch (e) {
    console.error('loadTasks error:', e);
    return [];
  }
};

export const saveWarnings = async (warnings: WarningRecord[]) => {
  try {
    await db.warnings.clear();
    if (warnings.length > 0) {
      const serialized = warnings.map((w) => ({
        ...w,
        triggeredAt: new Date(w.triggeredAt),
        reviewedAt: w.reviewedAt ? new Date(w.reviewedAt) : undefined,
      }));
      await db.warnings.bulkPut(serialized);
    }
  } catch (e) {
    console.error('saveWarnings error:', e);
  }
};

export const loadWarnings = async (): Promise<WarningRecord[]> => {
  try {
    const ws = await db.warnings.toArray();
    return ws.map((w) => ({
      ...w,
      triggeredAt: new Date(w.triggeredAt),
      reviewedAt: w.reviewedAt ? new Date(w.reviewedAt) : undefined,
    }));
  } catch (e) {
    console.error('loadWarnings error:', e);
    return [];
  }
};

const SYSTEM_STATUS_KEY = 'global';

export const saveSystemStatus = async (status: SystemStatus, baselinePeaks: Record<string, number>) => {
  try {
    const persisted: PersistedSystemStatus = {
      isPaused: status.isPaused,
      pauseReason: status.pauseReason,
      consecutivePeakDeviations: status.consecutivePeakDeviations,
      lastPeakDeviation: status.lastPeakDeviation,
      peakDeviationHistory: status.peakDeviationHistory.map(r => ({
        ...r,
        timestamp: new Date(r.timestamp),
      })),
      baselinePeaks,
    };
    await db.systemStatus.put(persisted, SYSTEM_STATUS_KEY);
  } catch (e) {
    console.error('saveSystemStatus error:', e);
  }
};

export const loadSystemStatus = async (): Promise<{ status: SystemStatus; baselinePeaks: Record<string, number> }> => {
  try {
    const row = await db.systemStatus.get(SYSTEM_STATUS_KEY);
    if (row) {
      const { baselinePeaks, ...rest } = row;
      const status: SystemStatus = {
        ...rest,
        peakDeviationHistory: (rest.peakDeviationHistory || []).map((r: PeakDeviationRecord) => ({
          ...r,
          timestamp: new Date(r.timestamp),
        })),
      };
      return { status, baselinePeaks };
    }
  } catch (e) {
    console.error('loadSystemStatus error:', e);
  }
  return {
    status: {
      isPaused: false,
      consecutivePeakDeviations: 0,
      peakDeviationHistory: [],
    },
    baselinePeaks: {},
  };
};
