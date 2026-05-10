import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AuthContext } from '../App';
import { Building2, Mail, Lock, Eye, EyeOff, LogIn, KeyRound, Shield, ArrowLeft, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { getGoogleOAuthURL, forgotPasswordAPI, resetPasswordAPI } from '../utils/api';
import TranslateWidget from '../components/TranslateWidget';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();

  // Multi-mode: login | forgot-password | reset-password
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Reset-password specific
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Handle OAuth error redirects
  useEffect(() => {
    const err = searchParams.get('error');
    if (err === 'pending_approval') toast.info('Your Google account has been registered. Please wait for admin approval.');
    else if (err === 'account_rejected') toast.error('Your account registration was rejected. Please contact support.');
    else if (err === 'auth_failed') toast.error('Google authentication failed. Please try again.');
    else if (err === 'server_error') toast.error('A server error occurred. Please try again later.');
  }, [searchParams]);

  const resetForm = () => {
    setEmail(''); setPassword(''); setOtp('');
    setNewPassword(''); setConfirmPassword('');
    setError(''); setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        if (!email || !password) { setError('Please fill in all fields'); setIsLoading(false); return; }
        const data = await login(email, password);
        toast.success('Login successful!');
        const role = data.user?.role;
        if (role === 'admin') navigate('/admin/dashboard');
        else if (role === 'employee') navigate('/employee/dashboard');
        else navigate('/resident/dashboard');
      } else if (mode === 'forgot-password') {
        if (!email) { setError('Please enter your email'); setIsLoading(false); return; }
        await forgotPasswordAPI(email.trim());
        setMode('reset-password');
        setSuccessMsg('A reset code has been sent to your email.');
        setOtp(''); setNewPassword(''); setConfirmPassword('');
      } else if (mode === 'reset-password') {
        if (!otp || otp.length < 6) { setError('Please enter the complete 6-digit code'); setIsLoading(false); return; }
        if (newPassword.length < 6) { setError('Password must be at least 6 characters'); setIsLoading(false); return; }
        if (newPassword !== confirmPassword) { setError('Passwords do not match'); setIsLoading(false); return; }
        await resetPasswordAPI(email.trim(), otp.trim(), newPassword);
        setMode('login');
        resetForm();
        setSuccessMsg('Password reset successfully! You can now sign in.');
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const headings = {
    'login':           { title: t('signIn') || 'Welcome Back',     subtitle: t('signInSubtitle') || 'Sign in to access your dashboard' },
    'forgot-password': { title: 'Forgot Password',                  subtitle: 'Enter your email to receive a reset code' },
    'reset-password':  { title: 'Reset Password',                   subtitle: 'Enter the code sent to your email and set a new password' },
  };

  const buttonConfig = {
    'login':           { label: t('signIn') || 'Sign In', icon: <LogIn className="w-5 h-5" /> },
    'forgot-password': { label: 'Send Reset Code',        icon: <Mail className="w-5 h-5" /> },
    'reset-password':  { label: 'Reset Password',         icon: <KeyRound className="w-5 h-5" /> },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Translate widget */}
      <div className="absolute top-4 right-4 z-50">
        <TranslateWidget />
      </div>

      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-[40%] right-[20%] w-[30%] h-[30%] bg-indigo-400/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 relative z-10 shadow-2xl rounded-3xl overflow-hidden bg-white">

        {/* ── Left Panel: Branding ── */}
        <div className="hidden lg:flex flex-col justify-center p-12 bg-gradient-to-br from-blue-600 to-indigo-800 text-white relative">
          <div className="absolute inset-0 opacity-[0.06]" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }} />
          <div className="relative z-10">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/20 shadow-xl">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold mb-4 tracking-tight">Kebele RMS</h1>
            <p className="text-blue-100 text-lg leading-relaxed mb-8">
              Resident Management System for Hermata Merkato Kebele.
              Access your services, track requests, and manage your digital identity.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <Shield className="w-6 h-6 text-blue-200 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">For Employees &amp; Admins</h3>
                  <p className="text-sm text-blue-200">Log in with your official email</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl border border-white/10 backdrop-blur-sm">
                <Users className="w-6 h-6 text-blue-200 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold">For Residents</h3>
                  <p className="text-sm text-blue-200">Use your email or Google account</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right Panel: Form ── */}
        <div className="p-8 lg:p-12 relative bg-white">
          {/* Back button for sub-modes */}
          {mode !== 'login' && (
            <button
              onClick={() => { setMode('login'); resetForm(); }}
              className="absolute top-6 left-6 text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Login
            </button>
          )}

          <div className={mode !== 'login' ? 'mt-8' : ''}>
            {/* Mobile logo */}
            <div className="lg:hidden flex items-center justify-center mb-6">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">{headings[mode].title}</h2>
            <p className="text-gray-500 mb-8">{headings[mode].subtitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Login fields ── */}
            {mode === 'login' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('emailAddress') || 'Email Address'}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900"
                      placeholder="you@example.com" disabled={isLoading}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('password') || 'Password'}</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                      className="w-full pl-11 pr-12 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900"
                      placeholder="Enter your password" disabled={isLoading}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button type="button" onClick={() => { setError(''); setSuccessMsg(''); setMode('forgot-password'); }}
                      className="text-sm text-blue-600 hover:underline font-medium">
                      Forgot password?
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── Forgot Password: email ── */}
            {mode === 'forgot-password' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900"
                    placeholder="Enter your account email" required disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* ── Reset Password: OTP + new password ── */}
            {mode === 'reset-password' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reset Code</label>
                  <input
                    type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-4 py-3 text-center text-2xl tracking-[0.5em] font-mono rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900"
                    placeholder="••••••" maxLength={6} required
                  />
                  <p className="text-sm text-gray-500 mt-2 text-center">Code sent to <strong className="text-gray-700">{email}</strong></p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900 pr-12"
                      placeholder="Min 6 characters" required minLength={6}
                    />
                    <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                  <input
                    type={showNewPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-gray-900"
                    placeholder="Re-enter new password" required minLength={6}
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
                  )}
                </div>

                <div className="text-center">
                  <button type="button" disabled={isLoading} onClick={async () => {
                    setIsLoading(true);
                    try { await forgotPasswordAPI(email.trim()); setSuccessMsg('A new reset code has been sent.'); }
                    catch (err) { setError(err.message || 'Failed to resend code'); }
                    finally { setIsLoading(false); }
                  }} className="text-sm font-semibold text-blue-600 hover:underline disabled:opacity-50">
                    Didn't receive code? Resend
                  </button>
                </div>
              </>
            )}

            {/* ── Messages ── */}
            {successMsg && (
              <div className="bg-green-50 border border-green-100 text-green-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <Mail className="w-4 h-4 flex-shrink-0" /> {successMsg}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <Shield className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            {/* ── Submit ── */}
            <button
              type="submit" disabled={isLoading}
              className="w-full py-3 mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25"
            >
              {isLoading ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> <span>Processing...</span></>
              ) : (
                <>{buttonConfig[mode].icon} <span>{buttonConfig[mode].label}</span></>
              )}
            </button>
          </form>

          {/* ── Google OAuth (login mode only) ── */}
          {mode === 'login' && (
            <div className="mt-6">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200" />
                <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">Or</span>
                <div className="flex-grow border-t border-gray-200" />
              </div>
              <a
                href={getGoogleOAuthURL()}
                className="mt-4 w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </a>
            </div>
          )}

          {/* ── Footer links ── */}
          {mode === 'login' && (
            <div className="mt-8 text-center text-sm text-gray-600">
              {t('noAccount') || "Don't have an account?"}{' '}
              <button type="button" onClick={() => navigate('/register')} className="font-semibold text-blue-600 hover:underline">
                Register here
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}