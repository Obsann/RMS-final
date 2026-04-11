import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Users, AlertTriangle, MessageSquare, IdCard, ArrowRight, Loader2, Calendar } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { getReports, getRequests, getDigitalIds } from '../../utils/api';

export default function SpecialEmployeeDashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentIssues, setRecentIssues] = useState([]);
  const [perf, setPerf] = useState({ resolved: 0, handled: 0, ids: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [overviewRes, reqRes, idRes] = await Promise.allSettled([
          getReports('/overview'),
          getRequests('limit=10&sort=-createdAt'),
          getDigitalIds('status=pending&limit=50'),
        ]);

        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value);

        if (reqRes.status === 'fulfilled') {
          const all = reqRes.value?.requests || reqRes.value || [];
          setRecentRequests(all.filter(r => r.status === 'pending' || r.status === 'in-progress').slice(0, 5));
          setRecentIssues(
            all.filter(r => r.priority === 'high' || r.priority === 'urgent').slice(0, 4)
          );
          const resolved = all.filter(r => r.status === 'completed' || r.status === 'resolved').length;
          const handled = all.filter(r => r.status !== 'pending').length;
          setPerf(prev => ({ ...prev, resolved, handled }));
        }

        if (idRes.status === 'fulfilled') {
          const ids = idRes.value?.digitalIds || idRes.value || [];
          setPerf(prev => ({ ...prev, ids: ids.length }));
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const stats = [
    { label: 'Total Residents', value: overview?.users?.residents ?? '—', icon: <Users className="w-6 h-6" />, color: 'bg-blue-500', path: '/special-employee/residents' },
    { label: 'Open Issues', value: overview?.requests?.pending ?? '—', icon: <AlertTriangle className="w-6 h-6" />, color: 'bg-red-500', path: '/special-employee/requests' },
    { label: 'Pending Requests', value: overview?.requests?.pending ?? '—', icon: <MessageSquare className="w-6 h-6" />, color: 'bg-yellow-500', path: '/special-employee/requests' },
    { label: 'ID Requests', value: overview?.digitalIds?.pending ?? perf.ids, icon: <IdCard className="w-6 h-6" />, color: 'bg-green-500', path: '/special-employee/digital-id' },
  ];

  const priorityColor = (p) => {
    if (p === 'urgent') return 'bg-red-100 text-red-700';
    if (p === 'high') return 'bg-orange-100 text-orange-700';
    if (p === 'medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1>Dashboard Overview</h1>
            <p className="text-gray-600 mt-1">Welcome! Here's today's community overview.</p>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <button key={idx} onClick={() => navigate(stat.path)}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 text-left hover:shadow-md transition-shadow group">
              <div className="flex items-center justify-between mb-3">
                <div className={`${stat.color} text-white p-2.5 rounded-xl`}>{stat.icon}</div>
                <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? <span className="inline-block w-8 h-5 bg-gray-200 rounded animate-pulse" /> : stat.value}
              </p>
            </button>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Community Issues */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">High Priority Issues</h2>
              <button onClick={() => navigate('/special-employee/requests')}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-gray-100 flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
              ) : recentIssues.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">No urgent issues right now</div>
              ) : recentIssues.map((issue, i) => (
                <div key={issue._id || i} className="p-4 hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/special-employee/requests')}>
                  <div className="flex items-start justify-between mb-1">
                    <p className="text-sm text-gray-900 flex-1 pr-3 truncate">{issue.subject || issue.category || '—'}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${priorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {issue.resident?.username || '—'} · {issue.unit || issue.resident?.unit || '—'}
                  </p>
                  <div className="mt-1"><StatusBadge status={issue.status} size="sm" /></div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Requests */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">Recent Pending Requests</h2>
              <button onClick={() => navigate('/special-employee/requests')}
                className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-10"><Loader2 className="w-6 h-6 text-blue-500 animate-spin" /></div>
            ) : recentRequests.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">No pending requests</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 text-left">Resident</th>
                      <th className="px-5 py-3 text-left">Category</th>
                      <th className="px-5 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentRequests.map((req, i) => (
                      <tr key={req._id || i} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate('/special-employee/requests')}>
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-gray-900">{req.resident?.username || '—'}</p>
                          <p className="text-xs text-gray-500">{req.unit || req.resident?.unit || ''}</p>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700 capitalize">{req.category || req.type || '—'}</td>
                        <td className="px-5 py-3.5"><StatusBadge status={req.status} size="sm" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Performance Summary — calculated from real API data */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Activity Summary</h2>
          <div className="grid sm:grid-cols-4 gap-4">
            {[
              { label: 'Issues Resolved', value: loading ? '…' : perf.resolved, pct: overview ? Math.min(100, Math.round((perf.resolved / Math.max(perf.handled, 1)) * 100)) : 0, color: 'bg-blue-500' },
              { label: 'Requests Handled', value: loading ? '…' : perf.handled, pct: overview ? Math.min(100, Math.round((perf.handled / Math.max((overview?.requests?.total || perf.handled), 1)) * 100)) : 0, color: 'bg-green-500' },
              { label: 'ID Requests Pending', value: loading ? '…' : perf.ids, pct: perf.ids > 0 ? 40 : 0, color: 'bg-purple-500' },
              { label: 'Open vs Total', value: loading ? '…' : `${overview?.requests?.pending ?? 0}/${overview?.requests?.total ?? 0}`, pct: overview ? Math.min(100, Math.round(((overview.requests?.pending || 0) / Math.max(overview.requests?.total || 1, 1)) * 100)) : 0, color: 'bg-yellow-500' },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600">{item.label}</p>
                  <p className="text-sm font-semibold text-gray-900">{item.value}</p>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
