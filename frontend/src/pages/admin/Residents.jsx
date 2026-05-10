import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { Plus, Search, Eye, Edit, IdCard, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getUsers, createUser, updateUser } from '../../utils/api';
import DualCalendarField from '../../components/ui/DualCalendarField';

const ITEMS_PER_PAGE = 10;

const emptyForm = {
  username: '', email: '', password: '', phone: '', unit: '',
  dateOfBirth: '', sex: '', nationality: '', address: '',
  emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: ''
};

export default function AdminResidents() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedResident, setSelectedResident] = useState(null);
  const [editData, setEditData] = useState({});
  const [formData, setFormData] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

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

  const handleAddResident = async () => {
    if (!formData.username || !formData.email || !formData.password || !formData.unit) {
      toast.error('Please fill in required fields (Name, Email, Password, Unit)');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        unit: formData.unit,
        role: 'resident',
        status: 'approved',
        address: formData.address || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        sex: formData.sex || undefined,
        nationality: formData.nationality || undefined,
      };
      await createUser(payload);
      // If emergency contact provided, update separately
      toast.success('Resident added successfully!');
      setShowAddModal(false);
      setFormData({ ...emptyForm });
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
        status: editData.status,
        address: editData.address,
        dateOfBirth: editData.dateOfBirth,
        sex: editData.sex,
        nationality: editData.nationality,
        emergencyContact: {
          name: editData.emergencyContactName || editData.emergencyContact?.name,
          phone: editData.emergencyContactPhone || editData.emergencyContact?.phone,
          relationship: editData.emergencyContactRelationship || editData.emergencyContact?.relationship,
        }
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

  // Toggle status
  const handleToggleStatus = async (resident) => {
    const newStatus = resident.status === 'approved' ? 'rejected' : 'approved';
    try {
      await updateUser(resident._id, { status: newStatus });
      toast.success(`Resident ${newStatus === 'approved' ? 'approved' : 'deactivated'}`);
      fetchResidents();
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const filtered = residents.filter(r => {
    const matchSearch = (r.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.unit || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginatedResidents = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  // Reset page if search changes
  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  const idStatusColors = {
    approved: 'text-green-600 bg-green-50 border-green-200',
    issued: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    pending: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    verified: 'text-sky-700 bg-sky-50 border-sky-200',
    processing: 'text-indigo-700 bg-indigo-50 border-indigo-200',
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

        {/* Summary Card */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center gap-6">
          <div><p className="text-gray-500 text-sm">Total</p><p className="text-2xl font-bold text-gray-900">{residents.length}</p></div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div><p className="text-green-600 text-sm">Active</p><p className="text-xl font-semibold text-green-700">{residents.filter(r => r.status === 'approved').length}</p></div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div><p className="text-red-500 text-sm">Inactive</p><p className="text-xl font-semibold text-red-600">{residents.filter(r => r.status !== 'approved').length}</p></div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, email, or unit..." className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
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
                  <th className="px-6 py-3 text-left text-gray-600">Active</th>
                  <th className="px-6 py-3 text-left text-gray-600">Digital ID</th>
                  <th className="px-6 py-3 text-left text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedResidents.map(r => (
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
                    <td className="px-6 py-4">
                      {/* Toggle Switch */}
                      <button
                        onClick={() => handleToggleStatus(r)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${r.status === 'approved' ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${r.status === 'approved' ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-sm capitalize ${idStatusColors[r.digitalId?.status || 'none']}`}>
                        <IdCard className="w-3.5 h-3.5" />
                        {r.digitalId?.status || 'None'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedResident(r); setShowViewModal(true); }} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="View"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => {
                          setEditData({
                            ...r,
                            emergencyContactName: r.emergencyContact?.name || '',
                            emergencyContactPhone: r.emergencyContact?.phone || '',
                            emergencyContactRelationship: r.emergencyContact?.relationship || '',
                            dateOfBirth: r.dateOfBirth ? new Date(r.dateOfBirth).toISOString().slice(0, 10) : '',
                          });
                          setShowEditModal(true);
                        }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Edit"><Edit className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginatedResidents.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No residents found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, i, arr) => (
                      <React.Fragment key={p}>
                        {i > 0 && arr[i - 1] < p - 1 && <span className="px-2 py-1 text-gray-400">…</span>}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium ${p === currentPage ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-100'}`}
                        >{p}</button>
                      </React.Fragment>
                    ))
                  }
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Add Resident Modal ────────────────────── */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Resident" size="lg">
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-gray-700 mb-1 text-sm">Full Name *</label><input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Abebe Kebede" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Email *</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="abebe@example.com" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Password *</label><input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Min. 6 characters" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Phone</label><input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+251 9XX XXX XXX" /></div>
            </div>
          </div>

          {/* Demographics */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Demographics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-gray-700 mb-1 text-sm">Date of Birth</label><DualCalendarField id="res-add-dob" value={formData.dateOfBirth} onChange={(val) => setFormData({ ...formData, dateOfBirth: val })} /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Gender</label>
                <select value={formData.sex} onChange={e => setFormData({ ...formData, sex: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                </select>
              </div>
              <div><label className="block text-gray-700 mb-1 text-sm">Nationality</label><input type="text" value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Ethiopian" /></div>
            </div>
          </div>

          {/* Residence Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Residence Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-gray-700 mb-1 text-sm">Unit / House No. *</label><input type="text" value={formData.unit} onChange={e => setFormData({ ...formData, unit: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. A-101" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Full Address</label><input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Kebele 03, Bole Sub-City" /></div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Emergency Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-gray-700 mb-1 text-sm">Contact Name</label><input type="text" value={formData.emergencyContactName} onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Contact Phone</label><input type="tel" value={formData.emergencyContactPhone} onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Relationship</label><input type="text" value={formData.emergencyContactRelationship} onChange={e => setFormData({ ...formData, emergencyContactRelationship: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Spouse, Sibling" /></div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button onClick={handleAddResident} disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Adding...' : 'Add Resident'}</button>
            <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* ─── View Resident Modal ────────────────────── */}
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
              <div><label className="block text-gray-600 mb-1">Gender</label><p className="text-gray-900">{selectedResident.sex || '—'}</p></div>
              <div><label className="block text-gray-600 mb-1">Nationality</label><p className="text-gray-900">{selectedResident.nationality || '—'}</p></div>
              <div><label className="block text-gray-600 mb-1">Date of Birth</label><p className="text-gray-900">{selectedResident.dateOfBirth ? new Date(selectedResident.dateOfBirth).toLocaleDateString() : '—'}</p></div>
              <div><label className="block text-gray-600 mb-1">Status</label><StatusBadge status={selectedResident.status} size="sm" /></div>
              <div className="col-span-2"><label className="block text-gray-600 mb-1">Address</label><p className="text-gray-900">{selectedResident.address || '—'}</p></div>
            </div>
            {selectedResident.emergencyContact?.name && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <label className="block text-orange-700 font-medium mb-2">Emergency Contact</label>
                <p className="text-gray-900">{selectedResident.emergencyContact.name} — {selectedResident.emergencyContact.relationship || '—'}</p>
                <p className="text-gray-600 text-sm">{selectedResident.emergencyContact.phone || '—'}</p>
              </div>
            )}
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

      {/* ─── Edit Resident Modal ────────────────────── */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Resident Information" size="lg">
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-gray-700 mb-1 text-sm">Full Name</label><input type="text" value={editData.username || ''} onChange={e => setEditData({ ...editData, username: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Phone</label><input type="tel" value={editData.phone || ''} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Demographics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-gray-700 mb-1 text-sm">Date of Birth</label><DualCalendarField id="res-edit-dob" value={editData.dateOfBirth || ''} onChange={(val) => setEditData({ ...editData, dateOfBirth: val })} /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Gender</label>
                <select value={editData.sex || ''} onChange={e => setEditData({ ...editData, sex: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                </select>
              </div>
              <div><label className="block text-gray-700 mb-1 text-sm">Nationality</label><input type="text" value={editData.nationality || ''} onChange={e => setEditData({ ...editData, nationality: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Residence</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-gray-700 mb-1 text-sm">Unit</label><input type="text" value={editData.unit || ''} onChange={e => setEditData({ ...editData, unit: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Address</label><input type="text" value={editData.address || ''} onChange={e => setEditData({ ...editData, address: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Emergency Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-gray-700 mb-1 text-sm">Name</label><input type="text" value={editData.emergencyContactName || ''} onChange={e => setEditData({ ...editData, emergencyContactName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Phone</label><input type="tel" value={editData.emergencyContactPhone || ''} onChange={e => setEditData({ ...editData, emergencyContactPhone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Relationship</label><input type="text" value={editData.emergencyContactRelationship || ''} onChange={e => setEditData({ ...editData, emergencyContactRelationship: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Account Status</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setEditData({ ...editData, status: editData.status === 'approved' ? 'rejected' : 'approved' })}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${editData.status === 'approved' ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow ${editData.status === 'approved' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
              <span className={`text-sm font-medium ${editData.status === 'approved' ? 'text-green-700' : 'text-gray-500'}`}>
                {editData.status === 'approved' ? 'Active (Approved)' : 'Inactive (Rejected)'}
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button onClick={handleSaveEdit} disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Saving...' : 'Save Changes'}</button>
            <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
