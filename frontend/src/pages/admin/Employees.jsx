import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { Plus, Search, Filter, Eye, Edit, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUsers, createUser, updateUser } from '../../utils/api';

export default function AdminEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const taskCategories = ['Water Supply', 'Electricity', 'Sanitation', 'Public Infrastructure', 'Road Maintenance', 'Waste Management', 'Security', 'Carpentry', 'General Maintenance', 'Plumbing', 'Cleaning'];

  const [formData, setFormData] = useState({ username: '', email: '', password: '', phone: '', category: '' });
  const [editData, setEditData] = useState({});

  // Fetch employees from backend
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
      toast.error('Please fill in all fields');
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
      });
      toast.success('Employee added successfully!');
      setShowAddModal(false);
      setFormData({ username: '', email: '', password: '', phone: '', category: '' });
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

  const filtered = employees.filter((e) =>
    (e.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.jobCategory || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            <p className="text-gray-600 mt-1">Manage maintenance and service staff</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Employee
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-gray-600 mb-1">Total Employees</p>
            <p className="text-gray-900 text-2xl font-semibold">{employees.length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-gray-600 mb-1">Active</p>
            <p className="text-green-600 text-2xl font-semibold">{employees.filter(e => e.status === 'approved').length}</p>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <p className="text-gray-600 mb-1">Categories</p>
            <p className="text-gray-900 text-2xl font-semibold">{new Set(employees.map(e => e.jobCategory).filter(Boolean)).size}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, category, or email..."
                className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
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
                  <th className="px-6 py-3 text-left text-gray-600">Category</th>
                  <th className="px-6 py-3 text-left text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((employee) => (
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
                    <td className="px-6 py-4"><StatusBadge status={employee.status} size="sm" /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setSelectedEmployee(employee); setShowViewModal(true); }}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => { setEditData({ ...employee }); setShowEditModal(true); }}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-600" title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No employees found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Employee Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Employee" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Username</label>
            <input type="text" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. samuel.fayisa" />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Email</label>
            <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="samuel@rms.com" />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Password</label>
            <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="••••••••" />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Phone</label>
            <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+251 9XX XXX XXX" />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Job Category</label>
            <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Category</option>
              {taskCategories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={handleAddEmployee} disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add Employee'}
            </button>
            <button onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* View Employee Modal */}
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
              <div><label className="block text-gray-600 mb-1">Category</label><p className="text-gray-900">{selectedEmployee.jobCategory || 'General'}</p></div>
              <div><label className="block text-gray-600 mb-1">Status</label><StatusBadge status={selectedEmployee.status} size="sm" /></div>
              <div><label className="block text-gray-600 mb-1">Joined</label><p className="text-gray-900">{new Date(selectedEmployee.createdAt).toLocaleDateString()}</p></div>
            </div>
            <button onClick={() => setShowViewModal(false)} className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
          </div>
        )}
      </Modal>

      {/* Edit Employee Modal */}
      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Employee" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 mb-2">Username</label>
            <input type="text" value={editData.username || ''} onChange={(e) => setEditData({ ...editData, username: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Phone</label>
            <input type="tel" value={editData.phone || ''} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Category</label>
            <select value={editData.jobCategory || ''} onChange={(e) => setEditData({ ...editData, jobCategory: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select Category</option>
              {taskCategories.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-700 mb-2">Status</label>
            <select value={editData.status || 'approved'} onChange={(e) => setEditData({ ...editData, status: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="approved">Approved (Active)</option>
              <option value="rejected">Rejected (Inactive)</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button onClick={handleEditEmployee} disabled={submitting} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => setShowEditModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
