import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { Search, Eye, Edit, IdCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUsers, updateUser } from '../../utils/api';

export default function SpecialEmployeeResidents() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedResident, setSelectedResident] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchResidents();
  }, []);

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const data = await getUsers('role=resident');
      setResidents(data.users || []);
    } catch (error) {
      toast.error('Failed to load residents');
    } finally {
      setLoading(false);
    }
  };

  const filtered = residents.filter(r => {
    const matchSearch =
      (r.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.unit || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const handleSaveEdit = async () => {
    setSubmitting(true);
    try {
      await updateUser(editData._id, {
        phone: editData.phone,
        status: editData.status
      });
      toast.success('Resident information updated!');
      setShowEditModal(false);
      fetchResidents();
    } catch (error) {
      toast.error(error.message || 'Failed to update resident');
    } finally {
      setSubmitting(false);
    }
  };

  const idStatusColors = {
    verified: 'text-green-600 bg-green-50 border-green-200',
    pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    'in-progress': 'text-blue-600 bg-blue-50 border-blue-200',
    none: 'text-gray-500 bg-gray-50 border-gray-200',
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading residents...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1>Residents Management</h1>
            <p className="text-gray-600 mt-1">View and manage resident information</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200"><p className="text-gray-600 mb-1">Total</p><p className="text-gray-900 text-2xl font-semibold">{residents.length}</p></div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-green-200 bg-green-50"><p className="text-green-700 mb-1">Approved</p><p className="text-gray-900 text-2xl font-semibold">{residents.filter(r => r.status === 'approved').length}</p></div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-200 bg-blue-50"><p className="text-blue-700 mb-1">Dependents</p><p className="text-gray-900 text-2xl font-semibold">{residents.reduce((acc, r) => acc + (r.dependents?.length || 0), 0)}</p></div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-yellow-200 bg-yellow-50"><p className="text-yellow-700 mb-1">ID Pending</p><p className="text-gray-900 text-2xl font-semibold">{residents.filter(r => (r.digitalId?.status || '') === 'pending').length}</p></div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by name or unit..."
                className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-600">Name</th>
                  <th className="px-6 py-3 text-left text-gray-600">Unit</th>
                  <th className="px-6 py-3 text-left text-gray-600">Phone</th>
                  <th className="px-6 py-3 text-left text-gray-600">Dependents</th>
                  <th className="px-6 py-3 text-left text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left text-gray-600">Digital ID</th>
                  <th className="px-6 py-3 text-left text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map(r => (
                  <tr key={r._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="text-blue-600">{(r.username || 'R').charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-gray-900 font-medium">{r.username}</p>
                          <p className="text-gray-500 text-sm">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{r.unit || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{r.phone || '—'}</td>
                    <td className="px-6 py-4 text-gray-700">{r.dependents?.length || 0}</td>
                    <td className="px-6 py-4"><StatusBadge status={r.status} size="sm" /></td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm ${idStatusColors[r.digitalId?.status || 'none']}`}>
                        <IdCard className="w-4 h-4" />
                        {r.digitalId?.status ? r.digitalId.status.charAt(0).toUpperCase() + r.digitalId.status.slice(1) : 'None'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedResident(r); setShowViewModal(true); }}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditData({ ...r }); setShowEditModal(true); }}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No residents found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* View Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Resident Details" size="md">
        {selectedResident && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <span className="text-blue-600 text-2xl">{(selectedResident.username || 'R').charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h3 className="text-gray-900 text-lg font-semibold">{selectedResident.username}</h3>
                <p className="text-gray-600">{selectedResident.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-sm">
              <div><label className="block text-gray-500 mb-1 text-xs">Unit</label><p className="text-gray-900 font-medium">{selectedResident.unit || '—'}</p></div>
              <div><label className="block text-gray-500 mb-1 text-xs">Phone</label><p className="text-gray-900 font-medium">{selectedResident.phone || '—'}</p></div>
              <div><label className="block text-gray-500 mb-1 text-xs">Dependents</label><p className="text-gray-900 font-medium">{selectedResident.dependents?.length || 0}</p></div>
              <div><label className="block text-gray-500 mb-1 text-xs">Status</label><div className="mt-1"><StatusBadge status={selectedResident.status} size="sm" /></div></div>
              <div className="col-span-2"><label className="block text-gray-500 mb-1 text-xs">Digital ID Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-sm font-medium ${idStatusColors[selectedResident.digitalId?.status || 'none']}`}>
                    <IdCard className="w-4 h-4" />
                    {selectedResident.digitalId?.status ? selectedResident.digitalId.status.charAt(0).toUpperCase() + selectedResident.digitalId.status.slice(1) : 'No ID'}
                  </span>
                </div>
              </div>
            </div>
            {selectedResident.dependents?.length > 0 && (
              <div className="mt-4">
                <label className="block text-gray-600 font-semibold mb-2">Family Members</label>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {selectedResident.dependents.map((dep, idx) => (
                    <div key={idx} className="p-3 bg-white border border-gray-200 rounded-lg text-sm flex justify-between items-center">
                      <span className="text-gray-900 font-medium">{dep.name}</span>
                      <span className="text-gray-500 bg-gray-50 px-2 py-0.5 rounded">{dep.relationship} {dep.age ? `• ${dep.age} yrs` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setShowViewModal(false)} className="w-full px-4 py-2 mt-4 border border-gray-300 font-medium rounded-lg hover:bg-gray-50">Close</button>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Resident Information" size="md">
        <div className="space-y-4">
          <div><label className="block text-gray-700 mb-2 font-medium text-sm">Phone Number</label>
            <input type="tel" value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-gray-700 mb-2 font-medium text-sm">Status</label>
            <select value={editData.status || 'approved'} onChange={e => setEditData({ ...editData, status: e.target.value })}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="pending">Pending</option>
            </select></div>
          <div className="flex gap-3 pt-2 border-t mt-4">
            <button onClick={handleSaveEdit} disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Saving...' : 'Save Changes'}</button>
            <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border border-gray-300 font-medium rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
