import React, { useState, useContext, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../../App';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Building2,
  LayoutDashboard,
  Users,
  UserCog,
  UserCheck,
  MessageSquare,
  IdCard,
  Bell,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Home,
  ClipboardList,
  Globe,
  Lock,
} from 'lucide-react';

export default function DashboardLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang, toggleLanguage } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bellCount, setBellCount] = useState(0);

  // Fetch real unread notification count from API
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const token = localStorage.getItem('rms_token');
        if (!token) return;
        const res = await fetch('/api/notifications?limit=1', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setBellCount(data.unreadCount ?? 0);
        }
      } catch (e) { /* silent */ }
    };
    load();
    // Refresh every 90 seconds
    const interval = setInterval(load, 90000);
    return () => clearInterval(interval);
  }, [user]);

  const adminMenuItems = [
    { labelKey: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/admin/dashboard' },
    { labelKey: 'residents', icon: <Users className="w-5 h-5" />, path: '/admin/residents' },
    { labelKey: 'employees', icon: <UserCog className="w-5 h-5" />, path: '/admin/employees' },
    { labelKey: 'specialEmployees', icon: <UserCheck className="w-5 h-5" />, path: '/admin/special-employees' },
    { labelKey: 'requestsComplaints', icon: <MessageSquare className="w-5 h-5" />, path: '/admin/requests' },
    { labelKey: 'digitalIdSystem', icon: <IdCard className="w-5 h-5" />, path: '/admin/digital-id' },
    { labelKey: 'notifications', icon: <Bell className="w-5 h-5" />, path: '/admin/notifications' },
    { labelKey: 'reports', icon: <FileText className="w-5 h-5" />, path: '/admin/reports' },
  ];

  const specialEmployeeMenuItems = [
    { labelKey: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/special-employee/dashboard' },
    { labelKey: 'residents', icon: <Users className="w-5 h-5" />, path: '/special-employee/residents' },
    { labelKey: 'employees', icon: <UserCog className="w-5 h-5" />, path: '/special-employee/employees' },
    { labelKey: 'requestsComplaints', icon: <MessageSquare className="w-5 h-5" />, path: '/special-employee/requests' },
    { labelKey: 'digitalIdSystem', icon: <IdCard className="w-5 h-5" />, path: '/special-employee/digital-id' },
    { labelKey: 'notifications', icon: <Bell className="w-5 h-5" />, path: '/special-employee/notifications' },
    { labelKey: 'reports', icon: <FileText className="w-5 h-5" />, path: '/special-employee/reports' },
  ];

  const employeeMenuItems = [
    { labelKey: 'myTasks', icon: <ClipboardList className="w-5 h-5" />, path: '/employee/dashboard' },
    { labelKey: 'Digital ID', icon: <IdCard className="w-5 h-5" />, path: '/employee/digital-id' },
    { labelKey: 'profile', icon: <Users className="w-5 h-5" />, path: '/employee/profile' },
    { labelKey: 'notifications', icon: <Bell className="w-5 h-5" />, path: '/employee/notifications' },
  ];

  const residentMenuItems = [
    { labelKey: 'dashboard', icon: <Home className="w-5 h-5" />, path: '/resident/dashboard' },
    { labelKey: 'myRequests', icon: <ClipboardList className="w-5 h-5" />, path: '/resident/requests' },
    { labelKey: 'digitalId', icon: <IdCard className="w-5 h-5" />, path: '/resident/digital-id' },
    { labelKey: 'profile', icon: <Users className="w-5 h-5" />, path: '/resident/profile' },
    { labelKey: 'notifications', icon: <Bell className="w-5 h-5" />, path: '/resident/notifications' },
  ];

  const getMenuItems = () => {
    if (user?.role === 'admin') return adminMenuItems;
    if (user?.role === 'special-employee') return specialEmployeeMenuItems;
    if (user?.role === 'employee') return employeeMenuItems;
    if (user?.role === 'resident') return residentMenuItems;
    return [];
  };

  const menuItems = getMenuItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navbar */}
      <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
              >
                {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
              <div className="flex items-center gap-2">
                <Building2 className="w-8 h-8 text-blue-600" />
                <span className="hidden sm:block text-blue-700">
                  {t('propertyManagement')}
                </span>
              </div>
            </div>

            {/* Search Bar - Desktop (admin only) */}
            {user?.role === 'admin' && (
              <div className="hidden md:block flex-1 max-w-2xl mx-8">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="w-full pl-11 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            )}

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* ── Amharic / English Language Toggle ── */}
              <button
                onClick={toggleLanguage}
                title={lang === 'en' ? 'Switch to Amharic' : 'ወደ እንግሊዝኛ ቀይር'}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                <Globe className="w-4 h-4 flex-shrink-0" />
                <span className="hidden sm:inline">{t('switchLanguage')}</span>
              </button>

              {/* Bell */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg" onClick={() => navigate(`/${user?.role}/notifications`)}>
                <Bell className="w-6 h-6 text-gray-600" />
                {bellCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {/* User Info */}
              <div className="hidden sm:flex items-center gap-3 pl-3 border-l border-gray-200">
                <div className="text-right">
                  <p className="text-gray-900">{(user?.username || user?.name || '').replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                  <p className="text-gray-500 capitalize">{user?.role?.replace('-', ' ')}</p>
                </div>
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white">{((user?.username || user?.name || '').charAt(0) || 'U').toUpperCase()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-16 left-0 bottom-0 w-64 bg-white border-r border-gray-200 z-40 transition-transform duration-300
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 h-full overflow-y-auto flex flex-col">
          <nav className="space-y-1 flex-1">
            {menuItems.map((item, index) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={index}
                  onClick={() => {
                    navigate(item.path);
                    setSidebarOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  {item.icon}
                  <span className="flex-1 text-left">{t(item.labelKey)}</span>
                  {item.readOnly && (
                    <Lock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" title="Read-only" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 pt-16">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30 top-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}