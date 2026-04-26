import React, { useState, useEffect, useContext, createContext } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { DigitalIDProvider } from './contexts/DigitalIDContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { loginAPI, getMeAPI, logoutAPI } from './utils/api';

// Pages
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import GoogleCallback from './pages/GoogleCallback';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminResidents from './pages/admin/Residents';
import AdminResidentProfile from './pages/admin/ResidentProfile';
import AdminEmployees from './pages/admin/Employees';
import AdminSpecialEmployees from './pages/admin/SpecialEmployees';
import AdminRequests from './pages/admin/Requests';
import AdminDigitalID from './pages/admin/DigitalID';
import AdminNotifications from './pages/admin/Notifications';
import AdminReports from './pages/admin/Reports';
import AdminProfile from './pages/admin/Profile';

// Special Employee Pages
import SpecialEmployeeDashboard from './pages/special-employee/Dashboard';
import SpecialEmployeeResidents from './pages/special-employee/Residents';
import SpecialEmployeeEmployees from './pages/special-employee/Employees';
import SpecialEmployeeRequests from './pages/special-employee/Requests';
import SpecialEmployeeDigitalID from './pages/special-employee/DigitalID';
import SpecialEmployeeNotifications from './pages/special-employee/Notifications';
import SpecialEmployeeReports from './pages/special-employee/Reports';
import SpecialEmployeeProfile from './pages/special-employee/Profile';

// Employee Pages
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeNotifications from './pages/employee/Notifications';
import EmployeeProfile from './pages/employee/Profile';
import EmployeeDigitalID from './pages/employee/DigitalID';
import EmployeeWorkspace from './pages/employee/Workspace';

// Resident Pages
import ResidentDashboard from './pages/resident/Dashboard';
import ResidentRequests from './pages/resident/Requests';
import ResidentProfile from './pages/resident/Profile';
import ResidentDigitalID from './pages/resident/DigitalID';
import ResidentNotifications from './pages/resident/Notifications';
import ResidentServiceHub from './pages/resident/ServiceHub';
import ResidentMyRequests from './pages/resident/MyRequests';

import { Toaster } from 'sonner';

// ── Auth Context ───────────────────────────────────────────────────────────────
export const AuthContext = createContext({
  user: null as null | { id: string; username: string; name?: string; email: string; role: string; status: string; unit?: string },
  login: async (_email: string, _password: string): Promise<any> => ({}),
  logout: (): void => { },
  setUserFromOAuth: (_user: any): void => { },
  loading: true,
});

