import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { TimePoint } from '../../types';
import { CHART_COLORS } from '../../constants';

interface InfectionCurveChartProps {
  data: TimePoint[];
  height?: number;
}

export function InfectionCurveChart({ data, height = 400 }: InfectionCurveChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
    }

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(71, 85, 105, 0.5)',
        textStyle: { color: '#e2e8f0' },
      },
      legend: {
        data: ['易感人群', '潜伏人群', '感染人群', '康复人群', '重症人群'],
        textStyle: { color: '#94a3b8' },
        top: 10,
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 50,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => `第${d.day}天`),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b' },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b' },
        splitLine: { lineStyle: { color: '#1e293b' } },
      },
      series: [
        {
          name: '易感人群',
          type: 'line',
          stack: 'total',
          smooth: true,
          showSymbol: false,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.5)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ]),
          },
          lineStyle: { color: CHART_COLORS.susceptible, width: 2 },
          data: data.map((d) => d.susceptible),
        },
        {
          name: '潜伏人群',
          type: 'line',
          stack: 'total',
          smooth: true,
          showSymbol: false,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(234, 179, 8, 0.5)' },
              { offset: 1, color: 'rgba(234, 179, 8, 0.05)' },
            ]),
          },
          lineStyle: { color: CHART_COLORS.exposed, width: 2 },
          data: data.map((d) => d.exposed),
        },
        {
          name: '感染人群',
          type: 'line',
          stack: 'total',
          smooth: true,
          showSymbol: false,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(239, 68, 68, 0.5)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0.05)' },
            ]),
          },
          lineStyle: { color: CHART_COLORS.infected, width: 2 },
          data: data.map((d) => d.infected),
        },
        {
          name: '重症人群',
          type: 'line',
          stack: 'total',
          smooth: true,
          showSymbol: false,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(249, 115, 22, 0.5)' },
              { offset: 1, color: 'rgba(249, 115, 22, 0.05)' },
            ]),
          },
          lineStyle: { color: CHART_COLORS.severe, width: 2 },
          data: data.map((d) => d.severe),
        },
        {
          name: '康复人群',
          type: 'line',
          stack: 'total',
          smooth: true,
          showSymbol: false,
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(16, 185, 129, 0.5)' },
              { offset: 1, color: 'rgba(16, 185, 129, 0.05)' },
            ]),
          },
          lineStyle: { color: CHART_COLORS.recovered, width: 2 },
          data: data.map((d) => d.recovered),
        },
      ],
    };

    chartInstance.current.setOption(option);

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [data]);

  return <div ref={chartRef} style={{ height }} />;
}
