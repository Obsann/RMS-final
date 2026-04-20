import React, { useState, useEffect, useContext } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import { AuthContext } from '../../App';
import { toast } from 'sonner';
import {
  Loader2, IdCard, FileText, Users, MessageSquare, Archive, Settings,
  Briefcase, Search, Eye, CheckCircle, XCircle, Clock, AlertCircle,
  ChevronRight, Filter, RefreshCw, Plus, Trash2, Edit, Download,
  Shield, User, MapPin, Phone, Calendar, BarChart2, AlertTriangle
} from 'lucide-react';
import { getMeAPI, api } from '../../utils/api';

// ─── Category config ────────────────────────────────────────────────────────
const CATEGORIES = {
  'ID & Registration': {
    icon: IdCard, color: 'blue',
    description: 'Process Digital ID requests, verify resident identities, and manage FIN records.',
    gradient: 'from-blue-600 to-cyan-500',
  },
  'Document Processing': {
    icon: FileText, color: 'emerald',
    description: 'Handle document requests, generate certificates and letters, track processing status.',
    gradient: 'from-emerald-600 to-teal-500',
  },
  'Resident Services': {
    icon: Users, color: 'violet',
    description: 'Manage service requests from residents, handle appointments, and provide support.',
    gradient: 'from-violet-600 to-purple-500',
  },
  'Complaint Handling': {
    icon: MessageSquare, color: 'orange',
    description: 'Receive, triage, and resolve complaints from residents and community members.',
    gradient: 'from-orange-600 to-red-500',
  },
  'Records Management': {
    icon: Archive, color: 'amber',
    description: 'Maintain archives, manage record retention, and ensure data integrity.',
    gradient: 'from-amber-600 to-yellow-500',
  },
  'IT & Systems': {
    icon: Settings, color: 'slate',
    description: 'Monitor system health, resolve technical issues, and manage user accounts.',
    gradient: 'from-slate-600 to-gray-500',
  },
};

const STATUS_STYLES = {
  pending: 'text-yellow-700 bg-yellow-50 border-yellow-200',
  'in-progress': 'text-blue-700 bg-blue-50 border-blue-200',
  processing: 'text-purple-700 bg-purple-50 border-purple-200',
  approved: 'text-green-700 bg-green-50 border-green-200',
  completed: 'text-green-700 bg-green-50 border-green-200',
  resolved: 'text-green-700 bg-green-50 border-green-200',
  rejected: 'text-red-700 bg-red-50 border-red-200',
  revoked: 'text-red-700 bg-red-50 border-red-200',
  assigned: 'text-indigo-700 bg-indigo-50 border-indigo-200',
};

export default function EmployeeWorkspace() {
  const { user } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await getMeAPI();
        setProfile(res.user || res);
      } catch { /* fallback to context */ }
      finally { setLoading(false); }
    })();
  }, []);

  const jobCategory = profile?.jobCategory || user?.jobCategory || '';
  const catConfig = CATEGORIES[jobCategory];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-gray-600">Loading workspace...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!jobCategory || !catConfig) {
    return (
      <DashboardLayout>
        <div className="max-w-xl mx-auto text-center py-16">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Briefcase className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">No Workspace Assigned</h1>
          <p className="text-gray-600 mb-6">
            Your administrator has not assigned a job category to your account yet.
            Once assigned, your personalized workspace with task-specific tools will appear here.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
            <AlertCircle className="w-4 h-4" /> Contact your administrator
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const Icon = catConfig.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Workspace Header */}
        <div className={`bg-gradient-to-r ${catConfig.gradient} rounded-2xl p-6 text-white shadow-lg`}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Icon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{jobCategory}</h1>
              <p className="text-white/80 text-sm mt-0.5">{catConfig.description}</p>
            </div>
          </div>
        </div>

        {/* Dynamic Workspace Panel */}
        {jobCategory === 'ID & Registration' && <IDRegistrationPanel />}
        {jobCategory === 'Document Processing' && <DocumentProcessingPanel />}
        {jobCategory === 'Resident Services' && <ResidentServicesPanel />}
        {jobCategory === 'Complaint Handling' && <ComplaintHandlingPanel />}
        {jobCategory === 'Records Management' && <RecordsManagementPanel />}
        {jobCategory === 'IT & Systems' && <ITSystemsPanel />}
      </div>
    </DashboardLayout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. ID & REGISTRATION
