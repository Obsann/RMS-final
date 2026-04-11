import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { Plus, Search, Eye, Edit, IdCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUsers, createUser, updateUser } from '../../utils/api';

export default function AdminResidents() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedResident, setSelectedResident] = useState(null);
  const [editData, setEditData] = useState({});
  const [formData, setFormData] = useState({ username: '', email: '', password: '', phone: '', unit: '' });
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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddResident = async () => {
    if (!formData.username || !formData.email || !formData.password || !formData.unit) {
      toast.error('Please fill in required fields');
      return;
    }
    setSubmitting(true);
    try {
      await createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        unit: formData.unit,
        role: 'resident',
        status: 'approved'
      });
      toast.success('Resident added successfully!');
      setShowAddModal(false);
      setFormData({ username: '', email: '', password: '', phone: '', unit: '' });
      fetchResidents();
    } catch (error) {
      toast.error(error.message || 'Failed to add resident');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    setSubmitting(true);
    try {
      await updateUser(editData._id, {
        username: editData.username,
        phone: editData.phone,
        unit: editData.unit,
        status: editData.status
      });
      toast.success('Resident updated successfully!');
      setShowEditModal(false);
      fetchResidents();
    } catch (error) {
      toast.error(error.message || 'Failed to update resident');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = residents.filter(r => {
    const matchSearch = (r.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.unit || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'all' || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const idStatusColors = {
    approved: 'text-green-600 bg-green-50 border-green-200',
    pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    revoked: 'text-red-600 bg-red-50 border-red-200',
    expired: 'text-gray-500 bg-gray-50 border-gray-200',
    none: 'text-gray-500 bg-gray-50 border-gray-200'
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
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1>Residents Management</h1>
            <p className="text-gray-600 mt-1">Manage all registered property residents</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Plus className="w-5 h-5" /> Add Resident
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200"><p className="text-gray-600 mb-1">Total</p><p className="text-gray-900 text-2xl font-semibold">{residents.length}</p></div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-green-200 bg-green-50"><p className="text-green-700 mb-1">Approved</p><p className="text-gray-900 text-2xl font-semibold">{residents.filter(r => r.status === 'approved').length}</p></div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-orange-200 bg-orange-50"><p className="text-orange-700 mb-1">Pending Approval</p><p className="text-gray-900 text-2xl font-semibold">{residents.filter(r => r.status === 'pending').length}</p></div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-200 bg-blue-50"><p className="text-blue-700 mb-1">Dependent Profiles</p><p className="text-gray-900 text-2xl font-semibold">{residents.reduce((acc, r) => acc + (r.dependents?.length || 0), 0)}</p></div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name or unit..." className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>

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
                        <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600">{(r.username || 'R').charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-gray-900">{r.username}</p>
                          <p className="text-gray-500 text-sm">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{r.unit || '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{r.phone || '—'}</td>
                    <td className="px-6 py-4 text-gray-700">{r.dependents?.length || 0}</td>
                    <td className="px-6 py-4"><StatusBadge status={r.status} size="sm" /></td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm capitalize ${idStatusColors[r.digitalId?.status || 'none']}`}>
                        <IdCard className="w-3.5 h-3.5" />
                        {r.digitalId?.status || 'None'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedResident(r); setShowViewModal(true); }} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => { setEditData({ ...r }); setShowEditModal(true); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Edit"><Edit className="w-4 h-4" /></button>
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

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Resident" size="md">
        <div className="space-y-4">
          <div><label className="block text-gray-700 mb-2">Username *</label><input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-gray-700 mb-2">Email *</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div><label className="block text-gray-700 mb-2">Password *</label><input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-gray-700 mb-2">Phone</label><input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-gray-700 mb-2">Unit *</label><input type="text" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. A-101" /></div>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={handleAddResident} disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Adding...' : 'Add Resident'}</button>
            <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Resident Details" size="md">
        {selectedResident && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-2xl font-medium">{(selectedResident.username || 'R').charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h3 className="text-gray-900 text-lg">{selectedResident.username}</h3>
                <p className="text-gray-600">{selectedResident.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div><label className="block text-gray-600 mb-1">Unit</label><p className="text-gray-900">{selectedResident.unit || '—'}</p></div>
              <div><label className="block text-gray-600 mb-1">Phone</label><p className="text-gray-900">{selectedResident.phone || '—'}</p></div>
              <div><label className="block text-gray-600 mb-1">Dependents</label><p className="text-gray-900">{selectedResident.dependents?.length || 0}</p></div>
              <div><label className="block text-gray-600 mb-1">Status</label><StatusBadge status={selectedResident.status} size="sm" /></div>
            </div>
            {selectedResident.dependents?.length > 0 && (
              <div className="mt-4">
                <label className="block text-gray-600 mb-2">Family Members</label>
                <div className="space-y-2">
                  {selectedResident.dependents.map((dep, idx) => (
                    <div key={idx} className="p-3 bg-white border border-gray-200 rounded-lg text-sm flex justify-between">
                      <span className="text-gray-900 font-medium">{dep.name}</span>
                      <span className="text-gray-500">{dep.relationship} {dep.age ? `• ${dep.age} yrs` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <button onClick={() => setShowViewModal(false)} className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
          </div>
        )}
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Resident Information" size="md">
        <div className="space-y-4">
          <div><label className="block text-gray-700 mb-2">Username</label><input type="text" value={editData.username || ''} onChange={e => setEditData({ ...editData, username: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-gray-700 mb-2">Phone</label><input type="tel" value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-gray-700 mb-2">Unit</label><input type="text" value={editData.unit || ''} onChange={e => setEditData({ ...editData, unit: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
          <div><label className="block text-gray-700 mb-2">Status</label>
            <select value={editData.status || 'approved'} onChange={e => setEditData({ ...editData, status: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={handleSaveEdit} disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Saving...' : 'Save Changes'}</button>
            <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
