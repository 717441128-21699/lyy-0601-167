import {
  VirusParams,
  NetworkData,
  InterventionConfig,
  PopulationConfig,
  SimulationResult,
  TimePoint,
  CityResult,
  City,
} from '../../types';

export interface SEIRState {
  susceptible: number;
  exposed: number;
  infected: number;
  recovered: number;
  deceased: number;
  severe: number;
}

export interface CitySEIRState extends SEIRState {
  cityId: string;
  cityName: string;
}

export class SEIREngine {
  private params: VirusParams;
  private network: NetworkData;
  private interventions: InterventionConfig;
  private population: PopulationConfig;
  private totalDays: number;
  private cityStates: Map<string, CitySEIRState> = new Map();
  private timeSeries: TimePoint[] = [];
  private cityTimeSeries: Map<string, TimePoint[]> = new Map();
  private vaccinated: Map<string, number> = new Map();

  constructor(
    params: VirusParams,
    network: NetworkData,
    interventions: InterventionConfig,
    population: PopulationConfig,
    totalDays: number = 180
  ) {
    this.params = params;
    this.network = network;
    this.interventions = interventions;
    this.population = population;
    this.totalDays = totalDays;
  }

  initialize(): void {
    const totalPop = this.network.totalPopulation;
    const initialInfected = this.population.initialInfected;
    const initialExposed = initialInfected * 2;

    let remainingInfected = initialInfected;
    let remainingExposed = initialExposed;

    this.network.cities.forEach((city, index) => {
      const popRatio = city.population / totalPop;
      let cityInfected = index === 0 ? Math.floor(remainingInfected * 0.6) : Math.floor(initialInfected * popRatio * 0.1);
      let cityExposed = index === 0 ? Math.floor(remainingExposed * 0.6) : Math.floor(initialExposed * popRatio * 0.1);

      if (index === 0) {
        remainingInfected -= cityInfected;
        remainingExposed -= cityExposed;
      }

      const state: CitySEIRState = {
        cityId: city.id,
        cityName: city.name,
        susceptible: city.population - cityInfected - cityExposed,
        exposed: cityExposed,
        infected: cityInfected,
        recovered: 0,
        deceased: 0,
        severe: 0,
      };

      this.cityStates.set(city.id, state);
      this.cityTimeSeries.set(city.id, []);
      this.vaccinated.set(city.id, 0);
    });

    this.recordTimePoint(0);
  }

  step(day: number): void {
    const beta = this.calculateTransmissionRate(day);
    const sigma = 1 / this.params.latentPeriod;
    const gamma = 1 / this.params.infectiousPeriod;
    const mu = this.params.mortalityRate;
    const severeRate = this.params.severeRate;

    const newStates = new Map<string, CitySEIRState>();

    this.network.cities.forEach((city) => {
      const state = this.cityStates.get(city.id)!;
      const totalPop = city.population;

      const interventionFactor = this.getInterventionFactor(day, city.id);
      const effectiveBeta = beta * interventionFactor;

      const infectionRate = effectiveBeta * state.infected * state.susceptible / totalPop;
      const progressionRate = sigma * state.exposed;
      const recoveryRate = gamma * state.infected * (1 - severeRate);
      const severeRate2 = gamma * state.infected * severeRate;
      const deathRate = mu * state.severe;
      const severeRecoveryRate = gamma * 0.3 * state.severe;

      const importedInfections = this.calculateImportedInfections(city.id);

      this.applyVaccination(day, city.id, state);

      const newSusceptible = Math.max(0, state.susceptible - infectionRate + importedInfections.susceptible);
      const newExposed = Math.max(0, state.exposed + infectionRate - progressionRate + importedInfections.exposed);
      const newInfected = Math.max(0, state.infected + progressionRate - recoveryRate - severeRate2 + importedInfections.infected);
      const newSevere = Math.max(0, state.severe + severeRate2 - deathRate - severeRecoveryRate);
      const newRecovered = Math.max(0, state.recovered + recoveryRate + severeRecoveryRate + importedInfections.recovered);
      const newDeceased = Math.max(0, state.deceased + deathRate);

      newStates.set(city.id, {
        cityId: city.id,
        cityName: state.cityName,
        susceptible: newSusceptible,
        exposed: newExposed,
        infected: newInfected,
        recovered: newRecovered,
        deceased: newDeceased,
        severe: newSevere,
      });
    });

    this.cityStates = newStates;
    this.recordTimePoint(day);
  }

