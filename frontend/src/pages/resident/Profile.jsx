import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import {
  Camera, Edit2, Mail, Phone, Home, Shield, Plus, FileText,
  Loader2, Trash2, AlertTriangle, CheckCircle, User, MapPin,
  Calendar, Users, AlertCircle, IdCard
} from 'lucide-react';
import { toast } from 'sonner';
import { getMeAPI, updateUser, api, getMyDigitalId } from '../../utils/api';
import DualCalendarField from '../../components/ui/DualCalendarField';

// Mandatory fields that must be filled to request a Digital ID
// (nationality removed since system is for Hermata Merkato, Jimma City, Ethiopia)
const MANDATORY_FIELDS = [
  { key: 'phone', label: 'Phone Number' },
  { key: 'dateOfBirth', label: 'Date of Birth' },
  { key: 'sex', label: 'Gender' },
  { key: 'address', label: 'Address' },
  { key: 'nationality', label: 'Nationality' },
  { key: 'unit', label: 'Unit / House Number' }
];

const ACTIVE_ID_STATUSES = ['approved', 'issued'];
const REVIEW_ID_STATUSES = ['pending', 'verified', 'processing'];

function getMissingFields(user) {
  return MANDATORY_FIELDS.filter(f => !user?.[f.key]);
}

function getMemberSinceDate(user) {
  if (!user) return new Date();
  if (user.createdAt) return new Date(user.createdAt);
  if (user._id) return new Date(parseInt(user._id.substring(0, 8), 16) * 1000);
  return new Date();
}

function ProfileCompletenessBar({ user, digitalIdStatus }) {
  const missing = getMissingFields(user);
  const completed = MANDATORY_FIELDS.length - missing.length;
  const pct = Math.round((completed / MANDATORY_FIELDS.length) * 100);

  // If Digital ID is approved/issued, just show "Profile Complete"
  if (missing.length === 0 && ACTIVE_ID_STATUSES.includes(digitalIdStatus)) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center shrink-0">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-green-800 text-sm">Profile Complete</p>
        </div>
      </div>
    );
  }

  if (missing.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl px-5 py-4 flex items-center gap-3">
        <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center shrink-0">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <p className="font-semibold text-green-800 text-sm">Profile Complete</p>
          <p className="text-xs text-green-600">You can now request your Kebele Digital ID.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
          <AlertCircle className="w-5 h-5 text-amber-600" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-amber-800 text-sm">Profile Incomplete — {pct}% done</p>
          <p className="text-xs text-amber-600 mt-0.5">
            Fill all required fields to unlock your Kebele Digital ID.
          </p>
          <div className="mt-2 h-2 bg-amber-200 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pl-12">
        {missing.map(f => (
          <span key={f.key} className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs rounded-full border border-amber-300">
            ⚠ {f.label}
          </span>
        ))}
      </div>
    </div>
  );
}

const inputCls = (focused) =>
  `w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500 transition-colors ${focused ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-300 focus:ring-blue-100'
  }`;

