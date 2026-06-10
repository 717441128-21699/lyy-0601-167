import { useEffect, useState } from 'react';
import {
  Sparkles,
  Shield,
  Syringe,
  Users,
  Plane,
  TrendingDown,
  Check,
  Star,
  RefreshCw,
  BarChart3,
} from 'lucide-react';
import { useTaskStore } from '../../store';
import { Card, ProgressBar } from '../../components/ui/StatusBadge';
import { StrategyRecommendation } from '../../types';
import { generateStrategyRecommendations } from '../../engine/strategy';
import { mockNetworkData, mockUsers } from '../../data/mockData';
import { DEFAULT_VIRUS_PARAMS, DEFAULT_POPULATION } from '../../constants';
import { motion } from 'framer-motion';

export default function Strategy() {
  const { tasks } = useTaskStore();
  const [strategies, setStrategies] = useState<StrategyRecommendation[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);

  useEffect(() => {
    if (tasks.length > 0) {
      const completedTask = tasks.find(t => t.status === 'completed') || tasks[0];
      setSelectedTaskId(completedTask.id);
      generateStrategies(completedTask.id);
    }
  }, [tasks]);

  const generateStrategies = (taskId: string) => {
    setIsGenerating(true);
    
    setTimeout(() => {
      const results = generateStrategyRecommendations(
        DEFAULT_VIRUS_PARAMS,
        mockNetworkData,
        DEFAULT_POPULATION
      );
      setStrategies(results);
      if (results.length > 0) {
        setSelectedStrategy(results[0].id);
      }
      setIsGenerating(false);
    }, 1500);
  };

  const selectedStrategyData = strategies.find(s => s.id === selectedStrategy);

  const getInterventionIcon = (type: string) => {
    switch (type) {
      case 'isolation': return <Shield className="w-4 h-4" />;
      case 'vaccination': return <Syringe className="w-4 h-4" />;
      case 'socialDistancing': return <Users className="w-4 h-4" />;
      case 'travelRestriction': return <Plane className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">策略优化引擎</h1>
          <p className="text-slate-400 mt-1">
            智能推荐最优防控策略组合，平衡效果与成本
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedTaskId}
            onChange={(e) => {
              setSelectedTaskId(e.target.value);
              generateStrategies(e.target.value);
            }}
            className="h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
          >
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => generateStrategies(selectedTaskId)}
            className="flex items-center gap-2 px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            重新生成
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-semibold text-white">推荐策略方案</h3>
          
          {isGenerating ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-5 bg-slate-800/40 border border-slate-700/50 rounded-xl animate-pulse">
                  <div className="h-6 bg-slate-700 rounded w-1/3 mb-3" />
                  <div className="h-4 bg-slate-700 rounded w-2/3 mb-4" />
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-16 bg-slate-700/50 rounded-lg" />
                    <div className="h-16 bg-slate-700/50 rounded-lg" />
                    <div className="h-16 bg-slate-700/50 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {strategies.map((strategy, index) => (
                <motion.div
                  key={strategy.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedStrategy(strategy.id)}
                  className={`relative p-5 rounded-xl border cursor-pointer transition-all ${
                    selectedStrategy === strategy.id
                      ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/10'
                      : 'bg-slate-800/40 border-slate-700/50 hover:border-slate-600/50'
                  }`}
                >
                  {strategy.isRecommended && (
                    <div className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full text-white text-xs font-medium">
                      <Star className="w-3 h-3 fill-current" />
                      智能推荐
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="text-lg font-semibold text-white">
                        {strategy.name}
                      </h4>
                      <p className="text-slate-400 text-sm mt-1">
                        {strategy.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-cyan-400">
                        {(strategy.predictedEffect.overallScore).toFixed(1)}
                      </p>
                      <p className="text-slate-500 text-xs">综合评分</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-slate-900/30 rounded-lg text-center">
                      <TrendingDown className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">
                        {(strategy.predictedEffect.peakReduction * 100).toFixed(1)}%
                      </p>
                      <p className="text-slate-500 text-xs">峰值降低</p>
                    </div>
                    <div className="p-3 bg-slate-900/30 rounded-lg text-center">
                      <TrendingDown className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">
                        {(strategy.predictedEffect.totalReduction * 100).toFixed(1)}%
                      </p>
                      <p className="text-slate-500 text-xs">总感染降低</p>
                    </div>
                    <div className="p-3 bg-slate-900/30 rounded-lg text-center">
                      <BarChart3 className="w-5 h-5 text-purple-400 mx-auto mb-1" />
                      <p className="text-lg font-bold text-white">
                        {(strategy.predictedEffect.costScore * 100).toFixed(0)}
                      </p>
                      <p className="text-slate-500 text-xs">成本指数</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {strategy.interventions.isolation.enabled && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 text-blue-400 rounded-md text-xs">
                        {getInterventionIcon('isolation')}
                        病例隔离
                      </span>
                    )}
                    {strategy.interventions.vaccination.enabled && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-md text-xs">
                        {getInterventionIcon('vaccination')}
                        疫苗接种
                      </span>
                    )}
                    {strategy.interventions.socialDistancing.enabled && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-yellow-500/20 text-yellow-400 rounded-md text-xs">
                        {getInterventionIcon('socialDistancing')}
                        社交疏离
                      </span>
                    )}
                    {strategy.interventions.travelRestriction.enabled && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 text-red-400 rounded-md text-xs">
                        {getInterventionIcon('travelRestriction')}
                        旅行限制
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-white">策略详情</h3>
          
          {selectedStrategyData ? (
            <Card>
              <div className="space-y-6">
                <div>
                  <h4 className="text-xl font-bold text-white mb-1">
                    {selectedStrategyData.name}
                  </h4>
                  <p className="text-slate-400 text-sm">
                    {selectedStrategyData.description}
                  </p>
                </div>

                <div className="space-y-4">
                  <h5 className="text-white font-medium">防控效果预测</h5>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">峰值降低</span>
                        <span className="text-emerald-400 font-medium">
                          {(selectedStrategyData.predictedEffect.peakReduction * 100).toFixed(1)}%
                        </span>
                      </div>
                      <ProgressBar
                        value={selectedStrategyData.predictedEffect.peakReduction * 100}
                        color="green"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">总感染降低</span>
                        <span className="text-blue-400 font-medium">
                          {(selectedStrategyData.predictedEffect.totalReduction * 100).toFixed(1)}%
                        </span>
                      </div>
                      <ProgressBar
                        value={selectedStrategyData.predictedEffect.totalReduction * 100}
                        color="blue"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">成本效益</span>
                        <span className="text-purple-400 font-medium">
                          {(selectedStrategyData.predictedEffect.costScore * 100).toFixed(0)}分
                        </span>
                      </div>
                      <ProgressBar
                        value={selectedStrategyData.predictedEffect.costScore * 100}
                        color="cyan"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h5 className="text-white font-medium">干预措施详情</h5>
                  
                  {selectedStrategyData.interventions.socialDistancing.enabled && (
                    <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-yellow-400 font-medium mb-2">
                        <Users className="w-4 h-4" />
                        社交疏离
                      </div>
                      <p className="text-slate-400 text-sm">
                        强度: {(selectedStrategyData.interventions.socialDistancing.intensity * 100).toFixed(0)}%
                      </p>
                      <p className="text-slate-400 text-sm">
                        启动时间: 第 {selectedStrategyData.interventions.socialDistancing.startTime} 天
                      </p>
                    </div>
                  )}

                  {selectedStrategyData.interventions.isolation.enabled && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-400 font-medium mb-2">
                        <Shield className="w-4 h-4" />
                        病例隔离
                      </div>
                      <p className="text-slate-400 text-sm">
                        覆盖范围: {(selectedStrategyData.interventions.isolation.coverage * 100).toFixed(0)}%
                      </p>
                      <p className="text-slate-400 text-sm">
                        依从率: {(selectedStrategyData.interventions.isolation.complianceRate * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}

                  {selectedStrategyData.interventions.vaccination.enabled && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-emerald-400 font-medium mb-2">
                        <Syringe className="w-4 h-4" />
                        疫苗接种
                      </div>
                      <p className="text-slate-400 text-sm">
                        日接种量: {selectedStrategyData.interventions.vaccination.dailyCapacity.toLocaleString()} 剂
                      </p>
                      <p className="text-slate-400 text-sm">
                        保护效力: {(selectedStrategyData.interventions.vaccination.efficacy * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}

                  {selectedStrategyData.interventions.travelRestriction.enabled && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-red-400 font-medium mb-2">
                        <Plane className="w-4 h-4" />
                        旅行限制
                      </div>
                      <p className="text-slate-400 text-sm">
                        限制等级: {(selectedStrategyData.interventions.travelRestriction.restrictionLevel * 100).toFixed(0)}%
                      </p>
                    </div>
                  )}
                </div>

                <button className="w-full h-11 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  应用此策略
                </button>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-12 text-slate-500">
                <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>选择一个策略查看详情</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </motion.div>
  );
}
