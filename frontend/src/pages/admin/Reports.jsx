import React, { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FileText, Download, TrendingUp, Users, Briefcase, MessageSquare, IdCard, Calendar } from 'lucide-react';
import { toast } from 'sonner';

const summaryStats = [
  { label: 'Total Residents', value: '487', icon: <Users className="w-6 h-6" />, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'tasks This Month', value: '128', icon: <Briefcase className="w-6 h-6" />, color: 'text-purple-600', bg: 'bg-purple-50' },
  { label: 'Requests Handled', value: '94', icon: <MessageSquare className="w-6 h-6" />, color: 'text-orange-600', bg: 'bg-orange-50' },
  { label: 'IDs Issued', value: '37', icon: <IdCard className="w-6 h-6" />, color: 'text-green-600', bg: 'bg-green-50' },
];

const taskStats = [
  { category: 'Water Supply', total: 32, completed: 28, inProgress: 3, pending: 1 },
  { category: 'Electricity', total: 27, completed: 22, inProgress: 4, pending: 1 },
  { category: 'Sanitation', total: 19, completed: 15, inProgress: 2, pending: 2 },
  { category: 'Public Infrastructure', total: 24, completed: 20, inProgress: 3, pending: 1 },
  { category: 'Waste Management', total: 18, completed: 18, inProgress: 0, pending: 0 },
  { category: 'Security', total: 8, completed: 7, inProgress: 1, pending: 0 },
];

const employeePerformance = [
  { name: 'Samuel Fayisa', category: 'Water Supply', completed: 18, rating: 4.8 },
  { name: 'Tesfaye Alemu', category: 'Electricity', completed: 15, rating: 4.6 },
  { name: 'Biruk Woldemariam', category: 'Sanitation', completed: 12, rating: 4.7 },
  { name: 'Mekonnen Desta', category: 'General', completed: 14, rating: 4.5 },
  { name: 'Hana Worku', category: 'Road Maintenance', completed: 10, rating: 4.4 },
];

const monthlyRequests = [
  { month: 'Sep 2025', requests: 67, resolved: 62 },
  { month: 'Oct 2025', requests: 72, resolved: 69 },
  { month: 'Nov 2025', requests: 81, resolved: 78 },
  { month: 'Dec 2025', requests: 58, resolved: 55 },
  { month: 'Jan 2026', requests: 91, resolved: 87 },
  { month: 'Feb 2026', requests: 94, resolved: 84 },
];

export default function AdminReports() {
  const [reportType, setReportType] = useState('monthly');
  const [dateRange, setDateRange] = useState({ from: '2026-02-01', to: '2026-02-27' });

  const handleExport = (type) => {
    if (type === 'PDF') {
      window.print();
      return;
    }

    // Generate functional dummy CSV download
    const csvContent = "data:text/csv;charset=utf-8,"
      + "Report Name,Date Range,Value,Status\n"
      + `${type} Report,${dateRange.from} to ${dateRange.to},Data Exported,Complete`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RMS_${type.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`${type} report downloaded successfully!`);
  };

  const maxRequests = Math.max(...monthlyRequests.map(m => m.requests));

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1>Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Comprehensive property management reports</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => handleExport('PDF')}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button
              onClick={() => handleExport('Excel')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Download className="w-4 h-4" /> Export Excel
            </button>
          </div>
        </div>

        {/* Date Range & Report Type */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-gray-700 mb-2">Report Type</label>
              <select
                value={reportType}
                onChange={e => setReportType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly Summary</option>
                <option value="quarterly">Quarterly Report</option>
                <option value="annual">Annual Report</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 mb-2">From</label>
              <input type="date" value={dateRange.from} onChange={e => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex-1">
              <label className="block text-gray-700 mb-2">To</label>
              <input type="date" value={dateRange.to} onChange={e => setDateRange({ ...dateRange, to: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button
              onClick={() => toast.success(`Report data generated for ${dateRange.from} to ${dateRange.to}`)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap"
            >
              Generate Report
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryStats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className={`inline-flex p-3 rounded-lg ${stat.bg} mb-3`}>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <p className="text-gray-600 mb-1">{stat.label}</p>
              <p className="text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Monthly Requests Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2>Monthly Requests Overview</h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-full"></span><span className="text-gray-600">Received</span></div>
              <div className="flex items-center gap-2"><span className="w-3 h-3 bg-green-500 rounded-full"></span><span className="text-gray-600">Resolved</span></div>
            </div>
          </div>
          <div className="flex items-end gap-3 h-48">
            {monthlyRequests.map((m, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex items-end gap-1 h-36">
                  <div
                    className="flex-1 bg-blue-500 rounded-t opacity-80"
                    style={{ height: `${(m.requests / maxRequests) * 100}%` }}
                    title={`Received: ${m.requests}`}
                  ></div>
                  <div
                    className="flex-1 bg-green-500 rounded-t opacity-80"
                    style={{ height: `${(m.resolved / maxRequests) * 100}%` }}
                    title={`Resolved: ${m.resolved}`}
                  ></div>
                </div>
                <span className="text-gray-500 text-center" style={{ fontSize: '10px' }}>{m.month.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Two-column grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* task Stats by Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="mb-5">tasks by Category</h2>
            <div className="space-y-4">
              {taskStats.map((cat, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-700">{cat.category}</span>
                    <span className="text-gray-600">{cat.completed}/{cat.total}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${(cat.completed / cat.total) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex gap-3 mt-1">
                    <span className="text-green-600" style={{ fontSize: '11px' }}>✓ {cat.completed} done</span>
                    <span className="text-yellow-600" style={{ fontSize: '11px' }}>⟳ {cat.inProgress} in progress</span>
                    <span className="text-gray-500" style={{ fontSize: '11px' }}>○ {cat.pending} pending</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Employee Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="mb-5">Employee Performance</h2>
            <div className="space-y-3">
              {employeePerformance.map((emp, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600">{emp.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-gray-900">{emp.name}</p>
                      <p className="text-gray-600">{emp.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-900">{emp.completed} tasks</p>
                    <div className="flex items-center gap-1 justify-end">
                      <span className="text-yellow-500">★</span>
                      <span className="text-gray-600">{emp.rating}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: 'Resident Report', desc: 'All resident information, dependents, and ID status', icon: <Users className="w-8 h-8 text-blue-600" /> },
            { title: 'task & Task Report', desc: 'task completion rates, employee assignments, and timelines', icon: <Briefcase className="w-8 h-8 text-purple-600" /> },
            { title: 'Digital ID Report', desc: 'ID issuance statistics, pending requests, and completion rates', icon: <IdCard className="w-8 h-8 text-green-600" /> },
          ].map((card, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="mb-4">{card.icon}</div>
              <h3 className="mb-2">{card.title}</h3>
              <p className="text-gray-600 mb-4">{card.desc}</p>
              <button
                onClick={() => handleExport(card.title)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4" /> Download
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
