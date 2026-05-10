import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Users, UserCog, AlertTriangle, Briefcase, Loader2, ArrowUpRight, MessageSquare, Clock, ChevronDown, ChevronUp, Calendar, GitBranch, CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { getReports, getRequests, getJobs, getRequestStats } from '../../utils/api';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [recentEscalations, setRecentEscalations] = useState([]);
  const [overdueJobs, setOverdueJobs] = useState([]);
  const [showOverdue, setShowOverdue] = useState(false);
  const [loading, setLoading] = useState(true);
  const [pipelineStats, setPipelineStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [overviewRes, reqRes, jobsRes, statsRes, allReqRes] = await Promise.allSettled([
          getReports('/overview'),
          getRequests('limit=6'),
          getJobs('status=assigned&limit=50'),
          getRequestStats(),
          getRequests('escalatedOnly=false&limit=10'),
        ]);
        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value);
        if (reqRes.status === 'fulfilled') setRecentEscalations(reqRes.value?.requests || []);
        if (statsRes.status === 'fulfilled') setPipelineStats(statsRes.value);
        if (allReqRes.status === 'fulfilled') setRecentActivity(allReqRes.value?.requests || []);
        if (jobsRes.status === 'fulfilled') {
          const now = new Date();
          const jobs = jobsRes.value?.jobs || [];
          const overdue = jobs.filter(j => {
            if (j.status === 'completed' || j.status === 'cancelled') return false;
            if (j.dueDate && new Date(j.dueDate) < now) return true;
            if (j.assignedAt && (now - new Date(j.assignedAt)) > 48 * 60 * 60 * 1000 && j.status === 'assigned') return true;
            return false;
          });
          setOverdueJobs(overdue);
        }
      } catch (e) {
        toast.error(e.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const cards = [
    {
      label: 'Residents',
      value: overview?.users?.approvedResidents ?? 0,
      sub: `${overview?.users?.residents ?? 0} total registered`,
      icon: <Users className="w-5 h-5" />,
      bg: 'bg-blue-600',
      path: '/admin/residents'
    },
    {
      label: 'Employees',
      value: overview?.users?.employees ?? 0,
      sub: `${overview?.users?.employees ?? 0} total staff`,
      icon: <UserCog className="w-5 h-5" />,
      bg: 'bg-emerald-600',
      path: '/admin/employees'
    },
    {
      label: 'Service Pipeline',
      value: (pipelineStats?.byStatus?.pending || 0) + (pipelineStats?.byStatus?.inProgress || 0),
      sub: `${pipelineStats?.byStatus?.pending || 0} pending · ${pipelineStats?.byStatus?.inProgress || 0} active`,
      icon: <GitBranch className="w-5 h-5" />,
      bg: 'bg-violet-600',
      path: '/admin/service-pipeline'
    },
    {
      label: 'Jobs',
      value: overview?.jobs?.unfinished ?? 0,
      sub: overdueJobs.length > 0 ? `⚠ ${overdueJobs.length} overdue` : `${overview?.jobs?.completed ?? 0} completed`,
      icon: <Briefcase className="w-5 h-5" />,
      bg: overdueJobs.length > 0 ? 'bg-red-500' : 'bg-amber-500',
      path: null,
      onClick: overdueJobs.length > 0 ? () => setShowOverdue(v => !v) : null,
    },
  ];

  const priorityDot = (p) => {
    if (p === 'urgent') return 'bg-red-500';
    if (p === 'high') return 'bg-orange-400';
    if (p === 'medium') return 'bg-yellow-400';
    return 'bg-gray-300';
  };

  const statusIcon = (s) => {
    if (s === 'completed') return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    if (s === 'rejected' || s === 'cancelled') return <XCircle className="w-3.5 h-3.5 text-red-500" />;
    if (s === 'in-progress') return <Clock className="w-3.5 h-3.5 text-blue-500" />;
    return <Clock className="w-3.5 h-3.5 text-yellow-500" />;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((c, i) => (
            <button
              key={i}
              onClick={() => c.onClick ? c.onClick() : c.path && navigate(c.path)}
              className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`${c.bg} text-white p-2.5 rounded-lg`}>{c.icon}</div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{c.value}</p>
              <p className="text-gray-500 text-sm mt-0.5">{c.label}</p>
              <p className="text-xs text-gray-400 mt-1">{c.sub}</p>
            </button>
          ))}
        </div>

        {/* Overdue jobs alert */}
        {overdueJobs.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl overflow-hidden">
            {/* Banner row */}
            <button
              onClick={() => setShowOverdue(v => !v)}
              className="w-full p-4 flex items-center gap-3 text-left hover:bg-red-100 transition-colors"
            >
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <div className="flex-1">
                <p className="text-red-800 font-medium text-sm">{overdueJobs.length} overdue job{overdueJobs.length > 1 ? 's' : ''} need attention</p>
                <p className="text-red-600 text-xs mt-0.5">Jobs assigned over 48h or past due date — click to {showOverdue ? 'hide' : 'view'} details</p>
              </div>
              {showOverdue
                ? <ChevronUp className="w-5 h-5 text-red-500 shrink-0" />
                : <ChevronDown className="w-5 h-5 text-red-500 shrink-0" />}
            </button>

            {/* Expandable list */}
            {showOverdue && (
              <div className="border-t border-red-200 divide-y divide-red-100">
                {overdueJobs.map(job => (
                  <div key={job._id} className="flex items-center gap-4 px-5 py-3.5 bg-white/60">
                    <Briefcase className="w-4 h-4 text-red-400 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-medium truncate">{job.title}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        Assigned to: <span className="font-medium">{job.assignedTo?.username || 'Unassigned'}</span>
                        {job.category ? ` · ${job.category}` : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      {job.dueDate && (
                        <p className="text-red-600 text-xs font-semibold flex items-center gap-1 justify-end">
                          <Calendar className="w-3 h-3" />
                          Due {new Date(job.dueDate).toLocaleDateString()}
                        </p>
                      )}
                      <p className="text-gray-400 text-xs mt-0.5">
                        Assigned {job.assignedAt ? new Date(job.assignedAt).toLocaleDateString() : '—'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Escalations */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Recent Escalations</h2>
                <p className="text-gray-500 text-xs mt-0.5">Requests forwarded by employees</p>
              </div>
              <button onClick={() => navigate('/admin/requests')} className="text-sm text-blue-600 hover:underline">View all</button>
            </div>

            {recentEscalations.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No escalated requests yet
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentEscalations.slice(0, 5).map((req) => (
                  <div
                    key={req._id}
                    className="px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate('/admin/requests')}
                  >
                    {/* Priority dot */}
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${priorityDot(req.priority)}`} />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-medium truncate">{req.subject || req.category || 'Untitled'}</p>
                      <p className="text-gray-500 text-xs mt-0.5">
                        {req.resident?.username || '—'} · Escalated by {req.escalatedBy?.username || '—'}
                      </p>
                    </div>

                    {/* Status + time */}
                    <div className="text-right shrink-0">
                      <StatusBadge status={req.status} size="sm" />
                      <p className="text-gray-400 text-xs mt-1 flex items-center gap-1 justify-end">
                        <Clock className="w-3 h-3" />
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Recent Activity</h2>
                <p className="text-gray-500 text-xs mt-0.5">Latest requests across all categories</p>
              </div>
              <button onClick={() => navigate('/admin/service-pipeline')} className="text-sm text-blue-600 hover:underline">Pipeline →</button>
            </div>

            {recentActivity.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                <GitBranch className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                No recent activity
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentActivity.slice(0, 6).map((req) => (
                  <div
                    key={req._id}
                    className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate('/admin/service-pipeline')}
                  >
                    {statusIcon(req.status)}
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 text-sm font-medium truncate">{req.subject || '—'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">{req.resident?.username || '—'}</span>
                        {req.serviceType && (
                          <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{req.serviceType}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={req.status} size="sm" />
                      <p className="text-gray-400 text-[10px] mt-0.5">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}