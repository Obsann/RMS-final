import React, { useState, useEffect, useContext, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { AuthContext } from '../../App';
import { toast } from 'sonner';
import { getMeAPI, updateUser } from '../../utils/api';
import {
    User, Mail, Phone, Building2, Camera, Save, Lock, Eye, EyeOff, Loader2, Edit2
} from 'lucide-react';

export default function EmployeeProfile() {
    const { user: authUser, setUser } = useContext(AuthContext);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({});

    const [showPwForm, setShowPwForm] = useState(false);
    const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
    const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
    const [savingPw, setSavingPw] = useState(false);

    const photoRef = useRef(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [photoFile, setPhotoFile] = useState(null);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const data = await getMeAPI();
            const me = data.user || data;
            setProfile(me);
            setForm({
                username: me.username || '',
                phone: me.phone || '',
                email: me.email || '',
            });
        } catch (e) {
            toast.error('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Photo must be under 5 MB');
            return;
        }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        if (!form.username?.trim()) {
            toast.error('Username is required');
            return;
        }
        setSaving(true);
        try {
            const payload = new FormData();
            payload.append('username', form.username.trim());
            if (form.phone) payload.append('phone', form.phone);
            if (photoFile) payload.append('photo', photoFile);

            const token = localStorage.getItem('rms_token');
            const res = await fetch(`/api/users/${profile._id}`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` },
                body: payload,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Update failed');

            const updated = data.user || data;
            setProfile(updated);
            setForm({ username: updated.username, phone: updated.phone || '', email: updated.email });
            setPhotoPreview(null);
            setPhotoFile(null);
            setEditMode(false);
            toast.success('Profile updated!');
        } catch (e) {
            toast.error(e.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirm) {
            toast.error('All password fields are required');
            return;
        }
        if (pwForm.newPassword !== pwForm.confirm) {
            toast.error('New passwords do not match');
            return;
        }
        if (pwForm.newPassword.length < 8) {
            toast.error('New password must be at least 8 characters');
            return;
        }
        setSavingPw(true);
        try {
            const token = localStorage.getItem('rms_token');
            const res = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Password change failed');
            toast.success('Password changed successfully');
            setShowPwForm(false);
            setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
        } catch (e) {
            toast.error(e.message || 'Failed to change password');
        } finally {
            setSavingPw(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
            </DashboardLayout>
        );
    }

    const avatarUrl = photoPreview || (profile?.profilePhoto ? `/uploads/${profile.profilePhoto.replace(/^.*?uploads\//, '')}` : null);
    const displayInitial = (profile?.username || 'E').charAt(0).toUpperCase();

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
                    <p className="text-gray-500 mt-1">View and update your account information</p>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Hero Banner */}
                    <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700" />

                    <div className="px-6 pb-6">
                        {/* Avatar */}
                        <div className="flex items-end justify-between -mt-12 mb-5">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full border-4 border-white shadow-md overflow-hidden bg-blue-600 flex items-center justify-center">
                                    {avatarUrl
                                        ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                                        : <span className="text-white text-3xl font-bold">{displayInitial}</span>
                                    }
                                </div>
                                {editMode && (
                                    <button
                                        onClick={() => photoRef.current?.click()}
                                        className="absolute bottom-0 right-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white hover:bg-blue-700 transition-colors shadow"
                                        title="Change photo"
                                    >
                                        <Camera className="w-4 h-4" />
                                    </button>
                                )}
                                <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                            </div>

                            <div className="flex gap-2 pb-1">
                                {!editMode ? (
                                    <button
                                        onClick={() => setEditMode(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" /> Edit
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={() => { setEditMode(false); setPhotoPreview(null); setPhotoFile(null); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                                        <button
                                            onClick={handleSave} disabled={saving}
                                            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
                                        >
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {saving ? 'Saving...' : 'Save'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Name & Role */}
                        <div className="mb-6">
                            <p className="text-xl font-bold text-gray-900">{profile?.username}</p>
                            <p className="text-gray-500 text-sm capitalize">{profile?.role?.replace('-', ' ')} • {profile?.jobCategory || 'General'}</p>
                        </div>

                        {/* Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name / Username</label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={form.username}
                                        onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                        placeholder="Your username"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-100 bg-gray-50 rounded-lg text-sm text-gray-900">
                                        <User className="w-4 h-4 text-gray-400" /> {profile?.username}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                                <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-100 bg-gray-50 rounded-lg text-sm text-gray-900">
                                    <Mail className="w-4 h-4 text-gray-400" /> {profile?.email}
                                    <span className="ml-auto text-xs text-gray-400 italic">Cannot be changed</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number</label>
                                {editMode ? (
                                    <input
                                        type="tel"
                                        value={form.phone}
                                        onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                        placeholder="+251 9XX XXX XXXX"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-100 bg-gray-50 rounded-lg text-sm text-gray-900">
                                        <Phone className="w-4 h-4 text-gray-400" /> {profile?.phone || '—'}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Role</label>
                                <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-100 bg-gray-50 rounded-lg text-sm text-gray-900">
                                    <Building2 className="w-4 h-4 text-gray-400" />
                                    <span className="capitalize">{profile?.role?.replace('-', ' ')} — {profile?.jobCategory || 'General Employee'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Account Status</label>
                                <div className="flex items-center gap-2">
                                    <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${profile?.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' :
                                        profile?.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                            'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                        {profile?.status ? profile.status.charAt(0).toUpperCase() + profile.status.slice(1) : 'Unknown'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Password Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Lock className="w-5 h-5 text-gray-400" />
                            <h3 className="font-semibold text-gray-900">Security</h3>
                        </div>
                        <button
                            onClick={() => setShowPwForm(p => !p)}
                            className="text-sm font-medium text-blue-600 hover:underline"
                        >
                            {showPwForm ? 'Cancel' : 'Change Password'}
                        </button>
                    </div>

                    {!showPwForm ? (
                        <p className="text-sm text-gray-500">For your security, we recommend using a strong unique password and updating it regularly.</p>
                    ) : (
                        <div className="space-y-3">
                            {['currentPassword', 'newPassword', 'confirm'].map((field) => {
                                const labels = { currentPassword: 'Current Password', newPassword: 'New Password', confirm: 'Confirm New Password' };
                                const key = field === 'currentPassword' ? 'current' : field === 'newPassword' ? 'new' : 'confirm';
                                return (
                                    <div key={field}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">{labels[field]}</label>
                                        <div className="relative">
                                            <input
                                                type={showPw[key] ? 'text' : 'password'}
                                                value={pwForm[field]}
                                                onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                                                className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
                                                placeholder={labels[field]}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                            >
                                                {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                            <button
                                onClick={handleChangePassword} disabled={savingPw}
                                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                            >
                                {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                {savingPw ? 'Changing...' : 'Change Password'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
