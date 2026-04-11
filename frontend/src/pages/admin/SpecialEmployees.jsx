import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import { Plus, Shield, Edit, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUsers, createUser, updateUser, deleteUser } from '../../utils/api';

export default function AdminSpecialEmployees() {
  const [specialEmployees, setSpecialEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    jobCategory: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const allPermissions = [
    { id: 'manage-tasks', label: 'Manage tasks & Tasks', description: 'Create, assign, and track tasks' },
    { id: 'manage-employees', label: 'Manage Employees', description: 'Add, edit, and remove employees' },
    { id: 'approve-requests', label: 'Approve Requests', description: 'Review and approve resident requests' },
    { id: 'view-reports', label: 'View Reports', description: 'Access system reports and analytics' },
    { id: 'manage-residents', label: 'Manage Residents', description: 'Add, edit, and view resident information' },
    { id: 'digital-id-approval', label: 'Digital ID Approval', description: 'Approve digital ID certificates' },
  ];

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const data = await getUsers('role=special-employee');
      setSpecialEmployees(data.users || []);
    } catch (error) {
      toast.error('Failed to load special employees');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.email || !formData.password) {
      toast.error('Please fill in required fields');
      return;
    }
    setSubmitting(true);
    try {
      await createUser({
        ...formData,
        role: 'special-employee',
        status: 'approved'
      });
      toast.success('Special employee added successfully');
      setShowAddModal(false);
      setFormData({ username: '', email: '', password: '', jobCategory: '' });
      fetchEmployees();
    } catch (error) {
      toast.error(error.message || 'Failed to add employee');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManagePermissions = (employee) => {
    setSelectedEmployee(employee);
    setSelectedPermissions(employee.permissions || []);
    setShowPermissionsModal(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedEmployee) return;
    setSubmitting(true);
    try {
      await updateUser(selectedEmployee._id, { permissions: selectedPermissions });
      toast.success('Permissions updated successfully!');
      setShowPermissionsModal(false);
      fetchEmployees();
    } catch (error) {
      toast.error(error.message || 'Failed to update permissions');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this employee?')) return;
    try {
      await deleteUser(id);
      toast.success('Employee removed successfully');
      fetchEmployees();
    } catch (error) {
      toast.error(error.message || 'Failed to delete employee');
    }
  };

  const togglePermission = (permId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId) ? prev.filter((p) => p !== permId) : [...prev, permId]
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Special Employees</h1>
            <p className="text-gray-600 mt-1">Manage special employees and their permissions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Special Employee
          </button>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Shield className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
          <div>
            <p className="font-semibold text-gray-900 mb-1">About Special Employees</p>
            <p className="text-gray-600 text-sm">
              Special employees have elevated permissions to manage tasks, approve requests, and oversee operations.
              Configure their access level based on their responsibilities.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <span className="ml-3 text-gray-600">Loading employees...</span>
          </div>
        ) : (
          <div className="grid gap-6">
            {specialEmployees.map((employee) => (
              <div key={employee._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-purple-600 text-xl font-medium">{employee.username.charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1 capitalize">{employee.username}</h3>
                      <p className="text-gray-600 text-sm">{employee.email}</p>
                      <p className="text-gray-500 text-sm mt-1">{employee.jobCategory || 'Special Employee'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleManagePermissions(employee)}
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700"
                    >
                      <Edit className="w-4 h-4" />
                      Permissions
                    </button>
                    <button onClick={() => handleDelete(employee._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-gray-600 text-sm mb-2 font-medium">Current Permissions:</p>
                  <div className="flex flex-wrap gap-2">
                    {employee.permissions && employee.permissions.length > 0 ? employee.permissions.map((perm, idx) => (
                      <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-medium rounded-full">
                        {allPermissions.find((p) => p.id === perm)?.label || perm}
                      </span>
                    )) : (
                      <span className="text-sm text-gray-500 italic">No permissions assigned</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {specialEmployees.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200 border-dashed">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No special employees found.</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Special Employee" size="md">
        <form onSubmit={handleAddEmployee} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input required type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="E.g. Samuel Tolasa" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="name@domain.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input required type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role/Title (Optional)</label>
            <input type="text" value={formData.jobCategory} onChange={e => setFormData({ ...formData, jobCategory: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Manager, Supervisor, etc." />
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button disabled={submitting} type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {submitting ? 'Adding...' : 'Add Employee'}
            </button>
            <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Cancel</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showPermissionsModal} onClose={() => setShowPermissionsModal(false)} title={`Manage Permissions`} size="lg">
        <div className="space-y-4">
          <p className="text-gray-600">Select the permissions you want to grant to <strong className="text-gray-900 capitalize">{selectedEmployee?.username}</strong>:</p>
          <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
            {allPermissions.map((permission) => (
              <div key={permission.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => togglePermission(permission.id)}>
                <input
                  type="checkbox"
                  id={permission.id}
                  checked={selectedPermissions.includes(permission.id)}
                  readOnly
                  className="mt-1 w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 pointer-events-none"
                />
                <div className="flex-1">
                  <p className="text-gray-900 font-medium">{permission.label}</p>
                  <p className="text-gray-500 text-sm mt-0.5">{permission.description}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button disabled={submitting} onClick={handleSavePermissions} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
              {submitting ? 'Saving...' : 'Save Permissions'}
            </button>
            <button onClick={() => setShowPermissionsModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700">Cancel</button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
