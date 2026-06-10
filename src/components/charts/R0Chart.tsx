import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { CHART_COLORS, DEFAULT_THRESHOLDS } from '../../constants';

interface R0ChartProps {
  data: number[];
  height?: number;
  showThresholds?: boolean;
}

export function R0Chart({ data, height = 300, showThresholds = true }: R0ChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
    }

    const markLines = showThresholds
      ? {
          markLine: {
            silent: true,
            data: [
              {
                yAxis: DEFAULT_THRESHOLDS.r0Warning.low,
                label: { formatter: '低预警', color: '#60a5fa' },
                lineStyle: { color: '#3b82f6', type: 'dashed' as const },
              },
              {
                yAxis: DEFAULT_THRESHOLDS.r0Warning.medium,
                label: { formatter: '中预警', color: '#facc15' },
                lineStyle: { color: '#eab308', type: 'dashed' as const },
              },
              {
                yAxis: DEFAULT_THRESHOLDS.r0Warning.high,
                label: { formatter: '高预警', color: '#fb923c' },
                lineStyle: { color: '#f97316', type: 'dashed' as const },
              },
            ],
          },
        }
      : {};

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: 'rgba(71, 85, 105, 0.5)',
        textStyle: { color: '#e2e8f0' },
        formatter: (params: any) => {
          const value = params[0];
          return `第${value.dataIndex}天<br/>R0: <b>${value.data.toFixed(2)}</b>`;
        },
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: 30,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: data.map((_, i) => i),
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b', formatter: (value: string) => `第${value}天` },
      },
      yAxis: {
        type: 'value',
        axisLine: { lineStyle: { color: '#334155' } },
        axisLabel: { color: '#64748b' },
        splitLine: { lineStyle: { color: '#1e293b' } },
      },
      series: [
        {
          name: 'R0',
          type: 'line',
          smooth: true,
          showSymbol: false,
          lineStyle: { color: CHART_COLORS.r0, width: 3 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(6, 182, 212, 0.4)' },
              { offset: 1, color: 'rgba(6, 182, 212, 0.02)' },
            ]),
          },
          data,
          ...markLines,
        } as echarts.SeriesOption,
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
  }, [data, showThresholds]);

  return <div ref={chartRef} style={{ height }} />;
}
