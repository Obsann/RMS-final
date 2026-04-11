import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { FileText, Download, Briefcase, MessageSquare, IdCard, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getReports, getRequests, getDigitalIds, getJobs } from '../../utils/api';

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

  // Derived stats from real data
  const completedRequests = requests.filter(r => r.status === 'completed' || r.status === 'resolved').length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const completedJobs = jobs.filter(j => j.status === 'completed').length;
  const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'assigned').length;
  const approvedIds = digitalIds.filter(d => d.status === 'approved').length;
  const pendingIds = digitalIds.filter(d => d.status === 'pending').length;
  const completionRate = requests.length > 0 ? Math.round((completedRequests / requests.length) * 100) : 0;

  // Build employee performance from jobs data
  const empMap = {};
  jobs.forEach(j => {
    const name = j.assignedTo?.username || j.assignedTo?.name || 'Unassigned';
    const cat = j.assignedTo?.jobCategory || 'General';
    if (!empMap[name]) empMap[name] = { name, category: cat, assigned: 0, completed: 0 };
    empMap[name].assigned++;
    if (j.status === 'completed') empMap[name].completed++;
  });
  const employeePerf = Object.values(empMap).slice(0, 6);

  // Category breakdown
  const catMap = {};
  jobs.forEach(j => {
    const cat = j.category || j.assignedTo?.jobCategory || 'General';
    if (!catMap[cat]) catMap[cat] = { category: cat, total: 0, completed: 0 };
    catMap[cat].total++;
    if (j.status === 'completed') catMap[cat].completed++;
  });
  const catBreakdown = Object.values(catMap).slice(0, 6);

  const myStats = [
    { label: 'Tasks Managed', value: loading ? '…' : jobs.length, icon: <Briefcase className="w-6 h-6" />, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Requests Handled', value: loading ? '…' : requests.length, icon: <MessageSquare className="w-6 h-6" />, color: 'text-orange-600', bg: 'bg-orange-50' },
    { label: 'IDs Processed', value: loading ? '…' : approvedIds, icon: <IdCard className="w-6 h-6" />, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Completion Rate', value: loading ? '…' : `${completionRate}%`, icon: <CheckCircle className="w-6 h-6" />, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  // ------ Real CSV/PDF export helpers ------
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

  const handleExportRequests = async (fmt) => {
    setExporting(fmt + '_req');
    try {
      const rows = requests.map(r => ({
        resident: r.resident?.username || '—',
        unit: r.unit || r.resident?.unit || '—',
        category: r.category || '—',
        priority: r.priority || '—',
        status: r.status,
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—',
      }));
      const csv = buildCSV(rows, ['resident', 'unit', 'category', 'priority', 'status', 'date']);
      if (fmt === 'PDF') {
        // Build a simple HTML + print-to-PDF approach
        const html = `<html><head><title>Requests Report</title><style>body{font-family:sans-serif;padding:20px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px 10px;text-align:left}th{background:#f0f0f0} h1{color:#1d4ed8}</style></head><body><h1>Requests Report — ${reportPeriod}</h1><p>Generated: ${new Date().toLocaleString()}</p><table><thead><tr>${['Resident', 'Unit', 'Category', 'Priority', 'Status', 'Date'].map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${Object.values(r).map(v => `<td>${v}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
        const w = window.open('', '_blank');
        w.document.write(html); w.document.close(); w.print();
      } else {
        downloadFile(csv, `requests_report_${Date.now()}.csv`, 'text/csv');
      }
      toast.success(`Requests report exported as ${fmt}`);
    } catch (e) { toast.error('Export failed'); }
    finally { setExporting(''); }
  };

  const handleExportJobs = async (fmt) => {
    setExporting(fmt + '_job');
    try {
      const rows = jobs.map(j => ({
        title: j.title || '—',
        assignedTo: j.assignedTo?.username || '—',
        category: j.category || '—',
        status: j.status,
        date: j.createdAt ? new Date(j.createdAt).toLocaleDateString() : '—',
      }));
      const csv = buildCSV(rows, ['title', 'assignedTo', 'category', 'status', 'date']);
      downloadFile(csv, `tasks_report_${Date.now()}.csv`, 'text/csv');
      toast.success(`Task report exported`);
    } catch (e) { toast.error('Export failed'); }
    finally { setExporting(''); }
  };

  const handleExportIDs = async (fmt) => {
    setExporting(fmt + '_id');
    try {
      const rows = digitalIds.map(d => ({
        resident: d.resident?.username || '—',
        status: d.status,
        requestDate: d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—',
        approvedDate: d.approvedAt ? new Date(d.approvedAt).toLocaleDateString() : '—',
      }));
      const csv = buildCSV(rows, ['resident', 'status', 'requestDate', 'approvedDate']);
      downloadFile(csv, `digital_id_report_${Date.now()}.csv`, 'text/csv');
      toast.success('Digital ID report exported');
    } catch (e) { toast.error('Export failed'); }
    finally { setExporting(''); }
  };

  const handleMainExport = async (fmt) => {
    setExporting(fmt);
    try {
      // Summary CSV with all sections
      const lines = [
        '=== SUMMARY REPORT ===',
        `Period: ${reportPeriod}`,
        `Generated: ${new Date().toLocaleString()}`,
        '',
        '--- REQUESTS ---',
        `Total,${requests.length}`,
        `Completed,${completedRequests}`,
        `Pending,${pendingRequests}`,
        `Completion Rate,${completionRate}%`,
        '',
        '--- TASKS ---',
        `Total,${jobs.length}`,
        `Completed,${completedJobs}`,
        `Pending,${pendingJobs}`,
        '',
        '--- DIGITAL IDs ---',
        `Approved,${approvedIds}`,
        `Pending,${pendingIds}`,
      ];
      downloadFile(lines.join('\n'), `full_report_${reportPeriod}_${Date.now()}.csv`, 'text/csv');
      toast.success(`Full report exported as ${fmt}`);
    } catch (e) { toast.error('Export failed'); }
    finally { setExporting(''); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1>Reports & Analytics</h1>
            <p className="text-gray-600 mt-1">Your performance and team activity reports</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => handleMainExport('PDF')} disabled={!!exporting}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-60">
              <Download className="w-4 h-4" /> {exporting === 'PDF' ? 'Exporting…' : 'PDF'}
            </button>
            <button onClick={() => handleMainExport('Excel')} disabled={!!exporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60">
              <Download className="w-4 h-4" /> {exporting === 'Excel' ? 'Exporting…' : 'Excel'}
            </button>
          </div>
        </div>

        {/* Report Type Selector */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-gray-700 text-sm mb-2">Report Period</label>
              <select value={reportPeriod} onChange={e => setReportPeriod(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="weekly">This Week</option>
                <option value="monthly">This Month</option>
                <option value="quarterly">This Quarter</option>
              </select>
            </div>
            <button onClick={() => handleMainExport('Excel')} disabled={!!exporting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 whitespace-nowrap disabled:opacity-60">
              Generate Report
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {myStats.map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
              <div className={`inline-flex p-3 rounded-xl ${stat.bg} mb-3`}>
                <span className={stat.color}>{stat.icon}</span>
              </div>
              <p className="text-sm text-gray-500 mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? <span className="inline-block w-10 h-5 bg-gray-200 rounded animate-pulse" /> : stat.value}
              </p>
            </div>
          ))}
        </div>

        {/* Employee Performance & Category Breakdown */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Employee Performance — from real jobs data */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Team Performance</h2>
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
            ) : employeePerf.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No assignment data yet</p>
            ) : (
              <div className="space-y-4">
                {employeePerf.map((emp, idx) => {
                  const rate = emp.assigned > 0 ? Math.round((emp.completed / emp.assigned) * 100) : 0;
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 text-xs font-medium">{emp.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-900">{emp.name}</p>
                            <p className="text-xs text-gray-500">{emp.category}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">{emp.completed}/{emp.assigned}</p>
                          <p className="text-xs text-gray-500">{rate}%</p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div className={`h-1.5 rounded-full ${rate >= 90 ? 'bg-green-500' : rate >= 70 ? 'bg-yellow-500' : 'bg-red-400'}`}
                          style={{ width: `${rate}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tasks by Category */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Tasks by Category</h2>
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
            ) : catBreakdown.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No task data yet</p>
            ) : (
              <div className="space-y-4">
                {catBreakdown.map((cat, idx) => {
                  const pct = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
                  const colors = ['bg-blue-500', 'bg-yellow-500', 'bg-cyan-500', 'bg-green-500', 'bg-purple-500', 'bg-red-400'];
                  return (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-gray-700">{cat.category}</span>
                        <span className="text-sm text-gray-500">{cat.completed}/{cat.total}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className={`${colors[idx % colors.length]} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Report Download Cards */}
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              title: 'Task Summary Report',
              desc: 'All tasks managed with employee assignments and completion status',
              icon: <Briefcase className="w-8 h-8 text-blue-600" />,
              onDownload: () => handleExportJobs('CSV'),
              key: 'CSV_job',
            },
            {
              title: 'Requests Report',
              desc: 'Resident requests and complaints handled, with priority and resolution status',
              icon: <MessageSquare className="w-8 h-8 text-orange-600" />,
              onDownload: () => handleExportRequests('Excel'),
              key: 'Excel_req',
            },
            {
              title: 'Digital ID Report',
              desc: 'ID requests processed, pending approvals, and issuance timeline',
              icon: <IdCard className="w-8 h-8 text-purple-600" />,
              onDownload: () => handleExportIDs('CSV'),
              key: 'CSV_id',
            },
          ].map((card) => (
            <div key={card.title} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="mb-4">{card.icon}</div>
              <h3 className="text-sm font-semibold text-gray-900 mb-1">{card.title}</h3>
              <p className="text-sm text-gray-500 mb-4">{card.desc}</p>
              <button onClick={card.onDownload} disabled={exporting === card.key || loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm disabled:opacity-60">
                {exporting === card.key ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {exporting === card.key ? 'Downloading…' : 'Download'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
