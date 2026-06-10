import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';

interface ResourceGaugeProps {
  value: number;
  title?: string;
  height?: number;
}

export function ResourceGauge({ value, title = '医疗资源占用率', height = 200 }: ResourceGaugeProps) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark');
    }

    const percentage = Math.min(100, value * 100);
    let color = '#10b981';
    if (percentage >= 90) color = '#ef4444';
    else if (percentage >= 75) color = '#f59e0b';
    else if (percentage >= 60) color = '#06b6d4';

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          splitNumber: 10,
          itemStyle: { color },
          progress: {
            show: true,
            width: 12,
            roundCap: true,
          },
          pointer: {
            show: false,
          },
          axisLine: {
            lineStyle: {
              width: 12,
              color: [[1, 'rgba(51, 65, 85, 0.5)']],
            },
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          title: {
            show: true,
            offsetCenter: [0, '70%'],
            fontSize: 12,
            color: '#64748b',
          },
          detail: {
            valueAnimation: true,
            fontSize: 28,
            fontWeight: 'bold',
            offsetCenter: [0, '30%'],
            formatter: '{value}%',
            color,
          },
          data: [
            {
              value: parseFloat(percentage.toFixed(1)),
              name: title,
            },
          ],
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
  }, [value, title]);

  return <div ref={chartRef} style={{ height }} />;
}
