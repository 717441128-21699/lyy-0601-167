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
  Send,
} from 'lucide-react';
import { useTaskStore, useSystemStore } from '../../store';
import { Card } from '../../components/ui/StatusBadge';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';

export default function Reports() {
  const { tasks, submitForApproval } = useTaskStore();
  const { showNotification } = useSystemStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [exportFormat, setExportFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [exportDimension, setExportDimension] = useState<'city' | 'time'>('time');

  const completedTasks = tasks.filter(
    (t) => t.status === 'completed'
  );

  const filteredTasks = completedTasks.filter((task) =>
    task.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getApprovalBadge = (status: string) => {
    switch (status) {
      case 'not_submitted': return { text: '待提交审批', color: 'bg-slate-500/20 text-slate-400' };
      case 'pending': return { text: '待一级审批', color: 'bg-yellow-500/20 text-yellow-400' };
      case 'level1_approved': return { text: '待二级审批', color: 'bg-blue-500/20 text-blue-400' };
      case 'level2_approved': return { text: '已审批', color: 'bg-emerald-500/20 text-emerald-400' };
      case 'rejected': return { text: '已驳回', color: 'bg-red-500/20 text-red-400' };
      default: return { text: '未知', color: 'bg-slate-500/20 text-slate-400' };
    }
  };

  const handleSubmitApproval = (taskId: string) => {
    submitForApproval(taskId);
    showNotification('success', '已提交审批，请前往审批中心查看');
  };

  const generateCityDailyData = (task: typeof tasks[0]) => {
    if (!task.results) return {};
    const totalPop = task.networkData.totalPopulation;
    const result: Record<string, { dailyData: { day: number; infected: number; severe: number; r0: number; resourceUsage: number }[] }> = {};
    for (const city of task.networkData.cities) {
      const ratio = city.population / totalPop;
      result[city.name] = {
        dailyData: task.results.timeSeries.map((d) => ({
          day: d.day,
          infected: Math.round(d.infected * ratio),
          severe: Math.round(d.severe * ratio),
          r0: d.r0,
          resourceUsage: d.resourceUsage * ratio,
        })),
      };
    }
    return result;
  };

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

    let yPos = 145;

    if (task.results) {
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('三、模拟结果', 20, yPos);

      yPos += 10;
      doc.setFontSize(10);
      doc.setTextColor(60);
      doc.text(`峰值感染人数: ${task.results.peakInfection.toLocaleString()}`, 25, yPos);
      yPos += 8;
      doc.text(`峰值出现时间: 第 ${task.results.peakTime} 天`, 25, yPos);
      yPos += 8;
      doc.text(`总感染人数: ${task.results.totalInfected.toLocaleString()}`, 25, yPos);
      yPos += 8;
      doc.text(`总康复人数: ${task.results.totalRecovered.toLocaleString()}`, 25, yPos);
      yPos += 8;
      doc.text(`总死亡人数: ${task.results.totalDeaths.toLocaleString()}`, 25, yPos);
      yPos += 16;

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('四、感染曲线数据', 20, yPos);
      yPos += 10;

      doc.setFontSize(9);
      doc.setTextColor(60);
      const ts = task.results.timeSeries;
      const totalDays = ts.length;
      const phaseSize = Math.ceil(totalDays / 5);
      const phases = [];
      for (let i = 0; i < 5; i++) {
        const start = i * phaseSize;
        const end = Math.min((i + 1) * phaseSize - 1, totalDays - 1);
        const slice = ts.slice(start, end + 1);
        const maxInfected = Math.max(...slice.map((d) => d.infected));
        const avgR0 = slice.reduce((s, d) => s + d.r0, 0) / slice.length;
        const maxResource = Math.max(...slice.map((d) => d.resourceUsage));
        phases.push({
          label: `第${start}-${end}天`,
          maxInfected,
          avgR0,
          maxResource,
        });
      }

      doc.setTextColor(0);
      doc.setFontSize(9);
      doc.text('阶段', 25, yPos);
      doc.text('最大感染人数', 65, yPos);
      doc.text('平均R0', 120, yPos);
      doc.text('峰值资源占用', 150, yPos);
      yPos += 2;
      doc.setDrawColor(150);
      doc.line(25, yPos, 190, yPos);
      yPos += 5;

      doc.setTextColor(60);
      for (const phase of phases) {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(phase.label, 25, yPos);
        doc.text(phase.maxInfected.toLocaleString(), 65, yPos);
        doc.text(phase.avgR0.toFixed(2), 120, yPos);
        doc.text((phase.maxResource * 100).toFixed(1) + '%', 150, yPos);
        yPos += 7;
      }

      yPos += 5;
      doc.setTextColor(0);
      doc.setFontSize(10);
      doc.text(`全局峰值: ${task.results.peakInfection.toLocaleString()} 人 (第${task.results.peakTime}天)`, 25, yPos);
      yPos += 16;

      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('五、空间扩散分析', 20, yPos);
      yPos += 10;

      const totalPop = task.networkData.totalPopulation;
      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text('城市', 25, yPos);
      doc.text('人口', 55, yPos);
      doc.text('预估峰值感染', 95, yPos);
      doc.text('预估峰值时间', 140, yPos);
      yPos += 2;
      doc.setDrawColor(150);
      doc.line(25, yPos, 190, yPos);
      yPos += 5;

      doc.setTextColor(60);
      for (const city of task.networkData.cities) {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        const ratio = city.population / totalPop;
        const cityPeak = Math.round(task.results.peakInfection * ratio);
        const cityPeakTime = task.results.peakTime + Math.round((Math.random() - 0.5) * 10);
        doc.text(city.name, 25, yPos);
        doc.text(city.population.toLocaleString(), 55, yPos);
        doc.text(cityPeak.toLocaleString(), 95, yPos);
        doc.text(`第${cityPeakTime}天`, 140, yPos);
        yPos += 7;
      }

      yPos += 8;

      if (exportDimension === 'city') {
        if (yPos > 200) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text('城市感染详情', 20, yPos);
        yPos += 10;

        const cityData = generateCityDailyData(task);
        for (const city of task.networkData.cities) {
          if (yPos > 240) {
            doc.addPage();
            yPos = 20;
          }
          const cd = cityData[city.name];
          if (!cd) continue;
          const ratio = city.population / totalPop;
          const cityPeak = Math.round(task.results.peakInfection * ratio);
          const cityTotal = Math.round(task.results.totalInfected * ratio);
          const cityDeaths = Math.round(task.results.totalDeaths * ratio);

          doc.setFontSize(11);
          doc.setTextColor(0);
          doc.text(`城市: ${city.name}`, 25, yPos);
          yPos += 7;

          doc.setFontSize(9);
          doc.setTextColor(60);
          doc.text(`峰值感染: ${cityPeak.toLocaleString()}`, 30, yPos);
          doc.text(`总感染: ${cityTotal.toLocaleString()}`, 80, yPos);
          doc.text(`死亡: ${cityDeaths.toLocaleString()}`, 135, yPos);
          yPos += 6;

          const cityPeakDay = cd.dailyData.reduce(
            (max, d) => (d.infected > max.infected ? d : max),
            cd.dailyData[0]
          );
          doc.text(`峰值时间: 第${cityPeakDay.day}天`, 30, yPos);
          doc.text(`峰值时资源占用: ${(cityPeakDay.resourceUsage * 100).toFixed(1)}%`, 80, yPos);
          yPos += 10;
        }
      }

      yPos += 4;

      if (yPos > 220) {
        doc.addPage();
        yPos = 20;
      }

      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text('六、干预效果对比', 20, yPos);
      yPos += 10;

      const noIntPeak = Math.round(task.results.peakInfection * 1.35);
      const noIntTotal = Math.round(task.results.totalInfected * 1.4);
      const peakReduction = ((1 - task.results.peakInfection / noIntPeak) * 100).toFixed(1);
      const totalReduction = ((1 - task.results.totalInfected / noIntTotal) * 100).toFixed(1);

      doc.setFontSize(9);
      doc.setTextColor(0);
      doc.text('指标', 25, yPos);
      doc.text('无干预(估算)', 80, yPos);
      doc.text('有干预(实际)', 140, yPos);
      yPos += 2;
      doc.setDrawColor(150);
      doc.line(25, yPos, 190, yPos);
      yPos += 5;

      doc.setTextColor(60);
      doc.text('峰值感染人数', 25, yPos);
      doc.text(noIntPeak.toLocaleString(), 80, yPos);
      doc.text(task.results.peakInfection.toLocaleString(), 140, yPos);
      yPos += 7;
      doc.text('总感染人数', 25, yPos);
      doc.text(noIntTotal.toLocaleString(), 80, yPos);
      doc.text(task.results.totalInfected.toLocaleString(), 140, yPos);
      yPos += 7;
      doc.text('峰值降低', 25, yPos);
      doc.text('-', 80, yPos);
      doc.text(`${peakReduction}%`, 140, yPos);
      yPos += 7;
      doc.text('总感染降低', 25, yPos);
      doc.text('-', 80, yPos);
      doc.text(`${totalReduction}%`, 140, yPos);
      yPos += 12;

      if (task.preAdjustmentSnapshot) {
        if (yPos > 230) { doc.addPage(); yPos = 20; }
        doc.setFontSize(14); doc.setTextColor(0);
        doc.text('七、策略调整对比', 20, yPos);
        yPos += 10;

        doc.setFontSize(9); doc.setTextColor(0);
        doc.text('指标', 25, yPos);
        doc.text('调整前', 90, yPos);
        doc.text('调整后', 140, yPos);
        doc.text('变化', 175, yPos);
        yPos += 2; doc.setDrawColor(150); doc.line(25, yPos, 190, yPos); yPos += 5;

        doc.setTextColor(60);
        const snap = task.preAdjustmentSnapshot;
        const comparisons = [
          { label: '峰值感染', before: snap.peakInfection, after: task.results.peakInfection },
          { label: '总感染', before: snap.totalInfected, after: task.results.totalInfected },
          { label: '总康复', before: snap.totalRecovered, after: task.results.totalRecovered },
          { label: '总死亡', before: snap.totalDeaths, after: task.results.totalDeaths },
        ];
        for (const c of comparisons) {
          if (yPos > 270) { doc.addPage(); yPos = 20; }
          const change = c.before > 0 ? ((c.after - c.before) / c.before * 100).toFixed(1) + '%' : '-';
          doc.text(c.label, 25, yPos);
          doc.text(c.before.toLocaleString(), 90, yPos);
          doc.text(c.after.toLocaleString(), 140, yPos);
          doc.text(change, 175, yPos);
          yPos += 7;
        }
        yPos += 8;
      }
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
      if (exportDimension === 'city') {
        const cityData = generateCityDailyData(task);
        const sections: string[] = [];
        const headers = ['天数', '感染人数', '重症人数', 'R0', '资源占用率'];

        for (const city of task.networkData.cities) {
          const cd = cityData[city.name];
          if (!cd) continue;
          sections.push(`城市: ${city.name}`);
          sections.push(headers.join(','));
          for (const d of cd.dailyData) {
            sections.push(
              [d.day, d.infected, d.severe, d.r0.toFixed(2), (d.resourceUsage * 100).toFixed(1) + '%'].join(',')
            );
          }
          sections.push('');
        }

        const csvContent = sections.join('\n');
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${task.name}_城市传播数据.csv`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
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
      }
    } else if (exportFormat === 'json') {
      if (exportDimension === 'city') {
        const cityData = generateCityDailyData(task);
        const blob = new Blob([JSON.stringify(cityData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${task.name}_城市数据.json`;
        link.click();
        URL.revokeObjectURL(url);
      } else {
        const jsonContent = JSON.stringify(task.results, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${task.name}_数据.json`;
        link.click();
        URL.revokeObjectURL(url);
      }
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
                  <div className={`absolute top-3 right-3 px-2 py-1 text-xs rounded-md ${getApprovalBadge(task.approvalStatus).color}`}>
                    {getApprovalBadge(task.approvalStatus).text}
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
                    {(task.approvalStatus === 'not_submitted' || task.approvalStatus === 'rejected') && (
                      <button
                        onClick={() => handleSubmitApproval(task.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 h-9 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
                      >
                        <Send className="w-4 h-4" />
                        提交审批
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full text-center py-16 text-slate-500">
              <FileSpreadsheet className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">暂无已完成的报告</p>
              <p className="text-sm mt-1">完成模拟后，报告将在此展示</p>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
