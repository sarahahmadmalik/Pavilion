import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { useTheme } from '../../context/ThemeContext.jsx';

ChartJS.register(ArcElement, Tooltip, Legend);

export const MaintenancePieChart = ({ openCount = 0, inProgressCount = 0, resolvedCount = 0 }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const data = {
    labels: ['Open Issues', 'In Progress', 'Resolved'],
    datasets: [
      {
        data: [openCount, inProgressCount, resolvedCount],
        backgroundColor: [
          '#EF4444', // Red
          '#F59E0B', // Amber
          '#10B981'  // Green
        ],
        borderColor: isDark ? '#1C2541' : '#FFFFFF',
        borderWidth: 2
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDark ? '#F8FAFC' : '#0F172A',
          font: { family: 'Inter', size: 12 },
          padding: 16
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.label}: ${context.raw} issues`
        }
      }
    }
  };

  return (
    <div style={{ width: '100%', height: '240px' }}>
      <Pie data={data} options={options} />
    </div>
  );
};
