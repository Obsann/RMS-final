import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { Eye, AlertTriangle, MessageSquare, Filter, Search, UserPlus, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRequests, updateRequestStatus, convertRequestToJob, getUsers } from '../../utils/api';

export default function SpecialEmployeeRequests() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [assignData, setAssignData] = useState({ employeeId: '', priority: 'medium', dueDate: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqData, empData] = await Promise.all([
        getRequests(),
        getUsers('role=employee')
      ]);
      setRequests(reqData.requests || []);
      setEmployees(empData.users || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await updateRequestStatus(selectedRequest._id, { status });
      toast.success(`Request marked as ${status}`);
      setShowDetailsModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignJob = async () => {
    if (!assignData.employeeId) {
      toast.error('Please select an employee');
      return;
    }
    setSubmitting(true);
    try {
      await convertRequestToJob(selectedRequest._id, {
        assignedTo: assignData.employeeId,
        priority: assignData.priority,
        dueDate: assignData.dueDate || undefined
      });
      toast.success('Request converted to job and assigned!');
      setShowAssignModal(false);
      setShowDetailsModal(false);
      setAssignData({ employeeId: '', priority: 'medium', dueDate: '' });
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to assign job');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchTab = activeTab === 'all' || r.type === activeTab;
    const matchSearch = (r.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.resident?.username || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchTab && matchSearch;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading requests...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1>Requests & Complaints Management</h1>
          <p className="text-gray-600 mt-1">Review community issues and assign staff to resolve them</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-gray-600 mb-1">Total Active</p>
            <p className="text-gray-900 text-2xl font-semibold">{requests.filter(r => r.status !== 'completed' && r.status !== 'cancelled').length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-yellow-200 bg-yellow-50">
            <p className="text-yellow-700 mb-1">New / Pending</p>
            <p className="text-gray-900 text-2xl font-semibold">{requests.filter(r => r.status === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-blue-200 bg-blue-50">
            <p className="text-blue-700 mb-1">In Progress</p>
            <p className="text-gray-900 text-2xl font-semibold">{requests.filter(r => r.status === 'in-progress' || r.status === 'assigned').length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-green-200 bg-green-50">
            <p className="text-green-700 mb-1">Completed</p>
            <p className="text-gray-900 text-2xl font-semibold">{requests.filter(r => r.status === 'completed').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4 mb-4 border-b pb-4">
            {[
              { key: 'all', label: `All (${requests.length})` },
              { key: 'request', label: `Requests (${requests.filter(r => r.type === 'request').length})` },
              { key: 'complaint', label: `Complaints (${requests.filter(r => r.type === 'complaint').length})` },
            ].map(({ key, label }) => (
              <button key={key} onClick={() => setActiveTab(key)}
                className={`px-4 py-2 rounded-lg transition-colors ${activeTab === key ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by subject or resident..." className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-600">Type</th>
                  <th className="px-6 py-3 text-left text-gray-600">Resident</th>
                  <th className="px-6 py-3 text-left text-gray-600">Category</th>
                  <th className="px-6 py-3 text-left text-gray-600">Subject</th>
                  <th className="px-6 py-3 text-left text-gray-600">Status</th>
                  <th className="px-6 py-3 text-left text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequests.map(request => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${request.type === 'request' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                        {request.type === 'request' ? <AlertTriangle className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                        {request.type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {request.resident?.username || 'Unknown'} <br />
                      <span className="text-gray-500 text-sm">Unit {request.unit || request.resident?.unit || '—'}</span>
                    </td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 rounded text-sm">{request.category}</span></td>
                    <td className="px-6 py-4 max-w-xs truncate">{request.subject}</td>
                    <td className="px-6 py-4"><StatusBadge status={request.status} size="sm" /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedRequest(request); setShowDetailsModal(true); }} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="Review & Take Action"><Eye className="w-4 h-4" /></button>
                        {(request.status === 'pending' || request.status === 'in-progress') && request.type === 'request' && !request.job && (
                          <button onClick={() => { setSelectedRequest(request); setShowAssignModal(true); }} className="p-2 hover:bg-green-50 rounded-lg text-green-600" title="Assign to Staff"><UserPlus className="w-4 h-4" /></button>
                        )}
                        {request.status !== 'completed' && (
                          <button onClick={() => { setSelectedRequest(request); handleUpdateStatus('completed'); }} disabled={submitting} className="p-2 hover:bg-green-50 rounded-lg text-green-600" title="Mark Completed"><CheckCircle className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No requests found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Issue Review & Action" size="lg">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div><label className="block text-gray-600 mb-1 text-sm">Type</label><span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs ${selectedRequest.type === 'request' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>{selectedRequest.type}</span></div>
              <div><label className="block text-gray-600 mb-1 text-sm">Status</label><StatusBadge status={selectedRequest.status} size="sm" /></div>
              <div><label className="block text-gray-600 mb-1 text-sm">Resident</label><p className="text-gray-900">{selectedRequest.resident?.username || '—'}</p></div>
              <div><label className="block text-gray-600 mb-1 text-sm">Unit / Phone</label><p className="text-gray-900 text-sm">{selectedRequest.unit || selectedRequest.resident?.unit || '—'} / {selectedRequest.resident?.phone || '—'}</p></div>
              <div><label className="block text-gray-600 mb-1 text-sm">Category</label><p className="text-gray-900">{selectedRequest.category}</p></div>
              <div><label className="block text-gray-600 mb-1 text-sm">Priority</label><p className="text-gray-900 capitalize">{selectedRequest.priority}</p></div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <label className="block text-gray-600 mb-1 text-sm font-medium">Subject</label>
              <p className="text-gray-900 font-medium mb-3">{selectedRequest.subject}</p>
              <label className="block text-gray-600 mb-1 text-sm font-medium">Description</label>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedRequest.description}</p>
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 mt-6">
              {(selectedRequest.status === 'pending' || selectedRequest.status === 'in-progress') && selectedRequest.type === 'request' && !selectedRequest.job && (
                <button onClick={() => { setShowDetailsModal(false); setShowAssignModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"><UserPlus className="w-4 h-4" /> Assign to Staff</button>
              )}
              {selectedRequest.status !== 'completed' && (
                <button disabled={submitting} onClick={() => handleUpdateStatus('completed')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Mark as Completed</button>
              )}
              <div className="flex-1"></div>
              <button disabled={submitting} onClick={() => setShowDetailsModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Close</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Task to Employee" size="md">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 text-blue-800 rounded-lg mb-4 text-sm">
              You are assigning the request <strong>"{selectedRequest.subject}"</strong> to a maintenance staff member. This will convert the request into an actionable job.
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Select Employee</label>
              <select value={assignData.employeeId} onChange={e => setAssignData({ ...assignData, employeeId: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Choose Staff Member --</option>
                {employees.filter(e => e.status === 'active').map(emp => (
                  <option key={emp._id} value={emp._id}>{emp.username} ({emp.jobCategory || 'General'})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Priority Level</label>
              <select value={assignData.priority} onChange={e => setAssignData({ ...assignData, priority: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-gray-700 mb-2">Due Date (Optional)</label>
              <input type="date" value={assignData.dueDate} onChange={e => setAssignData({ ...assignData, dueDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 pt-4">
              <button onClick={handleAssignJob} disabled={submitting || !assignData.employeeId} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">{submitting ? 'Assigning...' : 'Confirm Assignment'}</button>
              <button onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
