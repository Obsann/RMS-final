import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { Eye, AlertTriangle, MessageSquare, Filter, Search, Trash2, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getRequests, updateRequestStatus, deleteRequest } from '../../utils/api';

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [adminResponse, setAdminResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const data = await getRequests();
      setRequests(data.requests || []);
    } catch (error) {
      toast.error('Failed to load requests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setAdminResponse(request.response?.message || '');
    setShowDetailsModal(true);
  };

  const handleUpdateStatus = async (status) => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await updateRequestStatus(selectedRequest._id, {
        status,
        response: adminResponse
      });
      toast.success(`Request marked as ${status}`);
      setShowDetailsModal(false);
      fetchRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to update request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm('Are you sure you want to delete this request?')) return;
    try {
      await deleteRequest(id);
      toast.success('Request deleted successfully');
      fetchRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to delete request');
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
          <h1>Requests & Complaints Overview</h1>
          <p className="text-gray-600 mt-1">Monitor all community issues reported by residents</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-gray-600 mb-1">Total</p>
            <p className="text-gray-900 text-2xl font-semibold">{requests.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-gray-600 mb-1">Pending</p>
            <p className="text-yellow-600 text-2xl font-semibold">{requests.filter(r => r.status === 'pending').length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-gray-600 mb-1">In Progress / Assigned</p>
            <p className="text-blue-600 text-2xl font-semibold">{requests.filter(r => r.status === 'in-progress' || r.status === 'assigned').length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-gray-600 mb-1">Completed</p>
            <p className="text-green-600 text-2xl font-semibold">{requests.filter(r => r.status === 'completed').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex gap-8 px-6 overflow-x-auto">
              {[
                { key: 'all', label: `All (${requests.length})` },
                { key: 'request', label: `Requests (${requests.filter(r => r.type === 'request').length})` },
                { key: 'complaint', label: `Complaints (${requests.filter(r => r.type === 'complaint').length})` },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`py-4 border-b-2 whitespace-nowrap transition-colors ${activeTab === key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search by subject or resident name..." className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>

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
                        <button onClick={() => handleViewDetails(request)} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="View & Review"><Eye className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteRequest(request._id)} className="p-2 hover:bg-red-50 rounded-lg text-red-600" title="Delete"><Trash2 className="w-4 h-4" /></button>
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

      {/* Details/Review Modal */}
      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Issue Review" size="lg">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
              <div><label className="block text-gray-600 mb-1 text-sm">Type</label><span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs ${selectedRequest.type === 'request' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>{selectedRequest.type}</span></div>
              <div><label className="block text-gray-600 mb-1 text-sm">Status</label><StatusBadge status={selectedRequest.status} size="sm" /></div>
              <div><label className="block text-gray-600 mb-1 text-sm">Resident</label><p className="text-gray-900">{selectedRequest.resident?.username || '—'}</p></div>
              <div><label className="block text-gray-600 mb-1 text-sm">Unit / Phone</label><p className="text-gray-900 text-sm">{selectedRequest.unit || selectedRequest.resident?.unit || '—'} / {selectedRequest.resident?.phone || '—'}</p></div>
              <div><label className="block text-gray-600 mb-1 text-sm">Category</label><p className="text-gray-900">{selectedRequest.category}</p></div>
              <div><label className="block text-gray-600 mb-1 text-sm">Priority</label><p className="text-gray-900 capitalize">{selectedRequest.priority}</p></div>
              <div><label className="block text-gray-600 mb-1 text-sm">Submitted</label><p className="text-gray-900 text-sm">{new Date(selectedRequest.createdAt).toLocaleString()}</p></div>
            </div>

            <div className="p-4 border border-gray-200 rounded-lg">
              <label className="block text-gray-600 mb-1 text-sm font-medium">Subject</label>
              <p className="text-gray-900 font-medium mb-3">{selectedRequest.subject}</p>
              <label className="block text-gray-600 mb-1 text-sm font-medium">Description</label>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedRequest.description}</p>
            </div>

            <div className="pt-2 border-t border-gray-200">
              <label className="block text-gray-700 mb-2 font-medium">Admin Response / Notes</label>
              <textarea
                value={adminResponse}
                onChange={e => setAdminResponse(e.target.value)}
                placeholder="Add a response or internal note..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">This response will be visible to the resident if they check their request status.</p>
            </div>

            <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
              {Object.entries({
                pending: { label: 'Mark Pending', color: 'bg-yellow-500 hover:bg-yellow-600' },
                'in-progress': { label: 'Mark In-Progress', color: 'bg-blue-600 hover:bg-blue-700' },
                completed: { label: 'Mark Completed', color: 'bg-green-600 hover:bg-green-700' },
                cancelled: { label: 'Cancel Request', color: 'bg-gray-500 hover:bg-gray-600' }
              }).map(([statusValue, config]) => (
                selectedRequest.status !== statusValue && (
                  <button
                    key={statusValue}
                    disabled={submitting}
                    onClick={() => handleUpdateStatus(statusValue)}
                    className={`px-4 py-2 text-white rounded-lg text-sm transition-colors disabled:opacity-50 ${config.color}`}
                  >
                    {config.label}
                  </button>
                )
              ))}
              <div className="flex-1"></div>
              <button disabled={submitting} onClick={() => setShowDetailsModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
