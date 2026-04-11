import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { Users, UserCog, MessageSquare, AlertTriangle, Calendar, ArrowRight, Loader2 } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { useNavigate } from 'react-router-dom';
import { getReports, getRequests } from '../../utils/api';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [recentRequests, setRecentRequests] = useState([]);
  const [urgentRequests, setUrgentRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [overviewRes, requestsRes] = await Promise.allSettled([
          getReports('/overview'),
          getRequests('limit=10&sort=-createdAt'),
        ]);

        if (overviewRes.status === 'fulfilled') setOverview(overviewRes.value);

        if (requestsRes.status === 'fulfilled') {
          const requests = requestsRes.value?.requests || requestsRes.value || [];
          setRecentRequests(requests.slice(0, 5));
          // Urgent = high/urgent priority that are still pending or in-progress
          setUrgentRequests(
            requests
              .filter(r => (r.priority === 'high' || r.priority === 'urgent') && r.status !== 'completed' && r.status !== 'cancelled')
              .slice(0, 4)
          );
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const stats = [
    { label: 'Total Residents', value: overview?.users?.residents ?? '—', icon: <Users className="w-6 h-6" />, color: 'bg-blue-500', path: '/admin/residents' },
    { label: 'Employees', value: (overview?.users?.employees ?? 0) + (overview?.users?.specialEmployees ?? 0), icon: <UserCog className="w-6 h-6" />, color: 'bg-green-500', path: '/admin/employees' },
    { label: 'Open Issues', value: overview?.requests?.pending ?? '—', icon: <MessageSquare className="w-6 h-6" />, color: 'bg-yellow-500', path: '/admin/requests' },
    { label: 'Pending Jobs', value: overview?.jobs?.pending ?? '—', icon: <AlertTriangle className="w-6 h-6" />, color: 'bg-red-500', path: '/admin/requests' },
  ];

  const priorityColor = (p) => {
    if (p === 'urgent') return 'bg-red-100 text-red-700 border border-red-200';
    if (p === 'high') return 'bg-orange-100 text-orange-700 border border-orange-200';
    if (p === 'medium') return 'bg-yellow-100 text-yellow-700 border border-yellow-200';
    return 'bg-gray-100 text-gray-600 border border-gray-200';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1>Dashboard Overview</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-5 h-5" />
            <span>{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <button
              key={index}
              onClick={() => navigate(stat.path)}
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 text-left hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} text-white p-3 rounded-xl`}>
                  {stat.icon}
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <p className="text-gray-500 text-sm mb-1">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-900">
                {loading ? <span className="inline-block w-8 h-6 bg-gray-200 rounded animate-pulse" /> : stat.value}
              </p>
            </button>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Requests — live from API */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900">Recent Requests</h2>
              <button onClick={() => navigate('/admin/requests')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-sm">No requests yet</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider">
                    <tr>
                      <th className="px-5 py-3 text-left">Resident</th>
                      <th className="px-5 py-3 text-left">Category</th>
                      <th className="px-5 py-3 text-left">Priority</th>
                      <th className="px-5 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {recentRequests.map((req) => (
                      <tr
                        key={req._id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate('/admin/requests')}
                      >
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-gray-900">{req.resident?.username || req.resident?.email || '—'}</p>
                          <p className="text-xs text-gray-500">{req.unit || req.resident?.unit || '—'}</p>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-700 capitalize">{req.category || req.type || '—'}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${priorityColor(req.priority)}`}>
                            {req.priority || 'normal'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={req.status} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Urgent Issues — live from API */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
            <div className="p-5 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-base font-semibold text-gray-900">Urgent & High Priority Issues</h2>
              <button onClick={() => navigate('/admin/requests')} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                View all <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-5 space-y-3 flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : urgentRequests.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  No urgent issues right now
                </div>
              ) : (
                urgentRequests.map((req) => (
                  <div
                    key={req._id}
                    className="flex items-start gap-4 p-4 border border-gray-200 rounded-xl hover:border-red-200 hover:bg-red-50/30 transition-colors cursor-pointer"
                    onClick={() => navigate('/admin/requests')}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{req.subject || req.category || '—'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {req.resident?.username || 'Unknown'} · {req.unit || req.resident?.unit || '—'} · {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${priorityColor(req.priority)}`}>
                        {req.priority}
                      </span>
                      <p className="text-xs text-gray-400 mt-1 capitalize">{req.status}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}