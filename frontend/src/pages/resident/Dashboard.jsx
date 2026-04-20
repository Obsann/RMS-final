import React, { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, IdCard, User, FileText, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { getMeAPI, getMyDigitalId } from '../../utils/api';

const ANNOUNCEMENTS_PER_PAGE = 2;

function getMemberSinceDate(user) {
  if (!user) return new Date();
  if (user.createdAt) return new Date(user.createdAt);
  if (user._id) return new Date(parseInt(user._id.substring(0, 8), 16) * 1000);
  return new Date();
}

export default function ResidentDashboard() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [digitalId, setDigitalId] = useState(null);
  const [announcementPage, setAnnouncementPage] = useState(0);

  useEffect(() => {
    async function loadData() {
      try {
        const meRes = await getMeAPI();
        setUserData(meRes.user || meRes);
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
    { label: 'Report an Issue', icon: <AlertTriangle className="w-6 h-6" />, path: '/resident/requests', color: 'bg-orange-500' },
    { label: 'View Digital ID', icon: <IdCard className="w-6 h-6" />, path: '/resident/digital-id', color: 'bg-purple-500' },
    { label: 'Manage Profile', icon: <User className="w-6 h-6" />, path: '/resident/profile', color: 'bg-green-500' },
  ];

  const announcements = [
    { id: 1, title: 'Water Supply Interruption', date: '2026-02-26', content: 'Water supply will be interrupted on Feb 28 from 8AM–12PM for maintenance.' },
    { id: 2, title: 'Parking Policy Update', date: '2026-02-24', content: 'New parking guidelines are effective from March 1st. Please review the notice.' },
    { id: 3, title: 'Holiday Office Hours', date: '2026-02-20', content: 'Management office will observe reduced hours during the upcoming public holiday.' },
    { id: 4, title: 'Community Clean-Up Event', date: '2026-02-18', content: 'Join us for a community clean-up this Saturday at 9AM. Meet at the main gate.' },
    { id: 5, title: 'Monthly Rent Reminder', date: '2026-02-15', content: 'Rent payments for March are due by the 5th. Late fees apply after the deadline.' },
  ];

  const totalAnnouncementPages = Math.ceil(announcements.length / ANNOUNCEMENTS_PER_PAGE);
  const paginatedAnnouncements = announcements.slice(
    announcementPage * ANNOUNCEMENTS_PER_PAGE,
    (announcementPage + 1) * ANNOUNCEMENTS_PER_PAGE
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-xl p-8">
          <h1 className="text-white mb-2">እንኳን ደህና መጡ! — Welcome Back!</h1>
          <p className="text-blue-100">Your resident management dashboard</p>
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p className="text-blue-200">Household Members</p>
              <p className="text-white">{userData?.dependents?.length || 0}</p>
            </div>
            <div>
              <p className="text-blue-200">ID Status</p>
              <p className="text-white capitalize">{digitalId?.status || 'Not Set'}</p>
            </div>
            <div>
              <p className="text-blue-200">Member Since</p>
              <p className="text-white">
                {getMemberSinceDate(userData).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

        {/* Announcements — Full Width with Pagination */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex items-center justify-between">
            <h2>Announcements</h2>
            <span className="text-sm text-gray-500">
              Page {announcementPage + 1} of {totalAnnouncementPages}
            </span>
          </div>
          <div className="divide-y divide-gray-200">
            {paginatedAnnouncements.map((announcement) => (
              <div key={announcement.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-gray-900 font-medium mb-1">{announcement.title}</p>
                    <p className="text-gray-600 mb-2">{announcement.content}</p>
                    <p className="text-gray-500 text-sm">{announcement.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Pagination controls */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button
              disabled={announcementPage === 0}
              onClick={() => setAnnouncementPage((p) => Math.max(0, p - 1))}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalAnnouncementPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setAnnouncementPage(i)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    i === announcementPage
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              disabled={announcementPage >= totalAnnouncementPages - 1}
              onClick={() => setAnnouncementPage((p) => Math.min(totalAnnouncementPages - 1, p + 1))}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Household Members Card — Full Width */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8 text-green-600" />
            <h3>Household Members</h3>
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
              <p className="text-sm text-gray-500">No household members registered.</p>
            )}
            <button
              onClick={() => navigate('/resident/profile')}
              className="text-blue-600 hover:text-blue-700 mt-2"
            >
              Manage Household
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