function AuthGuard({ allowedRoles, children }: { allowedRoles: string[]; children: React.ReactNode }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

// ── Router ────────────────────────────────────────────────────────────────────
const router = createBrowserRouter([
  { path: '/', element: <Welcome /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/auth/google/callback', element: <GoogleCallback /> },

  // Admin Routes
  { path: '/admin/dashboard', element: <AuthGuard allowedRoles={['admin']}><AdminDashboard /></AuthGuard> },
  { path: '/admin/residents', element: <AuthGuard allowedRoles={['admin']}><AdminResidents /></AuthGuard> },
  { path: '/admin/residents/:id', element: <AuthGuard allowedRoles={['admin']}><AdminResidentProfile /></AuthGuard> },
  { path: '/admin/employees', element: <AuthGuard allowedRoles={['admin']}><AdminEmployees /></AuthGuard> },
  { path: '/admin/special-employees', element: <AuthGuard allowedRoles={['admin']}><AdminSpecialEmployees /></AuthGuard> },
  { path: '/admin/requests', element: <AuthGuard allowedRoles={['admin']}><AdminRequests /></AuthGuard> },
  { path: '/admin/digital-id', element: <AuthGuard allowedRoles={['admin']}><AdminDigitalID /></AuthGuard> },
  { path: '/admin/notifications', element: <AuthGuard allowedRoles={['admin']}><AdminNotifications /></AuthGuard> },
  { path: '/admin/reports', element: <AuthGuard allowedRoles={['admin']}><AdminReports /></AuthGuard> },
  { path: '/admin/profile', element: <AuthGuard allowedRoles={['admin']}><AdminProfile /></AuthGuard> },

  // Special Employee Routes
  { path: '/special-employee/dashboard', element: <AuthGuard allowedRoles={['special-employee']}><SpecialEmployeeDashboard /></AuthGuard> },
  { path: '/special-employee/residents', element: <AuthGuard allowedRoles={['special-employee']}><SpecialEmployeeResidents /></AuthGuard> },
  { path: '/special-employee/employees', element: <AuthGuard allowedRoles={['special-employee']}><SpecialEmployeeEmployees /></AuthGuard> },
  { path: '/special-employee/requests', element: <AuthGuard allowedRoles={['special-employee']}><SpecialEmployeeRequests /></AuthGuard> },
  { path: '/special-employee/digital-id', element: <AuthGuard allowedRoles={['special-employee']}><SpecialEmployeeDigitalID /></AuthGuard> },
  { path: '/special-employee/notifications', element: <AuthGuard allowedRoles={['special-employee']}><SpecialEmployeeNotifications /></AuthGuard> },
  { path: '/special-employee/reports', element: <AuthGuard allowedRoles={['special-employee']}><SpecialEmployeeReports /></AuthGuard> },
  { path: '/special-employee/profile', element: <AuthGuard allowedRoles={['special-employee']}><SpecialEmployeeProfile /></AuthGuard> },

  // Employee Routes
  { path: '/employee/dashboard', element: <AuthGuard allowedRoles={['employee']}><EmployeeDashboard /></AuthGuard> },
  { path: '/employee/notifications', element: <AuthGuard allowedRoles={['employee']}><EmployeeNotifications /></AuthGuard> },
  { path: '/employee/profile', element: <AuthGuard allowedRoles={['employee']}><EmployeeProfile /></AuthGuard> },
  { path: '/employee/workspace', element: <AuthGuard allowedRoles={['employee']}><EmployeeWorkspace /></AuthGuard> },
  { path: '/employee/digital-id', element: <AuthGuard allowedRoles={['employee']}><EmployeeDigitalID /></AuthGuard> },

  // Resident Routes
  { path: '/resident/dashboard', element: <AuthGuard allowedRoles={['resident']}><ResidentDashboard /></AuthGuard> },
  { path: '/resident/services', element: <AuthGuard allowedRoles={['resident']}><ResidentServiceHub /></AuthGuard> },
  { path: '/resident/my-requests', element: <AuthGuard allowedRoles={['resident']}><ResidentMyRequests /></AuthGuard> },
  { path: '/resident/requests', element: <AuthGuard allowedRoles={['resident']}><ResidentRequests /></AuthGuard> },
  { path: '/resident/profile', element: <AuthGuard allowedRoles={['resident']}><ResidentProfile /></AuthGuard> },
  { path: '/resident/digital-id', element: <AuthGuard allowedRoles={['resident']}><ResidentDigitalID /></AuthGuard> },
  { path: '/resident/notifications', element: <AuthGuard allowedRoles={['resident']}><ResidentNotifications /></AuthGuard> },

  // Catch-all
  { path: '*', element: <Navigate to="/" replace /> },
]);

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState<null | any>(null);
  const [loading, setLoading] = useState(true);

  // Restore session from JWT on mount
  useEffect(() => {
    const token = localStorage.getItem('rms_token');
    if (token) {
      getMeAPI()
        .then((data) => {
          setUser(data.user);
        })
        .catch(() => {
          localStorage.removeItem('rms_token');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const data = await loginAPI(email, password);
      setUser(data.user);
      return data;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    logoutAPI();
    setUser(null);
  };

  const setUserFromOAuth = (userData: any) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setUserFromOAuth, loading }}>
      <LanguageProvider>
        <DigitalIDProvider>
          <NotificationProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" richColors />
          </NotificationProvider>
        </DigitalIDProvider>
      </LanguageProvider>
    </AuthContext.Provider>
  );
}

export default App;
