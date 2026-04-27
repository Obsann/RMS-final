import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import {
  IdCard, CheckCircle, XCircle, Eye, Search, Loader2,
  AlertCircle, FileText, ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';
import { getDigitalIds, approveDigitalId, revokeDigitalId, getFileUrl } from '../../utils/api';

export default function EmployeeDigitalID() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
      toast.error(error.message || 'Failed to load ID requests');
    } finally {
      setLoading(false);
    }
  };

  const filteredRequests = requests.filter((request) => {
    const term = search.toLowerCase();
    return (
      request.user?.username?.toLowerCase().includes(term) ||
      request.user?.phone?.includes(search) ||
      request.user?.unit?.toLowerCase().includes(term)
    );
  });

  const pendingCount = requests.filter(request => request.status === 'pending').length;
  const issuedCount = requests.filter(request => request.status === 'issued' || request.status === 'approved').length;
  const revokedCount = requests.filter(request => request.status === 'revoked').length;

  const closeRejectModal = () => {
    setShowRejectModal(false);
    setRejectReason('');
  };

  const handleVerify = async (request) => {
    setSubmitting(true);
    try {
      await approveDigitalId(request._id);
      toast.success('Resident information verified and Digital ID issued successfully!');
      setShowDetailModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Verification and issuance failed');
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
      toast.success('Application rejected.');
      closeRejectModal();
      setShowDetailModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.message || 'Rejection failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Digital ID Verification</h1>
          <p className="text-gray-600 mt-1">Review resident applications, inspect their documents, and issue Digital IDs directly from this queue.</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-full shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-1">Employee issuance workflow</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Confirm the resident details against the uploaded passport photo and birth certificate. Once everything matches, use
              <strong className="text-gray-900"> Verify &amp; Issue ID</strong> to finalize the Digital ID immediately.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Pending Verification" value={pendingCount} tone="amber" />
          <StatCard label="Issued By Staff" value={issuedCount} tone="green" />
          <StatCard label="Rejected" value={revokedCount} tone="red" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900">Verification Queue ({pendingCount})</h2>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search residents..."
                value={search}
                onChange={event => setSearch(event.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
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
                <p className="text-gray-500 font-medium">No matching Digital ID applications.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Applicant</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date Applied</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
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
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={request.status} size="sm" />
                      </td>
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

        <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Verify Resident Information" size="lg">
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
                    <h3 className="font-bold text-gray-900 text-lg mb-1 capitalize">{selectedRequest.user?.username || 'Unknown Resident'}</h3>
                    <p className="text-sm text-gray-500 mb-4">{selectedRequest.user?.email || 'No email provided'}</p>

                    <div className="grid grid-cols-2 gap-y-4 text-sm">
                      <DetailCell label="Phone Number" value={selectedRequest.user?.phone || '-'} />
                      <DetailCell label="Date of Birth" value={selectedRequest.user?.dateOfBirth ? new Date(selectedRequest.user.dateOfBirth).toLocaleDateString() : '-'} />
                      <DetailCell label="Gender" value={selectedRequest.user?.sex || '-'} />
                      <DetailCell label="Nationality" value={selectedRequest.user?.nationality || '-'} />
                      <DetailCell label="Unit / House Number" value={selectedRequest.user?.unit || '-'} />
                      <DetailCell label="Status" value={<StatusBadge status={selectedRequest.status} size="sm" />} />
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
                {selectedRequest.status === 'pending' ? (
                  <>
                    <button
                      disabled={submitting}
                      onClick={() => handleVerify(selectedRequest)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 transition-colors"
                    >
                      {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                      Verify &amp; Issue ID
                    </button>
                    <button
                      disabled={submitting}
                      onClick={() => setShowRejectModal(true)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-5 h-5" /> Reject
                    </button>
                  </>
                ) : (
                  <div className="flex-1 text-center py-2.5 bg-gray-50 rounded-lg text-gray-500 text-sm font-medium border border-gray-200">
                    This application is already {selectedRequest.status === 'approved' ? 'issued' : selectedRequest.status} and can no longer be edited from this queue.
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>

        <Modal isOpen={showRejectModal} onClose={closeRejectModal} title="Reject ID Application" size="sm">
          <form onSubmit={handleReject} className="space-y-4">
            <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-sm text-red-800 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>Provide a clear reason for rejection. This will be visible to the resident so they can correct the issue.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rejection Reason *</label>
              <textarea
                required
                value={rejectReason}
                onChange={(event) => setRejectReason(event.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                placeholder="E.g., Blurred photo, invalid birth certificate, mismatching name..."
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                Confirm Rejection
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

function StatCard({ label, value, tone }) {
  const tones = {
    amber: 'bg-amber-50 border-amber-200 text-amber-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    red: 'bg-red-50 border-red-200 text-red-800',
  };

  return (
    <div className={`rounded-xl border p-4 ${tones[tone] || tones.amber}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
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
