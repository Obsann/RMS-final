import React, { useMemo } from 'react';
import { BarChart2, TrendingUp, Clock, Target, Award } from 'lucide-react';

export default function PerformanceMetrics({ jobs = [], requests = [] }) {
  const metrics = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 86400000);
    const monthAgo = new Date(now.getTime() - 30 * 86400000);

    const completedJobs = jobs.filter(j => j.status === 'completed');
    const completedReqs = requests.filter(r => r.status === 'completed' || r.status === 'resolved');
    const allCompleted = [...completedJobs, ...completedReqs];

    const weekCompleted = allCompleted.filter(i => new Date(i.completedAt || i.updatedAt || i.createdAt) >= weekAgo);
    const monthCompleted = allCompleted.filter(i => new Date(i.completedAt || i.updatedAt || i.createdAt) >= monthAgo);

    // Avg handling time (mock calculation based on creation→completion)
    const calcAvg = (items) => {
      if (items.length === 0) return '—';
      const times = items.map(i => {
        const start = new Date(i.createdAt).getTime();
        const end = new Date(i.completedAt || i.updatedAt || Date.now()).getTime();
        return (end - start) / 60000; // minutes
      }).filter(t => t > 0 && t < 100000);
      if (times.length === 0) return '—';
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      if (avg < 60) return `${avg.toFixed(1)} mins`;
      return `${(avg / 60).toFixed(1)} hrs`;
    };

    const calcAccuracy = (items) => {
      if (items.length === 0) return '—';
      // Simulated: completed / (completed + rejected)
      const rejected = items.filter(i => i.status === 'rejected').length;
      const total = items.length + rejected;
      if (total === 0) return '—';
      return `${((items.length / total) * 100).toFixed(1)}%`;
    };

    return [
      {
        period: 'Today',
        completed: allCompleted.filter(i => {
          const d = new Date(i.completedAt || i.updatedAt || i.createdAt);
          return d.toDateString() === now.toDateString();
        }).length,
        avgTime: '—',
        accuracy: '—',
      },
      {
        period: 'This Week',
        completed: weekCompleted.length,
        avgTime: calcAvg(weekCompleted),
        accuracy: calcAccuracy(weekCompleted),
      },
      {
        period: 'This Month',
        completed: monthCompleted.length,
        avgTime: calcAvg(monthCompleted),
        accuracy: calcAccuracy(monthCompleted),
      },
      {
        period: 'All Time',
        completed: allCompleted.length,
        avgTime: calcAvg(allCompleted),
        accuracy: calcAccuracy(allCompleted),
      },
    ];
  }, [jobs, requests]);

  const totalCompleted = metrics[metrics.length - 1]?.completed || 0;
  const weekCompleted = metrics[1]?.completed || 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" id="performance-metrics">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
              <BarChart2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900 text-sm">Performance Metrics</h2>
              <p className="text-xs text-gray-500">Your KPI tracking dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
              <Award className="w-3.5 h-3.5 text-green-600" />
              <span className="text-xs font-bold text-green-700">{totalCompleted} Total</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-bold text-blue-700">{weekCompleted} This Week</span>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Period</th>
              <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tasks Completed</th>
              <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Avg. Handling Time</th>
              <th className="px-6 py-3 text-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">Accuracy Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {metrics.map((row, i) => (
              <tr key={row.period} className="hover:bg-blue-50/30 transition-colors">
                <td className="px-6 py-3.5">
                  <span className="text-sm font-semibold text-gray-900">{row.period}</span>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-bold tabular-nums">
                    <Target className="w-3.5 h-3.5" />{row.completed}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />{row.avgTime}
                  </span>
                </td>
                <td className="px-6 py-3.5 text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-bold ${
                    row.accuracy === '—' ? 'text-gray-400' :
                    parseFloat(row.accuracy) >= 95 ? 'bg-green-50 text-green-700' :
                    parseFloat(row.accuracy) >= 80 ? 'bg-yellow-50 text-yellow-700' :
                    'bg-red-50 text-red-700'
                  }`}>
                    {row.accuracy}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
