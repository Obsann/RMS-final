import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  IdCard, CheckCircle, Eye, ArrowRight, User, Calendar, QrCode,
  Loader2, Info, ChevronRight, Zap, Shield, Clock, AlertTriangle,
  UserCheck, Fingerprint, ArrowUpRight, X
} from 'lucide-react';
import { toast } from 'sonner';
import { getDigitalIds, updateDigitalId, getUsers } from '../../utils/api';

const STATUS_CONFIG = {
  pending: {
    color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200',
    badge: 'bg-amber-100 text-amber-700', bar: 'bg-amber-500', dot: 'bg-amber-500'
  },
  approved: {
    color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500', dot: 'bg-blue-500'
  },
  processing: {
    color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200',
    badge: 'bg-blue-100 text-blue-700', bar: 'bg-blue-500', dot: 'bg-blue-500'
  },
  issued: {
    color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500', dot: 'bg-emerald-500'
  },
  rejected: {
    color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200',
    badge: 'bg-red-100 text-red-700', bar: 'bg-red-500', dot: 'bg-red-500'
  },
};

const TABS = [
  { key: 'all', label: 'All Requests' },
  { key: 'pending', label: 'Pending Approval' },
  { key: 'approved', label: 'In Progress' },
  { key: 'issued', label: 'Issued' },
  { key: 'rejected', label: 'Rejected' },
];

const WORKFLOW_STEPS = [
  { label: 'Admin approves request', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Shield },
  { label: 'You receive approved request', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: IdCard },
  { label: 'Assign to field employee', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: UserCheck },
  { label: 'Employee issues physical ID', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Fingerprint },
];

