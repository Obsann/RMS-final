import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import { Search, Info, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getUsers } from '../../utils/api';
import Modal from '../../components/ui/Modal';

export default function SpecialEmployeeEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewEmployee, setViewEmployee] = useState(null);

  useEffect(() => {
    setLoading(true);
    getUsers('role=employee')
      .then(data => setEmployees(data.users || []))
      .catch(() => toast.error('Failed to load employees'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = employees.filter(e =>
    (e.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.jobCategory || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (e.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1>Employees</h1>
          <p className="text-gray-600 mt-1">View maintenance & service staff — information synced from admin</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-gray-700 text-sm">
            This list is synchronized with the admin employee registry. You can view employee details and assign them tasks through the <strong>Requests</strong> section. Only Admin can add, edit, or remove employees.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Total</p>
            <p className="text-gray-900 text-2xl font-semibold">{employees.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Approved</p>
            <p className="text-green-600 text-2xl font-semibold">{employees.filter(e => e.status === 'approved').length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Pending</p>
            <p className="text-yellow-600 text-2xl font-semibold">{employees.filter(e => e.status === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm mb-1">Categories</p>
            <p className="text-blue-600 text-2xl font-semibold">{new Set(employees.map(e => e.jobCategory).filter(Boolean)).size}</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, category, or email..."
              className="w-full pl-11 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-7 h-7 text-blue-500 animate-spin" />
              <span className="ml-3 text-gray-500">Loading employees...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Name</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Email</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Phone</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Category</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Status</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map(emp => (
                    <tr key={emp._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-green-600 font-medium">{(emp.username || 'E').charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{emp.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{emp.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{emp.phone || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {emp.jobCategory || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={emp.status} size="sm" /></td>
                      <td className="px-6 py-4">
                        <button onClick={() => setViewEmployee(emp)}
                          className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="View details">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400 text-sm">No employees found</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View Employee Modal */}
      {viewEmployee && (
        <Modal isOpen={!!viewEmployee} onClose={() => setViewEmployee(null)} title="Employee Details" size="sm">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-xl font-medium">{(viewEmployee.username || 'E').charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">{viewEmployee.username}</p>
                <p className="text-sm text-gray-500">{viewEmployee.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl text-sm">
              <div><p className="text-gray-500 text-xs mb-0.5">Phone</p><p className="font-medium text-gray-900">{viewEmployee.phone || '—'}</p></div>
              <div><p className="text-gray-500 text-xs mb-0.5">Category</p><p className="font-medium text-gray-900">{viewEmployee.jobCategory || 'General'}</p></div>
              <div><p className="text-gray-500 text-xs mb-0.5">Status</p><StatusBadge status={viewEmployee.status} size="sm" /></div>
              <div><p className="text-gray-500 text-xs mb-0.5">Joined</p><p className="font-medium text-gray-900">{viewEmployee.createdAt ? new Date(viewEmployee.createdAt).toLocaleDateString() : '—'}</p></div>
            </div>
            <button onClick={() => setViewEmployee(null)} className="w-full py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50">Close</button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
