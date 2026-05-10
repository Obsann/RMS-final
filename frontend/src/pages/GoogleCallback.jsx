import React, { useEffect, useContext, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../App';
import { setToken, getMeAPI } from '../utils/api';
import { toast } from 'sonner';

/**
 * OAuth callback page — receives the JWT token from the backend redirect,
 * stores it, fetches the user profile, and navigates to the appropriate dashboard.
 */
export default function GoogleCallback() {
  const navigate = useNavigate();
  const { setUserFromOAuth } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Completing sign-in...');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      toast.error('Authentication failed — no token received');
      navigate('/login', { replace: true });
      return;
    }

    // Store the token and fetch the user profile
    setToken(token);

    getMeAPI()
      .then((data) => {
        setUserFromOAuth(data.user);
        toast.success('Signed in with Google!');

        const role = data.user?.role;
        if (role === 'admin') navigate('/admin/dashboard', { replace: true });
        else if (role === 'employee') navigate('/employee/dashboard', { replace: true });
        else navigate('/resident/dashboard', { replace: true });
      })
      .catch((err) => {
        setToken(null);
        toast.error(err.message || 'Failed to complete sign-in');
        navigate('/login', { replace: true });
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-700 text-lg font-medium">{status}</p>
      </div>
    </div>
  );
}
