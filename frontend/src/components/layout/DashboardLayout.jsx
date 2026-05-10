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
  GitBranch,
  Award,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import TranslateWidget from '../TranslateWidget';

export default function DashboardLayout({ children }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang, setLang } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [bellCount, setBellCount] = useState(0);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [employeeJobCategory, setEmployeeJobCategory] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Fetch real unread notification count + profile photo from API
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      try {
        const token = localStorage.getItem('rms_token');
        if (!token) return;

        const [notifRes, meRes] = await Promise.all([
          fetch('/api/notifications?limit=1', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        if (notifRes.ok) {
          const data = await notifRes.json();
          setBellCount(data.unreadCount ?? 0);
        }
        if (meRes.ok) {
          const data = await meRes.json();
          const me = data.user || data;
          const photo = me?.profilePhoto;
          if (photo) setProfilePhoto(`/uploads/${photo.replace(/^.*?uploads\//, '')}`);
          if (me?.jobCategory) setEmployeeJobCategory(me.jobCategory);
        }
      } catch (e) { /* silent */ }
    };
    load();
    const interval = setInterval(load, 90000);
    return () => clearInterval(interval);
  }, [user]);

  const adminMenuItems = [
    { labelKey: 'dashboard', icon: <LayoutDashboard className="w-5 h-5" />, path: '/admin/dashboard' },
    { labelKey: 'residents', icon: <Users className="w-5 h-5" />, path: '/admin/residents' },
    { labelKey: 'employees', icon: <UserCog className="w-5 h-5" />, path: '/admin/employees' },
    { labelKey: 'requestsComplaints', icon: <MessageSquare className="w-5 h-5" />, path: '/admin/requests' },
    { labelKey: 'Service Pipeline', icon: <GitBranch className="w-5 h-5" />, path: '/admin/service-pipeline' },
    { labelKey: 'digitalIdSystem', icon: <IdCard className="w-5 h-5" />, path: '/admin/digital-id' },
    { labelKey: 'notifications', icon: <Bell className="w-5 h-5" />, path: '/admin/notifications' },
    { labelKey: 'reports', icon: <FileText className="w-5 h-5" />, path: '/admin/reports' },
  ];

  // Dynamic workspace label/icon based on assigned job category
  const workspaceConfig = {
    'Identity & Registration': { label: 'Identity & Registration', icon: <IdCard className="w-5 h-5" /> },
    'Certificates': { label: 'Certificates', icon: <FileText className="w-5 h-5" /> },
    'Permits': { label: 'Permits', icon: <ClipboardList className="w-5 h-5" /> },
    'Feedback & Support': { label: 'Feedback & Support', icon: <MessageSquare className="w-5 h-5" /> },
  };
  const ws = workspaceConfig[employeeJobCategory] || { label: 'My Workspace', icon: <ClipboardList className="w-5 h-5" /> };

  const employeeMenuItems = [
    { labelKey: 'myTasks', icon: <LayoutDashboard className="w-5 h-5" />, path: '/employee/dashboard' },
    { labelKey: ws.label, icon: ws.icon, path: '/employee/workspace' },
    { labelKey: 'profile', icon: <Users className="w-5 h-5" />, path: '/employee/profile' },
    { labelKey: 'notifications', icon: <Bell className="w-5 h-5" />, path: '/employee/notifications' },
  ];

  const residentMenuItems = [
    { labelKey: 'dashboard', icon: <Home className="w-5 h-5" />, path: '/resident/dashboard' },
    { labelKey: 'Services', icon: <Building2 className="w-5 h-5" />, path: '/resident/services' },
    { labelKey: 'My Requests', icon: <ClipboardList className="w-5 h-5" />, path: '/resident/my-requests' },
    { labelKey: 'My Documents', icon: <Award className="w-5 h-5" />, path: '/resident/documents' },
    { labelKey: 'profile', icon: <Users className="w-5 h-5" />, path: '/resident/profile' },
    { labelKey: 'notifications', icon: <Bell className="w-5 h-5" />, path: '/resident/notifications' },
  ];

  const getMenuItems = () => {
    if (user?.role === 'admin') return adminMenuItems;
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
                  {t('Resident Management')}
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
              <TranslateWidget />

              {/* Bell */}
              <button className="relative p-2 hover:bg-gray-100 rounded-lg" onClick={() => navigate(`/${user?.role}/notifications`)}>
                <Bell className="w-6 h-6 text-gray-600" />
                {bellCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              {/* User Info + Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-3 pl-3 border-l border-gray-200 hover:bg-gray-50 rounded-lg pr-2 py-1 transition-colors"
                >
                  <div className="hidden sm:block text-right">
                    <p className="text-gray-900 text-sm font-medium">{(user?.username || user?.name || '').replace(/\./g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    <p className="text-gray-500 text-xs capitalize">{user?.role?.replace('-', ' ')}</p>
                  </div>
                  <div className="w-10 h-10 rounded-full border-2 border-blue-200 overflow-hidden bg-blue-600 flex items-center justify-center flex-shrink-0">
                    {profilePhoto
                      ? <img src={profilePhoto} alt="avatar" className="w-full h-full object-cover" />
                      : <span className="text-white font-medium text-sm">{((user?.username || user?.name || '').charAt(0) || 'U').toUpperCase()}</span>
                    }
                  </div>
                </button>

                {/* Dropdown Menu */}
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-2 overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">{user?.username || user?.name}</p>
                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      </div>
                      <button
                        onClick={() => { setUserMenuOpen(false); navigate(`/${user?.role}/profile`); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                      >
                        <Users className="w-4 h-4" /> Profile
                      </button>
                      <div className="border-t border-gray-100 my-1" />
                      <button
                        onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 transition-colors text-sm"
                      >
                        <LogOut className="w-4 h-4" /> {t('logout')}
                      </button>
                    </div>
                  </>
                )}
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