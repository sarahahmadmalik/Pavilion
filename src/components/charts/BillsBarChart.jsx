import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext.jsx';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
ChartJS.defaults.font.family = "'Outfit', system-ui, -apple-system, sans-serif";

export const BillsBarChart = ({ billItems = [] }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Group bill payments by month or company
  const labels = ['May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026'];
  const totals = [4200, 5100, 9880.50, 4730.50];

  const data = {
    labels,
    datasets: [
      {
        label: 'Monthly Payments (GHS)',
        data: totals,
        backgroundColor: isDark ? '#3B82F6' : '#1A3FA0',
        borderRadius: 6,
        borderSkipped: false
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` Total: GHS ${ctx.raw.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: isDark ? '#94A3B8' : '#64748B', font: { family: "'Outfit', system-ui, sans-serif", size: 11 } }
      },
      y: {
        grid: { color: isDark ? '#2E3B61' : '#E2E8F0' },
        ticks: {
          color: isDark ? '#94A3B8' : '#64748B',
          font: { family: 'Inter', size: 11 },
          callback: (value) => `GHS ${value >= 1000 ? `${value / 1000}k` : value}`
        }
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '240px' }}>
      <Bar data={data} options={options} />
    </div>
  );
};
