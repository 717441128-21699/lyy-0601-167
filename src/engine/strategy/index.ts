import {
  InterventionConfig,
  StrategyRecommendation,
  VirusParams,
  NetworkData,
  PopulationConfig,
  SimulationResult,
} from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { runSimulation } from '../SEIR';

export class StrategyRecommender {
  private params: VirusParams;
  private network: NetworkData;
  private population: PopulationConfig;
  private baseResult?: SimulationResult;

  constructor(
    params: VirusParams,
    network: NetworkData,
    population: PopulationConfig,
    baseResult?: SimulationResult
  ) {
    this.params = params;
    this.network = network;
    this.population = population;
    this.baseResult = baseResult;
  }

  generateRecommendations(): StrategyRecommendation[] {
    const recommendations: StrategyRecommendation[] = [];

    const strategies = this.generateStrategyCombinations();

    strategies.forEach((strategy, index) => {
      const result = runSimulation(
        this.params,
        this.network,
        strategy.interventions,
        this.population
      );

      const basePeak = this.baseResult?.peakInfection || result.peakInfection * 1.5;
      const baseTotal = this.baseResult?.totalInfected || result.totalInfected * 1.5;

      const peakReduction = (basePeak - result.peakInfection) / basePeak;
      const totalReduction = (baseTotal - result.totalInfected) / baseTotal;
      const costScore = this.calculateCostScore(strategy.interventions);
      const overallScore = this.calculateOverallScore(peakReduction, totalReduction, costScore);

      recommendations.push({
        id: uuidv4(),
        name: strategy.name,
        description: strategy.description,
        interventions: strategy.interventions,
        predictedEffect: {
          peakReduction: Math.max(0, peakReduction),
          totalReduction: Math.max(0, totalReduction),
          costScore,
          overallScore,
        },
        isRecommended: false,
      });
    });

    recommendations.sort((a, b) => b.predictedEffect.overallScore - a.predictedEffect.overallScore);
    if (recommendations.length > 0) {
      recommendations[0].isRecommended = true;
    }

    return recommendations;
  }

  private generateStrategyCombinations(): { name: string; description: string; interventions: InterventionConfig }[] {
    const baseInterventions: InterventionConfig = {
      isolation: { enabled: false, coverage: 0, complianceRate: 0, startTime: 0 },
      vaccination: { enabled: false, dailyCapacity: 0, efficacy: 0, priorityGroups: [], startTime: 0 },
      travelRestriction: { enabled: false, restrictionLevel: 0, startTime: 0 },
      socialDistancing: { enabled: false, intensity: 0, startTime: 0 },
    };

    return [
      {
        name: '无干预基准',
        description: '不采取任何干预措施，用于对比基准情况',
        interventions: { ...baseInterventions },
      },
      {
        name: '轻度防控',
        description: '仅实施社交疏离措施，对经济影响最小',
        interventions: {
          ...baseInterventions,
          socialDistancing: { enabled: true, intensity: 0.2, startTime: 10 },
        },
      },
      {
        name: '中度防控',
        description: '社交疏离+病例隔离，平衡防控效果与成本',
        interventions: {
          ...baseInterventions,
          socialDistancing: { enabled: true, intensity: 0.4, startTime: 7 },
          isolation: { enabled: true, coverage: 0.5, complianceRate: 0.8, startTime: 10 },
        },
      },
      {
        name: '严格防控',
        description: '全面措施：社交疏离+隔离+旅行限制，强力压制传播',
        interventions: {
          ...baseInterventions,
          socialDistancing: { enabled: true, intensity: 0.6, startTime: 5 },
          isolation: { enabled: true, coverage: 0.8, complianceRate: 0.9, startTime: 7 },
          travelRestriction: { enabled: true, restrictionLevel: 0.7, startTime: 10 },
        },
      },
      {
        name: '疫苗主导',
        description: '以疫苗接种为核心，配合轻度社交疏离',
        interventions: {
          ...baseInterventions,
          vaccination: {
            enabled: true,
            dailyCapacity: Math.floor(this.network.totalPopulation * 0.005),
            efficacy: 0.75,
            priorityGroups: ['elderly', 'medical', 'essential'],
            startTime: 15,
          },
          socialDistancing: { enabled: true, intensity: 0.2, startTime: 10 },
        },
      },
      {
        name: '综合最优',
        description: '多措施组合，根据效果成本比优化配置',
        interventions: {
          ...baseInterventions,
          socialDistancing: { enabled: true, intensity: 0.4, startTime: 7 },
          isolation: { enabled: true, coverage: 0.6, complianceRate: 0.85, startTime: 7 },
          vaccination: {
            enabled: true,
            dailyCapacity: Math.floor(this.network.totalPopulation * 0.003),
            efficacy: 0.7,
            priorityGroups: ['elderly', 'medical'],
            startTime: 20,
          },
          travelRestriction: { enabled: true, restrictionLevel: 0.4, startTime: 15 },
        },
      },
    ];
  }

  private calculateCostScore(interventions: InterventionConfig): number {
    let cost = 0;
    let weight = 0;

    if (interventions.socialDistancing.enabled) {
      cost += interventions.socialDistancing.intensity * 0.8;
      weight += 0.3;
    }

    if (interventions.isolation.enabled) {
      cost += interventions.isolation.coverage * interventions.isolation.complianceRate * 0.6;
      weight += 0.25;
    }

    if (interventions.travelRestriction.enabled) {
      cost += interventions.travelRestriction.restrictionLevel * 1.0;
      weight += 0.25;
    }

    if (interventions.vaccination.enabled) {
      const vaxRate = interventions.vaccination.dailyCapacity / this.network.totalPopulation;
      cost += vaxRate * 50 * 0.5;
      weight += 0.2;
    }

    return weight > 0 ? cost / weight : 0;
  }

  private calculateOverallScore(peakReduction: number, totalReduction: number, costScore: number): number {
    const effectScore = (peakReduction * 0.6 + totalReduction * 0.4) * 100;
    const costEfficiency = costScore > 0 ? effectScore / (costScore * 100) : effectScore;
    return effectScore * 0.7 + costEfficiency * 30 * 0.3;
  }

  optimizeStrategy(
    baseInterventions: InterventionConfig,
    targetPeakReduction: number
  ): InterventionConfig {
    let optimized = JSON.parse(JSON.stringify(baseInterventions)) as InterventionConfig;

    if (!optimized.socialDistancing.enabled) {
      optimized.socialDistancing = { enabled: true, intensity: 0.3, startTime: 10 };
    }

    if (!optimized.isolation.enabled) {
      optimized.isolation = { enabled: true, coverage: 0.5, complianceRate: 0.8, startTime: 7 };
    }

    return optimized;
  }
}

export function generateStrategyRecommendations(
  params: VirusParams,
  network: NetworkData,
  population: PopulationConfig,
  baseResult?: SimulationResult
): StrategyRecommendation[] {
  const recommender = new StrategyRecommender(params, network, population, baseResult);
  return recommender.generateRecommendations();
}
