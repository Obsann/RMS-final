import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { Wrench, MessageSquare, IdCard, User, FileText, Users, Home } from 'lucide-react';
import StatusBadge from '../../components/ui/StatusBadge';
import { getMeAPI, getRequests, getMyDigitalId } from '../../utils/api';

export default function ResidentDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [digitalId, setDigitalId] = useState(null);
  const [myRequests, setMyRequests] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, reqRes] = await Promise.all([
          getMeAPI(),
          getRequests('?sort=-createdAt&limit=5')
        ]);
        setUserData(meRes.user || meRes);
        setMyRequests(reqRes.requests || reqRes.data || reqRes);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
      try {
        const did = await getMyDigitalId();
        setDigitalId(did);
      } catch (err) {
        // 404 is fine if no DID exists
        setDigitalId(null);
      }
    }
    loadData();
  }, []);

  const quickActions = [
    { label: 'Submit Request', icon: <Wrench className="w-6 h-6" />, path: '/resident/requests', color: 'bg-blue-500' },
    { label: 'Submit Complaint', icon: <MessageSquare className="w-6 h-6" />, path: '/resident/requests', color: 'bg-orange-500' },
    { label: 'View Digital ID', icon: <IdCard className="w-6 h-6" />, path: '/resident/digital-id', color: 'bg-purple-500' },
    { label: 'Manage Profile', icon: <User className="w-6 h-6" />, path: '/resident/profile', color: 'bg-green-500' },
  ];



  const announcements = [
    { id: 1, title: 'Water Supply Interruption', date: '2026-02-26', content: 'Water supply will be interrupted on Feb 28 from 8AM–12PM for maintenance.' },
    { id: 2, title: 'Parking Policy Update', date: '2026-02-24', content: 'New parking guidelines are effective from March 1st. Please review the notice.' },
    { id: 3, title: 'Holiday Office Hours', date: '2026-02-20', content: 'Management office will observe reduced hours during the upcoming public holiday.' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-8">
          <h1 className="text-white mb-2">እንኳን ደህና መጡ! — Welcome Back!</h1>
          <p className="text-blue-100">Your resident management dashboard</p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-blue-200">Unit</p>
              <p className="text-white">{userData?.unit || 'N/A'}</p>
            </div>
            <div>
              <p className="text-blue-200">Active Requests</p>
              <p className="text-white">{myRequests.filter((r) => r.status && r.status !== 'completed').length}</p>
            </div>
            <div>
              <p className="text-blue-200">Dependents</p>
              <p className="text-white">{userData?.dependents?.length || 0}</p>
            </div>
            <div>
              <p className="text-blue-200">ID Status</p>
              <p className="text-white capitalize">{digitalId?.status || 'Not Set'}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow text-center"
              >
                <div className={`${action.color} text-white w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3`}>
                  {action.icon}
                </div>
                <p className="text-gray-900">{action.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* My Requests */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2>My Requests</h2>
              <button
                onClick={() => navigate('/resident/requests')}
                className="text-blue-600 hover:text-blue-700"
              >
                View All
              </button>
            </div>
            <div className="divide-y divide-gray-200">
              {myRequests.map((request, i) => (
                <div key={request._id || i} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-gray-900 mb-1">{request.subject || request.title || 'Support Request'}</p>
                      <p className="text-gray-600 capitalize">{request.type === 'maintenance' ? 'request' : request.type}</p>
                    </div>
                    <StatusBadge status={request.status} size="sm" />
                  </div>
                  <p className="text-gray-500">{new Date(request.createdAt).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Announcements */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2>Announcements</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {announcements.map((announcement) => (
                <div key={announcement.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <p className="text-gray-900 mb-1">{announcement.title}</p>
                      <p className="text-gray-600 mb-2">{announcement.content}</p>
                      <p className="text-gray-500">{announcement.date}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Home className="w-8 h-8 text-blue-600" />
              <h3>Unit Information</h3>
            </div>
            <div className="space-y-2 text-gray-600">
              <p>Unit: {userData?.unit || 'N/A'}</p>
              <p>Joined Date: {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown'}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-8 h-8 text-green-600" />
              <h3>Family Members</h3>
            </div>
            <div className="space-y-2">
              {userData?.dependents?.length > 0 ? (
                userData.dependents.map((dep, idx) => (
                  <div key={idx} className="flex items-center justify-between border-b pb-2 last:border-0">
                    <span className="text-gray-900">{dep.name}</span>
                    <span className="text-gray-600 capitalize">{dep.relationship}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500">No family members registered.</p>
              )}
              <button
                onClick={() => navigate('/resident/profile')}
                className="text-blue-600 hover:text-blue-700 mt-2"
              >
                Manage Dependents
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
