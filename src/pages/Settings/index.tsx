import { useState } from 'react';
import {
  Settings as SettingsIcon,
  Users,
  AlertTriangle,
  Bell,
  Sliders,
  Save,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { useSystemStore, useUserStore } from '../../store';
import { Card } from '../../components/ui/StatusBadge';
import { motion } from 'framer-motion';
import { DEFAULT_THRESHOLDS } from '../../constants';
import { mockUsers } from '../../data/mockData';
import { USER_ROLE_LABELS } from '../../constants';

export default function Settings() {
  const { thresholds, updateThresholds, showNotification, systemStatus, resumeSystem } = useSystemStore();
  const { users, fetchUsers, currentUser } = useUserStore();
  const [activeTab, setActiveTab] = useState<'thresholds' | 'users' | 'notifications'>('thresholds');

  const [localThresholds, setLocalThresholds] = useState(thresholds);

  const handleSaveThresholds = () => {
    updateThresholds(localThresholds);
    showNotification('success', '阈值配置已保存');
  };

  const handleResetThresholds = () => {
    setLocalThresholds(DEFAULT_THRESHOLDS);
    showNotification('info', '已重置为默认值，点击保存生效');
  };

  const tabs = [
    { id: 'thresholds', label: '阈值配置', icon: Sliders },
    { id: 'users', label: '用户管理', icon: Users },
    { id: 'notifications', label: '通知设置', icon: Bell },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-2xl font-bold text-white">系统设置</h1>
        <p className="text-slate-400 mt-1">配置系统参数、用户权限和通知选项</p>
      </div>

      {systemStatus.isPaused && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-red-400" />
            <div>
              <p className="text-red-400 font-medium">系统当前处于暂停状态</p>
              <p className="text-slate-400 text-sm">{systemStatus.pauseReason}</p>
            </div>
          </div>
          {currentUser?.role === 'chief_scientist' && (
            <button
              onClick={() => {
                resumeSystem();
                showNotification('success', '系统已恢复运行');
              }}
              className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors font-medium"
            >
              恢复系统
            </button>
          )}
        </div>
      )}

      <div className="flex gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-slate-800/50 text-cyan-400 border-b-2 border-cyan-500'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <Card>
        {activeTab === 'thresholds' && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                R0 预警阈值
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'low', label: '低级预警', color: 'text-blue-400' },
                  { key: 'medium', label: '中级预警', color: 'text-yellow-400' },
                  { key: 'high', label: '高级预警', color: 'text-orange-400' },
                  { key: 'critical', label: '紧急预警', color: 'text-red-400' },
                ].map((item) => (
                  <div key={item.key} className="p-4 bg-slate-900/50 rounded-lg">
                    <p className={`text-sm font-medium mb-2 ${item.color}`}>{item.label}</p>
                    <input
                      type="number"
                      value={localThresholds.r0Warning[item.key as keyof typeof localThresholds.r0Warning]}
                      onChange={(e) =>
                        setLocalThresholds({
                          ...localThresholds,
                          r0Warning: {
                            ...localThresholds.r0Warning,
                            [item.key]: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
                      step="0.1"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-500" />
                医疗资源预警阈值
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'low', label: '低级预警', color: 'text-blue-400' },
                  { key: 'medium', label: '中级预警', color: 'text-yellow-400' },
                  { key: 'high', label: '高级预警', color: 'text-orange-400' },
                  { key: 'critical', label: '紧急预警', color: 'text-red-400' },
                ].map((item) => (
                  <div key={item.key} className="p-4 bg-slate-900/50 rounded-lg">
                    <p className={`text-sm font-medium mb-2 ${item.color}`}>{item.label}</p>
                    <div className="flex items-center">
                      <input
                        type="number"
                        value={(localThresholds.resourceUsage[item.key as keyof typeof localThresholds.resourceUsage] * 100).toFixed(0)}
                        onChange={(e) =>
                          setLocalThresholds({
                            ...localThresholds,
                            resourceUsage: {
                              ...localThresholds.resourceUsage,
                              [item.key]: (parseFloat(e.target.value) || 0) / 100,
                            },
                          })
                        }
                        className="flex-1 h-10 px-3 bg-slate-800 border border-slate-700 rounded-l-lg text-white focus:outline-none focus:border-cyan-500/50"
                        min="0"
                        max="100"
                      />
                      <span className="h-10 px-3 bg-slate-700 rounded-r-lg text-slate-300 flex items-center text-sm">
                        %
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <SettingsIcon className="w-5 h-5 text-cyan-500" />
                峰值偏差阈值
              </h3>
              <div className="p-4 bg-slate-900/50 rounded-lg max-w-xs">
                <p className="text-slate-300 text-sm mb-2">连续偏差阈值</p>
                <div className="flex items-center">
                  <input
                    type="number"
                    value={(localThresholds.peakDeviation * 100).toFixed(0)}
                    onChange={(e) =>
                      setLocalThresholds({
                        ...localThresholds,
                        peakDeviation: (parseFloat(e.target.value) || 0) / 100,
                      })
                    }
                    className="flex-1 h-10 px-3 bg-slate-800 border border-slate-700 rounded-l-lg text-white focus:outline-none focus:border-cyan-500/50"
                    min="0"
                    max="100"
                  />
                  <span className="h-10 px-3 bg-slate-700 rounded-r-lg text-slate-300 flex items-center text-sm">
                    %
                  </span>
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  连续3次超过此阈值将自动暂停系统
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveThresholds}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium rounded-lg hover:from-cyan-400 hover:to-blue-500 transition-all shadow-lg shadow-cyan-500/25"
              >
                <Save className="w-4 h-4" />
                保存配置
              </button>
              <button
                onClick={handleResetThresholds}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                重置默认
              </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">用户列表</h3>
              <button className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm font-medium">
                + 添加用户
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700/50">
                    <th className="text-left py-3 px-4 text-slate-400 text-sm font-medium">用户</th>
                    <th className="text-left py-3 px-4 text-slate-400 text-sm font-medium">角色</th>
                    <th className="text-left py-3 px-4 text-slate-400 text-sm font-medium">邮箱</th>
                    <th className="text-right py-3 px-4 text-slate-400 text-sm font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {mockUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-700/20">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white text-sm font-medium">
                              {user.name.charAt(0)}
                            </span>
                          </div>
                          <span className="text-white font-medium">{user.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded-md text-xs font-medium">
                          {USER_ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400">{user.email}</td>
                      <td className="py-3 px-4 text-right">
                        <button className="text-slate-400 hover:text-white text-sm">编辑</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-white">通知设置</h3>
            
            <div className="space-y-4">
              {[
                { label: '系统预警通知', desc: '当触发多级预警时推送通知', default: true },
                { label: '任务完成通知', desc: '模拟任务完成时推送通知', default: true },
                { label: '审批待办通知', desc: '有待审批任务时推送通知', default: true },
                { label: '系统异常通知', desc: '系统出现异常时推送通知', default: true },
                { label: '每日统计报告', desc: '每日发送性能统计报告', default: false },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg">
                  <div>
                    <p className="text-white font-medium">{item.label}</p>
                    <p className="text-slate-400 text-sm">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.default} className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
