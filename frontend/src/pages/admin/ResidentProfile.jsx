import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import {
  ArrowLeft, Mail, Phone, Home, Users, Calendar, MapPin,
  Globe, ShieldCheck, AlertCircle, Loader2, Edit, CheckCircle, XCircle
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { getUserById, updateUserStatus } from '../../utils/api';

export default function AdminResidentProfile() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [resident, setResident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('personal');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getUserById(id)
      .then(res => {
        setResident(res.user || res);
        setNewStatus((res.user || res).status || 'pending');
      })
      .catch(() => toast.error('Failed to load resident profile'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleStatusUpdate = async () => {
    setSaving(true);
    try {
      await updateUserStatus(id, newStatus);
      setResident(prev => ({ ...prev, status: newStatus }));
      toast.success(`Status updated to ${newStatus}`);
      setShowStatusModal(false);
    } catch (err) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-24">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading resident profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!resident) {
    return (
      <DashboardLayout>
        <div className="text-center py-24">
          <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Resident not found.</p>
          <button onClick={() => navigate('/admin/residents')} className="mt-4 text-blue-600 hover:underline text-sm">
            Back to Residents
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const ecPhone = typeof resident.emergencyContact === 'object'
    ? resident.emergencyContact?.phone
    : resident.emergencyContact;

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/residents')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1>Resident Profile</h1>
            <p className="text-gray-600 mt-0.5 text-sm">View and manage resident information</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={resident.status} />
            <button
              onClick={() => setShowStatusModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" /> Change Status
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center shrink-0 overflow-hidden">
              {resident.profilePhoto ? (
                <img src={`http://localhost:5000${resident.profilePhoto}`} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-600 text-3xl font-medium">{(resident.username || 'R').charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-1">{resident.username}</h2>
              <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600 mt-3">
                <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" />{resident.email}</div>
                <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" />{resident.phone || '—'}</div>
                <div className="flex items-center gap-2"><Home className="w-4 h-4 text-gray-400" />Unit: {resident.unit || '—'}</div>
                <div className="flex items-center gap-2"><Users className="w-4 h-4 text-gray-400" />{resident.dependents?.length || 0} Dependents</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <div className="flex gap-1 px-4 pt-2">
              {['personal', 'dependents'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                    }`}
                >
                  {tab === 'personal' ? 'Personal Information' : 'Dependents'}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            {/* Personal Information */}
            {activeTab === 'personal' && (
              <div className="grid sm:grid-cols-2 gap-6">
                <InfoItem icon={<Users className="w-4 h-4" />} label="Full Name" value={resident.username} />
                <InfoItem icon={<Mail className="w-4 h-4" />} label="Email Address" value={resident.email} />
                <InfoItem icon={<Phone className="w-4 h-4" />} label="Phone Number" value={resident.phone} />
                <InfoItem icon={<Home className="w-4 h-4" />} label="Unit Number" value={resident.unit} />
                <InfoItem icon={<Calendar className="w-4 h-4" />} label="Date of Birth"
                  value={resident.dateOfBirth ? new Date(resident.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : null} />
                <InfoItem icon={<Users className="w-4 h-4" />} label="Gender" value={resident.sex} />
                <InfoItem icon={<Globe className="w-4 h-4" />} label="Nationality" value={resident.nationality} />
                <InfoItem icon={<MapPin className="w-4 h-4" />} label="Address" value={resident.address} />
                <InfoItem icon={<Phone className="w-4 h-4" />} label="Emergency Contact" value={ecPhone} />
                <InfoItem icon={<Calendar className="w-4 h-4" />} label="Registered"
                  value={resident.createdAt ? new Date(resident.createdAt).toLocaleDateString() : null} />
                <InfoItem icon={<ShieldCheck className="w-4 h-4" />} label="Account Status" value={resident.status} />
                <InfoItem icon={<ShieldCheck className="w-4 h-4" />} label="Digital ID Status"
                  value={resident.digitalId?.status || 'None'} />
              </div>
            )}

            {/* Dependents */}
            {activeTab === 'dependents' && (
              <div className="space-y-3">
                {resident.dependents?.length > 0 ? (
                  resident.dependents.map((dep, idx) => (
                    <div key={dep._id || idx} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-medium">
                          {dep.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{dep.name}</p>
                          <p className="text-sm text-gray-500">{dep.relationship}{dep.age ? ` · ${dep.age} yrs` : ''}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-400">
                    <Users className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No dependents recorded</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Change Status Modal */}
      <Modal isOpen={showStatusModal} onClose={() => setShowStatusModal(false)} title="Update Resident Status" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Select the new status for <strong className="text-gray-900">{resident.username}</strong>:
          </p>
          <div className="space-y-2">
            {[
              { value: 'pending', label: 'Pending', desc: 'Awaiting admin review', color: 'yellow' },
              { value: 'approved', label: 'Approved', desc: 'Active account, can log in', color: 'green' },
              { value: 'rejected', label: 'Rejected', desc: 'Account denied access', color: 'red' },
            ].map(opt => (
              <label key={opt.value}
                className={`flex items-start gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all ${newStatus === opt.value ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <input type="radio" className="mt-0.5" name="status" value={opt.value}
                  checked={newStatus === opt.value} onChange={() => setNewStatus(opt.value)} />
                <div>
                  <p className="text-sm font-medium text-gray-900 capitalize">{opt.label}</p>
                  <p className="text-xs text-gray-500">{opt.desc}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="flex gap-3 pt-2">
            <button disabled={saving} onClick={handleStatusUpdate}
              className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Status'}
            </button>
            <button onClick={() => setShowStatusModal(false)}
              className="flex-1 py-2 border border-gray-300 rounded-xl text-sm font-medium hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <p className="text-xs text-gray-500 mb-0.5">{label}</p>
        <p className={`text-sm font-medium ${!value ? 'text-gray-400 italic' : 'text-gray-900'} capitalize`}>
          {value || 'Not provided'}
        </p>
      </div>
    </div>
  );
}
