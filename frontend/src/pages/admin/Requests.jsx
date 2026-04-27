import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { Search, Loader2, Eye, ArrowUpRight, ChevronLeft, ChevronRight, MessageSquare, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { getRequests, updateRequestStatus } from '../../utils/api';

const ITEMS_PER_PAGE = 10;

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      let query = '';
      if (statusFilter) query += `status=${statusFilter}&`;
      const data = await getRequests(query);
      setRequests(data.requests || []);
    } catch (error) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await updateRequestStatus(id, { status });
      toast.success(`Request marked as ${status}`);
      fetchRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to update');
    }
  };

  const handleSendResponse = async () => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }
    setSubmitting(true);
    try {
      await updateRequestStatus(selectedRequest._id, {
        status: 'completed',
        response: responseText
      });
      toast.success('Response sent and request completed');
      setShowResponseModal(false);
      setResponseText('');
      fetchRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = requests.filter(r =>
    (r.subject || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.resident?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.escalatedBy?.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (r.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter]);

  const priorityColor = (p) => {
    if (p === 'urgent') return 'bg-red-100 text-red-700';
    if (p === 'high') return 'bg-orange-100 text-orange-700';
    if (p === 'medium') return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-600';
  };

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
          <h1>Escalated Requests</h1>
          <p className="text-gray-600 mt-1">Requests escalated by employees and special employees that require admin attention</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
          <ArrowUpRight className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900">Only escalated requests are shown here</p>
            <p className="text-blue-700 text-sm mt-0.5">Resident requests are first handled by employees. Only requests that employees escalate appear on this page.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search by subject, resident, or category..." className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
              <option value="">All Status</option>  
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total', count: requests.length, color: 'text-gray-900' },
            { label: 'Pending', count: requests.filter(r => r.status === 'pending').length, color: 'text-yellow-600' },
            { label: 'In Progress', count: requests.filter(r => r.status === 'in-progress').length, color: 'text-blue-600' },
            { label: 'Completed', count: requests.filter(r => r.status === 'completed').length, color: 'text-green-600' },
          ].map((s, i) => (
            <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 text-center">
              <p className="text-gray-500 text-sm">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.count}</p>
            </div>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Resident</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Subject</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Escalated By</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Priority</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Status</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Date</th>
                  <th className="px-6 py-3 text-left text-gray-600 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginated.map((req) => (
                  <tr key={req._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="text-gray-900 font-medium">{req.resident?.username || '—'}</p>
                      <p className="text-gray-500 text-xs">{req.unit || '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-900 text-sm max-w-[200px] truncate">{req.subject || req.category || '—'}</p>
                      <p className="text-gray-500 text-xs capitalize">{req.type}</p>
                    </td>
                    <td className="px-6 py-4">
                      {req.escalatedBy ? (
                        <div className="flex items-center gap-1.5">
                          <ArrowUpRight className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-blue-700 text-sm font-medium">{req.escalatedBy.username}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${priorityColor(req.priority)}`}>{req.priority}</span>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={req.status} size="sm" /></td>
                    <td className="px-6 py-4 text-gray-500 text-sm">{new Date(req.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setSelectedRequest(req); setShowViewModal(true); }} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600" title="View"><Eye className="w-4 h-4" /></button>
                        {req.status !== 'completed' && req.status !== 'cancelled' && (
                          <button onClick={() => { setSelectedRequest(req); setShowResponseModal(true); }} className="p-2 hover:bg-green-50 rounded-lg text-green-600" title="Respond"><MessageSquare className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {paginated.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No escalated requests found</td></tr>
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
                <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed">
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* View Request Modal */}
      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Request Details" size="lg">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div><label className="block text-gray-600 text-sm mb-1">Resident</label><p className="text-gray-900 font-medium">{selectedRequest.resident?.username || '—'}</p></div>
              <div><label className="block text-gray-600 text-sm mb-1">Unit</label><p className="text-gray-900">{selectedRequest.unit || '—'}</p></div>
              <div><label className="block text-gray-600 text-sm mb-1">Type</label><p className="text-gray-900 capitalize">{selectedRequest.type}</p></div>
              <div><label className="block text-gray-600 text-sm mb-1">Category</label><p className="text-gray-900 capitalize">{selectedRequest.category}</p></div>
              <div><label className="block text-gray-600 text-sm mb-1">Priority</label><span className={`text-xs px-2.5 py-1 rounded-full capitalize font-medium ${priorityColor(selectedRequest.priority)}`}>{selectedRequest.priority}</span></div>
              <div><label className="block text-gray-600 text-sm mb-1">Status</label><StatusBadge status={selectedRequest.status} size="sm" /></div>
            </div>

            <div>
              <label className="block text-gray-600 text-sm mb-1">Subject</label>
              <p className="text-gray-900 font-medium">{selectedRequest.subject}</p>
            </div>

            <div>
              <label className="block text-gray-600 text-sm mb-1">Description</label>
              <p className="text-gray-700 bg-gray-50 rounded-lg p-4 text-sm leading-relaxed">{selectedRequest.description}</p>
            </div>

            {selectedRequest.escalatedBy && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-blue-800 text-sm font-medium mb-1">Escalated By</label>
                <p className="text-blue-900">{selectedRequest.escalatedBy.username} — {selectedRequest.escalatedAt ? new Date(selectedRequest.escalatedAt).toLocaleString() : '—'}</p>
                {selectedRequest.escalationNote && <p className="text-blue-700 text-sm mt-1">{selectedRequest.escalationNote}</p>}
              </div>
            )}

            {selectedRequest.response?.message && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <label className="block text-green-700 text-sm font-medium mb-1">Admin Response</label>
                <p className="text-green-900">{selectedRequest.response.message}</p>
              </div>
            )}

            {selectedRequest.status !== 'completed' && selectedRequest.status !== 'cancelled' && (
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => handleUpdateStatus(selectedRequest._id, 'in-progress')} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Mark In Progress</button>
                <button onClick={() => { setShowViewModal(false); setShowResponseModal(true); }} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Respond & Complete</button>
              </div>
            )}

            <button onClick={() => setShowViewModal(false)} className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Close</button>
          </div>
        )}
      </Modal>

      {/* Response Modal */}
      <Modal isOpen={showResponseModal} onClose={() => setShowResponseModal(false)} title="Respond to Request" size="md">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Responding to: <span className="font-medium text-gray-900">{selectedRequest.subject}</span></p>
              <p className="text-sm text-gray-500 mt-1">From: {selectedRequest.resident?.username || '—'}</p>
            </div>
            <div>
              <label className="block text-gray-700 mb-1 text-sm font-medium">Your Response</label>
              <textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your response to this request..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleSendResponse} disabled={submitting} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">{submitting ? 'Sending...' : 'Send & Complete'}</button>
              <button onClick={() => setShowResponseModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