  private calculateTransmissionRate(day: number): number {
    const baseR0 = this.params.r0;
    const gamma = 1 / this.params.infectiousPeriod;
    return baseR0 * gamma;
  }

  private getInterventionFactor(day: number, cityId: string): number {
    let factor = 1.0;

    if (this.interventions.socialDistancing.enabled && day >= this.interventions.socialDistancing.startTime) {
      factor *= (1 - this.interventions.socialDistancing.intensity * 0.6);
    }

    if (this.interventions.isolation.enabled && day >= this.interventions.isolation.startTime) {
      const isolationEffect = this.interventions.isolation.coverage * this.interventions.isolation.complianceRate;
      factor *= (1 - isolationEffect * 0.5);
    }

    return factor;
  }

  private calculateImportedInfections(cityId: string): { susceptible: number; exposed: number; infected: number; recovered: number } {
    let importedExposed = 0;
    let importedInfected = 0;

    this.network.edges.forEach((edge) => {
      if (edge.to === cityId) {
        const fromState = this.cityStates.get(edge.from);
        if (fromState) {
          const fromCity = this.network.cities.find(c => c.id === edge.from);
          if (fromCity) {
            const flowFactor = this.getTravelRestrictionFactor();
            const flow = edge.flowRate * flowFactor;
            
            const infectedRatio = fromState.infected / fromCity.population;
            const exposedRatio = fromState.exposed / fromCity.population;
            
            importedInfected += flow * infectedRatio * 0.01;
            importedExposed += flow * exposedRatio * 0.01;
          }
        }
      }
    });

    return {
      susceptible: -importedExposed - importedInfected,
      exposed: importedExposed,
      infected: importedInfected,
      recovered: 0,
    };
  }

  private getTravelRestrictionFactor(): number {
    if (!this.interventions.travelRestriction.enabled) {
      return 1.0;
    }
    return 1 - this.interventions.travelRestriction.restrictionLevel;
  }

  private applyVaccination(day: number, cityId: string, state: CitySEIRState): void {
    if (!this.interventions.vaccination.enabled || day < this.interventions.vaccination.startTime) {
      return;
    }

    const city = this.network.cities.find(c => c.id === cityId);
    if (!city) return;

    const dailyVaccine = Math.min(
      this.interventions.vaccination.dailyCapacity * (city.population / this.network.totalPopulation),
      state.susceptible * 0.01
    );

    const vaccinated = this.vaccinated.get(cityId) || 0;
    const efficacy = this.interventions.vaccination.efficacy;
    
    state.susceptible -= dailyVaccine;
    state.recovered += dailyVaccine * efficacy * 0.5;
    this.vaccinated.set(cityId, vaccinated + dailyVaccine);
  }

  private recordTimePoint(day: number): void {
    let totalSusceptible = 0;
    let totalExposed = 0;
    let totalInfected = 0;
    let totalRecovered = 0;
    let totalDeceased = 0;
    let totalSevere = 0;
    let totalMedicalCapacity = 0;

    this.network.cities.forEach((city) => {
      const state = this.cityStates.get(city.id)!;
      totalSusceptible += state.susceptible;
      totalExposed += state.exposed;
      totalInfected += state.infected;
      totalRecovered += state.recovered;
      totalDeceased += state.deceased;
      totalSevere += state.severe;
      totalMedicalCapacity += city.medicalCapacity;

      const citySeries = this.cityTimeSeries.get(city.id)!;
      citySeries.push({
        day,
        susceptible: Math.round(state.susceptible),
        exposed: Math.round(state.exposed),
        infected: Math.round(state.infected),
        recovered: Math.round(state.recovered),
        deceased: Math.round(state.deceased),
        severe: Math.round(state.severe),
        r0: this.calculateR0(state, city.population),
        resourceUsage: state.severe / city.medicalCapacity,
      });
    });

    const r0 = this.calculateOverallR0();
    const resourceUsage = totalSevere / totalMedicalCapacity;

    this.timeSeries.push({
      day,
      susceptible: Math.round(totalSusceptible),
      exposed: Math.round(totalExposed),
      infected: Math.round(totalInfected),
      recovered: Math.round(totalRecovered),
      deceased: Math.round(totalDeceased),
      severe: Math.round(totalSevere),
      r0,
      resourceUsage,
    });
  }

