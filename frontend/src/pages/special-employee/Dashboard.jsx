import React, { useState, useEffect, useContext } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { AuthContext } from '../../App';
import {
  Users, AlertTriangle, MessageSquare, IdCard, ArrowRight, Loader2, Calendar,
  TrendingUp, CheckCircle2, Clock, Zap, Bell, Star, Activity,
  ShieldCheck, ChevronRight, BarChart3, Target, Flame
} from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { getReports, getRequests, getDigitalIds } from '../../utils/api';
import { toast } from 'sonner';

function LiveClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div className="text-right">
      <p className="text-2xl font-bold text-white tabular-nums tracking-tight leading-none">
        {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </p>
      <p className="text-blue-200 text-xs mt-1">
        {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </p>
    </div>
  );
}

function AnimatedBar({ pct, color }) {
  const [w, setW] = useState(0);
  useEffect(() => { const t = setTimeout(() => setW(pct), 300); return () => clearTimeout(t); }, [pct]);
  return (
    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
      <div className={`h-2 rounded-full transition-all duration-1000 ${color}`} style={{ width: `${w}%` }} />
    </div>
  );
}

const priorityConfig = {
  urgent: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500', icon: Flame },
  high: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', dot: 'bg-orange-500', icon: AlertTriangle },
  medium: { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', dot: 'bg-yellow-500', icon: Bell },
  low: { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', dot: 'bg-gray-400', icon: Clock },
};

export default function SpecialEmployeeDashboard() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [urgentIssues, setUrgentIssues] = useState([]);
  const [perf, setPerf] = useState({ resolved: 0, handled: 0, ids: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [overviewRes, reqRes, idRes] = await Promise.allSettled([
          getReports('/overview'),
          getRequests('limit=50&sort=-createdAt'),
          getDigitalIds('status=pending&limit=50'),
        ]);
        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value);
        if (reqRes.status === 'fulfilled') {
          const all = reqRes.value?.requests || reqRes.value || [];
          setRecentRequests(all.filter(r => r.status === 'pending' || r.status === 'in-progress').slice(0, 6));
          setUrgentIssues(all.filter(r => r.priority === 'urgent' || r.priority === 'high').slice(0, 5));
          const resolved = all.filter(r => r.status === 'completed' || r.status === 'resolved').length;
          const handled = all.filter(r => r.status !== 'pending').length;
          setPerf(p => ({ ...p, resolved, handled, total: all.length }));
        }
        if (idRes.status === 'fulfilled') {
          const ids = idRes.value?.digitalIds || idRes.value || [];
          setPerf(p => ({ ...p, ids: ids.length }));
        }
      } catch (e) { toast.error(e.message || 'Failed to load dashboard data'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const stats = [
    {
      label: 'Total Residents',
      value: overview?.users?.residents ?? '—',
      icon: Users,
      gradient: 'from-blue-500 to-blue-700',
      shadow: 'shadow-blue-200',
      lightBg: 'bg-blue-50',
      path: '/special-employee/residents',
      delta: '+3 this week'
    },
    {
      label: 'Open Issues',
      value: overview?.requests?.pending ?? '—',
      icon: AlertTriangle,
      gradient: 'from-rose-500 to-red-700',
      shadow: 'shadow-rose-200',
      lightBg: 'bg-rose-50',
      path: '/special-employee/requests',
      delta: 'Needs attention'
    },
    {
      label: 'In Progress',
      value: overview?.requests?.inProgress ?? '—',
      icon: Activity,
      gradient: 'from-amber-500 to-orange-600',
      shadow: 'shadow-amber-200',
      lightBg: 'bg-amber-50',
      path: '/special-employee/requests',
      delta: 'Being handled'
    },
    {
      label: 'ID Queue',
      value: overview?.digitalIds?.pending ?? perf.ids,
      icon: IdCard,
      gradient: 'from-emerald-500 to-teal-600',
      shadow: 'shadow-emerald-200',
      lightBg: 'bg-emerald-50',
      path: '/special-employee/digital-id',
      delta: 'Pending issuance'
    },
  ];

  const perfItems = [
    { label: 'Issues Resolved', value: perf.resolved, pct: Math.min(100, Math.round((perf.resolved / Math.max(perf.handled, 1)) * 100)), color: 'bg-blue-500' },
    { label: 'Requests Handled', value: perf.handled, pct: Math.min(100, Math.round((perf.handled / Math.max(perf.total, 1)) * 100)), color: 'bg-emerald-500' },
    { label: 'ID Requests Pending', value: perf.ids, pct: Math.min(100, perf.ids * 10), color: 'bg-purple-500' },
    { label: 'Open Ratio', value: `${overview?.requests?.pending ?? 0}/${overview?.requests?.total ?? 0}`, pct: Math.min(100, Math.round(((overview?.requests?.pending || 0) / Math.max(overview?.requests?.total || 1, 1)) * 100)), color: 'bg-amber-500' },
  ];

  const quickActions = [
    { label: 'Review Requests', icon: MessageSquare, path: '/special-employee/requests', color: 'bg-blue-600 hover:bg-blue-700' },
    { label: 'Manage Residents', icon: Users, path: '/special-employee/residents', color: 'bg-indigo-600 hover:bg-indigo-700' },
    { label: 'Digital IDs', icon: IdCard, path: '/special-employee/digital-id', color: 'bg-emerald-600 hover:bg-emerald-700' },
    { label: 'Reports', icon: BarChart3, path: '/special-employee/reports', color: 'bg-purple-600 hover:bg-purple-700' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── HERO HEADER ── */}
        <div className="relative rounded-2xl overflow-hidden p-6 md:p-8"
          style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 40%, #2563eb 70%, #3b82f6 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <div className="absolute top-0 right-0 w-64 h-64 opacity-10"
            style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)' }} />

          <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Star className="w-4 h-4 text-yellow-300" />
                </div>
                <span className="text-blue-200 text-sm font-semibold uppercase tracking-widest">Senior Staff Portal</span>
              </div>
              <h1 className="text-3xl font-black text-white leading-tight">
                Welcome back, {user?.username?.split(' ')[0] || 'Officer'} 👋
              </h1>
              <p className="text-blue-200 mt-1 text-sm">
                Special Employee · Community Operations Division
              </p>
            </div>
            <LiveClock />
          </div>

          {/* Quick Action Bar */}
          <div className="relative mt-6 flex flex-wrap gap-3">
            {quickActions.map((qa, i) => (
              <button key={i} onClick={() => navigate(qa.path)}
                className={`flex items-center gap-2 px-4 py-2 ${qa.color} text-white text-sm font-semibold rounded-xl transition-all shadow-lg hover:scale-105`}>
                <qa.icon className="w-4 h-4" />
                {qa.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <button key={idx} onClick={() => navigate(stat.path)}
              className={`group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden`}>
              <div className="absolute top-0 right-0 w-24 h-24 opacity-5 rounded-full -translate-y-6 translate-x-6"
                style={{ background: 'currentColor' }} />
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg ${stat.shadow} mb-3`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-black text-gray-900 mt-1 tabular-nums">
                {loading ? <span className="inline-block w-10 h-7 bg-gray-100 rounded-lg animate-pulse" /> : stat.value}
              </p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-gray-400">{stat.delta}</p>
                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Urgent Issues - 2 cols */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-rose-50 to-orange-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-rose-600 rounded-xl flex items-center justify-center">
                  <Flame className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-sm">Urgent Priority Issues</h2>
                  <p className="text-xs text-gray-500">Requires immediate attention</p>
                </div>
              </div>
              <button onClick={() => navigate('/special-employee/requests')}
                className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline">
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="ml-2 text-gray-400 text-sm">Loading...</span>
                </div>
              ) : urgentIssues.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm font-medium">No urgent issues right now</p>
                  <p className="text-gray-300 text-xs mt-1">All critical items have been resolved</p>
                </div>
              ) : urgentIssues.map((issue, i) => {
                const cfg = priorityConfig[issue.priority] || priorityConfig.low;
                const Icon = cfg.icon;
                return (
                  <div key={issue._id || i}
                    onClick={() => navigate('/special-employee/requests')}
                    className={`flex items-start gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors group`}>
                    <div className={`w-9 h-9 ${cfg.bg} border ${cfg.border} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${cfg.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 truncate">{issue.subject || issue.category || '—'}</p>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${cfg.bg} ${cfg.color} ${cfg.border} flex-shrink-0 capitalize`}>
                          {issue.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {issue.resident?.username || '—'} · Unit {issue.unit || issue.resident?.unit || '—'}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <StatusBadge status={issue.status} size="sm" />
                        <span className="text-xs text-gray-400">{new Date(issue.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0 mt-1 transition-colors" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity Summary - 1 col */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Activity Summary</h2>
                <p className="text-xs text-gray-500">Performance metrics</p>
              </div>
            </div>
            <div className="p-5 space-y-5">
              {perfItems.map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-xs font-semibold text-gray-600">{item.label}</p>
                    <p className="text-xs font-black text-gray-900 tabular-nums">{loading ? '…' : item.value}</p>
                  </div>
                  <AnimatedBar pct={loading ? 0 : item.pct} color={item.color} />
                  <p className="text-xs text-gray-400 mt-1 text-right">{loading ? '' : `${item.pct}%`}</p>
                </div>
              ))}
            </div>

            {/* Status overview pill */}
            <div className="mx-5 mb-5 p-4 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl text-white">
              <div className="flex items-center gap-2 mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-200" />
                <p className="text-xs font-semibold text-blue-200 uppercase tracking-wide">System Status</p>
              </div>
              <p className="text-lg font-black">Operational</p>
              <p className="text-blue-200 text-xs mt-0.5">All services running normally</p>
            </div>
          </div>
        </div>

        {/* ── PENDING REQUESTS TABLE ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-sm">Pending Requests Queue</h2>
                <p className="text-xs text-gray-500">Active & in-progress items awaiting action</p>
              </div>
            </div>
            <button onClick={() => navigate('/special-employee/requests')}
              className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline">
              Manage all <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {['Resident', 'Category', 'Subject', 'Priority', 'Status', 'Date'].map(h => (
                    <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="w-5 h-5 text-blue-400 animate-spin mx-auto" /></td></tr>
                ) : recentRequests.length === 0 ? (
                  <tr><td colSpan={6} className="py-10 text-center text-gray-400 text-sm">All caught up! No pending requests.</td></tr>
                ) : recentRequests.map((req, i) => {
                  const pCfg = priorityConfig[req.priority] || priorityConfig.low;
                  return (
                    <tr key={req._id || i}
                      onClick={() => navigate('/special-employee/requests')}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xs flex-shrink-0">
                            {(req.resident?.username || 'R').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{req.resident?.username || '—'}</p>
                            <p className="text-xs text-gray-400">Unit {req.unit || req.resident?.unit || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium capitalize">{req.category || '—'}</span>
                      </td>
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="text-sm text-gray-800 truncate">{req.subject || '—'}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className={`w-2 h-2 rounded-full ${pCfg.dot}`} />
                          <span className={`text-xs font-semibold capitalize ${pCfg.color}`}>{req.priority || 'low'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5"><StatusBadge status={req.status} size="sm" /></td>
                      <td className="px-5 py-3.5 text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
}