export default function SpecialEmployeeDigitalID() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [assignData, setAssignData] = useState({ employeeId: '', dueDate: '' });
  const [activeTab, setActiveTab] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [idData, empData] = await Promise.all([getDigitalIds(), getUsers('role=employee')]);
      setRequests(idData.digitalIds || idData || []);
      setEmployees(empData.users || []);
    } catch { toast.error('Failed to load Digital ID requests'); }
    finally { setLoading(false); }
  };

  const filtered = activeTab === 'all'
    ? requests
    : requests.filter(r => activeTab === 'approved' ? r.status === 'approved' || r.status === 'processing' : r.status === activeTab);

  const counts = {
    all: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    approved: requests.filter(r => r.status === 'approved' || r.status === 'processing').length,
    issued: requests.filter(r => r.status === 'issued').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  const handleAssign = async () => {
    if (!assignData.employeeId || !assignData.dueDate) {
      toast.error('Please select an employee and set a target date');
      return;
    }
    setSubmitting(true);
    try {
      await updateDigitalId(selectedReq._id, {
        status: 'approved',
        assignedTo: assignData.employeeId,
        issueDate: assignData.dueDate
      });
      toast.success('ID printing task assigned to employee!');
      setShowAssignModal(false);
      setAssignData({ employeeId: '', dueDate: '' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to assign');
    } finally { setSubmitting(false); }
  };

  const handleMarkIssued = async (req) => {
    setSubmitting(true);
    try {
      await updateDigitalId(req._id, { status: 'issued' });
      toast.success('Digital ID marked as issued!');
      setShowDetailModal(false);
      fetchData();
    } catch { toast.error('Failed to update status'); }
    finally { setSubmitting(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── HERO HEADER ── */}
        <div className="relative rounded-2xl overflow-hidden p-6 md:p-8"
          style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 80%, #6366f1 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-10"
            style={{ background: 'radial-gradient(circle, white 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
          <div className="relative">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/15 border border-white/20 rounded-xl flex items-center justify-center">
                <IdCard className="w-5 h-5 text-white" />
              </div>
              <span className="text-indigo-300 text-sm font-bold uppercase tracking-widest">Identity Management</span>
            </div>
            <h1 className="text-3xl font-black text-white mb-1">Digital ID System</h1>
            <p className="text-indigo-200 text-sm">Manage ID requests — assign to field employees and track issuance</p>
          </div>

          {/* Workflow Steps */}
          <div className="relative mt-6 flex flex-wrap items-center gap-2">
            {WORKFLOW_STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={idx}>
                  <div className="flex items-center gap-2 px-3 py-2 bg-white/15 border border-white/20 backdrop-blur-sm rounded-xl">
                    <Icon className="w-3.5 h-3.5 text-white/80" />
                    <span className="text-white text-xs font-semibold">{step.label}</span>
                  </div>
                  {idx < WORKFLOW_STEPS.length - 1 && (
                    <ArrowRight className="w-4 h-4 text-indigo-300/60 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Requests', val: counts.all, gradient: 'from-slate-500 to-gray-700', icon: IdCard },
            { label: 'Pending Approval', val: counts.pending, gradient: 'from-amber-500 to-orange-600', icon: Clock },
            { label: 'In Progress', val: counts.approved, gradient: 'from-blue-500 to-indigo-600', icon: Zap },
            { label: 'Issued IDs', val: counts.issued, gradient: 'from-emerald-500 to-teal-600', icon: CheckCircle },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 bg-gradient-to-br ${s.gradient} rounded-xl flex items-center justify-center mb-3 shadow-sm`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{s.label}</p>
              <p className="text-3xl font-black text-gray-900 tabular-nums mt-0.5">
                {loading ? <span className="inline-block w-10 h-7 bg-gray-100 rounded-lg animate-pulse" /> : s.val}
              </p>
            </div>
          ))}
        </div>

        {/* ── TABS + LIST ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Tab bar */}
          <div className="border-b border-gray-100 px-6 flex gap-0 overflow-x-auto">
            {TABS.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 py-4 px-4 border-b-2 transition-all font-semibold text-sm flex items-center gap-2 ${
                  activeTab === tab.key
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-400 hover:text-gray-700'
                }`}>
                {tab.label}
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  activeTab === tab.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
                }`}>
                  {counts[tab.key] ?? filtered.length}
                </span>
              </button>
            ))}
          </div>

          {/* Request list */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <IdCard className="w-8 h-8 text-indigo-300" />
              </div>
              <p className="text-gray-500 font-semibold">No ID requests in this category</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map(req => {
                const cfg = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending;
                return (
                  <div key={req._id} className={`p-5 hover:bg-gray-50/70 transition-colors group border-l-4 ${cfg.border}`}>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      {/* Avatar + Info */}
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
                          <span className="text-white font-black text-lg">
                            {(req.resident?.username || 'R').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-gray-900 truncate">{req.resident?.username || 'Unknown Resident'}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5 flex-wrap">
                            <span className="flex items-center gap-1">
                              <User className="w-3 h-3" />Unit {req.resident?.unit || '—'}
                            </span>
                            <span>·</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(req.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {req.assignedTo && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <div className="w-4 h-4 bg-emerald-100 rounded-full flex items-center justify-center">
                                <span className="text-emerald-700 text-xs font-bold">
                                  {(req.assignedTo.username || req.assignedTo).charAt(0)}
                                </span>
                              </div>
                              <span className="text-xs text-emerald-700 font-semibold">
                                → {req.assignedTo.username || req.assignedTo}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Status + ID + Actions */}
                      <div className="flex flex-wrap items-center gap-3 sm:flex-shrink-0">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                          <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
                          <span className={`text-xs font-bold capitalize ${cfg.color}`}>{req.status}</span>
                        </div>

                        {req.status === 'issued' && req.idNumber && (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                            <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700 text-xs font-black font-mono uppercase">{req.idNumber}</span>
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedReq(req); setShowDetailModal(true); }}
                            className="p-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-indigo-600 transition-colors" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          {req.status === 'approved' && !req.assignedTo && (
                            <button
                              onClick={() => { setSelectedReq(req); setAssignData({ employeeId: '', dueDate: '' }); setShowAssignModal(true); }}
                              className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors">
                              <Zap className="w-3.5 h-3.5" /> Assign
                            </button>
                          )}
                          {req.status === 'approved' && req.assignedTo && (
                            <button
                              onClick={() => handleMarkIssued(req)} disabled={submitting}
                              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors disabled:opacity-50">
                              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                              Mark Issued
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
      </div>

      {/* ── DETAIL MODAL ── */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="ID Request Details" size="md">
        {selectedReq && (() => {
          const cfg = STATUS_CONFIG[selectedReq.status] || STATUS_CONFIG.pending;
          return (
            <div className="space-y-5">
              {/* Resident card */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg flex-shrink-0">
                  {(selectedReq.resident?.username || 'R').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">{selectedReq.resident?.username || 'Unknown'}</h3>
                  <p className="text-gray-500 text-sm">{selectedReq.resident?.email}</p>
                  <p className="text-gray-500 text-sm">Unit {selectedReq.resident?.unit || '—'}</p>
                </div>
              </div>

              {/* Pending info banner */}
              {selectedReq.status === 'pending' && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 font-medium">
                    This request is awaiting Admin approval. You'll be able to assign it once approved.
                  </p>
                </div>
              )}

              {/* Meta info */}
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Request Date', val: new Date(selectedReq.createdAt).toLocaleDateString() },
                  { label: 'Status', isStatus: true },
                  ...(selectedReq.idType ? [{ label: 'ID Type', val: selectedReq.idType.toUpperCase() }] : []),
                  ...(selectedReq.assignedTo ? [{ label: 'Assigned To', val: selectedReq.assignedTo?.username || selectedReq.assignedTo }] : []),
                  ...(selectedReq.issueDate ? [{ label: 'Target Issue Date', val: new Date(selectedReq.issueDate).toLocaleDateString() }] : []),
                ].map(({ label, val, isStatus }, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                    {isStatus
                      ? <StatusBadge status={selectedReq.status} size="sm" />
                      : <p className="text-sm font-bold text-gray-900">{val}</p>
                    }
                  </div>
                ))}
              </div>

              {/* Issued badge */}
              {selectedReq.status === 'issued' && selectedReq.idNumber && (
                <div className="flex items-center gap-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <QrCode className="w-8 h-8 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wide mb-0.5">Issued ID Number</p>
                    <p className="text-2xl font-black text-emerald-900 font-mono uppercase tracking-wider">{selectedReq.idNumber}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-2 border-t border-gray-100">
                {selectedReq.status === 'approved' && !selectedReq.assignedTo && (
                  <button onClick={() => { setShowDetailModal(false); setShowAssignModal(true); }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700">
                    <Zap className="w-4 h-4" /> Assign to Employee
                  </button>
                )}
                {selectedReq.status === 'approved' && selectedReq.assignedTo && (
                  <button onClick={() => handleMarkIssued(selectedReq)} disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 disabled:opacity-60">
                    <CheckCircle className="w-4 h-4" /> Mark ID Issued
                  </button>
                )}
                <button onClick={() => setShowDetailModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50">Close</button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* ── ASSIGN MODAL ── */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign ID Printing Task" size="md">
        {selectedReq && (
          <div className="space-y-5">
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
              <p className="text-sm font-bold text-indigo-900 mb-0.5">
                Assigning ID for: {selectedReq.resident?.username || 'Unknown'}
              </p>
              <p className="text-xs text-indigo-700">Unit {selectedReq.resident?.unit || '—'}</p>
            </div>

            {/* Employee selector */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-3">Select Printing/Issuance Staff *</label>
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {employees.filter(e => e.status !== 'rejected').length === 0 ? (
                  <p className="text-sm text-gray-400 italic text-center py-4">No staff available</p>
                ) : employees.filter(e => e.status !== 'rejected').map(emp => (
                  <label key={emp._id}
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
                      assignData.employeeId === emp._id
                        ? 'border-indigo-500 bg-indigo-50/60 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}>
                    <input type="radio" name="empAssign" className="w-4 h-4 text-indigo-600"
                      checked={assignData.employeeId === emp._id}
                      onChange={() => setAssignData({ ...assignData, employeeId: emp._id })} />
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-white font-black">{(emp.username || 'E').charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{emp.username}</p>
                      <p className="text-xs text-gray-500">{emp.jobCategory || 'General Employee'}</p>
                    </div>
                    {assignData.employeeId === emp._id && (
                      <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Due date */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Target Issue Date *</label>
              <input type="date" value={assignData.dueDate}
                onChange={e => setAssignData({ ...assignData, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium" />
            </div>

            <div className="flex gap-3 pt-2 border-t border-gray-100">
              <button onClick={handleAssign} disabled={submitting || !assignData.employeeId || !assignData.dueDate}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 shadow-sm">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                {submitting ? 'Assigning…' : 'Confirm Assignment'}
              </button>
              <button onClick={() => setShowAssignModal(false)}
                className="flex-1 py-3 border border-gray-200 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
