import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { toast } from 'sonner';
import {
  getRequests, getRequestStats, updateRequest, assignJobToEmployee,
  getUsers, getJobs,
} from '../../utils/api';
import {
  Search, Loader2, Filter, RefreshCw, Eye, ArrowUpRight, ChevronRight,
  Home, Briefcase, Clock, Users, CheckCircle, XCircle, AlertTriangle,
  User, FileText, ChevronDown, Send, UserCog,
} from 'lucide-react';

const PIPELINE_COLUMNS = [
  { key: 'pending', label: 'Pending', color: 'bg-yellow-500', lightBg: 'bg-yellow-50', border: 'border-yellow-200' },
  { key: 'in-progress', label: 'In Progress', color: 'bg-blue-500', lightBg: 'bg-blue-50', border: 'border-blue-200' },
  { key: 'completed', label: 'Completed', color: 'bg-green-500', lightBg: 'bg-green-50', border: 'border-green-200' },
  { key: 'rejected', label: 'Rejected', color: 'bg-red-500', lightBg: 'bg-red-50', border: 'border-red-200' },
];

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All Categories' },
  { key: 'ID_REGISTRATION', label: 'Identity & Registration' },
  { key: 'CERTIFICATES', label: 'Certificates' },
  { key: 'PERMITS', label: 'Permits' },
  { key: 'FEEDBACK_SUPPORT', label: 'Feedback & Support' },
];

function getTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const priorityDot = (p) => {
  if (p === 'urgent') return 'bg-red-500';
  if (p === 'high') return 'bg-orange-400';
  if (p === 'medium') return 'bg-yellow-400';
  return 'bg-gray-300';
};

