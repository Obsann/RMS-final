import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import RequestTracker from '../../components/services/RequestTracker';
import { DEPARTMENT_MAP } from '../../components/services/serviceConfig';
import { getRequests } from '../../utils/api';
import { toast } from 'sonner';
import {
  Search, Filter, ChevronDown, ChevronUp, ChevronRight, Home,
  Briefcase, Clock, Loader2, CheckCircle, AlertTriangle, FileText,
  RefreshCw, ArrowRight, Paperclip, XCircle, UserCog,
} from 'lucide-react';

const STATUS_OPTIONS = ['all', 'pending', 'in-progress', 'completed', 'rejected', 'cancelled'];

export default function MyRequests() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);
      const data = await getRequests();
      setRequests(data.requests || []);
      if (showToast) toast.success('Requests refreshed');
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh on window focus
  useEffect(() => {
    const handleFocus = () => fetchData();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Stats
  const stats = useMemo(() => ({
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    inProgress: requests.filter(r => r.status === 'in-progress' || r.status === 'assigned').length,
    completed: requests.filter(r => r.status === 'completed').length,
    rejected: requests.filter(r => r.status === 'rejected' || r.status === 'cancelled').length,
  }), [requests]);

  // Filter & search
  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const matchesSearch =
        (r.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.serviceType || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.category || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [requests, searchTerm, statusFilter]);

  const getDepartment = (req) => {
    if (req.categoryTag && DEPARTMENT_MAP[req.categoryTag]) return DEPARTMENT_MAP[req.categoryTag];
    // Fallback for legacy requests
    if (req.type === 'complaint') return 'Complaints & Feedback';
    if (req.type === 'certificate') return 'Document Processing';
    return req.category || 'General';
  };

  const getRefId = (id) => `#${(id || '').slice(-6).toUpperCase()}`;

  const getStatusColor = (status) => {
    if (status === 'completed') return 'text-green-600';
    if (status === 'rejected' || status === 'cancelled') return 'text-red-600';
    if (status === 'in-progress') return 'text-blue-600';
    return 'text-yellow-600';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500">
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-blue-600 font-medium">My Requests</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
            <p className="text-gray-600 mt-1">Track all your service requests and submissions</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchData(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={() => navigate('/resident/services')}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              New Request
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Requests', value: stats.total, icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50' },
            { label: 'Pending', value: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'In Progress', value: stats.inProgress, icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500">{stat.label}</p>
                  <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by service, subject, or category..."
                className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              />
            </div>
            {/* Status filter */}
            <div className="flex gap-1.5 flex-wrap">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                    statusFilter === s
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {s === 'all' ? 'All' : s.replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Request List */}
          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-gray-500">Loading your requests...</p>
              </div>
            ) : filteredRequests.length > 0 ? (
              filteredRequests.map((req) => {
                const isExpanded = expandedId === req._id;
                return (
                  <div key={req._id} className="transition-colors hover:bg-gray-50/50">
                    {/* Main Row */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : req._id)}
                      className="w-full p-5 text-left"
                    >
                      <div className="flex items-start gap-4">
                        {/* Left: Info */}
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-gray-400">{getRefId(req._id)}</span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs text-gray-500">
                              {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                            {req.serviceType && (
                              <>
                                <span className="text-xs text-gray-400">·</span>
                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                                  {req.serviceType}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-gray-900 truncate">{req.subject}</p>
                          <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                            <span className="bg-gray-100 px-2 py-0.5 rounded-md">{getDepartment(req)}</span>
                            {req.priority && (
                              <span className={`px-2 py-0.5 rounded-md capitalize ${
                                req.priority === 'high' || req.priority === 'urgent'
                                  ? 'bg-red-50 text-red-600'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {req.priority}
                              </span>
                            )}
                            {req.attachments?.length > 0 && (
                              <span className="flex items-center gap-1 text-gray-400">
                                <Paperclip className="w-3 h-3" /> {req.attachments.length}
                              </span>
                            )}
                            {/* Assigned employee indicator */}
                            {req.assignedEmployee && (
                              <span className="flex items-center gap-1 text-emerald-600">
                                <UserCog className="w-3 h-3" />
                                <span className="font-medium">{req.assignedEmployee.username || 'Employee'}</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Stepper + Chevron */}
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <div className="hidden sm:block">
                            <RequestTracker status={req.status} compact />
                          </div>
                          {isExpanded
                            ? <ChevronUp className="w-5 h-5 text-gray-400" />
                            : <ChevronDown className="w-5 h-5 text-gray-400" />
                          }
                        </div>
                      </div>

                      {/* Mobile stepper */}
                      <div className="sm:hidden mt-3">
                        <RequestTracker status={req.status} compact />
                      </div>
                    </button>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="px-5 pb-5 space-y-4 border-t border-gray-100 bg-gray-50/50">
                        {/* Full Stepper */}
                        <div className="pt-4 max-w-md">
                          <RequestTracker status={req.status} />
                        </div>

                        {/* Assigned Employee */}
                        {req.assignedEmployee && (
                          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                            <UserCog className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm text-emerald-800">
                              Being handled by: <strong>{req.assignedEmployee.username}</strong>
                              {req.assignedEmployee.jobCategory && (
                                <span className="text-emerald-600 text-xs ml-1">({req.assignedEmployee.jobCategory})</span>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Rejection reason */}
                        {(req.status === 'rejected' || req.status === 'cancelled') && (
                          <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                            <div className="flex items-center gap-2 mb-1">
                              <XCircle className="w-4 h-4 text-red-600" />
                              <p className="text-xs font-medium text-red-800">
                                {req.status === 'rejected' ? 'Request Rejected' : 'Request Cancelled'}
                              </p>
                            </div>
                            {req.response?.message && (
                              <p className="text-sm text-red-700 mt-1">{req.response.message}</p>
                            )}
                          </div>
                        )}

                        {/* Description */}
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Description</p>
                          <p className="text-sm text-gray-700">{req.description}</p>
                        </div>

                        {/* Form Data */}
                        {req.formData && typeof req.formData === 'object' && Object.keys(req.formData).length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Form Details</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {Object.entries(req.formData)
                                .filter(([k, v]) => v != null && v !== '' && !k.startsWith('_'))
                                .map(([key, val]) => (
                                  <div key={key} className="text-sm">
                                    <span className="text-gray-500 capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                                    </span>{' '}
                                    <span className="text-gray-900 font-medium">{String(val)}</span>
                                  </div>
                                ))
                              }
                            </div>
                          </div>
                        )}

                        {/* Response */}
                        {req.response?.message && req.status !== 'rejected' && req.status !== 'cancelled' && (
                          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                            <p className="text-xs font-medium text-blue-900 mb-1">Response from Administration:</p>
                            <p className="text-sm text-blue-800">{req.response.message}</p>
                          </div>
                        )}

                        {/* Attachments */}
                        {req.attachments?.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Attachments</p>
                            <div className="flex gap-2 flex-wrap">
                              {req.attachments.map((att, i) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-200 text-xs">
                                  <Paperclip className="w-3 h-3 text-gray-400" />
                                  <span className="text-gray-700">{att.originalName || att.filename}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No requests found</h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm || statusFilter !== 'all'
                    ? 'Try adjusting your filters.'
                    : "You haven't submitted any service requests yet."}
                </p>
                <button
                  onClick={() => navigate('/resident/services')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  <Briefcase className="w-4 h-4" />
                  Browse Services
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