  private calculateR0(state: CitySEIRState, population: number): number {
    if (state.susceptible === 0) return 0;
    const susceptibleRatio = state.susceptible / population;
    return this.params.r0 * susceptibleRatio;
  }

  private calculateOverallR0(): number {
    let totalPop = 0;
    let totalSusceptible = 0;

    this.network.cities.forEach((city) => {
      const state = this.cityStates.get(city.id)!;
      totalPop += city.population;
      totalSusceptible += state.susceptible;
    });

    if (totalPop === 0) return 0;
    return this.params.r0 * (totalSusceptible / totalPop);
  }

  run(): SimulationResult {
    this.initialize();

    for (let day = 1; day <= this.totalDays; day++) {
      this.step(day);
    }

    const cityData: CityResult[] = this.network.cities.map((city) => {
      const series = this.cityTimeSeries.get(city.id)!;
      const peakInfection = Math.max(...series.map(t => t.infected));
      const peakTime = series.find(t => t.infected === peakInfection)?.day || 0;
      const totalInfected = series[series.length - 1].recovered + series[series.length - 1].deceased;

      return {
        cityId: city.id,
        cityName: city.name,
        peakInfection,
        peakTime,
        totalInfected,
        timeSeries: series,
      };
    });

    const peakInfection = Math.max(...this.timeSeries.map(t => t.infected));
    const peakTime = this.timeSeries.find(t => t.infected === peakInfection)?.day || 0;
    const finalState = this.timeSeries[this.timeSeries.length - 1];

    return {
      timeSeries: this.timeSeries,
      cityData,
      peakInfection,
      peakTime,
      totalInfected: finalState.recovered + finalState.deceased,
      totalRecovered: finalState.recovered,
      totalDeaths: finalState.deceased,
      r0Evolution: this.timeSeries.map(t => t.r0),
      medicalResourceUsage: this.timeSeries.map(t => t.resourceUsage),
    };
  }

  runStepByStep(onProgress?: (day: number, result: SimulationResult) => void): SimulationResult {
    this.initialize();

    for (let day = 1; day <= this.totalDays; day++) {
      this.step(day);

      if (onProgress && day % 5 === 0) {
        const partialResult = this.buildPartialResult();
        onProgress(day, partialResult);
      }
    }

    return this.run();
  }

  private buildPartialResult(): SimulationResult {
    const cityData: CityResult[] = this.network.cities.map((city) => {
      const series = this.cityTimeSeries.get(city.id)!;
      const peakInfection = Math.max(...series.map(t => t.infected));
      const peakTime = series.find(t => t.infected === peakInfection)?.day || 0;

      return {
        cityId: city.id,
        cityName: city.name,
        peakInfection,
        peakTime,
        totalInfected: 0,
        timeSeries: [...series],
      };
    });

    return {
      timeSeries: [...this.timeSeries],
      cityData,
      peakInfection: Math.max(...this.timeSeries.map(t => t.infected)),
      peakTime: this.timeSeries.find(t => t.infected === Math.max(...this.timeSeries.map(t => t.infected)))?.day || 0,
      totalInfected: 0,
      totalRecovered: 0,
      totalDeaths: 0,
      r0Evolution: this.timeSeries.map(t => t.r0),
      medicalResourceUsage: this.timeSeries.map(t => t.resourceUsage),
    };
  }
}

export function runSimulation(
  params: VirusParams,
  network: NetworkData,
  interventions: InterventionConfig,
  population: PopulationConfig,
  totalDays: number = 180,
  onProgress?: (day: number, result: SimulationResult) => void
): SimulationResult {
  const engine = new SEIREngine(params, network, interventions, population, totalDays);
  
  if (onProgress) {
    return engine.runStepByStep(onProgress);
  }
  
  return engine.run();
}
