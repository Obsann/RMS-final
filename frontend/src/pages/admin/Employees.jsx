import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { Plus, Search, Eye, Edit, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { getUsers, createUser, updateUser } from '../../utils/api';

const ITEMS_PER_PAGE = 10;

const taskCategories = [
  'Document Processing', 'Resident Services', 'ID & Registration',
  'Complaint Handling', 'Records Management', 'Community Affairs',
  'Property Management', 'Revenue & Tax', 'Public Relations',
  'IT & Systems', 'Administrative Support', 'Field Inspection'
];

const emptyForm = {
  username: '', email: '', password: '', phone: '', category: '',
  dateOfBirth: '', sex: '', nationality: '', address: '',
  emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: ''
};

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [formData, setFormData] = useState({ ...emptyForm });
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getUsers('role=employee');
      setEmployees(data.users || []);
    } catch (error) {
      toast.error('Failed to load employees');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async () => {
    if (!formData.username || !formData.email || !formData.password || !formData.phone || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      await createUser({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        role: 'employee',
        status: 'approved',
        jobCategory: formData.category,
        address: formData.address || undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        sex: formData.sex || undefined,
        nationality: formData.nationality || undefined,
      });
      toast.success('Employee added successfully!');
      setShowAddModal(false);
      setFormData({ ...emptyForm });
      fetchEmployees();
    } catch (error) {
      toast.error(error.message || 'Failed to add employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditEmployee = async () => {
    setSubmitting(true);
    try {
      await updateUser(editData._id, {
        username: editData.username,
        phone: editData.phone,
        status: editData.status,
        jobCategory: editData.jobCategory,
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
      toast.success('Employee updated successfully!');
      setShowEditModal(false);
      fetchEmployees();
    } catch (error) {
      toast.error(error.message || 'Failed to update employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (employee) => {
    const newStatus = employee.status === 'approved' ? 'rejected' : 'approved';
    try {
      await updateUser(employee._id, { status: newStatus });
      toast.success(`Employee ${newStatus === 'approved' ? 'activated' : 'deactivated'}`);
      fetchEmployees();
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const filtered = employees.filter((e) =>
    (e.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.jobCategory || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading employees...</span>
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
            <h1>Employee Management</h1>
            <p className="text-gray-600 mt-1">Manage administrative and service staff</p>
          </div>
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" /> Add Employee
          </button>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200 flex items-center gap-6">
          <div><p className="text-gray-500 text-sm">Total</p><p className="text-2xl font-bold text-gray-900">{employees.length}</p></div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div><p className="text-green-600 text-sm">Active</p><p className="text-xl font-semibold text-green-700">{employees.filter(e => e.status === 'approved').length}</p></div>
          <div className="w-px h-10 bg-gray-200"></div>
          <div><p className="text-gray-500 text-sm">Job Categories</p><p className="text-xl font-semibold text-gray-900">{new Set(employees.map(e => e.jobCategory).filter(Boolean)).size}</p></div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by name, category, or email..." className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-600">Name</th>
                  <th className="px-6 py-3 text-left text-gray-600">Email</th>
                  <th className="px-6 py-3 text-left text-gray-600">Phone</th>
                  <th className="px-6 py-3 text-left text-gray-600">Job Category</th>
                  <th className="px-6 py-3 text-left text-gray-600">Active</th>
                  <th className="px-6 py-3 text-left text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginated.map((employee) => (
                  <tr key={employee._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-medium">{(employee.username || 'E').charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-gray-900">{employee.username}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{employee.email}</td>
                    <td className="px-6 py-4 text-gray-600">{employee.phone || '—'}</td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">{employee.jobCategory || 'General'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(employee)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${employee.status === 'approved' ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${employee.status === 'approved' ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedEmployee(employee); setShowViewModal(true); }} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="View Details"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => {
                          setEditData({
                            ...employee,
                            emergencyContactName: employee.emergencyContact?.name || '',
                            emergencyContactPhone: employee.emergencyContact?.phone || '',
                            emergencyContactRelationship: employee.emergencyContact?.relationship || '',
                            dateOfBirth: employee.dateOfBirth ? new Date(employee.dateOfBirth).toISOString().slice(0, 10) : '',
                          });
                          setShowEditModal(true);
                        }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Edit"><Edit className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No employees found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 bg-gray-50">
              <p className="text-sm text-gray-600">Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length}</p>
              <div className="flex items-center gap-2">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" /> Previous
                </button>
                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, i, arr) => (
                      <React.Fragment key={p}>
                        {i > 0 && arr[i - 1] < p - 1 && <span className="px-2 py-1 text-gray-400">…</span>}
                        <button onClick={() => setCurrentPage(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${p === currentPage ? 'bg-blue-600 text-white' : 'border border-gray-300 hover:bg-gray-100'}`}>{p}</button>
                      </React.Fragment>
                    ))
                  }
                </div>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Add Employee Modal ────────────────────── */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Employee" size="lg">
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-gray-700 mb-1 text-sm">Full Name *</label><input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Samuel Fayisa" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Email *</label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="samuel@rms.com" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Password *</label><input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Min. 6 characters" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Phone *</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+251 9XX XXX XXX" /></div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Demographics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-gray-700 mb-1 text-sm">Date of Birth</label><input type="date" value={formData.dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Gender</label>
                <select value={formData.sex} onChange={e => setFormData({ ...formData, sex: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                </select>
              </div>
              <div><label className="block text-gray-700 mb-1 text-sm">Nationality</label><input type="text" value={formData.nationality} onChange={e => setFormData({ ...formData, nationality: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Ethiopian" /></div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Job Assignment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-gray-700 mb-1 text-sm">Job Category *</label>
                <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Category</option>
                  {taskCategories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div><label className="block text-gray-700 mb-1 text-sm">Address</label><input type="text" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Emergency Contact</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-gray-700 mb-1 text-sm">Contact Name</label><input type="text" value={formData.emergencyContactName} onChange={e => setFormData({ ...formData, emergencyContactName: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Contact Phone</label><input type="tel" value={formData.emergencyContactPhone} onChange={e => setFormData({ ...formData, emergencyContactPhone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Relationship</label><input type="text" value={formData.emergencyContactRelationship} onChange={e => setFormData({ ...formData, emergencyContactRelationship: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Spouse" /></div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button onClick={handleAddEmployee} disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Adding...' : 'Add Employee'}</button>
            <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* ─── View Employee Modal ────────────────────── */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Employee Details" size="md">
        {selectedEmployee && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-2xl font-medium">{(selectedEmployee.username || 'E').charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h3 className="text-gray-900 text-lg">{selectedEmployee.username}</h3>
                <p className="text-gray-600">{selectedEmployee.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div><label className="block text-gray-600 mb-1">Phone</label><p className="text-gray-900">{selectedEmployee.phone || '—'}</p></div>
              <div><label className="block text-gray-600 mb-1">Job Category</label><p className="text-gray-900">{selectedEmployee.jobCategory || 'General'}</p></div>
              <div><label className="block text-gray-600 mb-1">Status</label><StatusBadge status={selectedEmployee.status} size="sm" /></div>
              <div><label className="block text-gray-600 mb-1">Joined</label><p className="text-gray-900">{new Date(selectedEmployee.createdAt).toLocaleDateString()}</p></div>
              <div><label className="block text-gray-600 mb-1">Gender</label><p className="text-gray-900">{selectedEmployee.sex || '—'}</p></div>
              <div><label className="block text-gray-600 mb-1">Nationality</label><p className="text-gray-900">{selectedEmployee.nationality || '—'}</p></div>
            </div>
            {selectedEmployee.emergencyContact?.name && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <label className="block text-orange-700 font-medium mb-2">Emergency Contact</label>
                <p className="text-gray-900">{selectedEmployee.emergencyContact.name} — {selectedEmployee.emergencyContact.relationship || '—'}</p>
                <p className="text-gray-600 text-sm">{selectedEmployee.emergencyContact.phone || '—'}</p>
              </div>
            )}
            <button onClick={() => setShowViewModal(false)} className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
          </div>
        )}
      </Modal>

      {/* ─── Edit Employee Modal ────────────────────── */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Employee" size="lg">
        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-gray-700 mb-1 text-sm">Full Name</label><input type="text" value={editData.username || ''} onChange={(e) => setEditData({ ...editData, username: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Phone</label><input type="tel" value={editData.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Demographics</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><label className="block text-gray-700 mb-1 text-sm">Date of Birth</label><input type="date" value={editData.dateOfBirth || ''} onChange={e => setEditData({ ...editData, dateOfBirth: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              <div><label className="block text-gray-700 mb-1 text-sm">Gender</label>
                <select value={editData.sex || ''} onChange={e => setEditData({ ...editData, sex: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                </select>
              </div>
              <div><label className="block text-gray-700 mb-1 text-sm">Nationality</label><input type="text" value={editData.nationality || ''} onChange={e => setEditData({ ...editData, nationality: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3 border-b pb-2">Job Assignment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="block text-gray-700 mb-1 text-sm">Job Category</label>
                <select value={editData.jobCategory || ''} onChange={(e) => setEditData({ ...editData, jobCategory: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Category</option>
                  {taskCategories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
                </select>
              </div>
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
            <button onClick={handleEditEmployee} disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Saving...' : 'Save Changes'}</button>
            <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
