import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, Clock, CheckCircle, MessageSquare } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import { toast } from 'sonner';
import { getRequests, createRequest } from '../../utils/api';

const ALL_CATEGORIES = [
  'Maintenance', 'Plumbing', 'Electrical', 'Cleaning', 'Security',
  'Noise', 'Waste Management', 'Parking', 'Pets', 'Rules Violation', 'Other'
];

export default function ResidentRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    category: '',
    subject: '',
    description: '',
    priority: 'medium'
  });
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
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateIssue = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.subject || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const apiPayload = {
        type: 'maintenance',
        category: formData.category,
        subject: formData.subject,
        description: formData.description,
        priority: formData.priority
      };
      await createRequest(apiPayload);
      toast.success('Issue reported successfully');
      setShowModal(false);
      setFormData({ category: '', subject: '', description: '', priority: 'medium' });
      fetchRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to submit issue');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    return (r.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-700 bg-green-50 border-green-200';
      case 'in-progress': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'assigned': return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'cancelled': return 'text-gray-700 bg-gray-50 border-gray-200';
      default: return 'text-yellow-700 bg-yellow-50 border-yellow-200'; // pending
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Issues</h1>
            <p className="text-gray-600 mt-1">Report issues, requests, or complaints to management</p>
          </div>
          <button onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
            Report Issue
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-gray-600" />
              </div>
              <div><p className="text-sm font-medium text-gray-600">Total Reported</p><p className="text-2xl font-semibold text-gray-900">{requests.length}</p></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div><p className="text-sm font-medium text-gray-600">Pending</p><p className="text-2xl font-semibold text-gray-900">{requests.filter(r => r.status === 'pending').length}</p></div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div><p className="text-sm font-medium text-gray-600">Resolved</p><p className="text-2xl font-semibold text-gray-900">{requests.filter(r => r.status === 'completed').length}</p></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search your issues..." className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading your issues...</div>
            ) : filteredRequests.length > 0 ? (
              filteredRequests.map(item => (
                <div key={item._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(item.status)}`}>{item.status.replace('-', ' ')}</span>
                        <span className="text-gray-500 text-sm">{new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">{item.subject}</h3>
                      <p className="text-gray-600">{item.description}</p>
                      <div className="flex items-center gap-2 pt-2">
                        <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md">{item.category}</span>
                        {item.priority && <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-1 rounded-md capitalize">Priority: {item.priority}</span>}
                      </div>
                      {item.response?.message && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-sm font-medium text-blue-900 mb-1">Response from Management:</p>
                          <p className="text-sm text-blue-800">{item.response.message}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No issues found</h3>
                <p className="text-gray-500">You haven't reported any issues yet.</p>
                <div className="mt-6">
                  <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">Report an Issue</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Report an Issue" size="md">
        <form onSubmit={handleCreateIssue} className="space-y-4">
          <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p>Describe any issue — whether it's a service request, maintenance need, or a community complaint. Our team will handle it accordingly.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Select a category</option>
              {ALL_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input required type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="E.g., Leaking pipe, Loud noise at night, Broken streetlight" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details *</label>
            <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Please provide specific details about your issue..." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
            <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="low">Low — When convenient</option>
              <option value="medium">Medium — Standard timeframe</option>
              <option value="high">High — Urgent attention needed</option>
            </select>
          </div>
          <div className="pt-4 flex gap-3">
            <button disabled={submitting} type="submit" className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50">
              {submitting ? 'Submitting...' : 'Submit Issue'}
            </button>
            <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
