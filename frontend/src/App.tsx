import React, { useState, useEffect, useContext, createContext, Suspense, lazy } from 'react';
import { RouterProvider, createBrowserRouter, Navigate } from 'react-router-dom';
import { LanguageProvider } from './contexts/LanguageContext';
import { DigitalIDProvider } from './contexts/DigitalIDContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { loginAPI, getMeAPI, logoutAPI } from './utils/api';

// Pages
const Welcome = lazy(() => import('./pages/Welcome'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const GoogleCallback = lazy(() => import('./pages/GoogleCallback'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminResidents = lazy(() => import('./pages/admin/Residents'));
const AdminResidentProfile = lazy(() => import('./pages/admin/ResidentProfile'));
const AdminEmployees = lazy(() => import('./pages/admin/Employees'));

const AdminRequests = lazy(() => import('./pages/admin/Requests'));
const AdminDigitalID = lazy(() => import('./pages/admin/DigitalID'));
const AdminNotifications = lazy(() => import('./pages/admin/Notifications'));
const AdminReports = lazy(() => import('./pages/admin/Reports'));
const AdminProfile = lazy(() => import('./pages/admin/Profile'));
const AdminServicePipeline = lazy(() => import('./pages/admin/ServicePipeline'));
const AdminServiceHub = lazy(() => import('./pages/admin/AdminServiceHub'));



// Employee Pages
const EmployeeDashboard = lazy(() => import('./pages/employee/Dashboard'));
const EmployeeNotifications = lazy(() => import('./pages/employee/Notifications'));
const EmployeeProfile = lazy(() => import('./pages/employee/Profile'));
const EmployeeDigitalID = lazy(() => import('./pages/employee/DigitalID'));
const EmployeeWorkspace = lazy(() => import('./pages/employee/Workspace'));

// Resident Pages
const ResidentDashboard = lazy(() => import('./pages/resident/Dashboard'));
const ResidentRequests = lazy(() => import('./pages/resident/Requests'));
const ResidentProfile = lazy(() => import('./pages/resident/Profile'));
const ResidentNotifications = lazy(() => import('./pages/resident/Notifications'));
const ResidentServiceHub = lazy(() => import('./pages/resident/ServiceHub'));
const ResidentMyRequests = lazy(() => import('./pages/resident/MyRequests'));
const ResidentMyDocuments = lazy(() => import('./pages/resident/MyDocuments'));
const VerifyDigitalID = lazy(() => import('./pages/public/VerifyDigitalID'));
const NotFound = lazy(() => import('./pages/NotFound'));

import { Toaster } from 'sonner';

export interface User {
  id: string;
  username: string;
  name?: string;
  email: string;
  role: string;
  status: string;
  unit?: string;
}

export const AuthContext = createContext({
  user: null as null | User,
  login: async (_email: string, _password: string): Promise<{ user: User; token?: string }> => ({} as { user: User; token?: string }),
  logout: (): void => { },
  setUserFromOAuth: (_user: User): void => { },
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

  { path: '/admin/requests', element: <AuthGuard allowedRoles={['admin']}><AdminRequests /></AuthGuard> },
  { path: '/admin/digital-id', element: <AuthGuard allowedRoles={['admin']}><AdminDigitalID /></AuthGuard> },
  { path: '/admin/notifications', element: <AuthGuard allowedRoles={['admin']}><AdminNotifications /></AuthGuard> },
  { path: '/admin/reports', element: <AuthGuard allowedRoles={['admin']}><AdminReports /></AuthGuard> },
  { path: '/admin/profile', element: <AuthGuard allowedRoles={['admin']}><AdminProfile /></AuthGuard> },
  { path: '/admin/services', element: <AuthGuard allowedRoles={['admin']}><AdminServiceHub /></AuthGuard> },
  { path: '/admin/service-pipeline', element: <AuthGuard allowedRoles={['admin']}><AdminServicePipeline /></AuthGuard> },



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
  { path: '/resident/documents', element: <AuthGuard allowedRoles={['resident']}><ResidentMyDocuments /></AuthGuard> },
  { path: '/resident/requests', element: <AuthGuard allowedRoles={['resident']}><ResidentRequests /></AuthGuard> },
  { path: '/resident/profile', element: <AuthGuard allowedRoles={['resident']}><ResidentProfile /></AuthGuard> },
  { path: '/resident/notifications', element: <AuthGuard allowedRoles={['resident']}><ResidentNotifications /></AuthGuard> },

  // Public routes (no auth needed)
  { path: '/verify/:idNumber', element: <VerifyDigitalID /> },

  // Catch-all
  { path: '*', element: <NotFound /> },
]);

// ── App ───────────────────────────────────────────────────────────────────────
function App() {
  const [user, setUser] = useState<null | User>(null);
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

  const setUserFromOAuth = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, setUserFromOAuth, loading }}>
      <LanguageProvider>
        <DigitalIDProvider>
          <NotificationProvider>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}>
              <RouterProvider router={router} />
            </Suspense>
            <Toaster position="top-right" richColors />
          </NotificationProvider>
        </DigitalIDProvider>
      </LanguageProvider>
    </AuthContext.Provider>
  );
}

export default App;
