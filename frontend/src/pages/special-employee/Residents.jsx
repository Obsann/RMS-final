import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  Search, Eye, Edit, IdCard, Loader2, X, Users, Home,
  Phone, Mail, User, Calendar, ChevronRight, Filter,
  CheckCircle, Clock, UserX, Baby, Shield
} from 'lucide-react';
import { toast } from 'sonner';
import { getUsers, updateUser } from '../../utils/api';

const ID_STATUS = {
  verified: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Verified' },
  pending: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Pending' },
  'in-progress': { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', label: 'In Progress' },
  none: { color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200', label: 'No ID' },
};

const ACCOUNT_STATUS = {
  approved: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
  rejected: { icon: UserX, color: 'text-red-600', bg: 'bg-red-50' },
};

export default function SpecialEmployeeResidents() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterIdStatus, setFilterIdStatus] = useState('all');
  const [selectedResident, setSelectedResident] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchResidents(); }, []);

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const data = await getUsers('role=resident');
      setResidents(data.users || []);
    } catch { toast.error('Failed to load residents'); }
    finally { setLoading(false); }
  };

  const filtered = residents.filter(r => {
    const matchSearch = (r.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.unit || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchId = filterIdStatus === 'all' || (r.digitalId?.status || 'none') === filterIdStatus;
    return matchSearch && matchStatus && matchId;
  });

  const handleSaveEdit = async () => {
    setSubmitting(true);
    try {
      await updateUser(editData._id, { phone: editData.phone, status: editData.status });
      toast.success('Resident updated!');
      setShowEditModal(false);
      fetchResidents();
    } catch (error) {
      toast.error(error.message || 'Failed to update resident');
    } finally { setSubmitting(false); }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
              <span className="text-indigo-600 text-sm font-bold uppercase tracking-widest">Community</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900">Residents Registry</h1>
            <p className="text-gray-500 text-sm mt-0.5">View and manage registered community members</p>
          </div>
          {/* Summary pills */}
          <div className="flex gap-2 flex-wrap">
            {[
              { label: `${residents.length} Total`, color: 'bg-gray-100 text-gray-700 border-gray-200' },
              { label: `${residents.filter(r => r.status === 'approved').length} Active`, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
              { label: `${residents.reduce((a, r) => a + (r.dependents?.length || 0), 0)} Dependents`, color: 'bg-blue-100 text-blue-700 border-blue-200' },
            ].map((b, i) => (
              <span key={i} className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${b.color}`}>{b.label}</span>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, unit, or email…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-colors" />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-700">
            <option value="all">All Account Status</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={filterIdStatus} onChange={e => setFilterIdStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold text-gray-700">
            <option value="all">Any Digital ID</option>
            <option value="verified">ID Verified</option>
            <option value="pending">ID Pending</option>
            <option value="none">No ID</option>
          </select>
        </div>

        {/* Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">No residents found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(r => {
              const acctCfg = ACCOUNT_STATUS[r.status] || ACCOUNT_STATUS.pending;
              const idKey = r.digitalId?.status || 'none';
              const idCfg = ID_STATUS[idKey] || ID_STATUS.none;
              const AIcon = acctCfg.icon;
              return (
                <div key={r._id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                  {/* Color bar */}
                  <div className={`h-1.5 ${r.status === 'approved' ? 'bg-gradient-to-r from-emerald-400 to-teal-500' : r.status === 'rejected' ? 'bg-gradient-to-r from-red-400 to-rose-500' : 'bg-gradient-to-r from-amber-400 to-yellow-500'}`} />
                  <div className="p-5">
                    {/* Avatar + Name */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-400 to-blue-600 rounded-2xl flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-200">
                          {(r.username || 'R').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{r.username}</p>
                          <p className="text-xs text-gray-500 truncate max-w-[140px]">{r.email}</p>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-xl ${acctCfg.bg} border border-opacity-40`}>
                        <AIcon className={`w-3.5 h-3.5 ${acctCfg.color}`} />
                        <span className={`text-xs font-bold capitalize ${acctCfg.color}`}>{r.status}</span>
                      </div>
                    </div>

                    {/* Info rows */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Home className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium">Unit: {r.unit || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{r.phone || 'No phone'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Baby className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                        <span>{r.dependents?.length || 0} Dependents</span>
                      </div>
                    </div>

                    {/* Digital ID badge */}
                    <div className={`flex items-center gap-2 p-2.5 rounded-xl ${idCfg.bg} border ${idCfg.border} mb-4`}>
                      <IdCard className={`w-4 h-4 ${idCfg.color} flex-shrink-0`} />
                      <span className={`text-xs font-bold ${idCfg.color}`}>Digital ID: {idCfg.label}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button onClick={() => { setSelectedResident(r); setShowViewModal(true); }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-indigo-700 text-sm font-semibold transition-colors">
                        <Eye className="w-4 h-4" /> View
                      </button>
                      <button onClick={() => { setEditData({ ...r }); setShowEditModal(true); }}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 text-sm font-semibold transition-colors">
                        <Edit className="w-4 h-4" /> Edit
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Resident Profile" size="md">
        {selectedResident && (() => {
          const idCfg = ID_STATUS[selectedResident.digitalId?.status || 'none'] || ID_STATUS.none;
          return (
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl border border-indigo-100">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center text-white text-3xl font-black shadow-lg">
                  {(selectedResident.username || 'R').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900">{selectedResident.username}</h3>
                  <p className="text-gray-500 text-sm">{selectedResident.email}</p>
                  <StatusBadge status={selectedResident.status} size="sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: Home, label: 'Unit', val: selectedResident.unit || '—' },
                  { icon: Phone, label: 'Phone', val: selectedResident.phone || '—' },
                  { icon: Baby, label: 'Dependents', val: selectedResident.dependents?.length || 0 },
                  { icon: Calendar, label: 'Joined', val: selectedResident.createdAt ? new Date(selectedResident.createdAt).toLocaleDateString() : '—' },
                ].map(({ icon: Icon, label, val }, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                    <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase font-bold">{label}</p>
                      <p className="text-sm font-bold text-gray-900">{val}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`flex items-center gap-3 p-4 ${idCfg.bg} border ${idCfg.border} rounded-xl`}>
                <IdCard className={`w-6 h-6 ${idCfg.color}`} />
                <div>
                  <p className="text-xs font-bold uppercase text-gray-500">Digital ID Status</p>
                  <p className={`font-black ${idCfg.color}`}>{idCfg.label}</p>
                </div>
              </div>

              {selectedResident.dependents?.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Baby className="w-4 h-4 text-gray-400" /> Family Members
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {selectedResident.dependents.map((dep, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 text-xs font-bold">{dep.name.charAt(0)}</div>
                          <span className="font-semibold text-gray-900">{dep.name}</span>
                        </div>
                        <span className="text-gray-500 text-xs">{dep.relationship}{dep.age ? ` · ${dep.age} yrs` : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setShowViewModal(false)}
                className="w-full py-2.5 border border-gray-200 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50">Close</button>
            </div>
          );
        })()}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Resident" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
            <input type="tel" value={editData.phone || ''}
              onChange={e => setEditData({ ...editData, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Account Status</label>
            <select value={editData.status || 'approved'}
              onChange={e => setEditData({ ...editData, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-gray-50 font-semibold">
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button onClick={handleSaveEdit} disabled={submitting}
              className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50">
              {submitting ? 'Saving…' : 'Save Changes'}
            </button>
            <button onClick={() => setShowEditModal(false)}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