// ─────────────────────────────────────────────────────────────────────────────
function IDRegistrationPanel() {
  const [ids, setIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  const fetchIds = async () => {
    try {
      setLoading(true);
      const data = await api('/digital-id?limit=100');
      setIds(data.digitalIds || []);
    } catch { toast.error('Failed to load ID requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchIds(); }, []);

  const handleAction = async (id, action) => {
    try {
      if (action === 'approve') {
        await api(`/digital-id/${id}/approve`, { method: 'POST' });
        toast.success('Digital ID approved!');
      } else if (action === 'reject') {
        await api(`/digital-id/${id}/revoke`, { method: 'POST', body: JSON.stringify({ reason: 'Rejected by ID officer' }) });
        toast.success('Digital ID rejected');
      }
      fetchIds();
      setShowDetail(false);
    } catch (err) { toast.error(err.message || 'Action failed'); }
  };

  const filtered = ids.filter(d => {
    const matchSearch = (d.user?.username || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.idNumber || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || d.status === filter;
    return matchSearch && matchFilter;
  });

  const stats = {
    total: ids.length,
    pending: ids.filter(d => d.status === 'pending').length,
    approved: ids.filter(d => d.status === 'approved').length,
  };

  return (
    <>
      <StatsRow stats={[
        { label: 'Total IDs', value: stats.total, icon: <IdCard className="w-5 h-5" />, color: 'blue' },
        { label: 'Pending Review', value: stats.pending, icon: <Clock className="w-5 h-5" />, color: 'yellow' },
        { label: 'Approved', value: stats.approved, icon: <CheckCircle className="w-5 h-5" />, color: 'green' },
      ]} />

      <ListPanel
        title="Digital ID Requests"
        icon={<IdCard className="w-5 h-5 text-blue-600" />}
        loading={loading}
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        filterOptions={['all', 'pending', 'approved', 'revoked']}
        onRefresh={fetchIds}
        emptyText="No Digital ID requests found."
        items={filtered}
        renderItem={(item) => (
          <div key={item._id} className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shrink-0 font-bold text-blue-700">
                {(item.user?.username || 'R').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{item.user?.username || 'Unknown'}</p>
                <p className="text-xs text-gray-500">{item.idNumber || 'No FIN'} · {item.user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {item.livenessCheck && (
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${item.livenessCheck.passed ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'}`}>
                  {item.livenessCheck.passed ? 'Live ✓' : 'Liveness ✗'}
                </span>
              )}
              <StatusBadge status={item.status} />
              <button onClick={() => { setSelected(item); setShowDetail(true); }} className="p-2 hover:bg-blue-50 rounded-lg text-blue-600"><Eye className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      />

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Digital ID Request" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-700 text-xl">
                {(selected.user?.username || 'R').charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">{selected.user?.username}</h3>
                <p className="text-gray-500 text-sm">{selected.user?.email}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl">
              <InfoField icon={<IdCard className="w-4 h-4" />} label="FIN" value={selected.idNumber || '—'} />
              <InfoField icon={<Phone className="w-4 h-4" />} label="Phone" value={selected.user?.phone || '—'} />
              <InfoField icon={<MapPin className="w-4 h-4" />} label="Address" value={selected.user?.address || '—'} />
              <InfoField icon={<User className="w-4 h-4" />} label="Sex" value={selected.user?.sex || '—'} />
              <InfoField icon={<Calendar className="w-4 h-4" />} label="Requested" value={new Date(selected.createdAt).toLocaleDateString()} />
              <InfoField icon={<Shield className="w-4 h-4" />} label="Status" value={selected.status} />
            </div>
            {selected.livenessCheck && (
              <div className={`p-3 rounded-lg border text-sm ${selected.livenessCheck.passed ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                Liveness: {selected.livenessCheck.passed ? 'Passed' : 'Failed'} {selected.livenessCheck.score != null && `(Score: ${(selected.livenessCheck.score * 100).toFixed(0)}%)`}
              </div>
            )}
            {selected.status === 'pending' && (
              <div className="flex gap-3 pt-2">
                <button onClick={() => handleAction(selected._id, 'approve')} className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Approve</button>
                <button onClick={() => handleAction(selected._id, 'reject')} className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm flex items-center justify-center gap-2"><XCircle className="w-4 h-4" /> Reject</button>
              </div>
            )}
            <button onClick={() => setShowDetail(false)} className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">Close</button>
          </div>
        )}
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. DOCUMENT PROCESSING
// ─────────────────────────────────────────────────────────────────────────────
function DocumentProcessingPanel() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [response, setResponse] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api('/requests?limit=200');
      // Filter requests that relate to documents
      const docReqs = (data.requests || []).filter(r =>
        ['Maintenance', 'Other', 'Cleaning'].includes(r.category) === false
      );
      setRequests(data.requests || []);
    } catch { toast.error('Failed to load requests'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRespond = async () => {
    if (!selected || !response.trim()) return;
    try {
      await api(`/requests/${selected._id}/respond`, { method: 'PUT', body: JSON.stringify({ message: response }) });
      toast.success('Response sent!');
      setShowDetail(false);
      setResponse('');
      fetchData();
    } catch (err) { toast.error(err.message || 'Failed to respond'); }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await api(`/requests/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
      toast.success(`Status updated to ${status}`);
      fetchData();
      setShowDetail(false);
    } catch (err) { toast.error(err.message || 'Failed to update'); }
  };

  const filtered = requests.filter(r => {
    const matchSearch = (r.subject || '').toLowerCase().includes(search.toLowerCase()) ||
      (r.user?.username || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || r.status === filter;
    return matchSearch && matchFilter;
  });

  return (
    <>
      <StatsRow stats={[
        { label: 'Total Requests', value: requests.length, icon: <FileText className="w-5 h-5" />, color: 'emerald' },
        { label: 'Pending', value: requests.filter(r => r.status === 'pending').length, icon: <Clock className="w-5 h-5" />, color: 'yellow' },
        { label: 'Completed', value: requests.filter(r => r.status === 'completed').length, icon: <CheckCircle className="w-5 h-5" />, color: 'green' },
      ]} />

      <ListPanel
        title="Document & Request Queue"
        icon={<FileText className="w-5 h-5 text-emerald-600" />}
        loading={loading}
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        filterOptions={['all', 'pending', 'in-progress', 'completed']}
        onRefresh={fetchData}
        emptyText="No document requests found."
        items={filtered}
        renderItem={(item) => (
          <div key={item._id} className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{item.subject}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.user?.username || 'Unknown'} · {item.category} · {new Date(item.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <StatusBadge status={item.status} />
              <button onClick={() => { setSelected(item); setShowDetail(true); setResponse(''); }} className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600"><Eye className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      />

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Request Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-xl">
              <h3 className="font-bold text-gray-900">{selected.subject}</h3>
              <p className="text-gray-600 text-sm mt-1">{selected.description}</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">{selected.category}</span>
                <StatusBadge status={selected.status} />
                {selected.priority && <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded capitalize">{selected.priority}</span>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Send Response</label>
              <textarea value={response} onChange={e => setResponse(e.target.value)} rows={3} placeholder="Write your response to the resident..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none text-sm" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleRespond} disabled={!response.trim()} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 font-medium text-sm">Send Response</button>
              {selected.status !== 'completed' && (
                <button onClick={() => handleUpdateStatus(selected._id, 'completed')} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Complete</button>
              )}
            </div>
            <button onClick={() => setShowDetail(false)} className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">Close</button>
          </div>
        )}
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. RESIDENT SERVICES
// ─────────────────────────────────────────────────────────────────────────────
function ResidentServicesPanel() {
  const [residents, setResidents] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('requests');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [response, setResponse] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [reqData, resData] = await Promise.allSettled([
          api('/requests?limit=200'),
          api('/users?role=resident&limit=200'),
        ]);
        if (reqData.status === 'fulfilled') setRequests(reqData.value.requests || []);
        if (resData.status === 'fulfilled') setResidents(resData.value.users || []);
      } catch { toast.error('Failed to load data'); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleRespond = async () => {
    if (!selected || !response.trim()) return;
    try {
      await api(`/requests/${selected._id}/respond`, { method: 'PUT', body: JSON.stringify({ message: response }) });
      toast.success('Response sent!');
      setShowDetail(false);
      setResponse('');
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const filteredRequests = requests.filter(r =>
    (r.subject || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.user?.username || '').toLowerCase().includes(search.toLowerCase())
  );
  const filteredResidents = residents.filter(r =>
    (r.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <StatsRow stats={[
        { label: 'Total Residents', value: residents.length, icon: <Users className="w-5 h-5" />, color: 'violet' },
        { label: 'Open Requests', value: requests.filter(r => r.status === 'pending').length, icon: <Clock className="w-5 h-5" />, color: 'yellow' },
        { label: 'Resolved', value: requests.filter(r => r.status === 'completed').length, icon: <CheckCircle className="w-5 h-5" />, color: 'green' },
      ]} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {['requests', 'residents'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-medium text-center capitalize transition-colors ${tab === t ? 'text-violet-600 border-b-2 border-violet-600' : 'text-gray-500 hover:text-gray-700'}`}>{t === 'requests' ? 'Service Requests' : 'Resident Directory'}</button>
          ))}
        </div>

        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={tab === 'requests' ? 'Search requests...' : 'Search residents...'} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-violet-500 focus:border-transparent" />
          </div>
        </div>

        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading...</div>
          ) : tab === 'requests' ? (
            filteredRequests.length === 0 ? <EmptyState text="No requests found" /> :
            filteredRequests.map(r => (
              <div key={r._id} className="p-4 hover:bg-gray-50 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate text-sm">{r.subject}</p>
                  <p className="text-xs text-gray-500">{r.user?.username} · {r.category}</p>
                </div>
                <StatusBadge status={r.status} />
                <button onClick={() => { setSelected(r); setShowDetail(true); setResponse(''); }} className="p-1.5 hover:bg-violet-50 rounded text-violet-600"><Eye className="w-4 h-4" /></button>
              </div>
            ))
          ) : (
            filteredResidents.length === 0 ? <EmptyState text="No residents found" /> :
            filteredResidents.map(r => (
              <div key={r._id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                <div className="w-9 h-9 bg-violet-100 rounded-full flex items-center justify-center shrink-0 font-bold text-violet-700 text-sm">{(r.username || 'R').charAt(0).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate">{r.username}</p>
                  <p className="text-xs text-gray-500">{r.email} · Unit: {r.unit || '—'}</p>
                </div>
                <span className="text-xs text-gray-400">{r.phone || '—'}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Service Request" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="p-4 bg-violet-50 rounded-xl border border-violet-100">
              <h3 className="font-bold text-gray-900">{selected.subject}</h3>
              <p className="text-gray-600 text-sm mt-1">{selected.description}</p>
              <div className="flex gap-2 mt-2"><StatusBadge status={selected.status} /><span className="text-xs text-gray-500">{selected.category}</span></div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Respond to Resident</label>
              <textarea value={response} onChange={e => setResponse(e.target.value)} rows={3} placeholder="Type your response..." className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-violet-500" />
            </div>
            <button onClick={handleRespond} disabled={!response.trim()} className="w-full px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 font-medium text-sm">Send Response</button>
            <button onClick={() => setShowDetail(false)} className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Close</button>
          </div>
        )}
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. COMPLAINT HANDLING
// ─────────────────────────────────────────────────────────────────────────────
function ComplaintHandlingPanel() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [response, setResponse] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api('/requests?limit=200');
      setComplaints(data.requests || []);
    } catch { toast.error('Failed to load complaints'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRespond = async () => {
    if (!selected || !response.trim()) return;
    try {
      await api(`/requests/${selected._id}/respond`, { method: 'PUT', body: JSON.stringify({ message: response }) });
      toast.success('Response sent to complainant!');
      setShowDetail(false);
      setResponse('');
      fetchData();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const handleResolve = async (id) => {
    try {
      await api(`/requests/${id}`, { method: 'PUT', body: JSON.stringify({ status: 'completed' }) });
      toast.success('Complaint resolved!');
      fetchData();
      setShowDetail(false);
    } catch (err) { toast.error(err.message || 'Failed to resolve'); }
  };

  const handleEscalate = async (id) => {
    try {
      await api(`/requests/${id}`, { method: 'PUT', body: JSON.stringify({ priority: 'high', status: 'in-progress' }) });
      toast.success('Complaint escalated to high priority');
      fetchData();
    } catch (err) { toast.error(err.message || 'Failed'); }
  };

  const filtered = complaints.filter(c => {
    const matchSearch = (c.subject || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || c.status === filter;
    return matchSearch && matchFilter;
  });

  const priorityBadge = (p) => {
    const cls = { high: 'text-red-700 bg-red-50 border-red-200', medium: 'text-yellow-700 bg-yellow-50 border-yellow-200', low: 'text-green-700 bg-green-50 border-green-200' };
    return <span className={`text-xs px-2 py-0.5 rounded-full border font-medium capitalize ${cls[p] || cls.medium}`}>{p}</span>;
  };

  return (
    <>
      <StatsRow stats={[
        { label: 'Total Complaints', value: complaints.length, icon: <MessageSquare className="w-5 h-5" />, color: 'orange' },
        { label: 'Open', value: complaints.filter(c => c.status === 'pending' || c.status === 'in-progress').length, icon: <AlertTriangle className="w-5 h-5" />, color: 'red' },
        { label: 'Resolved', value: complaints.filter(c => c.status === 'completed').length, icon: <CheckCircle className="w-5 h-5" />, color: 'green' },
      ]} />

      <ListPanel
        title="Complaints Inbox"
        icon={<MessageSquare className="w-5 h-5 text-orange-600" />}
        loading={loading}
        search={search}
        onSearch={setSearch}
        filter={filter}
        onFilter={setFilter}
        filterOptions={['all', 'pending', 'in-progress', 'completed']}
        onRefresh={fetchData}
        emptyText="No complaints found."
        items={filtered}
        renderItem={(item) => (
          <div key={item._id} className="p-5 hover:bg-gray-50 transition-colors flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{item.subject}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.user?.username || 'Anonymous'} · {item.category} · {new Date(item.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {item.priority && priorityBadge(item.priority)}
              <StatusBadge status={item.status} />
              <button onClick={() => { setSelected(item); setShowDetail(true); setResponse(''); }} className="p-2 hover:bg-orange-50 rounded-lg text-orange-600"><Eye className="w-4 h-4" /></button>
            </div>
          </div>
        )}
      />

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Complaint Details" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
              <div className="flex items-start justify-between">
                <h3 className="font-bold text-gray-900">{selected.subject}</h3>
                {selected.priority && priorityBadge(selected.priority)}
              </div>
              <p className="text-gray-600 text-sm mt-2">{selected.description}</p>
              <p className="text-xs text-gray-400 mt-2">From: {selected.user?.username} · {new Date(selected.createdAt).toLocaleDateString()}</p>
            </div>
            {selected.response?.message && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm">
                <p className="font-medium text-blue-900 mb-1">Previous Response:</p>
                <p className="text-blue-800">{selected.response.message}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Your Response</label>
              <textarea value={response} onChange={e => setResponse(e.target.value)} rows={3} placeholder="Respond to the complaint..." className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-orange-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleRespond} disabled={!response.trim()} className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 font-medium text-sm">Send Response</button>
              {selected.status !== 'completed' && (
                <>
                  <button onClick={() => handleResolve(selected._id)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Resolve</button>
                  <button onClick={() => { handleEscalate(selected._id); setShowDetail(false); }} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-sm flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Escalate</button>
                </>
              )}
            </div>
            <button onClick={() => setShowDetail(false)} className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm">Close</button>
          </div>
        )}
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. RECORDS MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
function RecordsManagementPanel() {
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await api('/users?role=resident&limit=500');
        setResidents(data.users || []);
      } catch { toast.error('Failed to load records'); }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = residents.filter(r =>
    (r.username || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (r.unit || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <StatsRow stats={[
        { label: 'Total Records', value: residents.length, icon: <Archive className="w-5 h-5" />, color: 'amber' },
        { label: 'With Digital ID', value: residents.filter(r => r.digitalId?.status === 'approved').length, icon: <IdCard className="w-5 h-5" />, color: 'green' },
        { label: 'Pending Approval', value: residents.filter(r => r.status === 'pending').length, icon: <Clock className="w-5 h-5" />, color: 'yellow' },
      ]} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Archive className="w-5 h-5 text-amber-600" /> Records Archive</h2>
        </div>
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search records by name, email, or unit..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent" />
          </div>
        </div>
        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading...</div>
          ) : filtered.length === 0 ? <EmptyState text="No records found" /> :
          filtered.map(r => (
            <div key={r._id} className="p-4 hover:bg-gray-50 flex items-center gap-4 cursor-pointer" onClick={() => { setSelected(r); setShowDetail(true); }}>
              <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center shrink-0 font-bold text-amber-700 text-sm">{(r.username || 'R').charAt(0).toUpperCase()}</div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm truncate">{r.username}</p>
                <p className="text-xs text-gray-500">{r.email} · Unit: {r.unit || '—'}</p>
              </div>
              <StatusBadge status={r.status} />
              <ChevronRight className="w-4 h-4 text-gray-300" />
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={showDetail} onClose={() => setShowDetail(false)} title="Resident Record" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center font-bold text-amber-700 text-xl">{(selected.username || 'R').charAt(0).toUpperCase()}</div>
              <div><h3 className="font-bold text-lg text-gray-900">{selected.username}</h3><p className="text-gray-500 text-sm">{selected.email}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 rounded-xl">
              <InfoField icon={<User className="w-4 h-4" />} label="Unit" value={selected.unit || '—'} />
              <InfoField icon={<Phone className="w-4 h-4" />} label="Phone" value={selected.phone || '—'} />
              <InfoField icon={<MapPin className="w-4 h-4" />} label="Address" value={selected.address || '—'} />
              <InfoField icon={<User className="w-4 h-4" />} label="Sex" value={selected.sex || '—'} />
              <InfoField icon={<Calendar className="w-4 h-4" />} label="Registered" value={new Date(selected.createdAt).toLocaleDateString()} />
              <InfoField icon={<Shield className="w-4 h-4" />} label="Status" value={selected.status} />
            </div>
            {selected.dependents?.length > 0 && (
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="font-semibold text-sm text-blue-900 mb-2">Household Members ({selected.dependents.length})</p>
                {selected.dependents.map((d, i) => (
                  <p key={i} className="text-sm text-blue-800">{d.name} — {d.relationship}{d.age ? `, ${d.age} yrs` : ''}</p>
                ))}
              </div>
            )}
            <button onClick={() => setShowDetail(false)} className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium">Close</button>
          </div>
        )}
      </Modal>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. IT & SYSTEMS
// ─────────────────────────────────────────────────────────────────────────────
function ITSystemsPanel() {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('issues');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [userData, reqData] = await Promise.allSettled([
          api('/users?limit=500'),
          api('/requests?limit=200'),
        ]);
        if (userData.status === 'fulfilled') setUsers(userData.value.users || []);
        if (reqData.status === 'fulfilled') setRequests(reqData.value.requests || []);
      } catch { toast.error('Failed to load data'); }
      finally { setLoading(false); }
    })();
  }, []);

  const roleCount = (role) => users.filter(u => u.role === role).length;
  const techRequests = requests.filter(r => (r.category || '').toLowerCase().includes('it') || (r.category || '').toLowerCase().includes('system'));

  return (
    <>
      <StatsRow stats={[
        { label: 'Total Users', value: users.length, icon: <Users className="w-5 h-5" />, color: 'slate' },
        { label: 'Residents', value: roleCount('resident'), icon: <User className="w-5 h-5" />, color: 'blue' },
        { label: 'Employees', value: roleCount('employee') + roleCount('special-employee'), icon: <Briefcase className="w-5 h-5" />, color: 'green' },
      ]} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex border-b border-gray-200">
          {['issues', 'accounts'].map(t => (
            <button key={t} onClick={() => setTab(t)} className={`flex-1 py-3 text-sm font-medium text-center capitalize transition-colors ${tab === t ? 'text-slate-700 border-b-2 border-slate-600' : 'text-gray-500 hover:text-gray-700'}`}>{t === 'issues' ? 'Tech Requests' : 'User Accounts'}</button>
          ))}
        </div>
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 focus:border-transparent" />
          </div>
        </div>
        <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading...</div>
          ) : tab === 'issues' ? (
            requests.length === 0 ? <EmptyState text="No tech requests found" /> :
            requests.filter(r => (r.subject || '').toLowerCase().includes(search.toLowerCase())).map(r => (
              <div key={r._id} className="p-4 hover:bg-gray-50 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate text-sm">{r.subject}</p>
                  <p className="text-xs text-gray-500">{r.user?.username} · {r.category}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>
            ))
          ) : (
            users.filter(u => (u.username || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase())).length === 0 ? <EmptyState text="No users found" /> :
            users.filter(u => (u.username || '').toLowerCase().includes(search.toLowerCase()) || (u.email || '').toLowerCase().includes(search.toLowerCase())).slice(0, 50).map(u => (
              <div key={u._id} className="p-4 hover:bg-gray-50 flex items-center gap-4">
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center shrink-0 font-bold text-slate-700 text-sm">{(u.username || 'U').charAt(0).toUpperCase()}</div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 text-sm truncate">{u.username}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded capitalize">{u.role?.replace('-', ' ')}</span>
                <StatusBadge status={u.status} />
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function StatsRow({ stats }) {
  const bgMap = { blue: 'bg-blue-50', green: 'bg-green-50', yellow: 'bg-yellow-50', red: 'bg-red-50', emerald: 'bg-emerald-50', violet: 'bg-violet-50', orange: 'bg-orange-50', amber: 'bg-amber-50', slate: 'bg-slate-50', indigo: 'bg-indigo-50' };
  const txtMap = { blue: 'text-blue-600', green: 'text-green-600', yellow: 'text-yellow-600', red: 'text-red-600', emerald: 'text-emerald-600', violet: 'text-violet-600', orange: 'text-orange-600', amber: 'text-amber-600', slate: 'text-slate-600', indigo: 'text-indigo-600' };
  const borderMap = { blue: 'border-blue-200', green: 'border-green-200', yellow: 'border-yellow-200', red: 'border-red-200', emerald: 'border-emerald-200', violet: 'border-violet-200', orange: 'border-orange-200', amber: 'border-amber-200', slate: 'border-slate-200', indigo: 'border-indigo-200' };

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map((s, i) => (
        <div key={i} className={`bg-white p-5 rounded-xl shadow-sm border ${borderMap[s.color] || 'border-gray-200'}`}>
          <div className="flex items-start justify-between">
            <div><p className="text-sm font-medium text-gray-500">{s.label}</p><p className="text-2xl font-bold text-gray-900 mt-1">{s.value}</p></div>
            <div className={`p-3 rounded-xl ${bgMap[s.color] || 'bg-gray-50'} ${txtMap[s.color] || 'text-gray-600'}`}>{s.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ListPanel({ title, icon, loading, search, onSearch, filter, onFilter, filterOptions, onRefresh, emptyText, items, renderItem }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 flex items-center gap-2">{icon} {title}</h2>
        <button onClick={onRefresh} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500" title="Refresh"><RefreshCw className="w-4 h-4" /></button>
      </div>
      <div className="p-4 border-b border-gray-100 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={search} onChange={e => onSearch(e.target.value)} placeholder="Search..." className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
        </div>
        <select value={filter} onChange={e => onFilter(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 capitalize">
          {filterOptions.map(o => <option key={o} value={o}>{o === 'all' ? 'All Status' : o.replace('-', ' ')}</option>)}
        </select>
      </div>
      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />Loading...</div>
        ) : items.length === 0 ? <EmptyState text={emptyText} /> :
        items.map(renderItem)}
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cls = STATUS_STYLES[status] || 'text-gray-600 bg-gray-50 border-gray-200';
  return <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium capitalize ${cls}`}>{(status || 'unknown').replace('-', ' ')}</span>;
}

function InfoField({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 mt-0.5">{icon}</div>
      <div><p className="text-xs text-gray-500">{label}</p><p className="text-sm font-medium text-gray-900 capitalize">{value}</p></div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="p-10 text-center">
      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3"><Search className="w-6 h-6 text-gray-300" /></div>
      <p className="text-gray-500 text-sm">{text}</p>
    </div>
  );
}
