import { WarningRecord, WarningLevel, WarningType, ThresholdConfig, TimePoint } from '../../types';
import { v4 as uuidv4 } from 'uuid';

export class WarningDetector {
  private thresholds: ThresholdConfig;
  private warnings: WarningRecord[] = [];
  private taskId: string;

  constructor(taskId: string, thresholds: ThresholdConfig) {
    this.taskId = taskId;
    this.thresholds = thresholds;
  }

  checkTimePoint(timePoint: TimePoint, iteration: number): WarningRecord[] {
    const newWarnings: WarningRecord[] = [];

    const r0Warning = this.checkR0Threshold(timePoint.r0, timePoint.day, iteration);
    if (r0Warning) newWarnings.push(r0Warning);

    const resourceWarning = this.checkResourceThreshold(timePoint.resourceUsage, timePoint.day, iteration);
    if (resourceWarning) newWarnings.push(resourceWarning);

    newWarnings.forEach((w) => this.warnings.push(w));

    return newWarnings;
  }

  private checkR0Threshold(r0: number, day: number, iteration: number): WarningRecord | null {
    const { r0Warning } = this.thresholds;
    let level: WarningLevel | null = null;
    let threshold = 0;

    if (r0 >= r0Warning.critical) {
      level = 'critical';
      threshold = r0Warning.critical;
    } else if (r0 >= r0Warning.high) {
      level = 'high';
      threshold = r0Warning.high;
    } else if (r0 >= r0Warning.medium) {
      level = 'medium';
      threshold = r0Warning.medium;
    } else if (r0 >= r0Warning.low) {
      level = 'low';
      threshold = r0Warning.low;
    }

    if (!level) return null;

    const recentWarning = this.warnings.find(
      (w) => w.type === 'r0_threshold' && w.level === level && Math.abs(w.iteration - iteration) < 5
    );
    if (recentWarning) return null;

    return {
      id: uuidv4(),
      taskId: this.taskId,
      level,
      type: 'r0_threshold',
      message: `R0值达到 ${r0.toFixed(2)}，超过${this.getLevelLabel(level)}预警阈值`,
      value: r0,
      threshold,
      triggeredAt: new Date(),
      iteration,
      reviewed: false,
    };
  }

  private checkResourceThreshold(usage: number, day: number, iteration: number): WarningRecord | null {
    const { resourceUsage } = this.thresholds;
    let level: WarningLevel | null = null;
    let threshold = 0;

    if (usage >= resourceUsage.critical) {
      level = 'critical';
      threshold = resourceUsage.critical;
    } else if (usage >= resourceUsage.high) {
      level = 'high';
      threshold = resourceUsage.high;
    } else if (usage >= resourceUsage.medium) {
      level = 'medium';
      threshold = resourceUsage.medium;
    } else if (usage >= resourceUsage.low) {
      level = 'low';
      threshold = resourceUsage.low;
    }

    if (!level) return null;

    const recentWarning = this.warnings.find(
      (w) => w.type === 'resource_overflow' && w.level === level && Math.abs(w.iteration - iteration) < 5
    );
    if (recentWarning) return null;

    return {
      id: uuidv4(),
      taskId: this.taskId,
      level,
      type: 'resource_overflow',
      message: `医疗资源占用率达到 ${(usage * 100).toFixed(1)}%，超过${this.getLevelLabel(level)}预警阈值`,
      value: usage,
      threshold,
      triggeredAt: new Date(),
      iteration,
      reviewed: false,
    };
  }

  checkPeakAnomaly(currentPeak: number, baselinePeak: number, iteration: number): WarningRecord | null {
    const deviation = Math.abs(currentPeak - baselinePeak) / baselinePeak;

    if (deviation >= this.thresholds.peakDeviation) {
      const warning: WarningRecord = {
        id: uuidv4(),
        taskId: this.taskId,
        level: deviation > 0.3 ? 'high' : 'medium',
        type: 'peak_anomaly',
        message: `峰值偏差达到 ${(deviation * 100).toFixed(1)}%，超出正常范围`,
        value: deviation,
        threshold: this.thresholds.peakDeviation,
        triggeredAt: new Date(),
        iteration,
        reviewed: false,
      };
      this.warnings.push(warning);
      return warning;
    }

    return null;
  }

  getWarnings(): WarningRecord[] {
    return [...this.warnings];
  }

  getUnreviewedWarnings(): WarningRecord[] {
    return this.warnings.filter((w) => !w.reviewed);
  }

  private getLevelLabel(level: WarningLevel): string {
    const labels: Record<WarningLevel, string> = {
      low: '低级',
      medium: '中级',
      high: '高级',
      critical: '紧急',
    };
    return labels[level];
  }

  updateThresholds(thresholds: ThresholdConfig): void {
    this.thresholds = thresholds;
  }
}

export function detectWarnings(
  taskId: string,
  timeSeries: TimePoint[],
  thresholds: ThresholdConfig
): WarningRecord[] {
  const detector = new WarningDetector(taskId, thresholds);
  const warnings: WarningRecord[] = [];

  timeSeries.forEach((point, index) => {
    const newWarnings = detector.checkTimePoint(point, index);
    warnings.push(...newWarnings);
  });

  return warnings;
}
