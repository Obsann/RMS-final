import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { IdCard, CheckCircle, XCircle, Eye, UserCheck, Clock, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getDigitalIds, approveDigitalId, revokeDigitalId, getUsers } from '../../utils/api';

export default function AdminDigitalID() {
  const [requests, setRequests] = useState([]);
  const [specialEmployees, setSpecialEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [idData, seData] = await Promise.all([
        getDigitalIds(),
        getUsers('role=special-employee')
      ]);
      setRequests(idData.digitalIds || []);
      setSpecialEmployees(seData.users || []);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filtered = activeTab === 'all' ? requests : requests.filter(r => r.status === activeTab);

  const handleApprove = async (req) => {
    setSubmitting(true);
    try {
      await approveDigitalId(req._id);
      toast.success(`ID request approved!`);
      setShowDetailModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to approve ID');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (req) => {
    const reason = window.prompt("Enter rejection reason:");
    if (!reason && reason !== '') return; // cancelled prompt

    setSubmitting(true);
    try {
      await revokeDigitalId(req._id, reason || 'Did not meet requirements');
      toast.success(`ID request rejected.`);
      setShowDetailModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to reject ID');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'verified', label: 'Verified To Approve' },
    { key: 'pending', label: 'Pending Verification' },
    { key: 'approved', label: 'Approved' },
    { key: 'expired', label: 'Expired' },
    { key: 'revoked', label: 'Revoked' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital ID System</h1>
          <p className="text-gray-600 mt-1">Review and approve resident Digital ID requests</p>
        </div>

        {/* Workflow Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="font-semibold text-gray-900 mb-3">Digital ID Workflow</p>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            {[
              { icon: <IdCard className="w-4 h-4" />, label: 'Resident Requests ID', color: 'bg-gray-100 text-gray-700 border-gray-200' },
              { icon: <ArrowRight className="w-4 h-4 text-blue-400" />, label: '', color: '' },
              { icon: <UserCheck className="w-4 h-4" />, label: 'Employee Verifies Details', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
              { icon: <ArrowRight className="w-4 h-4 text-blue-400" />, label: '', color: '' },
              { icon: <CheckCircle className="w-4 h-4" />, label: 'Admin Inspects & Approves', color: 'bg-blue-100 text-blue-800 border-blue-200' },
              { icon: <ArrowRight className="w-4 h-4 text-blue-400" />, label: '', color: '' },
              { icon: <IdCard className="w-4 h-4" />, label: 'ID Automatically Issued', color: 'bg-green-100 text-green-800 border-green-200' },
            ].map((step, idx) =>
              step.label ? (
                <span key={idx} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border ${step.color} font-medium`}>
                  {step.icon}{step.label}
                </span>
              ) : (
                <span key={idx}>{step.icon}</span>
              )
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200">
            <p className="text-gray-600 mb-1 text-sm font-medium">Total Requests</p>
            <p className="text-gray-900 text-3xl font-bold">{requests.length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-yellow-200 bg-yellow-50">
            <p className="text-yellow-700 mb-1 text-sm font-medium">Pending Final Approvals</p>
            <p className="text-gray-900 text-3xl font-bold">{requests.filter(r => r.status === 'verified').length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-green-200 bg-green-50">
            <p className="text-green-700 mb-1 text-sm font-medium">Active (Approved)</p>
            <p className="text-gray-900 text-3xl font-bold">{requests.filter(r => r.status === 'approved').length}</p>
          </div>
          <div className="bg-white rounded-xl p-5 shadow-sm border border-red-200 bg-red-50">
            <p className="text-red-700 mb-1 text-sm font-medium">Revoked / Expired</p>
            <p className="text-gray-900 text-3xl font-bold">{requests.filter(r => r.status === 'revoked' || r.status === 'expired').length}</p>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Tabs */}
          <div className="border-b border-gray-200 px-6 flex gap-6 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 border-b-2 font-medium transition-colors capitalize whitespace-nowrap ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
                  }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs border ${activeTab === tab.key ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-100 border-gray-200 text-gray-600'}`}>
                  {tab.key === 'all' ? requests.length : requests.filter(r => r.status === tab.key).length}
                </span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" /></div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-600 font-medium text-sm">Resident Info</th>
                    <th className="px-6 py-3 text-left text-gray-600 font-medium text-sm">ID Type & Number</th>
                    <th className="px-6 py-3 text-left text-gray-600 font-medium text-sm">Request Date</th>
                    <th className="px-6 py-3 text-left text-gray-600 font-medium text-sm">Status</th>
                    <th className="px-6 py-3 text-left text-gray-600 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map(req => (
                    <tr key={req._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                            <span className="text-blue-600 font-medium">{(req.user?.username || 'U').charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium capitalize">{req.user?.username || 'Unknown'}</p>
                            <p className="text-gray-500 text-sm">Unit: {req.user?.unit || '—'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900 font-medium">Digital ID</p>
                        <p className="text-gray-500 font-mono text-xs max-w-xs truncate" title={req.qrCode}>{req.qrCode}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{new Date(req.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4"><StatusBadge status={req.status} size="sm" /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => { setSelectedRequest(req); setShowDetailModal(true); }} className="p-2 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors" title="View Details">
                            <Eye className="w-4 h-4" />
                          </button>
                          {req.status === 'verified' && (
                            <>
                              <button disabled={submitting} onClick={() => handleApprove(req)} className="p-2 hover:bg-green-100 rounded-lg text-green-600 transition-colors disabled:opacity-50 border border-transparent hover:border-green-200" title="Approve ID">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button disabled={submitting} onClick={() => handleReject(req)} className="p-2 hover:bg-red-100 rounded-lg text-red-600 transition-colors disabled:opacity-50 border border-transparent hover:border-red-200" title="Reject / Revoke">
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {req.status === 'approved' && (
                            <button disabled={submitting} onClick={() => handleReject(req)} className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm font-medium transition-colors" title="Revoke ID">
                              <XCircle className="w-3.5 h-3.5" /> Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No requests found</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Digital ID Application" size="md">
        {selectedRequest && (
          <div className="space-y-4">
            <div className="flex items-start gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="w-20 h-24 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 border border-gray-300 overflow-hidden">
                {selectedRequest.user?.profilePhoto ? (
                  <img src={`http://localhost:5000${selectedRequest.user.profilePhoto}`} alt="Applicant" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-blue-600 text-3xl font-medium">{(selectedRequest.user?.username || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 text-xl font-bold capitalize">{selectedRequest.user?.username || 'Unknown Applicant'}</h3>
                <p className="text-gray-600 mb-2">{selectedRequest.user?.email || 'No email provided'}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2.5 py-1 rounded">Unit: {selectedRequest.user?.unit || '—'}</span>
                  {selectedRequest.user?.phone && <span className="text-xs font-medium bg-gray-200 text-gray-800 px-2.5 py-1 rounded">Tel: {selectedRequest.user.phone}</span>}
                  <span className="text-xs font-medium bg-gray-200 text-gray-800 px-2.5 py-1 rounded capitalize">Ref: {selectedRequest._id.slice(-6)}</span>
                </div>
              </div>
              <div className="text-right">
                <StatusBadge status={selectedRequest.status} />
                <p className="text-xs text-gray-500 mt-2">Applied:<br />{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-xl space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Demographics</h4>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div><span className="block text-gray-500 text-xs">Nationality</span><span className="font-medium">{selectedRequest.user?.nationality || '—'}</span></div>
                  <div><span className="block text-gray-500 text-xs">Sex</span><span className="font-medium">{selectedRequest.user?.sex || '—'}</span></div>
                  <div><span className="block text-gray-500 text-xs">Date of Birth</span><span className="font-medium">{selectedRequest.user?.dateOfBirth ? new Date(selectedRequest.user.dateOfBirth).toLocaleDateString() : '—'}</span></div>
                  <div className="col-span-2"><span className="block text-gray-500 text-xs">Address</span><span className="font-medium">{selectedRequest.user?.address || '—'}</span></div>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-xl flex flex-col">
                <h4 className="font-semibold text-gray-900 border-b pb-2 mb-3">Supporting Documents</h4>
                {selectedRequest.user?.birthCertificate ? (
                  <a href={`http://localhost:5000${selectedRequest.user.birthCertificate}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">📄</div>
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">Birth Certificate</p>
                        <p className="text-xs text-gray-500">Click to view document</p>
                      </div>
                    </div>
                    <span className="text-blue-600 text-sm font-medium">View</span>
                  </a>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200">
                    No documents uploaded
                  </div>
                )}

                {selectedRequest.status === 'approved' && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <span className="block text-gray-500 text-xs mb-1">ID Validity</span>
                    <span className="text-sm font-medium bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 inline-block">
                      Expires: {selectedRequest.expiresAt ? new Date(selectedRequest.expiresAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {selectedRequest.revokeReason && selectedRequest.status === 'revoked' && (
              <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-100">
                <p className="font-semibold text-sm mb-1">Revocation Reason:</p>
                <p className="text-sm">{selectedRequest.revokeReason}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              {selectedRequest.status === 'verified' && (
                <>
                  <button disabled={submitting} onClick={() => handleApprove(selectedRequest)} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 transition-colors">Approve ID Application</button>
                  <button disabled={submitting} onClick={() => handleReject(selectedRequest)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 transition-colors">Reject Application</button>
                </>
              )}
              {selectedRequest.status === 'approved' && (
                <button disabled={submitting} onClick={() => handleReject(selectedRequest)} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 transition-colors">Revoke Digital ID</button>
              )}
              <button disabled={submitting} onClick={() => setShowDetailModal(false)} className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors">Close</button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
