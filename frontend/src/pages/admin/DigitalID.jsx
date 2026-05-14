import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { IdCard, Eye, Clock, Loader2, XCircle, AlertCircle, FileText, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { getDigitalIds, revokeDigitalId, getFileUrl, api } from '../../utils/api';

const IN_REVIEW_STATUSES = ['verified', 'processing'];
const ACTIVE_ID_STATUSES = ['approved', 'issued'];

export default function AdminDigitalID() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const idData = await getDigitalIds();
      setRequests(idData.digitalIds || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load Digital ID data');
    } finally {
      setLoading(false);
    }
  };

  const filtered = activeTab === 'all'
    ? requests
    : activeTab === 'in_review'
      ? requests.filter(request => IN_REVIEW_STATUSES.includes(request.status))
      : requests.filter(request => request.status === activeTab);

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectReason('');
  };

  const handleToggleIDStatus = async (request) => {
    if (request.status === 'issued') {
       setSelectedRequest(request);
       setShowRejectModal(true);
    } else if (request.status === 'revoked') {
       setSubmitting(true);
       try {
         await api(`/digital-id/${request._id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status: 'issued' })
         });
         toast.success('Digital ID restored successfully.');
         fetchData();
       } catch(error) {
         toast.error(error.message || 'Failed to restore ID');
       } finally {
         setSubmitting(false);
       }
    }
  };

  const handleReject = async (event) => {
    event.preventDefault();

    if (!rejectReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    setSubmitting(true);
    try {
      await revokeDigitalId(selectedRequest._id, rejectReason.trim());
      toast.success(selectedRequest.status === 'pending' ? 'Application rejected.' : 'Digital ID revoked.');
      closeRejectModal();
      setShowDetailModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to update Digital ID status');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending Verification' },
    { key: 'in_review', label: 'In Review' },
    { key: 'approved', label: 'Approved' },
    { key: 'issued', label: 'Issued' },
    { key: 'revoked', label: 'Revoked' },
    { key: 'expired', label: 'Expired' },
  ];

  const pendingCount = requests.filter(request => request.status === 'pending').length;
  const inReviewCount = requests.filter(request => IN_REVIEW_STATUSES.includes(request.status)).length;
  const activeCount = requests.filter(request => ACTIVE_ID_STATUSES.includes(request.status)).length;
  const revokedCount = requests.filter(request => request.status === 'revoked' || request.status === 'expired').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital ID System</h1>
          <p className="text-gray-600 mt-1">Monitor employee-issued Digital IDs, inspect application records, and revoke access when necessary.</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Updated Digital ID workflow</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Residents submit an application, employees verify the record and issue the Digital ID directly, and admins keep oversight of the queue and can revoke any record that should no longer remain active.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <SummaryCard label="Total Requests" value={requests.length} tone="slate" />
          <SummaryCard label="Awaiting Employee Review" value={pendingCount} tone="amber" />
          <SummaryCard label="In Review" value={inReviewCount} tone="blue" />
          <SummaryCard label="Active IDs" value={activeCount} tone="green" />
          <SummaryCard label="Revoked / Expired" value={revokedCount} tone="red" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200 px-6 flex gap-6 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-4 border-b-2 font-medium transition-colors capitalize whitespace-nowrap ${
                  activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs border ${
                  activeTab === tab.key ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-100 border-gray-200 text-gray-600'
                }`}>
                  {tab.key === 'all'
                    ? requests.length
                    : tab.key === 'in_review'
                      ? inReviewCount
                      : requests.filter(request => request.status === tab.key).length}
                </span>
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-gray-600 font-medium text-sm">Resident Info</th>
                    <th className="px-6 py-3 text-left text-gray-600 font-medium text-sm">ID Number</th>
                    <th className="px-6 py-3 text-left text-gray-600 font-medium text-sm">Request Date</th>
                    <th className="px-6 py-3 text-left text-gray-600 font-medium text-sm">Status</th>
                    <th className="px-6 py-3 text-left text-gray-600 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filtered.map(request => (
                    <tr key={request._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
                            {request.user?.profilePhoto ? (
                              <img src={getFileUrl(request.user.profilePhoto)} alt="Resident" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-blue-600 font-medium">{(request.user?.username || 'U').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-900 font-medium capitalize">{request.user?.username || 'Unknown'}</p>
                            <p className="text-gray-500 text-sm">Unit: {request.user?.unit || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-900 font-medium">{request.idNumber || 'Pending issue'}</p>
                        <p className="text-gray-500 font-mono text-xs max-w-xs truncate" title={request.qrCode}>{request.qrCode}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">{new Date(request.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4"><StatusBadge status={request.status} size="sm" /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedRequest(request); setShowDetailModal(true); }}
                            className="p-2 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {request.status !== 'revoked' && request.status !== 'expired' && request.status !== 'issued' && (
                            <button
                              disabled={submitting}
                              onClick={() => { setSelectedRequest(request); setShowRejectModal(true); }}
                              className="flex items-center gap-1.5 px-3 py-1.5 hover:bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm font-medium transition-colors disabled:opacity-50"
                              title={request.status === 'pending' ? 'Reject application' : 'Revoke Digital ID'}
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              {request.status === 'pending' ? 'Reject' : 'Revoke'}
                            </button>
                          )}
                          {(request.status === 'issued' || request.status === 'revoked') && (
                            <button
                              disabled={submitting}
                              onClick={() => handleToggleIDStatus(request)}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${request.status === 'issued' ? 'bg-green-500' : 'bg-gray-300'}`}
                              title={request.status === 'issued' ? 'Active - Click to Revoke' : 'Revoked - Click to Restore'}
                            >
                              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${request.status === 'issued' ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                          )}
                          {request.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
                              <Clock className="w-3 h-3" />
                              Awaiting employee verification
                            </span>
                          )}
                          {IN_REVIEW_STATUSES.includes(request.status) && (
                            <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2.5 py-1">
                              <Clock className="w-3 h-3" />
                              Staff follow-up in progress
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No Digital ID requests found.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Digital ID Application" size="lg">
        {selectedRequest && (
          <div className="space-y-5">
            <div className="flex items-start gap-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="w-20 h-24 bg-blue-100 rounded-lg flex items-center justify-center shrink-0 border border-gray-300 overflow-hidden">
                {selectedRequest.user?.profilePhoto ? (
                  <img src={getFileUrl(selectedRequest.user.profilePhoto)} alt="Applicant" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-blue-600 text-3xl font-medium">{(selectedRequest.user?.username || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-gray-900 text-xl font-bold capitalize">{selectedRequest.user?.username || 'Unknown Applicant'}</h3>
                <p className="text-gray-600 mb-2">{selectedRequest.user?.email || 'No email provided'}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-medium bg-blue-100 text-blue-800 px-2.5 py-1 rounded">Unit: {selectedRequest.user?.unit || '-'}</span>
                  {selectedRequest.user?.phone && <span className="text-xs font-medium bg-gray-200 text-gray-800 px-2.5 py-1 rounded">Tel: {selectedRequest.user.phone}</span>}
                  <span className="text-xs font-medium bg-gray-200 text-gray-800 px-2.5 py-1 rounded capitalize">Ref: {selectedRequest._id.slice(-6)}</span>
                </div>
              </div>
              <div className="text-right">
                <StatusBadge status={selectedRequest.status} />
                <p className="text-xs text-gray-500 mt-2">Applied:<br />{new Date(selectedRequest.createdAt).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="p-4 border border-gray-200 rounded-xl space-y-4">
                <h4 className="font-semibold text-gray-900 border-b pb-2">Resident Details</h4>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <DetailField label="Nationality" value={selectedRequest.user?.nationality || '-'} />
                  <DetailField label="Gender" value={selectedRequest.user?.sex || '-'} />
                  <DetailField label="Date of Birth" value={selectedRequest.user?.dateOfBirth ? new Date(selectedRequest.user.dateOfBirth).toLocaleDateString() : '-'} />
                  <DetailField label="ID Number" value={selectedRequest.idNumber || 'Pending issue'} />
                  <div className="col-span-2">
                    <span className="block text-gray-500 text-xs">Address</span>
                    <span className="font-medium">{selectedRequest.user?.address || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 border border-gray-200 rounded-xl space-y-4">
                <DocumentPreview title="Birth Certificate" filePath={selectedRequest.user?.birthCertificate} emptyMessage="No supporting document uploaded." />
              </div>
            </div>

            {selectedRequest.revokeReason && (
              <div className="p-4 bg-red-50 text-red-800 rounded-xl border border-red-100">
                <p className="font-semibold text-sm mb-1">Revocation Reason:</p>
                <p className="text-sm">{selectedRequest.revokeReason}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4 border-t border-gray-100">
              {selectedRequest.status !== 'revoked' && selectedRequest.status !== 'expired' && selectedRequest.status !== 'issued' && (
                <button
                  disabled={submitting}
                  onClick={() => setShowRejectModal(true)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 transition-colors"
                >
                  {selectedRequest.status === 'pending' ? 'Reject Application' : 'Revoke Digital ID'}
                </button>
              )}
              {selectedRequest.status === 'issued' && (
                <button
                  disabled={submitting}
                  onClick={() => setShowRejectModal(true)}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 transition-colors"
                >
                  Revoke Digital ID
                </button>
              )}
              {selectedRequest.status === 'revoked' && (
                <button
                  disabled={submitting}
                  onClick={() => handleToggleIDStatus(selectedRequest)}
                  className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 transition-colors"
                >
                  Restore Digital ID
                </button>
              )}
              <button
                disabled={submitting}
                onClick={() => setShowDetailModal(false)}
                className="px-6 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium text-gray-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={showRejectModal} onClose={closeRejectModal} title="Reject / Revoke ID" size="sm">
        <form onSubmit={handleReject} className="space-y-4">
          <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-sm text-red-800 flex items-start gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <p>Provide a clear reason for rejection or revocation. This will be visible to the resident so they can correct the issue.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
            <textarea
              required
              value={rejectReason}
              onChange={(event) => setRejectReason(event.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
              placeholder="E.g., Invalid document, does not meet requirements..."
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Confirm
            </button>
            <button
              type="button"
              onClick={closeRejectModal}
              className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

function SummaryCard({ label, value, tone }) {
  const tones = {
    slate: 'bg-white border-gray-200',
    amber: 'bg-yellow-50 border-yellow-200',
    blue: 'bg-blue-50 border-blue-200',
    green: 'bg-green-50 border-green-200',
    red: 'bg-red-50 border-red-200',
  };

  return (
    <div className={`rounded-xl p-5 shadow-sm border ${tones[tone] || tones.slate}`}>
      <p className="text-gray-600 mb-1 text-sm font-medium">{label}</p>
      <p className="text-gray-900 text-3xl font-bold">{value}</p>
    </div>
  );
}

function DetailField({ label, value }) {
  return (
    <div>
      <span className="block text-gray-500 text-xs">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function DocumentPreview({ title, filePath, emptyMessage }) {
  const src = getFileUrl(filePath);
  const lower = src?.toLowerCase() || '';
  const isPdf = lower.endsWith('.pdf');

  return (
    <div className="space-y-3">
      <h4 className="font-semibold text-gray-900">{title}</h4>
      {src ? (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
          <div className="aspect-[4/3] bg-white">
            {isPdf ? (
              <iframe title={title} src={src} className="w-full h-full" />
            ) : (
              <img src={src} alt={title} className="w-full h-full object-contain bg-gray-50" />
            )}
          </div>
          <a
            href={src}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between p-3 border-t border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 rounded bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Open full document</p>
                <p className="text-xs text-gray-500">View the original upload</p>
              </div>
            </div>
            <Eye className="w-4 h-4 text-gray-400" />
          </a>
        </div>
      ) : (
        <div className="flex items-center justify-center text-gray-400 text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200 min-h-40">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}
