import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Upload,
  Check,
  FileText,
  Settings2,
  Shield,
  Map,
  Sparkles,
} from 'lucide-react';
import { useTaskStore, useSystemStore } from '../../store';
import { Card } from '../../components/ui/StatusBadge';
import { motion } from 'framer-motion';
import { mockNetworkData } from '../../data/mockData';
import { DEFAULT_VIRUS_PARAMS, DEFAULT_INTERVENTIONS, DEFAULT_POPULATION } from '../../constants';

export default function NewTask() {
  const navigate = useNavigate();
  const { createTask } = useTaskStore();
  const { showNotification, systemStatus } = useSystemStore();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    params: { ...DEFAULT_VIRUS_PARAMS },
    interventions: { ...DEFAULT_INTERVENTIONS },
    population: { ...DEFAULT_POPULATION },
    networkData: mockNetworkData,
    totalDays: 180,
  });

  const steps = [
    { id: 1, label: '基本信息', icon: FileText },
    { id: 2, label: '病毒参数', icon: Settings2 },
    { id: 3, label: '干预措施', icon: Shield },
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    if (systemStatus.isPaused) {
      showNotification('error', '系统已暂停，无法创建新任务');
      return;
    }

    if (!formData.name.trim()) {
      showNotification('error', '请输入任务名称');
      return;
    }

    const task = createTask({
      name: formData.name,
      description: formData.description,
      params: formData.params,
      interventions: formData.interventions,
      population: formData.population,
      networkData: formData.networkData,
      totalDays: formData.totalDays,
      createdBy: 'user1',
    });

    showNotification('success', '任务创建成功，正在进行数据校验...');
    
    setTimeout(() => {
      navigate(`/monitor/${task.id}`);
    }, 500);
  };

  const handleFileUpload = () => {
    showNotification('info', '演示模式：使用默认网络数据');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/tasks')}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">新建模拟任务</h1>
          <p className="text-slate-400 mt-1">配置模拟参数，创建新的病毒传播模拟任务</p>
        </div>
      </div>

      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2">
          {steps.map((s, index) => {
            const Icon = s.icon;
            const isActive = step === s.id;
            const isCompleted = step > s.id;

            return (
              <div key={s.id} className="flex items-center">
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800/50 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium">{s.label}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <Card>
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                任务名称 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="请输入任务名称"
                className="w-full h-11 px-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                任务描述
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请描述本次模拟的目的和背景..."
                rows={3}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/30 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                人口流动网络数据
              </label>
              <div
                onClick={handleFileUpload}
                className="border-2 border-dashed border-slate-700 rounded-xl p-8 text-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all"
              >
                <Upload className="w-12 h-12 mx-auto text-slate-500 mb-3" />
                <p className="text-white font-medium mb-1">上传人口流动网络文件</p>
                <p className="text-slate-400 text-sm">支持 JSON、CSV 格式，或使用示例数据</p>
                <div className="mt-4">
                  <button className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm hover:bg-slate-600 transition-colors">
                    选择文件
                  </button>
                </div>
              </div>
              <p className="text-slate-500 text-xs mt-2">
                <Map className="w-3 h-3 inline mr-1" />
                当前使用：8城市示范网络 · {formData.networkData.totalPopulation.toLocaleString()} 人口
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                模拟天数
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="30"
                  max="365"
                  value={formData.totalDays}
                  onChange={(e) => setFormData({ ...formData, totalDays: parseInt(e.target.value) })}
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <span className="w-20 text-right text-white font-mono">{formData.totalDays} 天</span>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="p-4 bg-slate-900/30 rounded-xl">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                基本传染数 (R0)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.5"
                  max="6"
                  step="0.1"
                  value={formData.params.r0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      params: { ...formData.params, r0: parseFloat(e.target.value) },
                    })
                  }
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <span className="w-12 text-right text-cyan-400 font-mono font-bold">
                  {formData.params.r0.toFixed(1)}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-2">每个感染者平均传染人数</p>
            </div>

            <div className="p-4 bg-slate-900/30 rounded-xl">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                潜伏期 (天)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max="14"
                  step="0.5"
                  value={formData.params.incubationPeriod}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      params: { ...formData.params, incubationPeriod: parseFloat(e.target.value) },
                    })
                  }
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <span className="w-12 text-right text-white font-mono">
                  {formData.params.incubationPeriod.toFixed(1)}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-2">感染后到出现症状的时间</p>
            </div>

            <div className="p-4 bg-slate-900/30 rounded-xl">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                传染期 (天)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="3"
                  max="14"
                  step="0.5"
                  value={formData.params.infectiousPeriod}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      params: { ...formData.params, infectiousPeriod: parseFloat(e.target.value) },
                    })
                  }
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
                <span className="w-12 text-right text-white font-mono">
                  {formData.params.infectiousPeriod.toFixed(1)}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-2">感染者具有传染性的持续时间</p>
            </div>

            <div className="p-4 bg-slate-900/30 rounded-xl">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                重症率 (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="30"
                  step="0.5"
                  value={formData.params.severeRate * 100}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      params: { ...formData.params, severeRate: parseFloat(e.target.value) / 100 },
                    })
                  }
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
                />
                <span className="w-12 text-right text-orange-400 font-mono">
                  {(formData.params.severeRate * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-2">感染后发展为重症的比例</p>
            </div>

            <div className="p-4 bg-slate-900/30 rounded-xl">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                病死率 (%)
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formData.params.mortalityRate * 100}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      params: { ...formData.params, mortalityRate: parseFloat(e.target.value) / 100 },
                    })
                  }
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <span className="w-12 text-right text-red-400 font-mono">
                  {(formData.params.mortalityRate * 100).toFixed(1)}%
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-2">感染后死亡的比例</p>
            </div>

            <div className="p-4 bg-slate-900/30 rounded-xl">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                初始感染人数
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="10000"
                  step="10"
                  value={formData.population.initialInfected}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      population: { ...formData.population, initialInfected: parseInt(e.target.value) },
                    })
                  }
                  className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                />
                <span className="w-16 text-right text-red-400 font-mono">
                  {formData.population.initialInfected.toLocaleString()}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-2">模拟开始时的感染人数</p>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div
              className={`p-4 rounded-xl border transition-all ${
                formData.interventions.socialDistancing.enabled
                  ? 'bg-yellow-500/10 border-yellow-500/30'
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.interventions.socialDistancing.enabled
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-slate-700 text-slate-500'
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">社交疏离</h4>
                    <p className="text-slate-400 text-sm">减少人群接触，降低传播风险</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.interventions.socialDistancing.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        interventions: {
                          ...formData.interventions,
                          socialDistancing: {
                            ...formData.interventions.socialDistancing,
                            enabled: e.target.checked,
                          },
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                </label>
              </div>

              {formData.interventions.socialDistancing.enabled && (
                <div className="space-y-3 pl-13">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-sm w-20">强度</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={formData.interventions.socialDistancing.intensity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          interventions: {
                            ...formData.interventions,
                            socialDistancing: {
                              ...formData.interventions.socialDistancing,
                              intensity: parseFloat(e.target.value),
                            },
                          },
                        })
                      }
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                    />
                    <span className="w-12 text-right text-yellow-400 font-mono">
                      {(formData.interventions.socialDistancing.intensity * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-sm w-20">启动时间</span>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.interventions.socialDistancing.startTime}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          interventions: {
                            ...formData.interventions,
                            socialDistancing: {
                              ...formData.interventions.socialDistancing,
                              startTime: parseInt(e.target.value) || 0,
                            },
                          },
                        })
                      }
                      className="w-24 h-8 px-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-yellow-500/50"
                    />
                    <span className="text-slate-500 text-sm">天</span>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`p-4 rounded-xl border transition-all ${
                formData.interventions.isolation.enabled
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.interventions.isolation.enabled
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-slate-700 text-slate-500'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">病例隔离</h4>
                    <p className="text-slate-400 text-sm">隔离确诊病例，切断传播链</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.interventions.isolation.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        interventions: {
                          ...formData.interventions,
                          isolation: {
                            ...formData.interventions.isolation,
                            enabled: e.target.checked,
                          },
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
              </div>

              {formData.interventions.isolation.enabled && (
                <div className="space-y-3 pl-13">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-sm w-20">覆盖率</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={formData.interventions.isolation.coverage}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          interventions: {
                            ...formData.interventions,
                            isolation: {
                              ...formData.interventions.isolation,
                              coverage: parseFloat(e.target.value),
                            },
                          },
                        })
                      }
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <span className="w-12 text-right text-blue-400 font-mono">
                      {(formData.interventions.isolation.coverage * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`p-4 rounded-xl border transition-all ${
                formData.interventions.vaccination.enabled
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.interventions.vaccination.enabled
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700 text-slate-500'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">疫苗接种</h4>
                    <p className="text-slate-400 text-sm">大规模接种，建立群体免疫</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.interventions.vaccination.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        interventions: {
                          ...formData.interventions,
                          vaccination: {
                            ...formData.interventions.vaccination,
                            enabled: e.target.checked,
                          },
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {formData.interventions.vaccination.enabled && (
                <div className="space-y-3 pl-13">
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-sm w-20">日接种量</span>
                    <input
                      type="number"
                      min="1000"
                      max="1000000"
                      step="1000"
                      value={formData.interventions.vaccination.dailyCapacity}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          interventions: {
                            ...formData.interventions,
                            vaccination: {
                              ...formData.interventions.vaccination,
                              dailyCapacity: parseInt(e.target.value) || 0,
                            },
                          },
                        })
                      }
                      className="flex-1 h-8 px-3 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-emerald-500/50"
                    />
                    <span className="text-slate-500 text-sm">剂/天</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-sm w-20">保护效力</span>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={formData.interventions.vaccination.efficacy}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          interventions: {
                            ...formData.interventions,
                            vaccination: {
                              ...formData.interventions.vaccination,
                              efficacy: parseFloat(e.target.value),
                            },
                          },
                        })
                      }
                      className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                    <span className="w-12 text-right text-emerald-400 font-mono">
                      {(formData.interventions.vaccination.efficacy * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div
              className={`p-4 rounded-xl border transition-all ${
                formData.interventions.travelRestriction.enabled
                  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-slate-800/50 border-slate-700/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      formData.interventions.travelRestriction.enabled
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-slate-700 text-slate-500'
                    }`}
                  >
                    <Shield className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-white font-medium">旅行限制</h4>
                    <p className="text-slate-400 text-sm">限制城市间人口流动</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.interventions.travelRestriction.enabled}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        interventions: {
                          ...formData.interventions,
                          travelRestriction: {
                            ...formData.interventions.travelRestriction,
                            enabled: e.target.checked,
                          },
                        },
                      })
                    }
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                </label>
              </div>
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-700/50">
          <button
            onClick={step === 1 ? () => navigate('/tasks') : handlePrev}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {step === 1 ? '取消' : '上一步'}
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
            >
              下一步
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium rounded-lg hover:from-emerald-400 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/25"
            >
              <Sparkles className="w-4 h-4" />
              创建并开始模拟
            </button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