export default function ResidentProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [digitalIdStatus, setDigitalIdStatus] = useState(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddDependentModal, setShowAddDependentModal] = useState(false);

  const [editFormData, setEditFormData] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [dependentData, setDependentData] = useState({ name: '', relationship: '', age: '' });
  const [submitting, setSubmitting] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const [resData, didResult] = await Promise.allSettled([
        getMeAPI(),
        getMyDigitalId()
      ]);

      if (resData.status === 'fulfilled') {
        const userData = resData.value.user || resData.value;
        setUser(userData);
        setEditFormData({
          username: userData.username || '',
          phone: userData.phone || '',
          dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.slice(0, 10) : '',
          sex: userData.sex || '',
          nationality: userData.nationality || 'Ethiopian',
          unit: userData.unit || '',
          address: userData.address || '',
          emergencyContact: userData.emergencyContact
            ? (typeof userData.emergencyContact === 'object'
              ? userData.emergencyContact.phone || ''
              : userData.emergencyContact)
            : '',
        });
      } else {
        toast.error('Failed to load profile');
      }

      if (didResult.status === 'fulfilled' && didResult.value) {
        setDigitalIdStatus(didResult.value.status);
      } else {
        setDigitalIdStatus(null);
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const validateEditForm = () => {
    const errs = {};
    if (!editFormData.phone?.trim()) errs.phone = 'Phone is required';
    else if (!/^[0-9+\-() ]{7,20}$/.test(editFormData.phone)) errs.phone = 'Enter a valid phone number';
    if (!editFormData.dateOfBirth) errs.dateOfBirth = 'Date of Birth is required';
    if (!editFormData.sex) errs.sex = 'Gender is required';
    if (!editFormData.address?.trim()) errs.address = 'Address is required';
    if (!editFormData.nationality?.trim()) errs.nationality = 'Nationality is required';
    if (!editFormData.unit?.trim()) errs.unit = 'Unit is required';
    return errs;
  };

  const handleEditProfile = async () => {
    const errs = validateEditForm();
    if (Object.keys(errs).length > 0) { setEditErrors(errs); return; }
    setEditErrors({});
    setSubmitting(true);
    try {
      const payload = {
        username: editFormData.username,
        phone: editFormData.phone,
        dateOfBirth: editFormData.dateOfBirth || undefined,
        sex: editFormData.sex || undefined,
        nationality: editFormData.nationality,
        unit: editFormData.unit,
        address: editFormData.address,
        emergencyContact: editFormData.emergencyContact
          ? { phone: editFormData.emergencyContact }
          : undefined,
      };
      // remove undefined
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
      await updateUser(user.id || user._id, payload);
      // Update local state immediately so completeness banner reacts now
      setUser(prev => ({ ...prev, ...payload, emergencyContact: payload.emergencyContact || prev.emergencyContact }));
      toast.success('Profile updated successfully!');
      setShowEditModal(false);
      fetchProfile();
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const setEdit = (field) => (val) => {
    const v = val && val.target ? val.target.value : val;
    setEditFormData(p => ({ ...p, [field]: v }));
    if (editErrors[field]) setEditErrors(p => ({ ...p, [field]: '' }));
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    setPhotoUploading(true);
    try {
      const token = localStorage.getItem('rms_token');
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await fetch('/api/uploads', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'x-upload-type': 'profile-photo'
        },
        body: formData
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.message || 'Upload failed');

      // Use Cloudinary URL directly if available, else fallback to API download route
      const photoPath = uploadData.file.url || `/api/uploads/${uploadData.file.filename}`;
      await updateUser(user.id || user._id, { profilePhoto: photoPath });
      // Update local state immediately so photo renders right away
      setUser(prev => ({ ...prev, profilePhoto: photoPath }));
      toast.success('Profile picture updated!');
      fetchProfile();
    } catch (err) {
      toast.error(err.message || 'Failed to update profile picture');
    } finally {
      setPhotoUploading(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleAddDependent = async () => {
    if (!dependentData.name || !dependentData.relationship) {
      toast.error('Name and relationship are required'); return;
    }
    setSubmitting(true);
    try {
      await api(`/users/${user.id || user._id}/dependents`, {
        method: 'POST',
        body: JSON.stringify(dependentData)
      });
      toast.success('Household member added!');
      setShowAddDependentModal(false);
      setDependentData({ name: '', relationship: '', age: '' });
      fetchProfile();
    } catch (error) {
      toast.error(error.message || 'Failed to add household member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveDependent = async (dependentId) => {
    if (!window.confirm('Remove this household member?')) return;
    try {
      await api(`/users/${user.id || user._id}/dependents/${dependentId}`, { method: 'DELETE' });
      toast.success('Household member removed');
      fetchProfile();
    } catch (error) {
      toast.error(error.message || 'Failed to remove household member');
    }
  };

  if (loading || !user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  const missing = getMissingFields(user);
  const ecPhone = typeof user.emergencyContact === 'object' ? user.emergencyContact?.phone : user.emergencyContact;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto">

        {/* Profile completeness banner */}
        <ProfileCompletenessBar user={user} digitalIdStatus={digitalIdStatus} />

        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-500 relative">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          </div>

          <div className="px-8 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-6">
              {/* Clickable profile photo */}
              <div className="relative group cursor-pointer" onClick={() => !photoUploading && photoInputRef.current?.click()}>
                <div className="w-24 h-24 bg-white rounded-full p-1 shadow-md">
                  <div className="w-full h-full bg-blue-100 rounded-full flex items-center justify-center border-4 border-white overflow-hidden">
                    {photoUploading ? (
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    ) : user.profilePhoto ? (
                      <img src={user.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-medium text-blue-600">
                        {user.username?.charAt(0).toUpperCase() || 'U'}
                      </span>
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 rounded-full bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              <button
                onClick={() => setShowEditModal(true)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
              >
                <Edit2 className="w-4 h-4" /> Edit Profile
                {missing.length > 0 && (
                  <span className="w-5 h-5 bg-amber-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {missing.length}
                  </span>
                )}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.username}</h1>
                <p className="text-gray-500 capitalize mt-0.5">{user.role}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InfoTile icon={<Home className="w-5 h-5 text-blue-600" />} bg="bg-blue-50" label="Unit" value={user.unit || '—'} />
                <InfoTile
                  icon={<Shield className="w-5 h-5 text-green-600" />} bg="bg-green-50"
                  label="Account Status"
                  value={user.status}
                  valueClass={user.status === 'approved' ? 'text-green-600' : 'text-yellow-600'}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Contact & Demographics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden md:col-span-1">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
              <h2 className="font-semibold text-gray-900">Contact & Demographics</h2>
            </div>
            <div className="p-6 space-y-4">
              <ContactRow icon={<Mail className="w-4 h-4 text-gray-400" />} label="Email" value={user.email} />
              <ContactRow icon={<Phone className="w-4 h-4 text-gray-400" />} label="Phone" value={user.phone} missing={!user.phone} />
              <ContactRow icon={<AlertTriangle className="w-4 h-4 text-red-400" />} label="Emergency Contact" value={ecPhone} missing={!ecPhone} />
              <div className="border-t border-gray-100 pt-4 space-y-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Demographics</p>
                <DemoRow label="Date of Birth" value={user.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : null} />
                <DemoRow label="Gender" value={user.sex} />
                <DemoRow label="Nationality" value={user.nationality} />
                <DemoRow label="Address" value={user.address} />
              </div>
            </div>
          </div>

          {/* Right Column: Unit Info + Household Members */}
          <div className="md:col-span-2 space-y-6">
            {/* Unit Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-600" /> Unit Information
                </h2>
              </div>
              <div className="p-6">
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Unit / House Number</p>
                    <p className="font-medium text-gray-900">{user.unit || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Member Since</p>
                    <p className="font-medium text-gray-900">
                      {getMemberSinceDate(user).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Digital ID Status</p>
                    <p className={`font-medium capitalize ${
                      ACTIVE_ID_STATUSES.includes(digitalIdStatus)
                        ? 'text-green-600'
                        : REVIEW_ID_STATUSES.includes(digitalIdStatus)
                          ? 'text-blue-600'
                          : digitalIdStatus === 'revoked'
                            ? 'text-red-600'
                            : 'text-gray-500'
                    }`}>
                      {digitalIdStatus ? digitalIdStatus.replace(/_/g, ' ') : 'Not Requested'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Household Members */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
                <h2 className="font-semibold text-gray-900">Household Members</h2>
                <button onClick={() => setShowAddDependentModal(true)} className="text-sm text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Member
                </button>
              </div>
              <div className="p-6">
                {user.dependents && user.dependents.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {user.dependents.map((dep) => (
                      <div key={dep._id} className="p-4 border border-gray-200 rounded-xl flex items-start gap-4 hover:border-blue-200 hover:bg-blue-50/30 transition-colors group">
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0 font-medium text-gray-600">
                          {dep.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{dep.name}</p>
                          <p className="text-sm text-gray-500">{dep.relationship}{dep.age ? ` • ${dep.age} yrs` : ''}</p>
                        </div>
                        <button onClick={() => handleRemoveDependent(dep._id)} className="p-2 text-gray-400 hover:text-red-600 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Users className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm">No household members added yet.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Edit Profile Modal ── */}
      <Modal isOpen={showEditModal} onClose={() => { setShowEditModal(false); setEditErrors({}); }} title="Edit Profile" size="md">
        <div className="space-y-4 overflow-y-auto max-h-[75vh] px-0.5">
          {missing.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-800 flex gap-2 items-start">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <span>Please complete all <strong>required fields</strong> below to unlock your Digital ID eligibility.</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
              <User className="w-3.5 h-3.5" /> Display Name
            </label>
            <input type="text" value={editFormData.username || ''} onChange={setEdit('username')}
              className={inputCls(false)} placeholder="E.g., Abebe Kebede" />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Phone Number <span className="text-red-500">*</span>
            </label>
            <input type="tel" value={editFormData.phone || ''} onChange={setEdit('phone')}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${editErrors.phone ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'}`}
              placeholder="+251 911 123 456" />
            {editErrors.phone && <p className="mt-1 text-xs text-red-600">⚠ {editErrors.phone}</p>}
          </div>

          {/* DOB + Sex */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" /> Date of Birth <span className="text-red-500">*</span>
              </label>
              <DualCalendarField
                id="profile-dateOfBirth"
                value={editFormData.dateOfBirth || ''}
                onChange={setEdit('dateOfBirth')}
                required
              />
              {editErrors.dateOfBirth && <p className="mt-1 text-xs text-red-600">⚠ {editErrors.dateOfBirth}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> Gender <span className="text-red-500">*</span>
              </label>
              <select value={editFormData.sex || ''} onChange={setEdit('sex')}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${editErrors.sex ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'}`}>
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {editErrors.sex && <p className="mt-1 text-xs text-red-600">⚠ {editErrors.sex}</p>}
            </div>
          </div>

          {/* Nationality + Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" /> Nationality <span className="text-red-500">*</span>
              </label>
              <input type="text" value={editFormData.nationality || ''} onChange={setEdit('nationality')}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${editErrors.nationality ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'}`}
                 placeholder="E.g., Ethiopian" />
              {editErrors.nationality && <p className="mt-1 text-xs text-red-600">⚠ {editErrors.nationality}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                <Home className="w-3.5 h-3.5" /> Unit / House No <span className="text-red-500">*</span>
              </label>
              <input type="text" value={editFormData.unit || ''} onChange={setEdit('unit')}
                className={`w-full px-3 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${editErrors.unit ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'}`}
                 placeholder="E.g., A-12" />
              {editErrors.unit && <p className="mt-1 text-xs text-red-600">⚠ {editErrors.unit}</p>}
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> Residential Address <span className="text-red-500">*</span>
            </label>
            <textarea value={editFormData.address || ''} onChange={setEdit('address')} rows={2}
              className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors resize-none ${editErrors.address ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:ring-blue-100 focus:border-blue-500'}`}
              placeholder="E.g., Kebele 12, Hermata Merkato, Jimma" />
            {editErrors.address && <p className="mt-1 text-xs text-red-600">⚠ {editErrors.address}</p>}
          </div>

          {/* Member Since (Read only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> Member Since
            </label>
            <input type="text" disabled value={getMemberSinceDate(user).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-xl text-sm text-gray-500 cursor-not-allowed" />
          </div>

          {/* Emergency Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" /> Emergency Contact Phone
            </label>
            <input type="tel" value={editFormData.emergencyContact || ''} onChange={setEdit('emergencyContact')}
              className={inputCls(false)} placeholder="+251 911 000 000" />
          </div>

          <div className="pt-3 flex gap-3">
            <button disabled={submitting} onClick={handleEditProfile}
              className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium text-sm transition-colors">
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => { setShowEditModal(false); setEditErrors({}); }}
              className="flex-1 bg-white border border-gray-300 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Add Household Member Modal ── */}
      <Modal isOpen={showAddDependentModal} onClose={() => setShowAddDependentModal(false)} title="Add Household Member" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name *</label>
            <input type="text" value={dependentData.name} onChange={e => setDependentData({ ...dependentData, name: e.target.value })}
              className={inputCls(false)} placeholder="E.g., Abebe Kebede" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Relationship *</label>
              <select value={dependentData.relationship} onChange={e => setDependentData({ ...dependentData, relationship: e.target.value })}
                className={inputCls(false)}>
                <option value="">Select...</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Age (Optional)</label>
              <input type="number" value={dependentData.age} onChange={e => setDependentData({ ...dependentData, age: e.target.value })}
                className={inputCls(false)} placeholder="Years" min="0" max="120" />
            </div>
          </div>
          <div className="pt-3 flex gap-3">
            <button disabled={submitting} onClick={handleAddDependent}
              className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 font-medium text-sm">
              {submitting ? 'Adding...' : 'Add Member'}
            </button>
            <button onClick={() => setShowAddDependentModal(false)}
              className="flex-1 bg-white border border-gray-300 px-4 py-2.5 rounded-xl hover:bg-gray-50 text-sm font-medium">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

// ── Small helper sub-components ───────────────────────────────────────────────
function InfoTile({ icon, bg, label, value, valueClass = 'text-gray-900' }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className={`font-medium capitalize text-sm ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}

function ContactRow({ icon, label, value, missing }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 shrink-0">{icon}</div>
      <div>
        <p className="text-xs font-medium text-gray-700">{label}</p>
        <p className={`text-sm ${missing ? 'text-amber-600 italic' : 'text-gray-600'}`}>
          {value || '⚠ Not provided — required for Digital ID'}
        </p>
      </div>
    </div>
  );
}

function DemoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${!value ? 'text-amber-600 italic' : 'text-gray-800'}`}>
        {value || '⚠ Missing'}
      </span>
    </div>
  );
}