export default function ServicePipeline() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Detail modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Reassign modal
  const [showReassign, setShowReassign] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [reassigning, setReassigning] = useState(false);

  const fetchData = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);

      const [reqRes, statsRes] = await Promise.allSettled([
        getRequests('escalatedOnly=false&limit=500'),
        getRequestStats(),
      ]);

      if (reqRes.status === 'fulfilled') setRequests(reqRes.value?.requests || []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
      if (showToast) toast.success('Pipeline refreshed');
    } catch {
      toast.error('Failed to load pipeline');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => fetchData(), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filtered = useMemo(() => {
    return requests.filter(r => {
      const matchSearch =
        (r.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.resident?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.serviceType || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory = categoryFilter === 'all' || r.categoryTag === categoryFilter;
      return matchSearch && matchCategory;
    });
  }, [requests, searchTerm, categoryFilter]);

  const columnData = useMemo(() => {
    const cols = {};
    PIPELINE_COLUMNS.forEach(c => { cols[c.key] = []; });
    filtered.forEach(r => {
      const s = r.status || 'pending';
      if (cols[s]) cols[s].push(r);
      else if (s === 'cancelled') cols['rejected']?.push(r);
    });
    return cols;
  }, [filtered]);

  const openDetail = (req) => {
    setSelectedRequest(req);
    setShowDetail(true);
  };

  const openReassign = async (req) => {
    setSelectedRequest(req);
    setShowReassign(true);
    try {
      const data = await getUsers('role=employee&status=approved&limit=100');
      setEmployees(data.users || []);
    } catch {
      toast.error('Failed to load employees');
    }
  };

  const handleReassign = async () => {
    if (!selectedEmployee || !selectedRequest?.job) return;
    setReassigning(true);
    try {
      await assignJobToEmployee(
        typeof selectedRequest.job === 'object' ? selectedRequest.job._id : selectedRequest.job,
        selectedEmployee
      );
      toast.success('Job reassigned successfully');
      setShowReassign(false);
      setSelectedEmployee('');
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to reassign');
    } finally {
      setReassigning(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading pipeline...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-5">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-500">
          <Home className="w-3.5 h-3.5" />
          <span>Admin</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-blue-600 font-medium">Service Pipeline</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              Service Pipeline
            </h1>
            <p className="text-gray-500 text-sm mt-0.5">
              Full request lifecycle — from submission to resolution
            </p>
          </div>
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Summary */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: 'Total', value: stats.total, icon: FileText, color: 'text-gray-600', bg: 'bg-gray-50' },
              { label: 'Pending', value: stats.byStatus?.pending || 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
              { label: 'In Progress', value: stats.byStatus?.inProgress || 0, icon: Loader2, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: 'Completed', value: stats.byStatus?.completed || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
              { label: 'Escalated', value: stats.byStatus?.escalated || 0, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
            ].map((s) => (
              <div key={s.label} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 ${s.bg} rounded-lg flex items-center justify-center`}>
                    <s.icon className={`w-4 h-4 ${s.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-lg font-bold text-gray-900">{s.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-3 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by subject, resident, or service..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORY_FILTERS.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategoryFilter(c.key)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  categoryFilter === c.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {PIPELINE_COLUMNS.map((col) => {
            const items = columnData[col.key] || [];
            return (
              <div key={col.key} className="flex flex-col">
                {/* Column Header */}
                <div className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl ${col.lightBg} border ${col.border} border-b-0`}>
                  <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                  <span className="text-sm font-bold text-gray-900">{col.label}</span>
                  <span className="ml-auto text-xs font-semibold text-gray-500 bg-white px-2 py-0.5 rounded-full border border-gray-200">
                    {items.length}
                  </span>
                </div>

                {/* Column Body */}
                <div className={`flex-1 border ${col.border} border-t-0 rounded-b-xl bg-gray-50/50 p-2 space-y-2 min-h-[200px] max-h-[60vh] overflow-y-auto`}>
                  {items.length === 0 ? (
                    <div className="py-8 text-center text-gray-400 text-xs">
                      No requests
                    </div>
                  ) : (
                    items.map((req) => (
                      <button
                        key={req._id}
                        onClick={() => openDetail(req)}
                        className="w-full text-left p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md hover:border-blue-200 transition-all group"
                      >
                        {/* Priority + Time */}
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full ${priorityDot(req.priority)}`} />
                            <span className="text-[10px] font-medium text-gray-400 uppercase">{req.priority}</span>
                          </div>
                          <span className="text-[10px] text-gray-400">{getTimeAgo(req.createdAt)}</span>
                        </div>

                        {/* Subject */}
                        <p className="text-sm font-semibold text-gray-900 truncate">{req.subject || req.category || '—'}</p>

                        {/* Resident + Service */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-xs text-gray-500 truncate flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {req.resident?.username || '—'}
                          </span>
                          {req.serviceType && (
                            <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium truncate">
                              {req.serviceType}
                            </span>
                          )}
                        </div>

                        {/* Assigned Employee */}
                        {req.assignedEmployee && (
                          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-emerald-600">
                            <UserCog className="w-3 h-3" />
                            <span className="font-medium">{req.assignedEmployee.username}</span>
                          </div>
                        )}

                        {/* Escalation badge */}
                        {req.isEscalated && (
                          <div className="mt-1.5">
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              ⚠ Escalated
                            </span>
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Request Details" size="lg">
        {selectedRequest && (
          <div className="space-y-4">
            {/* Header info */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div><label className="block text-gray-600 text-sm mb-1">Resident</label><p className="text-gray-900 font-medium">{selectedRequest.resident?.username || '—'}</p></div>
              <div><label className="block text-gray-600 text-sm mb-1">Unit</label><p className="text-gray-900">{selectedRequest.unit || '—'}</p></div>
              <div><label className="block text-gray-600 text-sm mb-1">Service Type</label><p className="text-gray-900">{selectedRequest.serviceType || selectedRequest.type || '—'}</p></div>
              <div><label className="block text-gray-600 text-sm mb-1">Category</label><p className="text-gray-900 capitalize">{selectedRequest.category}</p></div>
              <div><label className="block text-gray-600 text-sm mb-1">Priority</label><span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${selectedRequest.priority === 'high' || selectedRequest.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{selectedRequest.priority}</span></div>
              <div><label className="block text-gray-600 text-sm mb-1">Status</label><StatusBadge status={selectedRequest.status} size="sm" /></div>
            </div>

            {/* Subject + Description */}
            <div>
              <label className="block text-gray-600 text-sm mb-1">Subject</label>
              <p className="text-gray-900 font-medium">{selectedRequest.subject}</p>
            </div>
            <div>
              <label className="block text-gray-600 text-sm mb-1">Description</label>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">{selectedRequest.description}</p>
            </div>

            {/* Form Data */}
            {selectedRequest.formData && typeof selectedRequest.formData === 'object' && Object.keys(selectedRequest.formData).length > 0 && (
              <div>
                <label className="block text-gray-600 text-sm mb-2">Submitted Form Data</label>
                <div className="grid grid-cols-2 gap-2 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                  {Object.entries(selectedRequest.formData)
                    .filter(([k, v]) => v != null && v !== '' && !k.startsWith('_'))
                    .map(([key, val]) => (
                      <div key={key} className="text-sm">
                        <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>{' '}
                        <span className="text-gray-900 font-medium">{String(val)}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Assigned Employee */}
            {selectedRequest.assignedEmployee && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                <UserCog className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-emerald-800">Assigned to: <strong>{selectedRequest.assignedEmployee.username}</strong></span>
              </div>
            )}

            {/* Escalation Info */}
            {selectedRequest.isEscalated && selectedRequest.escalatedBy && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <label className="block text-amber-800 text-sm font-medium mb-1">Escalated By</label>
                <p className="text-amber-900">{selectedRequest.escalatedBy.username} — {selectedRequest.escalatedAt ? new Date(selectedRequest.escalatedAt).toLocaleString() : '—'}</p>
                {selectedRequest.escalationNote && <p className="text-amber-700 text-sm mt-1">{selectedRequest.escalationNote}</p>}
              </div>
            )}

            {/* Response */}
            {selectedRequest.response?.message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <label className="block text-green-700 text-sm font-medium mb-1">Response</label>
                <p className="text-green-900">{selectedRequest.response.message}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200">
              {selectedRequest.job && (
                <button
                  onClick={() => { setShowDetail(false); openReassign(selectedRequest); }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center justify-center gap-2"
                >
                  <UserCog className="w-4 h-4" /> Reassign Employee
                </button>
              )}
              <button onClick={() => setShowDetail(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reassign Modal */}
      <Modal isOpen={showReassign} onClose={() => setShowReassign(false)} title="Reassign Employee" size="md">
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              Reassigning: <strong>{selectedRequest?.subject || '—'}</strong>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Select Employee</label>
            <select
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">Choose an employee...</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.username} — {emp.jobCategory || 'No category'}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleReassign}
              disabled={!selectedEmployee || reassigning}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {reassigning ? 'Reassigning...' : 'Reassign'}
            </button>
            <button onClick={() => setShowReassign(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
