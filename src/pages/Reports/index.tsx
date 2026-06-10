import { useState } from 'react';
import {
  FileBarChart,
  Download,
  Eye,
  Calendar,
  MapPin,
  FileSpreadsheet,
  Filter,
  Search,
  ChevronRight,
} from 'lucide-react';
import { useTaskStore } from '../../store';
import { Card } from '../../components/ui/StatusBadge';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';

export default function Reports() {
  const { tasks } = useTaskStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [exportDimension, setExportDimension] = useState<'city' | 'time'>('time');

  const completedTasks = tasks.filter(
    (t) => t.status === 'completed' && t.approvalStatus === 'level2_approved'
  );

  const filteredTasks = completedTasks.filter((task) =>
    task.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const generatePDF = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(30, 58, 138);
    doc.text('病毒传播模拟综合报告', 105, 25, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(task.name, 105, 35, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('一、基本信息', 20, 55);
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`任务名称: ${task.name}`, 25, 65);
    doc.text(`创建时间: ${task.createdAt.toLocaleDateString('zh-CN')}`, 25, 73);
    doc.text(`模拟天数: ${task.totalDays} 天`, 25, 81);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('二、病毒参数', 20, 95);
    
    doc.setFontSize(10);
    doc.setTextColor(60);
    doc.text(`R0: ${task.params.r0}`, 25, 105);
    doc.text(`潜伏期: ${task.params.incubationPeriod} 天`, 25, 113);
    doc.text(`传染期: ${task.params.infectiousPeriod} 天`, 25, 121);
    doc.text(`重症率: ${(task.params.severeRate * 100).toFixed(1)}%`, 25, 129);

    if (task.results) {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('三、模拟结果', 20, 145);
      
      doc.setFontSize(10);
      doc.setTextColor(60);
      doc.text(`峰值感染人数: ${task.results.peakInfection.toLocaleString()}`, 25, 155);
      doc.text(`峰值出现时间: 第 ${task.results.peakTime} 天`, 25, 163);
      doc.text(`总感染人数: ${task.results.totalInfected.toLocaleString()}`, 25, 171);
      doc.text(`总康复人数: ${task.results.totalRecovered.toLocaleString()}`, 25, 179);
      doc.text(`总死亡人数: ${task.results.totalDeaths.toLocaleString()}`, 25, 187);
    }

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('EpiSim 病毒传播动力学模拟平台 生成', 105, 280, { align: 'center' });

    doc.save(`${task.name}_报告.pdf`);
  };

  const exportData = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task || !task.results) return;

    if (exportFormat === 'csv') {
      const headers = ['天数', '易感人群', '潜伏人群', '感染人群', '康复人群', '死亡人群', '重症人数', 'R0', '资源占用率'];
      const rows = task.results.timeSeries.map((d) => [
        d.day,
        d.susceptible,
        d.exposed,
        d.infected,
        d.recovered,
        d.deceased,
        d.severe,
        d.r0.toFixed(2),
        (d.resourceUsage * 100).toFixed(1) + '%',
      ]);
      
      const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${task.name}_传播数据.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (exportFormat === 'json') {
      const jsonContent = JSON.stringify(task.results, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${task.name}_数据.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      generatePDF(taskId);
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
          <h1 className="text-2xl font-bold text-white">报告中心</h1>
          <p className="text-slate-400 mt-1">
            查看和导出模拟结果报告，支持多种格式和维度
          </p>
        </div>
      </div>

      <Card>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              placeholder="搜索报告..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as 'pdf' | 'csv' | 'json')}
              className="h-10 px-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="pdf">PDF 报告</option>
              <option value="csv">CSV 数据</option>
              <option value="json">JSON 数据</option>
            </select>
            <select
              value={exportDimension}
              onChange={(e) => setExportDimension(e.target.value as 'city' | 'time')}
              className="h-10 px-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500/50"
            >
              <option value="time">按时间维度</option>
              <option value="city">按城市维度</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-slate-900/30 border border-slate-700/50 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all group"
              >
                <div className="h-40 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 relative flex items-center justify-center">
                  <FileBarChart className="w-16 h-16 text-cyan-400/50" />
                  <div className="absolute top-3 right-3 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs rounded-md">
                    已审批
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-medium truncate">{task.name}</h3>
                  <p className="text-slate-400 text-sm mt-1 line-clamp-2">
                    {task.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-3 text-slate-500 text-xs">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {task.createdAt.toLocaleDateString('zh-CN')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {task.networkData.cities.length} 城市
                    </span>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => exportData(task.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm"
                    >
                      <Download className="w-4 h-4" />
                      下载
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm">
                      <Eye className="w-4 h-4" />
                      预览
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 text-slate-500">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">暂无已完成的报告</p>
              <p className="text-sm mt-1">完成模拟并通过审批后，报告将在此展示</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
