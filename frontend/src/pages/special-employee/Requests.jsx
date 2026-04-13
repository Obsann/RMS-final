import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  Eye, AlertTriangle, MessageSquare, Search, UserPlus, CheckCircle, Loader2,
  Filter, X, ChevronRight, Flame, Clock, ArrowUpRight, Zap,
  FileText, User, Phone, MapPin, Calendar, Tag, SlidersHorizontal
} from 'lucide-react';
import { toast } from 'sonner';
import { getRequests, updateRequestStatus, convertRequestToJob, getUsers } from '../../utils/api';

const PRIORITY_CONFIG = {
  urgent: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  high: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500' },
  medium: { color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', badge: 'bg-yellow-100 text-yellow-700', dot: 'bg-yellow-400' },
  low: { color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
};

const TYPE_CONFIG = {
  request: { icon: MessageSquare, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700' },
  complaint: { icon: AlertTriangle, color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-700' },
};

const TABS = [
  { key: 'all', label: 'All', color: 'blue' },
  { key: 'pending', label: 'Pending', color: 'amber' },
  { key: 'in-progress', label: 'In Progress', color: 'blue' },
  { key: 'completed', label: 'Completed', color: 'green' },
];

export default function SpecialEmployeeRequests() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [assignData, setAssignData] = useState({ employeeId: '', priority: 'medium', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqData, empData] = await Promise.all([getRequests(), getUsers('role=employee')]);
      setRequests(reqData.requests || []);
      setEmployees(empData.users || []);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await updateRequestStatus(selectedRequest._id, { status });
      toast.success(`Request marked as ${status}`);
      setShowDetailsModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    } finally { setSubmitting(false); }
  };

  const handleAssignJob = async () => {
    if (!assignData.employeeId) { toast.error('Please select an employee'); return; }
    setSubmitting(true);
    try {
      await convertRequestToJob(selectedRequest._id, {
        assignedTo: assignData.employeeId,
        priority: assignData.priority,
        dueDate: assignData.dueDate || undefined
      });
      toast.success('Request converted to job and assigned!');
      setShowAssignModal(false);
      setShowDetailsModal(false);
      setAssignData({ employeeId: '', priority: 'medium', dueDate: '' });
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to assign job');
    } finally { setSubmitting(false); }
  };

  const filtered = requests.filter(r => {
    const matchTab = activeTab === 'all' || r.status === activeTab ||
      (activeTab === 'in-progress' && (r.status === 'in-progress' || r.status === 'assigned'));
    const matchType = typeFilter === 'all' || r.type === typeFilter;
    const matchPriority = priorityFilter === 'all' || r.priority === priorityFilter;
    const matchSearch = (r.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.resident?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchTab && matchType && matchPriority && matchSearch;
  });

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    'in-progress': requests.filter(r => r.status === 'in-progress' || r.status === 'assigned').length,
    completed: requests.filter(r => r.status === 'completed').length,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <span className="text-blue-600 text-sm font-bold uppercase tracking-widest">Requests & Complaints</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900">Community Issue Management</h1>
            <p className="text-gray-500 text-sm mt-0.5">Review, triage, and assign community requests to field staff</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: `${counts.pending} Pending`, color: 'bg-amber-100 text-amber-700 border-amber-200' },
              { label: `${counts['in-progress']} In Progress`, color: 'bg-blue-100 text-blue-700 border-blue-200' },
              { label: `${counts.completed} Completed`, color: 'bg-green-100 text-green-700 border-green-200' },
            ].map((b, i) => (
              <span key={i} className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${b.color}`}>{b.label}</span>
            ))}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-fit">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-blue-700 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}>
                {tab.label}
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'
                }`}>
                  {counts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {/* Search + Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by subject, resident, or category…"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm transition-colors" />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700">
              <option value="all">All Types</option>
              <option value="request">Requests</option>
              <option value="complaint">Complaints</option>
            </select>
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-700">
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          {filtered.length < requests.length && (
            <p className="text-xs text-gray-400">Showing <strong>{filtered.length}</strong> of <strong>{requests.length}</strong> requests</p>
          )}
        </div>

        {/* Request Cards */}
        {loading ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
            <CheckCircle className="w-12 h-12 text-green-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">No requests match your filters</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(request => {
              const typeCfg = TYPE_CONFIG[request.type] || TYPE_CONFIG.request;
              const priCfg = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.low;
              const TypeIcon = typeCfg.icon;
              return (
                <div key={request._id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Type Icon */}
                    <div className={`w-12 h-12 ${typeCfg.bg} border ${typeCfg.border} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <TypeIcon className={`w-5 h-5 ${typeCfg.color}`} />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-bold border capitalize ${typeCfg.badge} ${typeCfg.border}`}>
                          {request.type}
                        </span>
                        <span className={`text-xs px-2.5 py-1 rounded-lg font-bold capitalize ${priCfg.badge}`}>
                          <span className={`inline-block w-1.5 h-1.5 rounded-full ${priCfg.dot} mr-1`} />
                          {request.priority || 'low'}
                        </span>
                        {request.category && (
                          <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 font-semibold capitalize">
                            {request.category}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-gray-900 truncate">{request.subject || '—'}</p>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1"><User className="w-3 h-3" />{request.resident?.username || '—'}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />Unit {request.unit || request.resident?.unit || '—'}</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(request.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Status + Actions */}
                    <div className="flex items-center gap-3 sm:flex-shrink-0">
                      <StatusBadge status={request.status} size="sm" />
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => { setSelectedRequest(request); setShowDetailsModal(true); }}
                          className="p-2 bg-blue-50 hover:bg-blue-100 rounded-xl text-blue-600 transition-colors" title="View Details">
                          <Eye className="w-4 h-4" />
                        </button>
                        {(request.status === 'pending' || request.status === 'in-progress') && request.type === 'request' && !request.job && (
                          <button
                            onClick={() => { setSelectedRequest(request); setShowAssignModal(true); }}
                            className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-emerald-600 transition-colors" title="Assign to Staff">
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                        {request.status !== 'completed' && (
                          <button
                            onClick={() => { setSelectedRequest(request); handleUpdateStatus('completed'); }}
                            disabled={submitting}
                            className="p-2 bg-green-50 hover:bg-green-100 rounded-xl text-green-600 transition-colors disabled:opacity-50" title="Mark Completed">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── DETAILS MODAL ── */}
      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Issue Review & Action" size="lg">
        {selectedRequest && (() => {
          const typeCfg = TYPE_CONFIG[selectedRequest.type] || TYPE_CONFIG.request;
          const priCfg = PRIORITY_CONFIG[selectedRequest.priority] || PRIORITY_CONFIG.low;
          const TypeIcon = typeCfg.icon;
          return (
            <div className="space-y-5">
              {/* Header */}
              <div className={`flex items-start gap-4 p-4 rounded-xl ${typeCfg.bg} border ${typeCfg.border}`}>
                <div className={`w-12 h-12 bg-white border ${typeCfg.border} rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <TypeIcon className={`w-6 h-6 ${typeCfg.color}`} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-lg">{selectedRequest.subject || '—'}</h3>
                  <div className="flex flex-wrap gap-2 mt-1.5">
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-bold capitalize ${typeCfg.badge}`}>{selectedRequest.type}</span>
                    <span className={`text-xs px-2.5 py-1 rounded-lg font-bold capitalize ${priCfg.badge}`}>{selectedRequest.priority}</span>
                    {selectedRequest.category && <span className="text-xs px-2.5 py-1 rounded-lg bg-white border border-gray-200 text-gray-600 font-semibold capitalize">{selectedRequest.category}</span>}
                  </div>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: User, label: 'Resident', val: selectedRequest.resident?.username || '—' },
                  { icon: Phone, label: 'Phone', val: selectedRequest.resident?.phone || '—' },
                  { icon: MapPin, label: 'Unit', val: selectedRequest.unit || selectedRequest.resident?.unit || '—' },
                  { icon: Calendar, label: 'Submitted', val: new Date(selectedRequest.createdAt).toLocaleDateString() },
                ].map(({ icon: Icon, label, val }, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-gray-200 flex-shrink-0">
                      <Icon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">{label}</p>
                      <p className="text-sm font-bold text-gray-900">{val}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</p>
                <p className="text-gray-800 text-sm leading-relaxed whitespace-pre-wrap">{selectedRequest.description || 'No description provided.'}</p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-gray-600">Current Status:</p>
                <StatusBadge status={selectedRequest.status} />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                {(selectedRequest.status === 'pending' || selectedRequest.status === 'in-progress') && selectedRequest.type === 'request' && !selectedRequest.job && (
                  <button
                    onClick={() => { setShowDetailsModal(false); setShowAssignModal(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold text-sm shadow-sm">
                    <UserPlus className="w-4 h-4" /> Assign to Staff
                  </button>
                )}
                {selectedRequest.status !== 'completed' && (
                  <button
                    disabled={submitting}
                    onClick={() => handleUpdateStatus('completed')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold text-sm shadow-sm disabled:opacity-60">
                    <CheckCircle className="w-4 h-4" /> Mark Completed
                  </button>
                )}
                <div className="flex-1" />
                <button onClick={() => setShowDetailsModal(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Close</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── ASSIGN MODAL ── */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Task to Staff" size="md">
        {selectedRequest && (
          <div className="space-y-5">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm font-bold text-blue-900 mb-0.5">Assigning: "{selectedRequest.subject}"</p>
              <p className="text-xs text-blue-700">This will convert the community request into an actionable staff job.</p>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Select Staff Member</label>
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {employees.filter(e => e.status !== 'rejected').length === 0 ? (
                  <p className="text-sm text-gray-400 italic text-center py-4">No staff available</p>
                ) : employees.filter(e => e.status !== 'rejected').map(emp => (
                  <label key={emp._id}
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${assignData.employeeId === emp._id ? 'border-blue-500 bg-blue-50/60 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <input type="radio" name="empId" className="w-4 h-4 text-blue-600"
                      checked={assignData.employeeId === emp._id}
                      onChange={() => setAssignData({ ...assignData, employeeId: emp._id })} />
                    <div className="w-9 h-9 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-700 font-bold text-sm">{(emp.username || 'E').charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{emp.username}</p>
                      <p className="text-xs text-gray-500">{emp.jobCategory || 'General Employee'}</p>
                    </div>
                    {assignData.employeeId === emp._id && <CheckCircle className="w-4 h-4 text-blue-600 ml-auto" />}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Priority Level</label>
                <select value={assignData.priority} onChange={e => setAssignData({ ...assignData, priority: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50">
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Due Date</label>
                <input type="date" value={assignData.dueDate} onChange={e => setAssignData({ ...assignData, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-gray-50" />
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button onClick={handleAssignJob} disabled={submitting || !assignData.employeeId}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-bold text-sm shadow-sm disabled:opacity-50">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {submitting ? 'Assigning…' : 'Confirm Assignment'}
              </button>
              <button onClick={() => setShowAssignModal(false)}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
