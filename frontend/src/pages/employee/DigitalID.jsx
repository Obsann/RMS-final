import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { IdCard, CheckCircle, XCircle, Eye, Search, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getDigitalIds } from '../../utils/api';

export default function EmployeeDigitalID() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [search, setSearch] = useState('');

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const data = await getDigitalIds();
            // Employees only need to see 'pending' to verify, and their own past verifications
            setRequests((data.digitalIds || []).filter(r => r.status === 'pending' || r.status === 'verified'));
        } catch (error) {
            toast.error('Failed to load ID requests');
        } finally {
            setLoading(false);
        }
    };

    const filteredRequests = requests.filter(r =>
        r.user?.username?.toLowerCase().includes(search.toLowerCase()) ||
        r.user?.phone?.includes(search)
    );

    const pendingCount = requests.filter(r => r.status === 'pending').length;

    const handleVerify = async (req) => {
        setSubmitting(true);
        try {
            const token = localStorage.getItem('rms_token');
            // We use the same update pattern as admin, but shift status to 'verified'
            const res = await fetch(`/api/digital-id/${req._id}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status: 'verified' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Verification failed');

            toast.success('Resident information verified and sent to Admin');
            setShowDetailModal(false);
            fetchData();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async (req) => {
        const reason = window.prompt("Enter reason for rejection (e.g., Blur photo, invalid document):");
        if (!reason && reason !== '') return;

        setSubmitting(true);
        try {
            const token = localStorage.getItem('rms_token');
            const res = await fetch(`/api/digital-id/${req._id}/revoke`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ reason: reason || 'Information verification failed' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Rejection failed');

            toast.success('Request rejected.');
            setShowDetailModal(false);
            fetchData();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Digital ID Verification</h1>
                    <p className="text-gray-600 mt-1">Review applicant details and documents before Admin approval.</p>
                </div>

                {/* Info card */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-full shrink-0">
                        <IdCard className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 mb-1">Your Role in Digital ID Issuance</h3>
                        <p className="text-sm text-gray-700 leading-relaxed">
                            As an employee, your job is to <strong className="text-gray-900">verify the truthfulness</strong> of the resident's provided information.
                            Check their uploaded passport photo and birth certificate. Make sure their demographics match the documents.
                            Once you click "Verify", it will be forwarded to the Admin for final legal approval.
                        </p>
                    </div>
                </div>

                {/* List Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">Pending Validations ({pendingCount})</h2>
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search residents..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-64"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {loading ? (
                            <div className="p-12 text-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto" /></div>
                        ) : filteredRequests.length === 0 ? (
                            <div className="p-12 text-center">
                                <IdCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500 font-medium">No pending requests to verify.</p>
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
                                    {filteredRequests.map(req => (
                                        <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 overflow-hidden">
                                                        {req.user?.profilePhoto ? (
                                                            <img src={`/api${req.user.profilePhoto}`} alt="DP" className="w-full h-full object-cover" />
                                                        ) : (
                                                            <span className="text-blue-600 font-semibold">{(req.user?.username || 'U').charAt(0).toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 capitalize">{req.user?.username || 'Unknown'}</p>
                                                        <p className="text-xs text-gray-500">{req.user?.phone || 'No phone'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {new Date(req.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <StatusBadge status={req.status} size="sm" />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => { setSelectedRequest(req); setShowDetailModal(true); }}
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

                {/* Verification Modal */}
                <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Verify Resident Information" size="lg">
                    {selectedRequest && (
                        <div className="space-y-6">

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Photo Review */}
                                <div className="md:col-span-1 space-y-2">
                                    <p className="font-semibold text-gray-900 text-sm">Passport Photo</p>
                                    <div className="aspect-[3/4] rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden flex items-center justify-center relative group">
                                        {selectedRequest.user?.profilePhoto ? (
                                            <img src={`/api${selectedRequest.user.profilePhoto}`} alt="Applicant passport" className="w-full h-full object-cover" />
                                        ) : (
                                            <p className="text-xs text-gray-400 text-center px-4">No photo provided</p>
                                        )}
                                    </div>
                                </div>

                                {/* Details Review */}
                                <div className="md:col-span-2 space-y-4">
                                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                        <h3 className="font-bold text-gray-900 text-lg mb-1 capitalize">{selectedRequest.user?.username}</h3>
                                        <p className="text-sm text-gray-500 mb-4">{selectedRequest.user?.email}</p>

                                        <div className="grid grid-cols-2 gap-y-4 text-sm">
                                            <div>
                                                <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase mb-1">Phone Number</span>
                                                <span className="font-medium text-gray-900">{selectedRequest.user?.phone || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase mb-1">Date of Birth</span>
                                                <span className="font-medium text-gray-900">{selectedRequest.user?.dateOfBirth ? new Date(selectedRequest.user.dateOfBirth).toLocaleDateString() : '—'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase mb-1">Gender</span>
                                                <span className="font-medium text-gray-900">{selectedRequest.user?.sex || '—'}</span>
                                            </div>
                                            <div>
                                                <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase mb-1">Nationality</span>
                                                <span className="font-medium text-gray-900">{selectedRequest.user?.nationality || '—'}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="block text-xs font-semibold tracking-wider text-gray-500 uppercase mb-1">Residential Address</span>
                                                <span className="font-medium text-gray-900">{selectedRequest.user?.address || '—'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Supporting Docs */}
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm mb-2">Attached Documents</p>
                                        {selectedRequest.user?.birthCertificate ? (
                                            <a href={`/api${selectedRequest.user.birthCertificate}`} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors group">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-200">
                                                        <IdCard className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">Birth Certificate / Kebele ID</p>
                                                        <p className="text-xs text-gray-500">Opens in new tab</p>
                                                    </div>
                                                </div>
                                                <Eye className="w-5 h-5 text-gray-400 group-hover:text-blue-600" />
                                            </a>
                                        ) : (
                                            <div className="p-4 border border-dashed border-gray-200 rounded-lg text-center bg-gray-50">
                                                <p className="text-sm text-gray-500">No birth certificate attached.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                {selectedRequest.status === 'pending' ? (
                                    <>
                                        <button
                                            disabled={submitting}
                                            onClick={() => handleVerify(selectedRequest)}
                                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors"
                                        >
                                            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                                            Verify & Send to Admin
                                        </button>
                                        <button
                                            disabled={submitting}
                                            onClick={() => handleReject(selectedRequest)}
                                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 font-medium disabled:opacity-50 transition-colors"
                                        >
                                            <XCircle className="w-5 h-5" /> Reject
                                        </button>
                                    </>
                                ) : (
                                    <div className="flex-1 text-center py-2.5 bg-gray-50 rounded-lg text-gray-500 text-sm font-medium border border-gray-200">
                                        This request has already been verified and forwarded to Admin.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </Modal>
            </div>
        </DashboardLayout>
    );
}
