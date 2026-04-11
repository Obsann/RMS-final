import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import { useNavigate } from 'react-router-dom';
import {
  IdCard, AlertCircle, CheckCircle, Clock, Shield,
  Loader2, Image as ImageIcon, User, Calendar, Globe,
  Phone, MapPin, FileText, ChevronRight
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { getMyDigitalId, getMeAPI } from '../../utils/api';

const MANDATORY_PROFILE_FIELDS = [
  { key: 'phone', label: 'Phone Number' },
  { key: 'dateOfBirth', label: 'Date of Birth' },
  { key: 'sex', label: 'Gender' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'address', label: 'Residential Address' },
];

export default function ResidentDigitalID() {
  const navigate = useNavigate();
  const [digitalId, setDigitalId] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRequestForm, setShowRequestForm] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    sex: '',
    phone: '',
    nationality: '',
    address: ''
  });
  const [files, setFiles] = useState({ photo: null, birthCertificate: null });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      // Fetch both in parallel — digital ID status + full user profile
      const [idResult, meResult] = await Promise.allSettled([
        getMyDigitalId(),
        getMeAPI()
      ]);

      const idData = idResult.status === 'fulfilled' ? idResult.value : null;
      const meData = meResult.status === 'fulfilled'
        ? (meResult.value.user || meResult.value)
        : null;

      setDigitalId(idData);
      setCurrentUser(meData);

      // Pre-fill form from existing user profile
      if (meData) {
        setFormData(prev => ({
          ...prev,
          name: meData.username || '',
          phone: meData.phone || '',
          address: meData.address || '',
          nationality: meData.nationality || '',
        }));
      }
    } catch {
      setDigitalId(null);
    } finally {
      setLoading(false);
    }
  };

  const loadUserData = async () => {
    try {
      const res = await getMeAPI();
      const me = res.user || res;
      setFormData(prev => ({
        ...prev,
        name: me.username || prev.name,
        phone: me.phone || prev.phone,
        address: me.address || prev.address,
        nationality: me.nationality || prev.nationality,
      }));
    } catch {
      // silently fail — user can fill manually
    }
  };

  useEffect(() => {
    if (showRequestForm) {
      loadUserData();
    }
  }, [showRequestForm]);

  const handleSubmitRequest = async (e) => {
    e.preventDefault();
    const { name, dateOfBirth, sex, phone, nationality, address } = formData;
    if (!name || !dateOfBirth || !sex || !phone || !nationality || !address) {
      toast.error('Please fill in all required text fields.');
      return;
    }
    if (!files.photo || !files.birthCertificate) {
      toast.error('Please upload both the 4x3 passport photo and the birth certificate.');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('rms_token');
      const payload = new FormData();
      Object.keys(formData).forEach(key => payload.append(key, formData[key]));
      payload.append('photo', files.photo);
      payload.append('birthCertificate', files.birthCertificate);

      const res = await fetch('/api/digital-id/generate', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: payload
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.message || 'Failed to submit digital ID request');
      }

      toast.success('Digital ID request submitted! Waiting for admin approval.');
      setShowRequestForm(false);
      fetchAll();
    } catch (error) {
      toast.error(error.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadId = async () => {
    const cardElement = document.getElementById('digital-id-card');
    if (!cardElement) return;
    try {
      const canvas = await html2canvas(cardElement, { scale: 2, backgroundColor: null });
      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `KebeleID_${digitalId?.user?.username || 'Resident'}.png`;
      link.href = imgData;
      link.click();
      toast.success('Digital ID downloaded!');
    } catch {
      toast.error('Failed to export ID image');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading your Digital ID...</span>
        </div>
      </DashboardLayout>
    );
  }

  // The backend returns status: 'pending' | 'approved' | 'revoked' | 'expired'
  const currentStatus = digitalId?.status || 'none';
  const resident = currentUser || digitalId?.user || {};

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Resident Digital ID</h1>
          <p className="text-gray-600 mt-1">Your official Kebele community identification</p>
        </div>

        {/* ── APPROVED: Show the actual ID card ── */}
        {currentStatus === 'approved' && digitalId ? (
          <div className="space-y-6 max-w-2xl mx-auto">
            <div
              id="digital-id-card"
              className="bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl shadow-2xl overflow-hidden relative text-white"
            >
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <Shield className="w-48 h-48" />
              </div>
              <div className="relative p-8">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-blue-200 font-semibold text-sm tracking-widest uppercase">Kebele Digital ID</p>
                    <p className="text-xs text-blue-300 mt-0.5">Resident Management System</p>
                  </div>
                  <div className="bg-green-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-2 border border-green-400/40 text-green-200">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-semibold tracking-wide">APPROVED</span>
                  </div>
                </div>

                {/* Body */}
                <div className="flex gap-6 items-start">
                  {/* Profile photo or initials */}
                  <div className="w-20 h-24 bg-white/10 rounded-xl border-2 border-white/30 flex items-center justify-center shrink-0 overflow-hidden">
                    {resident.profilePhoto ? (
                      <img
                        src={`http://localhost:5000${resident.profilePhoto}`}
                        alt="ID Photo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-3xl font-bold text-white">
                        {(resident.username || 'R').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 space-y-3">
                    <div>
                      <p className="text-blue-300 text-xs uppercase tracking-wider">Full Name</p>
                      <p className="text-white text-lg font-semibold">{resident.username || '—'}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                      <div>
                        <p className="text-blue-300 text-xs uppercase tracking-wider">Unit</p>
                        <p className="text-white font-medium">{resident.unit || '—'}</p>
                      </div>
                      <div>
                        <p className="text-blue-300 text-xs uppercase tracking-wider">Nationality</p>
                        <p className="text-white font-medium">{resident.nationality || 'Ethiopian'}</p>
                      </div>
                      <div>
                        <p className="text-blue-300 text-xs uppercase tracking-wider">Sex</p>
                        <p className="text-white font-medium">{resident.sex || '—'}</p>
                      </div>
                      <div>
                        <p className="text-blue-300 text-xs uppercase tracking-wider">Issued</p>
                        <p className="text-white font-medium">
                          {digitalId.issuedAt ? new Date(digitalId.issuedAt).toLocaleDateString() : '—'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="w-20 h-20 bg-white rounded-lg p-1 shrink-0">
                    <QRCodeSVG
                      value={digitalId.qrCode || 'RMS-KEBELE'}
                      size={72}
                      bgColor="#ffffff"
                      fgColor="#1e3a5f"
                      level="Q"
                    />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/20 flex justify-between items-center">
                  <p className="text-xs text-blue-400">This ID is the property of the Kebele Administration</p>
                  <div className="text-xs text-blue-400">RMS • kebele.gov</div>
                </div>
              </div>
            </div>

            <div className="flex justify-center pt-2">
              <button
                onClick={handleDownloadId}
                className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-blue-600 text-blue-700 font-medium rounded-xl hover:bg-blue-50 transition-colors shadow-sm"
              >
                <ImageIcon className="w-5 h-5" />
                Download ID as Image
              </button>
            </div>
          </div>

        ) : currentStatus === 'pending' && digitalId ? (
          /* ── PENDING: Show request summary card ── */
          <div className="max-w-2xl mx-auto space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-yellow-900">Request Under Review</h2>
                  <p className="text-yellow-700 text-sm">Submitted on {new Date(digitalId.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="ml-auto">
                  <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-semibold">Pending Approval</span>
                </div>
              </div>
              <p className="text-yellow-800 text-sm">
                Your Digital ID request is being reviewed by the Kebele administration. This usually takes 1–2 business days. You will be notified once a decision is made.
              </p>
            </div>

            {/* Request Info Summary */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Submitted Information
                </h3>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-4">
                <InfoRow icon={<User className="w-4 h-4" />} label="Full Name" value={resident.username} />
                <InfoRow icon={<Globe className="w-4 h-4" />} label="Nationality" value={resident.nationality} />
                <InfoRow icon={<Calendar className="w-4 h-4" />} label="Date of Birth"
                  value={resident.dateOfBirth ? new Date(resident.dateOfBirth).toLocaleDateString() : null}
                />
                <InfoRow icon={<User className="w-4 h-4" />} label="Sex" value={resident.sex} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone Number" value={resident.phone} />
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Address" value={resident.address} />
                <InfoRow
                  icon={<Calendar className="w-4 h-4" />}
                  label="Request Date"
                  value={new Date(digitalId.createdAt).toLocaleDateString()}
                />
                <InfoRow icon={<Shield className="w-4 h-4" />} label="Unit" value={resident.unit} />
              </div>
            </div>
          </div>

        ) : currentStatus === 'revoked' ? (
          /* ── REVOKED ── */
          <div className="bg-white rounded-xl shadow-sm border border-red-200 text-center p-12 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Digital ID Revoked</h2>
            <p className="text-gray-600 mb-8 max-w-sm mx-auto">
              Your Digital ID has been revoked. Please contact the Kebele office for more information.
            </p>
          </div>

        ) : (
          /* ── NO ID: Show request button or profile completeness gate ── */
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-center p-12 max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <IdCard className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">No Digital ID Found</h2>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              You haven't applied for your Kebele Digital ID yet.
            </p>

            {/* Profile completeness gate */}
            {(() => {
              const missing = MANDATORY_PROFILE_FIELDS.filter(f => !resident?.[f.key]);
              if (missing.length > 0) {
                return (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-left space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                      Complete your profile before requesting a Digital ID
                    </div>
                    <p className="text-xs text-amber-700">
                      The following required profile fields are missing:
                    </p>
                    <ul className="space-y-1">
                      {missing.map(f => (
                        <li key={f.key} className="text-xs text-amber-800 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          {f.label}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-amber-700 pt-1 border-t border-amber-200">
                      📎 You will also need to upload a <strong>passport-size photo</strong> and <strong>birth certificate</strong> when applying.
                    </p>
                    <button
                      onClick={() => navigate('/resident/profile')}
                      className="mt-2 w-full px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 flex items-center justify-center gap-2 transition-colors"
                    >
                      Go to Profile &amp; Complete Your Info <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              }
              return (
                <>
                  <p className="text-xs text-gray-500 mb-4">📎 You'll need a passport-size photo and birth certificate for the application.</p>
                  <button
                    onClick={() => setShowRequestForm(true)}
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors inline-flex items-center gap-2"
                  >
                    <Shield className="w-5 h-5" /> Request Kebele Digital ID
                  </button>
                </>
              );
            })()}
          </div>
        )}

        {/* Info cards at bottom */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" /> Benefits of Kebele ID
            </h3>
            <ul className="space-y-3">
              {[
                'Fast-track entry at community gates',
                'Access to Kebele amenities and services',
                'Verified proof of residence for official matters',
                'Easier processing for letters and documents',
              ].map((b, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500 shrink-0" /> {b}
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-blue-600" /> Important Guidelines
            </h3>
            <ul className="space-y-3">
              {[
                'Do not share or screenshot your Digital ID QR code.',
                'IDs are non-transferable and personal to the resident.',
                'Report immediately if you suspect unauthorized use.',
                'Administration reserves the right to revoke access.',
              ].map((g, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-600">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                  {g}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Request Form Modal ── */}
      <Modal isOpen={showRequestForm} onClose={() => setShowRequestForm(false)} title="Apply for Kebele Digital ID" size="md">
        <form onSubmit={handleSubmitRequest} className="space-y-4 overflow-y-auto max-h-[75vh] px-1">
          <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800 flex gap-3 items-start">
            <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p>Provide accurate demographic information and upload the required documents. All fields are required.</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              required type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="E.g., Abebe Kebede Alemu"
            />
          </div>

          {/* DOB + Sex */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
              <input
                required type="date"
                value={formData.dateOfBirth}
                onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sex *</label>
              <select
                required
                value={formData.sex}
                onChange={e => setFormData({ ...formData, sex: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          {/* Phone + Nationality */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
              <input
                required type="tel"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="+251..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nationality *</label>
              <input
                required type="text"
                value={formData.nationality}
                onChange={e => setFormData({ ...formData, nationality: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="E.g., Ethiopian"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
            <textarea
              required
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="Full residential address (Kebele, Woreda, City)"
            />
          </div>

          {/* Auto-filled Issued Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issued Date (Auto)</label>
            <input
              type="text" disabled
              value={new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              className="w-full px-4 py-2 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
            />
          </div>

          {/* Documents */}
          <div className="border-t border-gray-200 pt-4 space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Required Documents
            </h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Passport-size Photo (4×3, white background) *
              </label>
              <input
                required type="file" accept="image/*"
                onChange={e => setFiles({ ...files, photo: e.target.files[0] })}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-lg px-3 py-2 cursor-pointer"
              />
              {files.photo && (
                <p className="text-xs text-green-600 mt-1">✓ {files.photo.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Birth Certificate (Image or PDF) *
              </label>
              <input
                required type="file" accept="image/*,.pdf"
                onChange={e => setFiles({ ...files, birthCertificate: e.target.files[0] })}
                className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border border-gray-300 rounded-lg px-3 py-2 cursor-pointer"
              />
              {files.birthCertificate && (
                <p className="text-xs text-green-600 mt-1">✓ {files.birthCertificate.name}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex gap-3">
            <button
              disabled={submitting} type="submit"
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
            <button
              type="button"
              onClick={() => setShowRequestForm(false)}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
}

// Helper component
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
      </div>
    </div>
  );
}
