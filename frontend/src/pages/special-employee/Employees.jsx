import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import {
  Search, Eye, Loader2, X, Users, Briefcase, Phone, Mail,
  Calendar, Shield, Star, CheckCircle, Clock, UserX, ChevronRight,
  MapPin, GraduationCap, Award
} from 'lucide-react';
import { toast } from 'sonner';
import { getUsers } from '../../utils/api';

const categoryColors = {
  'maintenance': 'from-orange-400 to-amber-500',
  'cleaning': 'from-teal-400 to-cyan-500',
  'security': 'from-blue-500 to-indigo-600',
  'administration': 'from-purple-500 to-violet-600',
  'it': 'from-sky-500 to-blue-600',
  'finance': 'from-emerald-500 to-green-600',
  default: 'from-gray-400 to-gray-600',
};

const getCategoryGradient = (cat) => categoryColors[(cat || '').toLowerCase()] || categoryColors.default;

export default function SpecialEmployeeEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [viewEmployee, setViewEmployee] = useState(null);

  useEffect(() => {
    setLoading(true);
    getUsers('role=employee')
      .then(data => setEmployees(data.users || []))
      .catch(() => toast.error('Failed to load employees'))
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(employees.map(e => e.jobCategory).filter(Boolean))];

  const filtered = employees.filter(e =>
    ((e.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.jobCategory || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.email || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'all' || e.status === filterStatus) &&
    (filterCategory === 'all' || e.jobCategory === filterCategory)
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <span className="text-emerald-600 text-sm font-bold uppercase tracking-widest">Staff Directory</span>
            </div>
            <h1 className="text-2xl font-black text-gray-900">Field Employees</h1>
            <p className="text-gray-500 text-sm mt-0.5">View and monitor maintenance & service staff synced from admin</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: `${employees.length} Total`, color: 'bg-gray-100 text-gray-700 border-gray-200' },
              { label: `${employees.filter(e => e.status === 'approved').length} Active`, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
              { label: `${categories.length} Categories`, color: 'bg-blue-100 text-blue-700 border-blue-200' },
            ].map((b, i) => <span key={i} className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${b.color}`}>{b.label}</span>)}
          </div>
        </div>

        {/* Info Banner */}
        <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm">Read-Only Staff Registry</p>
            <p className="text-gray-600 text-xs mt-0.5">
              This directory is synced from the Admin registry. You can view employee details and assign tasks via the <strong>Requests</strong> module. Only administrators can add, update, or remove staff members.
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search by name, category, or email…"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-sm transition-colors" />
            {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-gray-700">
            <option value="all">All Status</option>
            <option value="approved">Active</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-gray-700">
            <option value="all">All Categories</option>
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Employee Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 py-16 text-center">
            <Users className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">No employees found</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(emp => (
              <div key={emp._id}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group">
                {/* Gradient banner */}
                <div className={`h-16 bg-gradient-to-r ${getCategoryGradient(emp.jobCategory)} relative flex items-end p-3`}>
                  <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  <div className="relative flex items-center gap-2">
                    <span className={`px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-lg border border-white/30 capitalize`}>
                      {emp.jobCategory || 'Staff'}
                    </span>
                  </div>
                </div>

                <div className="p-5 -mt-8">
                  {/* Avatar */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${getCategoryGradient(emp.jobCategory)} rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-black mb-3`}>
                    {(emp.username || 'E').charAt(0).toUpperCase()}
                  </div>

                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-black text-gray-900">{emp.username}</p>
                      <p className="text-xs text-gray-500 truncate max-w-[160px]">{emp.email}</p>
                    </div>
                    <StatusBadge status={emp.status} size="sm" />
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{emp.phone || 'No phone'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>Joined {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString() : '—'}</span>
                    </div>
                  </div>

                  <button onClick={() => setViewEmployee(emp)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-transparent rounded-xl text-gray-700 text-sm font-semibold transition-all">
                    <Eye className="w-4 h-4" /> View Details
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Employee Modal */}
      {viewEmployee && (
        <Modal isOpen={!!viewEmployee} onClose={() => setViewEmployee(null)} title="Employee Profile" size="sm">
          <div className="space-y-4">
            <div className={`h-20 rounded-xl bg-gradient-to-r ${getCategoryGradient(viewEmployee.jobCategory)} relative overflow-hidden`}>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            </div>
            <div className="flex items-center gap-4 -mt-12 px-2">
              <div className={`w-16 h-16 bg-gradient-to-br ${getCategoryGradient(viewEmployee.jobCategory)} rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-white text-2xl font-black`}>
                {(viewEmployee.username || 'E').charAt(0).toUpperCase()}
              </div>
              <div className="mt-4">
                <p className="font-black text-xl text-gray-900">{viewEmployee.username}</p>
                <p className="text-sm text-gray-500">{viewEmployee.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: Phone, label: 'Phone', val: viewEmployee.phone || '—' },
                { icon: Briefcase, label: 'Category', val: viewEmployee.jobCategory || 'General' },
                { icon: Calendar, label: 'Joined', val: viewEmployee.createdAt ? new Date(viewEmployee.createdAt).toLocaleDateString() : '—' },
                { icon: Award, label: 'Status', isStatus: true },
              ].map(({ icon: Icon, label, val, isStatus }, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 bg-white rounded-lg border border-gray-200 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase font-bold">{label}</p>
                    {isStatus ? <StatusBadge status={viewEmployee.status} size="sm" /> : <p className="text-sm font-bold text-gray-900">{val}</p>}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => setViewEmployee(null)}
              className="w-full py-2.5 border border-gray-200 rounded-xl font-semibold text-sm hover:bg-gray-50">Close</button>
          </div>
        </Modal>
      )}
    </DashboardLayout>
  );
}
