import React, { useState, useEffect, useContext, useRef } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { AuthContext } from '../../App';
import { toast } from 'sonner';
import { getMeAPI } from '../../utils/api';
import {
    User, Mail, Phone, ShieldCheck, Camera, Save, Lock, Eye, EyeOff, Loader2, Edit2,
    Scale, FileText, Database, ClipboardCheck, Shield, BookOpen, AlertCircle,
    CheckCircle2, ChevronDown, ChevronUp, Briefcase, MapPin, GraduationCap,
    Heart, Calendar, CreditCard, Building2, Users, Contact
} from 'lucide-react';
import DualCalendarField from '../../components/ui/DualCalendarField';

/* ─────────────────────────────────────────────────────── */

export default function AdminProfile() {
    const { user: authUser } = useContext(AuthContext);
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

    useEffect(() => { fetchProfile(); }, []);

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
                address: me.address || '',
                dateOfBirth: me.dateOfBirth ? me.dateOfBirth.slice(0, 10) : '',
                sex: me.sex || '',
                nationality: me.nationality || '',
                maritalStatus: me.maritalStatus || '',
                nationalId: me.nationalId || '',
                employeeId: me.employeeId || '',
                educationLevel: me.educationLevel || '',
                fieldOfStudy: me.fieldOfStudy || '',
                officeLocation: me.officeLocation || '',
                supervisorName: me.supervisorName || '',
                employmentStartDate: me.employmentStartDate ? me.employmentStartDate.slice(0, 10) : '',
                adminNote: me.adminNote || '',
                emergencyContact: {
                    name: me.emergencyContact?.name || '',
                    phone: me.emergencyContact?.phone || '',
                    relationship: me.emergencyContact?.relationship || '',
                },
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
        if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5 MB'); return; }
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSave = async () => {
        if (!form.username?.trim()) { toast.error('Username is required'); return; }
        setSaving(true);
        try {
            const userId = profile._id || profile.id;
            if (!userId) { toast.error('Cannot identify user — please refresh'); setSaving(false); return; }
            const payload = new FormData();
            const textFields = [
                'username', 'phone', 'address', 'dateOfBirth', 'sex', 'nationality',
                'maritalStatus', 'nationalId', 'employeeId', 'educationLevel',
                'fieldOfStudy', 'officeLocation', 'supervisorName', 'employmentStartDate', 'adminNote'
            ];
            textFields.forEach(f => { if (form[f]) payload.append(f, form[f]); });
            if (form.emergencyContact?.name) payload.append('emergencyContact[name]', form.emergencyContact.name);
            if (form.emergencyContact?.phone) payload.append('emergencyContact[phone]', form.emergencyContact.phone);
            if (form.emergencyContact?.relationship) payload.append('emergencyContact[relationship]', form.emergencyContact.relationship);
            if (photoFile) payload.append('photo', photoFile);

            const token = localStorage.getItem('rms_token');
            const res = await fetch(`/api/users/${userId}`, {
                method: 'PUT', headers: { Authorization: `Bearer ${token}` }, body: payload,
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Update failed');
            const updated = data.user || data;
            setProfile(updated);
            setPhotoPreview(null); setPhotoFile(null); setEditMode(false);
            toast.success('Profile updated successfully');
            fetchProfile();
        } catch (e) {
            toast.error(e.message || 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async () => {
        if (!pwForm.currentPassword || !pwForm.newPassword || !pwForm.confirm) { toast.error('All fields required'); return; }
        if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
        if (pwForm.newPassword.length < 8) { toast.error('Password must be at least 8 characters'); return; }
        setSavingPw(true);
        try {
            const token = localStorage.getItem('rms_token');
            const res = await fetch('/api/auth/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed');
            toast.success('Password changed successfully');
            setShowPwForm(false);
            setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
        } catch (e) {
            toast.error(e.message);
        } finally {
            setSavingPw(false);
        }
    };

    if (loading) return (
        <DashboardLayout>
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        </DashboardLayout>
    );

    const avatarUrl = photoPreview || (profile?.profilePhoto ? `/uploads/${profile.profilePhoto.replace(/^.*?uploads\//, '')}` : null);
    const displayInitial = (profile?.username || 'A').charAt(0).toUpperCase();
    const field = (label, value) => (
        <div className="flex items-start gap-2 py-1">
            <span className="text-xs text-gray-400 w-32 flex-shrink-0 mt-0.5">{label}</span>
            <span className="text-sm text-gray-900 font-medium">{value || <span className="text-gray-300 italic">—</span>}</span>
        </div>
    );

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Administrator Profile</h1>
                    <p className="text-gray-500 mt-1">Manage your personal details, employment information, and security credentials.</p>
                </div>

                {/* ── Profile Card ── */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-slate-800 via-blue-900 to-indigo-900 relative">
                        <div className="absolute inset-0 bg-black/10" />
                    </div>
                    <div className="px-8 pb-8">
                        <div className="flex items-end justify-between -mt-16 mb-6">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-800 flex items-center justify-center">
                                    {avatarUrl ? <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" /> : <span className="text-white text-5xl font-bold">{displayInitial}</span>}
                                </div>
                                {editMode && (
                                    <button onClick={() => photoRef.current?.click()} className="absolute bottom-1 right-1 w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center border-2 border-white hover:bg-blue-700 shadow-md">
                                        <Camera className="w-4 h-4" />
                                    </button>
                                )}
                                <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                            </div>
                            <div className="flex gap-2 pb-2">
                                {!editMode ? (
                                    <button onClick={() => setEditMode(true)} className="flex items-center gap-1.5 px-5 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm">
                                        <Edit2 className="w-4 h-4" /> Edit Profile
                                    </button>
                                ) : (
                                    <>
                                        <button onClick={() => { setEditMode(false); setPhotoPreview(null); setPhotoFile(null); }} className="px-5 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 shadow-sm">Cancel</button>
                                        <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 shadow-sm">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            {saving ? 'Saving...' : 'Save Changes'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-2xl font-bold text-gray-900">{profile?.username}</p>
                            <div className="flex items-center gap-2 mt-1">
                                <ShieldCheck className="w-4 h-4 text-blue-600" />
                                <p className="text-blue-600 font-semibold text-sm uppercase tracking-wide">System Administrator</p>
                            </div>
                        </div>

                        {/* ── SECTION 1: Basic Identity ── */}
                        <ProfileSection title="Basic Identity" icon={<User className="w-4 h-4 text-blue-600" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormRow label="Display Name" editMode={editMode} required>
                                    <input type="text" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} className={INPUT} placeholder="Full name or username" />
                                    <ReadValue>{profile?.username}</ReadValue>
                                </FormRow>
                                <FormRow label="National ID / Kebele ID" editMode={editMode}>
                                    <input type="text" value={form.nationalId} onChange={e => setForm(p => ({ ...p, nationalId: e.target.value }))} className={INPUT} placeholder="e.g. ETH-1234-5678" />
                                    <ReadValue>{profile?.nationalId}</ReadValue>
                                </FormRow>
                                <FormRow label="Date of Birth" editMode={editMode}>
                                    <DualCalendarField id="adm-prof-dob" value={form.dateOfBirth} onChange={(val) => setForm(p => ({ ...p, dateOfBirth: val }))} />
                                    <ReadValue>{profile?.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : null}</ReadValue>
                                </FormRow>
                                <FormRow label="Gender" editMode={editMode}>
                                    <select value={form.sex} onChange={e => setForm(p => ({ ...p, sex: e.target.value }))} className={INPUT}>
                                        <option value="">Select…</option>
                                        {['Male', 'Female'].map(v => <option key={v}>{v}</option>)}
                                    </select>
                                    <ReadValue>{profile?.sex}</ReadValue>
                                </FormRow>
                                <FormRow label="Nationality" editMode={editMode}>
                                    <input type="text" value={form.nationality} onChange={e => setForm(p => ({ ...p, nationality: e.target.value }))} className={INPUT} placeholder="e.g. Ethiopian" />
                                    <ReadValue>{profile?.nationality}</ReadValue>
                                </FormRow>
                                <FormRow label="Marital Status" editMode={editMode}>
                                    <select value={form.maritalStatus} onChange={e => setForm(p => ({ ...p, maritalStatus: e.target.value }))} className={INPUT}>
                                        <option value="">Select…</option>
                                        {['Single', 'Married', 'Divorced', 'Widowed', 'Other'].map(v => <option key={v}>{v}</option>)}
                                    </select>
                                    <ReadValue>{profile?.maritalStatus}</ReadValue>
                                </FormRow>
                            </div>
                        </ProfileSection>

                        {/* ── SECTION 2: Contact ── */}
                        <ProfileSection title="Contact & Address" icon={<MapPin className="w-4 h-4 text-teal-600" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormRow label="Official Email" editMode={false}>
                                    <ReadValue suffix="(Read-only)">{profile?.email}</ReadValue>
                                </FormRow>
                                <FormRow label="Phone Number" editMode={editMode}>
                                    <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} className={INPUT} placeholder="+251 9XX XXX XXX" />
                                    <ReadValue>{profile?.phone}</ReadValue>
                                </FormRow>
                                <div className="md:col-span-2">
                                    <FormRow label="Residential Address" editMode={editMode}>
                                        <input type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className={INPUT} placeholder="Sub-city, Woreda, House No." />
                                        <ReadValue>{profile?.address}</ReadValue>
                                    </FormRow>
                                </div>
                            </div>
                        </ProfileSection>

                        {/* ── SECTION 3: Employment ── */}
                        <ProfileSection title="Employment Details" icon={<Briefcase className="w-4 h-4 text-indigo-600" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormRow label="Staff / Employee ID" editMode={editMode}>
                                    <input type="text" value={form.employeeId} onChange={e => setForm(p => ({ ...p, employeeId: e.target.value }))} className={INPUT} placeholder="e.g. RMS-ADM-001" />
                                    <ReadValue>{profile?.employeeId}</ReadValue>
                                </FormRow>
                                <FormRow label="Employment Start Date" editMode={editMode}>
                                    <DualCalendarField id="adm-prof-startdate" value={form.employmentStartDate} onChange={(val) => setForm(p => ({ ...p, employmentStartDate: val }))} />
                                    <ReadValue>{profile?.employmentStartDate ? new Date(profile.employmentStartDate).toLocaleDateString() : null}</ReadValue>
                                </FormRow>
                                <FormRow label="Office Location" editMode={editMode}>
                                    <input type="text" value={form.officeLocation} onChange={e => setForm(p => ({ ...p, officeLocation: e.target.value }))} className={INPUT} placeholder="e.g. Main Office, Block A" />
                                    <ReadValue>{profile?.officeLocation}</ReadValue>
                                </FormRow>
                                <FormRow label="Supervisor / Reporting To" editMode={editMode}>
                                    <input type="text" value={form.supervisorName} onChange={e => setForm(p => ({ ...p, supervisorName: e.target.value }))} className={INPUT} placeholder="Name of direct supervisor" />
                                    <ReadValue>{profile?.supervisorName}</ReadValue>
                                </FormRow>
                                <FormRow label="Department / Category" editMode={false}>
                                    <ReadValue>{profile?.jobCategory || 'System Administration'}</ReadValue>
                                </FormRow>
                                <FormRow label="Account Status" editMode={false}>
                                    <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                                        profile?.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                    }`}>{profile?.status === 'approved' ? 'Active' : profile?.status}</span>
                                </FormRow>
                            </div>
                            {editMode && (
                                <div className="mt-4">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Administrative Notes</label>
                                    <textarea value={form.adminNote} onChange={e => setForm(p => ({ ...p, adminNote: e.target.value }))} rows={3} className={INPUT} placeholder="Optional internal notes about this account…" />
                                </div>
                            )}
                            {!editMode && profile?.adminNote && (
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-gray-700">{profile.adminNote}</div>
                            )}
                        </ProfileSection>

                        {/* ── SECTION 4: Education ── */}
                        <ProfileSection title="Education & Qualifications" icon={<GraduationCap className="w-4 h-4 text-purple-600" />}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormRow label="Highest Education Level" editMode={editMode}>
                                    <select value={form.educationLevel} onChange={e => setForm(p => ({ ...p, educationLevel: e.target.value }))} className={INPUT}>
                                        <option value="">Select…</option>
                                        {["Certificate", "Diploma", "Bachelor's Degree", "Master's Degree", "PhD", "Other"].map(v => <option key={v}>{v}</option>)}
                                    </select>
                                    <ReadValue>{profile?.educationLevel}</ReadValue>
                                </FormRow>
                                <FormRow label="Field of Study" editMode={editMode}>
                                    <input type="text" value={form.fieldOfStudy} onChange={e => setForm(p => ({ ...p, fieldOfStudy: e.target.value }))} className={INPUT} placeholder="e.g. Public Administration, IT" />
                                    <ReadValue>{profile?.fieldOfStudy}</ReadValue>
                                </FormRow>
                            </div>
                        </ProfileSection>

                        {/* ── SECTION 5: Emergency Contact ── */}
                        <ProfileSection title="Emergency Contact" icon={<Contact className="w-4 h-4 text-rose-600" />}>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <FormRow label="Full Name" editMode={editMode}>
                                    <input type="text" value={form.emergencyContact?.name} onChange={e => setForm(p => ({ ...p, emergencyContact: { ...p.emergencyContact, name: e.target.value } }))} className={INPUT} placeholder="Contact name" />
                                    <ReadValue>{profile?.emergencyContact?.name}</ReadValue>
                                </FormRow>
                                <FormRow label="Phone" editMode={editMode}>
                                    <input type="tel" value={form.emergencyContact?.phone} onChange={e => setForm(p => ({ ...p, emergencyContact: { ...p.emergencyContact, phone: e.target.value } }))} className={INPUT} placeholder="+251 ..." />
                                    <ReadValue>{profile?.emergencyContact?.phone}</ReadValue>
                                </FormRow>
                                <FormRow label="Relationship" editMode={editMode}>
                                    <input type="text" value={form.emergencyContact?.relationship} onChange={e => setForm(p => ({ ...p, emergencyContact: { ...p.emergencyContact, relationship: e.target.value } }))} className={INPUT} placeholder="e.g. Spouse, Parent" />
                                    <ReadValue>{profile?.emergencyContact?.relationship}</ReadValue>
                                </FormRow>
                            </div>
                        </ProfileSection>
                    </div>
                </div>

                {/* ── Password Section ── */}
                <PasswordSection showPwForm={showPwForm} setShowPwForm={setShowPwForm} pwForm={pwForm} setPwForm={setPwForm} showPw={showPw} setShowPw={setShowPw} savingPw={savingPw} handleChangePassword={handleChangePassword} />

                {/* ── Legal Section ── */}
                <LegalSection role="admin" />
            </div>
        </DashboardLayout>
    );
}

/* ─────────────────── Shared sub-components ─────────────────── */
const INPUT = "w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-gray-50/50";

function ProfileSection({ title, icon, children }) {
    return (
        <div className="border-t border-gray-100 pt-6 mt-6">
            <div className="flex items-center gap-2 mb-4">
                {icon}
                <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">{title}</h3>
            </div>
            {children}
        </div>
    );
}

function FormRow({ label, editMode, required, children }) {
    const [view, edit] = Array.isArray(children) ? children : [children, null];
    return (
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                {label}{required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {editMode && edit ? edit : view}
        </div>
    );
}

function ReadValue({ children, suffix }) {
    return (
        <div className="flex items-center gap-2 px-4 py-2.5 border border-gray-100 bg-gray-50 rounded-xl text-sm text-gray-900 min-h-[42px]">
            {children || <span className="text-gray-300 italic text-xs">Not provided</span>}
            {suffix && <span className="ml-auto text-xs text-gray-400 italic">{suffix}</span>}
        </div>
    );
}

function PasswordSection({ showPwForm, setShowPwForm, pwForm, setPwForm, showPw, setShowPw, savingPw, handleChangePassword }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 rounded-lg border border-red-100"><Lock className="w-5 h-5 text-red-600" /></div>
                    <div><h3 className="font-bold text-gray-900">Security Credentials</h3><p className="text-xs text-gray-500 mt-0.5">Manage administrator password</p></div>
                </div>
                <button onClick={() => setShowPwForm(p => !p)} className="px-4 py-2 rounded-lg text-sm font-semibold border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm">
                    {showPwForm ? 'Cancel' : 'Change Password'}
                </button>
            </div>
            {showPwForm && (
                <div className="p-8 space-y-5">
                    {['currentPassword', 'newPassword', 'confirm'].map((field) => {
                        const labels = { currentPassword: 'Current Password', newPassword: 'New Password', confirm: 'Confirm New Password' };
                        const key = field === 'currentPassword' ? 'current' : field === 'newPassword' ? 'new' : 'confirm';
                        return (
                            <div key={field} className="max-w-md">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{labels[field]}</label>
                                <div className="relative">
                                    <input type={showPw[key] ? 'text' : 'password'} value={pwForm[field]}
                                        onChange={e => setPwForm(p => ({ ...p, [field]: e.target.value }))}
                                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm bg-gray-50/50"
                                        placeholder="••••••••" />
                                    <button type="button" onClick={() => setShowPw(p => ({ ...p, [key]: !p[key] }))}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                                        {showPw[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    <button onClick={handleChangePassword} disabled={savingPw}
                        className="px-6 py-2.5 bg-slate-800 text-white rounded-xl font-semibold text-sm hover:bg-slate-900 disabled:opacity-60 flex items-center gap-2 shadow-sm w-full max-w-md">
                        {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        {savingPw ? 'Updating...' : 'Update Password'}
                    </button>
                </div>
            )}
        </div>
    );
}

/* ─────────────────── Legal Section ─────────────────── */
function LegalSection({ role }) {
    const [openSection, setOpenSection] = useState(null);
    const toggle = (key) => setOpenSection(prev => prev === key ? null : key);
    const ROLE_LABEL = { admin: 'System Administrator', employee: 'Staff Member' }[role] ?? 'Staff Member';

    const sections = [
        { key: 'access', icon: ShieldCheck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100', title: 'Platform Access & Authorization', content: [`As a ${ROLE_LABEL}, you are granted access to the RMS solely for the performance of your official duties.`, 'Unauthorized access to restricted system areas, data sets, or administrative functions beyond your designated role is strictly prohibited.', role === 'admin' ? 'As System Administrator, your elevated privileges carry additional legal responsibility. Any misuse, unauthorized configuration change, or data manipulation constitutes a serious breach of your obligations.' : 'Access credentials are personal and non-transferable. Sharing login details with any third party is a disciplinary offense.', 'Your access may be revoked at any time if a policy violation, security threat, or role change is identified.'] },
        { key: 'privacy', icon: Database, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', title: 'Data Privacy & Personal Data Protection', content: ['All resident and employee personal data is protected under applicable data protection legislation.', 'You are obligated to process personal data only for the purpose for which access was granted.', 'Data minimization applies: access only the information needed to fulfill your task. Browsing records without purpose constitutes a privacy violation.', 'Any disclosure of personal data to unauthorized parties must be reported to the System Administrator within 24 hours.', 'Exporting or transmitting system data outside approved workflows is prohibited without written authorization.'] },
        { key: 'confidentiality', icon: Lock, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-100', title: 'Confidentiality Obligations', content: ['All information encountered through this system — including complaints, escalation records, administrative decisions, and digital ID records — is strictly confidential.', 'Confidentiality obligations survive termination of employment. You remain bound after your access is revoked.', 'Sharing confidential information on social media, personal devices, or unofficial channels is a violation of law.', 'Do not discuss resident identities or complaint outcomes with unauthorized persons.'] },
        { key: 'security', icon: Shield, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', title: 'Security Responsibilities', content: ['You are personally responsible for your login credentials. Use a strong, unique password and update it regularly.', 'Never leave an active session unattended. Log out whenever you leave your workstation.', 'Report any suspected unauthorized access or system anomaly to the administrator immediately.', role === 'admin' ? 'As Administrator, all changes to user roles or system configuration must be documented and authorized.' : 'Notify the Administrator if you notice access to functions beyond your designated role.'] },
        { key: 'acceptable_use', icon: ClipboardCheck, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-100', title: 'Acceptable Use Policy', content: ['System resources may be used exclusively for authorized administrative functions.', 'Attempting to circumvent security controls, manipulate records, or inject unauthorized data is strictly prohibited and constitutes a criminal offense.', 'All system interactions are subject to logging. System logs are official administrative records and cannot be tampered with.', 'The system must not be used to discriminate against any resident or employee on any basis.'] },
        { key: 'conduct', icon: BookOpen, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', title: 'Professional Code of Conduct', content: ['All staff must maintain the highest standards of professional integrity, impartiality, and ethical conduct.', 'Resident requests must be processed fairly, promptly, and without bias. Deliberately delaying a request is a conduct violation.', 'All communication within the system must remain professional, factual, and free of personal opinion.', 'Retaliation against a resident or colleague for submitting a complaint is strictly prohibited and may result in immediate suspension.', role === 'admin' ? 'As Administrator, favoritism, data manipulation for personal interest, or selective enforcement of policies is a serious breach of your fiduciary duty.' : 'Report observed misconduct through the proper escalation channel.'] },
        { key: 'audit', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-100', title: 'Audit & Monitoring Consent', content: ['By accessing this system, you explicitly consent to monitoring, logging, and periodic auditing of all activities.', 'Audit logs capture login history, data queries, record modifications, and role changes, retained for a minimum of 24 months.', 'Audit records may be used in disciplinary proceedings, internal investigations, or legal proceedings.', role === 'admin' ? 'Administrator actions are subject to an elevated audit standard. All configuration changes and mass data operations require justification notes and are reviewed quarterly.' : 'Unusual access patterns may trigger an automatic security review.'] },
        { key: 'legal', icon: Scale, color: 'text-gray-700', bg: 'bg-gray-50', border: 'border-gray-200', title: 'Legal Basis & Consequences of Violation', content: ['This system operates in compliance with the laws governing municipal administration, civil service, and data protection in the Federal Democratic Republic of Ethiopia.', 'Violations may result in: formal disciplinary action, suspension or permanent revocation of access, termination of contract, civil liability, and/or criminal prosecution.', 'The organization reserves the right to seek damages or pursue legal remedies for violations resulting in harm to residents, employees, or the organization.', 'Ignorance of these policies is not a valid defense. By using this system, you acknowledge that you have read and agree to all applicable policies.', 'These policies are reviewed annually. Continued use after a policy update constitutes acceptance of the revised terms.'] },
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 rounded-xl border border-blue-100"><Scale className="w-5 h-5 text-blue-600" /></div>
                <div>
                    <h3 className="font-bold text-gray-900">Legal Information & Compliance</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Click any section to expand your obligations as {ROLE_LABEL}</p>
                </div>
                <span className="ml-auto px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">{sections.length} Sections</span>
            </div>
            <div className="divide-y divide-gray-100">
                {sections.map(({ key, icon: Icon, color, bg, border, title, content }) => (
                    <div key={key}>
                        <button onClick={() => toggle(key)} className="w-full flex items-center gap-4 px-8 py-4 text-left hover:bg-gray-50 transition-colors">
                            <div className={`p-2 ${bg} ${border} border rounded-lg flex-shrink-0`}><Icon className={`w-4 h-4 ${color}`} /></div>
                            <span className="flex-1 font-semibold text-gray-800 text-sm">{title}</span>
                            {openSection === key ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
                        </button>
                        {openSection === key && (
                            <div className={`mx-8 mb-4 ${bg} border ${border} rounded-xl p-5 space-y-3`}>
                                {content.map((para, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <CheckCircle2 className={`w-4 h-4 ${color} flex-shrink-0 mt-0.5`} />
                                        <p className="text-gray-700 text-sm leading-relaxed">{para}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div className="px-8 py-5 bg-amber-50 border-t border-amber-100 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-amber-800 text-xs leading-relaxed">
                    <span className="font-bold">Acknowledgment: </span>
                    By logging in and using this system, you confirm that you have read, understood, and agree to comply with all policies and legal obligations above.
                    This acknowledgment is recorded and timestamped against your account in the system audit log. Last review: <span className="font-semibold">April 2026</span>.
                </p>
            </div>
        </div>
    );
}
