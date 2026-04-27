import React, { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  AlertCircle,
  CheckCircle,
  Eye,
  FileText,
  IdCard,
  Loader2,
  Search,
  ShieldCheck,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  approveDigitalId,
  getDigitalIds,
  getFileUrl,
  revokeDigitalId,
  updateDigitalId,
} from '../../utils/api';

const IN_REVIEW_STATUSES = ['verified', 'processing'];
const ACTIVE_ID_STATUSES = ['approved', 'issued'];

export default function SpecialEmployeeDigitalID() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getDigitalIds();
      setRequests(data.digitalIds || []);
    } catch (error) {
      toast.error(error.message || 'Failed to load Digital ID requests');
    } finally {
      setLoading(false);
    }
  };

  const filteredByTab = activeTab === 'all'
    ? requests
    : activeTab === 'in_review'
      ? requests.filter(request => IN_REVIEW_STATUSES.includes(request.status))
      : activeTab === 'active'
        ? requests.filter(request => ACTIVE_ID_STATUSES.includes(request.status))
        : requests.filter(request => request.status === activeTab);

  const filteredRequests = filteredByTab.filter((request) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;

    return (
      request.user?.username?.toLowerCase().includes(term) ||
      request.user?.email?.toLowerCase().includes(term) ||
      request.user?.unit?.toLowerCase().includes(term) ||
      request.idNumber?.toLowerCase().includes(term)
    );
  });

  const counts = {
    all: requests.length,
    pending: requests.filter(request => request.status === 'pending').length,
    inReview: requests.filter(request => IN_REVIEW_STATUSES.includes(request.status)).length,
    active: requests.filter(request => ACTIVE_ID_STATUSES.includes(request.status)).length,
    revoked: requests.filter(request => request.status === 'revoked' || request.status === 'expired').length,
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_review', label: 'In Review' },
    { key: 'active', label: 'Active' },
    { key: 'revoked', label: 'Revoked' },
    { key: 'expired', label: 'Expired' },
  ];

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectReason('');
  };

  const handleIssue = async (request) => {
    setSubmitting(true);
    try {
      if (request.status === 'approved') {
        await updateDigitalId(request._id, { status: 'issued' });
      } else {
        await approveDigitalId(request._id);
      }

      toast.success('Digital ID finalized successfully.');
      setShowDetailModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Failed to finalize Digital ID');
    } finally {
      setSubmitting(false);
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

  const canFinalize = selectedRequest && !['issued', 'revoked', 'expired'].includes(selectedRequest.status);
  const finalizeLabel = selectedRequest?.status === 'approved' ? 'Mark Issued' : 'Approve & Issue';

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital ID Oversight</h1>
          <p className="text-gray-600 mt-1">
            Review applications that need intervention, finalize exception cases, and monitor issued records across the queue.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Current workflow</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Residents submit one Digital ID application, employees can verify and issue it directly, and this queue stays available
              for special-employee oversight, exception handling, and revocation when a record should no longer remain active.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
          <SummaryCard label="Total Requests" value={counts.all} tone="slate" />
          <SummaryCard label="Pending" value={counts.pending} tone="amber" />
          <SummaryCard label="In Review" value={counts.inReview} tone="blue" />
          <SummaryCard label="Active IDs" value={counts.active} tone="green" />
          <SummaryCard label="Revoked / Expired" value={counts.revoked} tone="red" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
            <div className="flex gap-2 overflow-x-auto">
              {tabs.map(tab => {
                const tabCount = tab.key === 'all'
                  ? counts.all
                  : tab.key === 'pending'
                    ? counts.pending
                    : tab.key === 'in_review'
                      ? counts.inReview
                      : tab.key === 'active'
                        ? counts.active
                        : requests.filter(request => request.status === tab.key).length;

                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                    <span className="ml-2 text-xs">{tabCount}</span>
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search residents or ID..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-12 text-center">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="p-12 text-center">
                <IdCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No Digital ID requests match this view.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applicant</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Applied</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID Number</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredRequests.map(request => (
                    <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {request.user?.profilePhoto ? (
                              <img src={getFileUrl(request.user.profilePhoto)} alt="Resident" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-blue-600 font-semibold">{(request.user?.username || 'U').charAt(0).toUpperCase()}</span>
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 capitalize">{request.user?.username || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">Unit {request.user?.unit || '-'} | {request.user?.phone || 'No phone'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(request.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={request.status} size="sm" />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{request.idNumber || 'Pending issue'}</td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => { setSelectedRequest(request); setShowDetailModal(true); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Eye className="w-4 h-4" /> Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Digital ID Review" size="lg">
          {selectedRequest && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-4">
                  <DocumentPreview
                    title="Passport Photo"
                    filePath={selectedRequest.user?.profilePhoto}
                    emptyMessage="No photo provided"
                  />

                  <div className={`rounded-xl border p-3 text-sm ${
                    selectedRequest.livenessCheck?.apiUnavailable
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : 'bg-green-50 border-green-200 text-green-800'
                  }`}>
                    {selectedRequest.livenessCheck?.apiUnavailable
                      ? 'Liveness service was unavailable during submission. Manual review is required.'
                      : 'Photo passed liveness screening and is ready for manual verification.'}
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-1 capitalize">{selectedRequest.user?.username || 'Unknown Resident'}</h3>
                        <p className="text-sm text-gray-500">{selectedRequest.user?.email || 'No email provided'}</p>
                      </div>
                      <StatusBadge status={selectedRequest.status} size="sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 text-sm mt-4">
                      <DetailCell label="Phone Number" value={selectedRequest.user?.phone || '-'} />
                      <DetailCell label="Date of Birth" value={selectedRequest.user?.dateOfBirth ? new Date(selectedRequest.user.dateOfBirth).toLocaleDateString() : '-'} />
                      <DetailCell label="Gender" value={selectedRequest.user?.sex || '-'} />
                      <DetailCell label="Nationality" value={selectedRequest.user?.nationality || '-'} />
                      <DetailCell label="Unit / House Number" value={selectedRequest.user?.unit || '-'} />
                      <DetailCell label="ID Number" value={selectedRequest.idNumber || 'Pending issue'} />
                      <DetailCell label="Submitted" value={new Date(selectedRequest.createdAt).toLocaleDateString()} />
                      <DetailCell label="Last Verified" value={selectedRequest.lastVerified ? new Date(selectedRequest.lastVerified).toLocaleDateString() : '-'} />
                      <div className="col-span-2">
                        <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase mb-1">Residential Address</span>
                        <span className="font-medium text-gray-900">{selectedRequest.user?.address || '-'}</span>
                      </div>
                    </div>
                  </div>

                  <DocumentPreview
                    title="Birth Certificate"
                    filePath={selectedRequest.user?.birthCertificate}
                    emptyMessage="No birth certificate attached."
                  />

                  {selectedRequest.revokeReason && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-sm font-semibold text-red-900 mb-1">Rejection reason</p>
                      <p className="text-sm text-red-800">{selectedRequest.revokeReason}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                {canFinalize ? (
                  <button
                    disabled={submitting}
                    onClick={() => handleIssue(selectedRequest)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 transition-colors"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    {finalizeLabel}
                  </button>
                ) : (
                  <div className="flex-1 text-center py-2.5 bg-gray-50 rounded-lg text-gray-500 text-sm font-medium border border-gray-200">
                    This record is already {selectedRequest.status} and cannot be finalized again.
                  </div>
                )}

                {selectedRequest.status !== 'revoked' && selectedRequest.status !== 'expired' && (
                  <button
                    disabled={submitting}
                    onClick={() => setShowRejectModal(true)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="w-5 h-5" /> {selectedRequest.status === 'pending' ? 'Reject' : 'Revoke'}
                  </button>
                )}
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={showRejectModal} onClose={closeRejectModal} title="Reject / Revoke ID" size="sm">
          <form onSubmit={handleReject} className="space-y-4">
            <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-sm text-red-800 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>Provide a clear reason so the resident understands what needs to be corrected or why access was revoked.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
              <textarea
                required
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                placeholder="E.g., Invalid document, mismatched records, duplicate submission..."
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
      </div>
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

function DetailCell({ label, value }) {
  return (
    <div>
      <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase mb-1">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}

function DocumentPreview({ title, filePath, emptyMessage }) {
  const src = getFileUrl(filePath);
  const lower = src?.toLowerCase() || '';
  const isPdf = lower.endsWith('.pdf');

  return (
    <div className="space-y-2">
      <p className="font-semibold text-gray-900 text-sm">{title}</p>
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
            className="flex items-center justify-between px-4 py-3 border-t border-gray-200 text-sm text-blue-700 hover:bg-blue-50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Open full document
            </span>
            <Eye className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div className="p-4 border border-dashed border-gray-200 rounded-lg text-center bg-gray-50">
          <p className="text-sm text-gray-500">{emptyMessage}</p>
        </div>
      )}
    </div>
  );
}
