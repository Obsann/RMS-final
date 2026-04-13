import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import {
  FileText, Download, Briefcase, MessageSquare, IdCard, CheckCircle,
  Loader2, TrendingUp, BarChart3, Users, Target, Award, ArrowUpRight,
  Zap, Clock, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { getReports, getRequests, getDigitalIds, getJobs } from '../../utils/api';

function StatCard({ icon: Icon, gradient, label, value, loading, sub }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 bg-gradient-to-br ${gradient} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-3xl font-black text-gray-900 tabular-nums">
        {loading ? <span className="inline-block w-12 h-7 bg-gray-100 rounded-lg animate-pulse" /> : value}
      </p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function ProgressRow({ label, completed, total, colorClass }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-sm font-semibold text-gray-700 truncate">{label}</p>
        <div className="flex items-center gap-2 text-right flex-shrink-0">
          <p className="text-sm font-black text-gray-900 tabular-nums">{completed}/{total}</p>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            pct >= 90 ? 'bg-emerald-100 text-emerald-700' : pct >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
          }`}>{pct}%</span>
        </div>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full transition-all duration-700 ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SpecialEmployeeReports() {
  const [reportPeriod, setReportPeriod] = useState('monthly');
  const [overview, setOverview] = useState(null);
  const [requests, setRequests] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [digitalIds, setDigitalIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [ovRes, reqRes, jobRes, idRes] = await Promise.allSettled([
          getReports('/overview'),
          getRequests('limit=200'),
          getJobs('limit=200'),
          getDigitalIds('limit=200'),
        ]);
        if (ovRes.status === 'fulfilled') setOverview(ovRes.value);
        if (reqRes.status === 'fulfilled') setRequests(reqRes.value?.requests || reqRes.value || []);
        if (jobRes.status === 'fulfilled') setJobs(jobRes.value?.jobs || jobRes.value || []);
        if (idRes.status === 'fulfilled') setDigitalIds(idRes.value?.digitalIds || idRes.value || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const completedReqs = requests.filter(r => r.status === 'completed' || r.status === 'resolved').length;
  const pendingReqs = requests.filter(r => r.status === 'pending').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'assigned').length;
  const approvedIds = digitalIds.filter(d => d.status === 'approved' || d.status === 'issued').length;
  const pendingIds = digitalIds.filter(d => d.status === 'pending').length;
  const completionRate = requests.length > 0 ? Math.round((completedReqs / requests.length) * 100) : 0;

  const empMap = {};
  jobs.forEach(j => {
    const name = j.assignedTo?.username || 'Unassigned';
    const cat = j.assignedTo?.jobCategory || 'General';
    if (!empMap[name]) empMap[name] = { name, category: cat, assigned: 0, completed: 0 };
    empMap[name].assigned++;
    if (j.status === 'completed') empMap[name].completed++;
  });
  const employeePerf = Object.values(empMap).slice(0, 8);

  const catMap = {};
  jobs.forEach(j => {
    const cat = j.category || j.assignedTo?.jobCategory || 'General';
    if (!catMap[cat]) catMap[cat] = { category: cat, total: 0, completed: 0 };
    catMap[cat].total++;
    if (j.status === 'completed') catMap[cat].completed++;
  });
  const catBreakdown = Object.values(catMap).slice(0, 6);

  const catColors = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-cyan-500'];

  const buildCSV = (rows, cols) => {
    const header = cols.join(',');
    const body = rows.map(r => cols.map(c => `"${(r[c] ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    return `${header}\n${body}`;
  };

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = async (type, fmt) => {
    const key = `${fmt}_${type}`;
    setExporting(key);
    try {
      if (type === 'requests') {
        const rows = requests.map(r => ({ resident: r.resident?.username || '—', unit: r.unit || '—', category: r.category || '—', priority: r.priority || '—', status: r.status, date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—' }));
        if (fmt === 'PDF') {
          const html = `<html><head><title>Requests Report</title><style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}th{background:#e0e7ff;color:#3730a3}h1{color:#4f46e5}</style></head><body><h1>Requests Report — ${reportPeriod}</h1><p>Generated: ${new Date().toLocaleString()}</p><table><thead><tr>${['Resident','Unit','Category','Priority','Status','Date'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${Object.values(r).map(v=>`<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
          const w = window.open('', '_blank'); w.document.write(html); w.document.close(); w.print();
        } else {
          downloadFile(buildCSV(rows, ['resident','unit','category','priority','status','date']), `requests_${Date.now()}.csv`, 'text/csv');
        }
      } else if (type === 'jobs') {
        const rows = jobs.map(j => ({ title: j.title || '—', assignedTo: j.assignedTo?.username || '—', category: j.category || '—', status: j.status, date: j.createdAt ? new Date(j.createdAt).toLocaleDateString() : '—' }));
        downloadFile(buildCSV(rows, ['title','assignedTo','category','status','date']), `tasks_${Date.now()}.csv`, 'text/csv');
      } else if (type === 'ids') {
        const rows = digitalIds.map(d => ({ resident: d.resident?.username || '—', status: d.status, requested: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—' }));
        downloadFile(buildCSV(rows, ['resident','status','requested']), `digital_ids_${Date.now()}.csv`, 'text/csv');
      } else {
        const lines = [`Summary Report — ${reportPeriod}`, `Generated: ${new Date().toLocaleString()}`, '', '--- REQUESTS ---', `Total,${requests.length}`, `Completed,${completedReqs}`, `Pending,${pendingReqs}`, `Rate,${completionRate}%`, '', '--- TASKS ---', `Total,${jobs.length}`, `Completed,${completedJobs}`, `Pending,${pendingJobs}`, '', '--- DIGITAL IDs ---', `Approved,${approvedIds}`, `Pending,${pendingIds}`];
        downloadFile(lines.join('\n'), `full_report_${reportPeriod}_${Date.now()}.csv`, 'text/csv');
      }
      toast.success('Export successful');
    } catch { toast.error('Export failed'); }
    finally { setExporting(''); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="relative rounded-2xl overflow-hidden p-6 md:p-8"
          style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #334155 100%)' }}>
          <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-9 h-9 bg-blue-500/20 border border-blue-400/30 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                </div>
                <span className="text-blue-400 text-sm font-bold uppercase tracking-widest">Analytics</span>
              </div>
              <h1 className="text-2xl font-black text-white">Reports & Analytics</h1>
              <p className="text-slate-400 text-sm mt-0.5">Performance summary and exportable reports</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <select value={reportPeriod} onChange={e => setReportPeriod(e.target.value)}
                className="px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400">
                <option value="weekly" className="text-gray-900">This Week</option>
                <option value="monthly" className="text-gray-900">This Month</option>
                <option value="quarterly" className="text-gray-900">This Quarter</option>
              </select>
              <button onClick={() => handleExport('summary', 'CSV')} disabled={!!exporting}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold disabled:opacity-60 transition-colors">
                {exporting === 'CSV_summary' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Export Full Report
              </button>
            </div>
          </div>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Briefcase} gradient="from-blue-500 to-indigo-600" label="Tasks Managed" value={jobs.length} loading={loading} sub={`${completedJobs} completed`} />
          <StatCard icon={MessageSquare} gradient="from-amber-500 to-orange-600" label="Requests Handled" value={requests.length} loading={loading} sub={`${completedReqs} resolved`} />
          <StatCard icon={IdCard} gradient="from-purple-500 to-violet-600" label="IDs Processed" value={approvedIds} loading={loading} sub={`${pendingIds} pending`} />
          <StatCard icon={Target} gradient="from-emerald-500 to-teal-600" label="Completion Rate" value={`${completionRate}%`} loading={loading} sub="Overall rate" />
        </div>

        {/* Performance + Category */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Team Performance */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center gap-3">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Team Performance</h2>
                <p className="text-xs text-gray-500">Tasks completed per staff member</p>
              </div>
              <button onClick={() => handleExport('jobs', 'CSV')} disabled={!!exporting}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 text-xs font-semibold transition-colors disabled:opacity-50">
                <Download className="w-3 h-3" /> CSV
              </button>
            </div>
            <div className="p-5 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /></div>
              ) : employeePerf.length === 0 ? (
                <p className="text-gray-400 text-sm py-6 text-center">No assignment data yet</p>
              ) : employeePerf.map((emp, idx) => (
                <ProgressRow key={idx} label={`${emp.name} · ${emp.category}`} completed={emp.completed} total={emp.assigned}
                  colorClass={emp.completed / Math.max(emp.assigned, 1) >= 0.9 ? 'bg-emerald-500' : emp.completed / Math.max(emp.assigned, 1) >= 0.7 ? 'bg-amber-500' : 'bg-red-400'} />
              ))}
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-violet-50 flex items-center gap-3">
              <div className="w-9 h-9 bg-purple-600 rounded-xl flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Tasks by Category</h2>
                <p className="text-xs text-gray-500">Completion rate by service type</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-purple-500 animate-spin" /></div>
              ) : catBreakdown.length === 0 ? (
                <p className="text-gray-400 text-sm py-6 text-center">No category data yet</p>
              ) : catBreakdown.map((cat, idx) => (
                <ProgressRow key={idx} label={cat.category} completed={cat.completed} total={cat.total} colorClass={catColors[idx % catColors.length]} />
              ))}
            </div>
          </div>
        </div>

        {/* Request Status Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Requests Overview</h2>
                <p className="text-xs text-gray-500">Current status breakdown</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleExport('requests', 'CSV')} disabled={!!exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 text-xs font-semibold disabled:opacity-50">
                <Download className="w-3 h-3" /> CSV
              </button>
              <button onClick={() => handleExport('requests', 'PDF')} disabled={!!exporting}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50">
                <Download className="w-3 h-3" /> PDF
              </button>
            </div>
          </div>
          <div className="p-6 grid sm:grid-cols-4 gap-4">
            {[
              { label: 'Total', val: requests.length, color: 'text-gray-900', bg: 'bg-gray-50', border: 'border-gray-200' },
              { label: 'Pending', val: pendingReqs, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
              { label: 'In Progress', val: requests.filter(r => r.status === 'in-progress' || r.status === 'assigned').length, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
              { label: 'Completed', val: completedReqs, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
            ].map((item, i) => (
              <div key={i} className={`p-4 ${item.bg} border ${item.border} rounded-xl text-center`}>
                <p className={`text-3xl font-black tabular-nums ${item.color}`}>{loading ? '…' : item.val}</p>
                <p className={`text-xs font-bold uppercase tracking-wider mt-1 ${item.color} opacity-70`}>{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Export Report Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: 'Task Summary', desc: 'Employee assignments and completion status', icon: Briefcase, gradient: 'from-blue-500 to-indigo-600', onClick: () => handleExport('jobs', 'CSV'), key: 'CSV_jobs' },
            { title: 'Community Requests', desc: 'Resident requests & complaints with resolution status', icon: MessageSquare, gradient: 'from-amber-500 to-orange-600', onClick: () => handleExport('requests', 'CSV'), key: 'CSV_requests' },
            { title: 'Digital ID Report', desc: 'ID processing history and pending queue', icon: IdCard, gradient: 'from-purple-500 to-violet-600', onClick: () => handleExport('ids', 'CSV'), key: 'CSV_ids' },
          ].map(card => (
            <div key={card.title} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className={`h-2 bg-gradient-to-r ${card.gradient}`} />
              <div className="p-5">
                <div className={`w-12 h-12 bg-gradient-to-br ${card.gradient} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">{card.title}</h3>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{card.desc}</p>
                <button onClick={card.onClick} disabled={exporting === card.key || loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold text-gray-700 disabled:opacity-50 transition-colors">
                  {exporting === card.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {exporting === card.key ? 'Downloading…' : 'Download CSV'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
