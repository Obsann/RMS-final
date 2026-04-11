import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, AlertTriangle, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import { toast } from 'sonner';
import { getRequests, createRequest } from '../../utils/api';

export default function ResidentRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showRequestModal, setShowRequestModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    type: 'request', // request | complaint
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
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!formData.category || !formData.subject || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const apiPayload = { ...formData, type: formData.type === 'request' ? 'maintenance' : formData.type };
      await createRequest(apiPayload);
      toast.success(`${formData.type === 'request' ? 'Request' : 'Complaint'} submitted successfully`);
      setShowRequestModal(false);
      setFormData({ type: 'request', category: '', subject: '', description: '', priority: 'medium' });
      fetchRequests();
    } catch (error) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const requestCategories = ['Maintenance', 'Plumbing', 'Electrical', 'Cleaning', 'Security', 'Other'];
  const complaintCategories = ['Noise', 'Waste Management', 'Parking', 'Pets', 'Rules Violation', 'Other'];

  const filteredRequests = requests.filter(r => {
    const apiType = activeTab === 'request' ? 'maintenance' : activeTab;
    const matchTab = activeTab === 'all' || r.type === apiType;
    const matchSearch = (r.subject || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchTab && matchSearch;
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

  const getTypeIcon = (type) => {
    return (type === 'request' || type === 'maintenance') ? <AlertTriangle className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Requests & Complaints</h1>
            <p className="text-gray-600 mt-1">Submit requests to management or report community issues</p>
          </div>
          <button onClick={() => { setFormData({ ...formData, type: 'request' }); setShowRequestModal(true); }}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors">
            <Plus className="w-5 h-5" />
            New Submission
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center">
                <Filter className="w-6 h-6 text-gray-600" />
              </div>
              <div><p className="text-sm font-medium text-gray-600">Total Submitted</p><p className="text-2xl font-semibold text-gray-900">{requests.length}</p></div>
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
          <div className="border-b border-gray-200">
            <div className="flex gap-8 px-6 overflow-x-auto">
              {['all', 'request', 'complaint'].map((tab) => {
                const apiType = tab === 'request' ? 'maintenance' : tab;
                return (
                  <button key={tab} onClick={() => setActiveTab(tab)}
                    className={`py-4 border-b-2 font-medium whitespace-nowrap transition-colors capitalize ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    {tab === 'all' ? `All (${requests.length})` : `${tab}s (${requests.filter(r => r.type === apiType).length})`}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search your submissions..." className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" />
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading your submissions...</div>
            ) : filteredRequests.length > 0 ? (
              filteredRequests.map(item => (
                <div key={item._id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${item.type === 'maintenance' || item.type === 'request' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                          {getTypeIcon(item.type)} <span className="capitalize">{item.type === 'maintenance' ? 'request' : item.type}</span>
                        </span>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No submissions found</h3>
                <p className="text-gray-500">You haven't submitted any {activeTab === 'all' ? 'requests or complaints' : `${activeTab}s`} matching your search.</p>
                <div className="mt-6 flex justify-center gap-3">
                  <button onClick={() => { setFormData({ ...formData, type: 'request' }); setShowRequestModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors">Submit Request</button>
                  <button onClick={() => { setFormData({ ...formData, type: 'complaint' }); setShowRequestModal(true); }} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium transition-colors">Submit Complaint</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showRequestModal} onClose={() => setShowRequestModal(false)} title={`New ${formData.type === 'request' ? 'Request' : 'Complaint'}`} size="md">
        <form onSubmit={handleCreateRequest} className="space-y-4">
          <div className="flex gap-4 p-1 bg-gray-100 rounded-lg mb-6">
            <button type="button" onClick={() => setFormData({ ...formData, type: 'request', category: '' })} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.type === 'request' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Request Service</button>
            <button type="button" onClick={() => setFormData({ ...formData, type: 'complaint', category: '' })} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${formData.type === 'complaint' ? 'bg-white shadow-sm text-orange-600' : 'text-gray-500 hover:text-gray-700'}`}>Report Issue</button>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select required value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">Select a category</option>
              {(formData.type === 'request' ? requestCategories : complaintCategories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
            <input required type="text" value={formData.subject} onChange={(e) => setFormData({ ...formData, subject: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder={`E.g., ${formData.type === 'request' ? 'Leaking pipe in bathroom' : 'Loud music after 10PM'}`} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details *</label>
            <textarea required value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Please provide specific details..." />
          </div>
          {formData.type === 'request' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority Level</label>
              <select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="low">Low - When convenient</option>
                <option value="medium">Medium - Standard timeframe</option>
                <option value="high">High - Urgent attention needed</option>
              </select>
            </div>
          )}
          <div className="pt-4 flex gap-3">
            <button disabled={submitting} type="submit" className={`flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${formData.type === 'request' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-orange-600 hover:bg-orange-700'}`}>
              {submitting ? 'Submitting...' : `Submit ${formData.type === 'request' ? 'Request' : 'Complaint'}`}
            </button>
            <button type="button" onClick={() => setShowRequestModal(false)} className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}
