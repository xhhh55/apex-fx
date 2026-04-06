import { useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';

export default function Chart({ symbol, interval = '1h', theme }) {
  const containerRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 400,
      layout: {
        backgroundColor: theme.bg,
        textColor: '#EEE8DA',
      },
      grid: {
        vertLines: { color: `${theme.primary}20` },
        horzLines: { color: `${theme.primary}20` },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: `${theme.primary}40` },
      timeScale: { borderColor: `${theme.primary}40` },
    });
    chartRef.current = chart;

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#4ADE80',
      downColor: '#E05252',
      borderVisible: false,
      wickUpColor: '#4ADE80',
      wickDownColor: '#E05252',
    });

    // جلب البيانات التاريخية
    import('../api/prices').then(({ fetchHistorical }) => {
      fetchHistorical(symbol, interval).then(data => {
        candleSeries.setData(data);
      });
    });

    const handleResize = () => {
      chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [symbol, interval, theme]);

  return <div ref={containerRef} />;
}