import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Modal from '../../components/ui/Modal';
import StatusBadge from '../../components/ui/StatusBadge';
import { IdCard, CheckCircle, Eye, ArrowRight, User, Calendar, QrCode, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { getDigitalIds, updateDigitalId, getUsers } from '../../utils/api';

export default function SpecialEmployeeDigitalID() {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedReq, setSelectedReq] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [assignData, setAssignData] = useState({ employeeId: '', dueDate: '' });
  const [activeTab, setActiveTab] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [idData, empData] = await Promise.all([
        getDigitalIds(),
        getUsers('role=employee')
      ]);
      setRequests(idData.digitalIds || idData || []);
      setEmployees(empData.users || []);
    } catch (error) {
      toast.error('Failed to load Digital ID requests');
    } finally {
      setLoading(false);
    }
  };

  const filtered = activeTab === 'all'
    ? requests
    : requests.filter(r => activeTab === 'approved' ? r.status === 'approved' || r.status === 'processing' : r.status === activeTab);

  const handleAssign = async () => {
    if (!assignData.employeeId || !assignData.dueDate) {
      toast.error('Please select an employee and set a due date');
      return;
    }
    setSubmitting(true);
    try {
      // The assign endpoint currently targets admins, but special employees have permission route-wise.
      // If we only have updateDigitalId:
      await updateDigitalId(selectedReq._id, {
        status: 'approved', // keep it approved
        assignedTo: assignData.employeeId,
        issueDate: assignData.dueDate // store target print date
      });
      toast.success('ID printing assigned to employee');
      setShowAssignModal(false);
      setAssignData({ employeeId: '', dueDate: '' });
      fetchData();
    } catch (err) {
      toast.error(err.message || 'Failed to assign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkIssued = async (req) => {
    setSubmitting(true);
    try {
      await updateDigitalId(req._id, { status: 'issued' });
      toast.success(`Digital ID marked as issued!`);
      setShowDetailModal(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const tabs = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: 'Pending Approval' },
    { key: 'approved', label: 'In Progress' },
    { key: 'issued', label: 'Issued' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const statusColors = {
    pending: 'border-yellow-200',
    approved: 'border-blue-200',
    processing: 'border-blue-200',
    issued: 'border-green-200',
    rejected: 'border-red-200'
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1>Digital ID System</h1>
          <p className="text-gray-600 mt-1">Manage Digital ID requests — assign to employees and track issuance</p>
        </div>

        {/* Workflow */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <p className="text-gray-900 mb-3 text-sm font-medium">Your Role in Digital ID Workflow</p>
          <div className="flex flex-wrap items-center gap-3">
            {[
              { label: 'Admin approves request', color: 'bg-blue-100 text-blue-700' },
              null,
              { label: 'You receive approved request', color: 'bg-indigo-100 text-indigo-700' },
              null,
              { label: 'You assign to Employee', color: 'bg-yellow-100 text-yellow-700' },
              null,
              { label: 'Employee issues the ID', color: 'bg-green-100 text-green-700' },
            ].map((item, idx) =>
              item ? (
                <span key={idx} className={`px-3 py-1.5 rounded-lg text-xs font-medium border border-opacity-20 ${item.color}`}>{item.label}</span>
              ) : (
                <ArrowRight key={idx} className="w-4 h-4 text-blue-400" />
              )
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-200"><p className="text-gray-500 text-sm mb-1">Total</p><p className="text-gray-900 text-2xl font-bold">{requests.length}</p></div>
          <div className="bg-yellow-50 rounded-xl p-5 shadow-sm border border-yellow-200"><p className="text-yellow-700 text-sm font-medium mb-1">Pending Approval</p><p className="text-gray-900 text-2xl font-bold">{requests.filter(r => r.status === 'pending').length}</p></div>
          <div className="bg-blue-50 rounded-xl p-5 shadow-sm border border-blue-200"><p className="text-blue-700 text-sm font-medium mb-1">In Progress</p><p className="text-gray-900 text-2xl font-bold">{requests.filter(r => r.status === 'approved' || r.status === 'processing').length}</p></div>
          <div className="bg-green-50 rounded-xl p-5 shadow-sm border border-green-200"><p className="text-green-700 text-sm font-medium mb-1">Issued</p><p className="text-gray-900 text-2xl font-bold">{requests.filter(r => r.status === 'issued').length}</p></div>
        </div>

        {/* Tabs + List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200 px-6 flex gap-6 flex-wrap">
            {tabs.map(tab => (
              <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                className={`py-4 border-b-2 transition-all font-medium text-sm ${activeTab === tab.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-900'}`}>
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.key ? 'bg-blue-100' : 'bg-gray-100'}`}>
                  {tab.key === 'all' ? requests.length : tab.key === 'approved' ? requests.filter(r => r.status === 'approved' || r.status === 'processing').length : requests.filter(r => r.status === tab.key).length}
                </span>
              </button>
            ))}
          </div>

          <div className="divide-y divide-gray-100">
            {filtered.map(req => (
              <div key={req._id} className={`p-5 hover:bg-gray-50 transition-colors border-l-4 ${statusColors[req.status] || 'border-gray-200'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-semibold text-lg">{(req.resident?.username || 'U').charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">{req.resident?.username || 'Unknown Resident'}</p>
                      <p className="text-gray-500 text-sm">Unit {req.resident?.unit || '—'} • {req.resident?.phone || '—'}</p>
                      <p className="text-gray-400 text-xs mt-1">Requested: {new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <StatusBadge status={req.status} size="sm" />

                    {req.assignedTo && (
                      <div className="flex items-center gap-1.5 text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-200">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-sm font-medium">{req.assignedTo.username || req.assignedTo}</span>
                      </div>
                    )}
                    {(req.status === 'issued') && req.idNumber && (
                      <div className="flex items-center gap-1.5 text-green-700 bg-green-50 px-2.5 py-1 rounded-md border border-green-200">
                        <QrCode className="w-3.5 h-3.5" />
                        <span className="text-sm font-medium uppercase">{req.idNumber}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => { setSelectedReq(req); setShowDetailModal(true); }}
                        className="p-2 hover:bg-blue-50 rounded-lg text-blue-600 transition-colors" title="View details"
                      >
                        <Eye className="w-4.5 h-4.5" />
                      </button>

                      {/* Special Employee only assigns if Admin has approved */}
                      {req.status === 'approved' && !req.assignedTo && (
                        <button
                          onClick={() => { setSelectedReq(req); setAssignData({ employeeId: '', dueDate: '' }); setShowAssignModal(true); }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium shadow-sm transition-colors"
                        >
                          <ArrowRight className="w-3.5 h-3.5" /> Assign Task
                        </button>
                      )}

                      {/* Mark Issued if assigned and not yet issued */}
                      {req.status === 'approved' && req.assignedTo && (
                        <button
                          onClick={() => handleMarkIssued(req)} disabled={submitting}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium shadow-sm transition-colors disabled:opacity-50"
                        >
                          {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                          Mark Issued
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="p-12 text-center border-l-4 border-transparent">
                <IdCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No ID requests found in this status.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Digital ID Request Details" size="md">
        {selectedReq && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 border border-blue-200 rounded-full flex items-center justify-center shrink-0">
                <span className="text-blue-600 text-2xl font-bold">{(selectedReq.resident?.username || 'U').charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h3 className="text-gray-900 text-xl font-bold">{selectedReq.resident?.username || 'Unknown'}</h3>
                <p className="text-gray-600">{selectedReq.resident?.email}</p>
                <p className="text-gray-600">Unit {selectedReq.resident?.unit || '—'}</p>
              </div>
            </div>

            {selectedReq.status === 'pending' && (
              <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm">This request is pending Admin approval. You will be able to assign it to an employee once approved.</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 border border-gray-100 rounded-xl text-sm">
              <div><label className="block text-gray-500 mb-1 text-xs uppercase font-semibold">Request Date</label><p className="text-gray-900 font-medium">{new Date(selectedReq.createdAt).toLocaleDateString()}</p></div>
              <div><label className="block text-gray-500 mb-1 text-xs uppercase font-semibold">Status</label><div className="mt-0.5"><StatusBadge status={selectedReq.status} size="sm" /></div></div>

              {selectedReq.idType && <div><label className="block text-gray-500 mb-1 text-xs uppercase font-semibold">ID Type</label><p className="text-gray-900 font-medium uppercase">{selectedReq.idType}</p></div>}

              {selectedReq.assignedTo && <div><label className="block text-gray-500 mb-1 text-xs uppercase font-semibold">Assigned To</label><p className="text-gray-900 font-medium flex items-center gap-1.5"><User className="w-3.5 h-3.5 text-gray-400" /> {selectedReq.assignedTo?.username || selectedReq.assignedTo}</p></div>}
              {selectedReq.issueDate && <div><label className="block text-gray-500 mb-1 text-xs uppercase font-semibold">Target Issue Date</label><p className="text-gray-900 font-medium">{new Date(selectedReq.issueDate).toLocaleDateString()}</p></div>}

              {(selectedReq.status === 'issued') && selectedReq.idNumber && (
                <div className="col-span-2 bg-green-50 border border-green-200 p-3 rounded-lg mt-2 flex items-center justify-between">
                  <div>
                    <label className="block text-green-800 mb-0.5 text-xs uppercase font-semibold">ID Number</label>
                    <p className="text-green-900 font-mono text-lg font-bold">{selectedReq.idNumber}</p>
                  </div>
                  <QrCode className="w-8 h-8 text-green-600 opacity-50" />
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              {selectedReq.status === 'approved' && !selectedReq.assignedTo && (
                <button onClick={() => { setShowDetailModal(false); setShowAssignModal(true); }} className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors">Assign to Employee</button>
              )}
              {selectedReq.status === 'approved' && selectedReq.assignedTo && (
                <button onClick={() => handleMarkIssued(selectedReq)} disabled={submitting} className="flex-1 px-4 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50">Mark ID Issued</button>
              )}
              <button onClick={() => setShowDetailModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors">Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Employee Modal */}
      <Modal isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} title="Assign Employee Setup" size="md">
        {selectedReq && (
          <div className="space-y-5">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-gray-900 text-sm">Assigning ID request for: <strong>{selectedReq.resident?.username || 'Unknown'}</strong> (Unit {selectedReq.resident?.unit || '—'})</p>
            </div>
            <div>
              <label className="block text-gray-900 font-semibold mb-3 text-sm">Select Printing/Issuance Staff *</label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {employees.filter(e => e.status !== 'rejected').map(emp => (
                  <label key={emp._id}
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${assignData.employeeId === emp._id ? 'border-blue-500 bg-blue-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300 bg-white'}`}>
                    <input type="radio" name="empId" className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      checked={assignData.employeeId === emp._id}
                      onChange={() => setAssignData({ ...assignData, employeeId: emp._id })} />
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                      <span className="text-green-700 font-bold">{(emp.username || 'E').charAt(0).toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-gray-900 font-medium">{emp.username}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{emp.jobCategory || 'General Employee'}</p>
                    </div>
                  </label>
                ))}
                {employees.length === 0 && <p className="text-sm text-gray-500 italic">No staff available.</p>}
              </div>
            </div>
            <div>
              <label className="block text-gray-900 font-semibold mb-2 text-sm">Target Issue Date *</label>
              <input type="date" value={assignData.dueDate} onChange={e => setAssignData({ ...assignData, dueDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-3 pt-3 border-t">
              <button onClick={handleAssign} disabled={submitting || !assignData.employeeId || !assignData.dueDate}
                className="flex-1 px-4 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50">
                {submitting ? 'Assigning...' : 'Confirm Assignment'}
              </button>
              <button onClick={() => setShowAssignModal(false)} className="flex-1 px-4 py-2.5 border border-gray-300 font-medium rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
