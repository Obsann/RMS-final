import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, User, Mail, Lock, AtSign,
  ChevronRight, ChevronLeft, CheckCircle, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { registerAPI, getGoogleOAuthURL, sendOtpAPI, verifyOtpAPI } from '../utils/api';
import TranslateWidget from '../components/TranslateWidget';

// ── Field validation helper ────────────────────────────────────────────────
const validateStep1 = (d) => {
  const errs = {};
  if (!d.fullName?.trim()) errs.fullName = 'Full name is required. E.g., Abebe Kebede Alemu';
  else if (d.fullName.trim().split(' ').length < 2) errs.fullName = 'Please enter your full name (at least 2 words)';
  
  if (!d.username?.trim()) errs.username = 'Username is required';
  else if (d.username.length < 3) errs.username = 'Username must be at least 3 characters';
  else if (!/^[a-zA-Z0-9._]+$/.test(d.username)) errs.username = 'Only letters, numbers, dots and underscores allowed';
  
  if (!d.email?.trim()) errs.email = 'Email is required';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errs.email = 'Enter a valid email address. E.g., abebe@gmail.com';
  
  if (!d.password) errs.password = 'Password is required';
  else if (d.password.length < 6) errs.password = 'Password must be at least 6 characters';
  
  if (!d.confirmPassword) errs.confirmPassword = 'Please confirm your password';
  else if (d.password !== d.confirmPassword) errs.confirmPassword = 'Passwords do not match';
  
  return errs;
};

// ── Reusable input component ────────────────────────────────────────────────
function Field({ label, error, icon: Icon, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5 notranslate">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />}
        {children}
      </div>
      {error && <p className="mt-1 text-xs text-red-600 flex items-center gap-1">⚠ {error}</p>}
    </div>
  );
}

const inputCls = (err) =>
  `notranslate w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${err ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`;

export default function Register() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  
  // Steps: 1 = Details, 2 = OTP
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState('forward');
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    fullName: '', username: '', email: '', password: '', confirmPassword: ''
  });

  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  const set = (field) => (e) => {
    const val = e && e.target ? e.target.value : e;
    setFormData((p) => ({ ...p, [field]: val }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const handleContinue = async () => {
    const errs = validateStep1(formData);
    if (Object.keys(errs).length > 0) { 
      setErrors(errs); 
      return; 
    }
    setErrors({});
    
    setIsSendingOtp(true);
    try {
      await sendOtpAPI(formData.email);
      toast.success(`Verification code sent to ${formData.email}`);
      setDirection('forward');
      setStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast.error(error.message || 'Failed to send verification code');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleBack = () => {
    setErrors({});
    setDirection('backward');
    setStep(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const verifyAndRegister = async () => {
    if (!otp || otp.length < 6) {
      toast.error("Please enter the complete 6-digit code.");
      return;
    }
    
    setIsLoading(true);
    try {
      // 1. Verify OTP
      await verifyOtpAPI(formData.email, otp);
      
      // 2. Automatically trigger registration
      await registerAPI({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        // Backend handles fullName internally if needed, or we just pass it along
        fullName: formData.fullName, 
        // We omit phone and unit; user will fill them in profile later.
      });
      
      toast.success('Registration completed successfully!');
      setRegistered(true);
    } catch (error) {
      toast.error(error.message || 'Verification or registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Registration Successful!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Your account has been successfully created and verified.
            You can now log in to access your dashboard.
          </p>
          <button onClick={() => navigate('/login')} className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Define transition classes
  const slideInClass = direction === 'forward' ? 'animate-in slide-in-from-right-8 fade-in duration-300' : 'animate-in slide-in-from-left-8 fade-in duration-300';

  return (
    <div className="min-w-screen min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Header controls */}
      <div className="relative z-10 flex justify-between items-center px-6 pt-6">
        <button onClick={() => navigate('/')} className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1 transition-colors font-medium">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </button>
        <TranslateWidget />
      </div>

      <div className="relative z-10 flex-1 flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-lg">
          {/* Logo + Title */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Create Resident Account</h1>
            <p className="text-gray-500 mt-2 text-sm">Join the Kebele Community System</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="p-8">
              
              {/* ── STEP 1: Account Details ────────────────────────────── */}
              {step === 1 && (
                <div className={`space-y-5 ${slideInClass}`}>
                  <div className="mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Account Details</h2>
                    <p className="text-sm text-gray-500 mt-1">Please provide your basic information.</p>
                  </div>

                  <Field label="Full Name" error={errors.fullName} icon={User} required>
                    <input
                      type="text" value={formData.fullName} onChange={set('fullName')}
                      className={inputCls(errors.fullName)}
                      placeholder="E.g., Abebe Kebede"
                    />
                  </Field>

                  <Field label="Username" error={errors.username} icon={AtSign} required>
                    <input
                      type="text" value={formData.username} onChange={set('username')}
                      className={inputCls(errors.username)}
                      placeholder="Choose a unique username"
                    />
                  </Field>

                  <Field label="Email Address" error={errors.email} icon={Mail} required>
                    <input
                      type="email" value={formData.email} onChange={set('email')}
                      className={inputCls(errors.email)}
                      placeholder="E.g., abebe@gmail.com"
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Password" error={errors.password} icon={Lock} required>
                      <input
                        type={showPass ? 'text' : 'password'} value={formData.password} onChange={set('password')}
                        className={inputCls(errors.password) + ' pr-10'}
                        placeholder="Min 6 characters"
                      />
                      <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </Field>

                    <Field label="Confirm Password" error={errors.confirmPassword} icon={Lock} required>
                      <input
                        type={showConfirmPass ? 'text' : 'password'} value={formData.confirmPassword} onChange={set('confirmPassword')}
                        className={inputCls(errors.confirmPassword) + ' pr-10'}
                        placeholder="Re-enter password"
                      />
                      <button type="button" onClick={() => setShowConfirmPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </Field>
                  </div>

                  <button
                    type="button" onClick={handleContinue} disabled={isSendingOtp}
                    className="w-full mt-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {isSendingOtp ? 'Sending OTP...' : 'Continue'} <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {/* Google Sign-Up */}
                  <div className="flex items-center my-6">
                    <div className="flex-1 border-t border-gray-200"></div>
                    <span className="px-4 text-xs font-medium text-gray-400 uppercase">OR</span>
                    <div className="flex-1 border-t border-gray-200"></div>
                  </div>

                  <a
                    href={getGoogleOAuthURL()}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Sign up with Google
                  </a>
                </div>
              )}

              {/* ── STEP 2: Email Verification ────────────────────────────── */}
              {step === 2 && (
                <div className={`space-y-6 ${slideInClass}`}>
                  <div className="mb-6">
                    <button onClick={handleBack} className="text-gray-400 hover:text-gray-600 transition-colors mb-4 flex items-center text-sm font-medium">
                      <ChevronLeft className="w-4 h-4 mr-1" /> Back
                    </button>
                    <h2 className="text-xl font-bold text-gray-900">Verify Email</h2>
                    <p className="text-sm text-gray-500 mt-1">We've sent a 6-digit code to <strong className="text-gray-800">{formData.email}</strong></p>
                  </div>
                  
                  <div className="flex justify-center py-4">
                     <input
                        type="text"
                        maxLength="6"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="text-center text-3xl tracking-[0.5em] font-mono border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-blue-500 px-4 py-3 w-64 shadow-sm"
                        placeholder="••••••"
                     />
                  </div>
                  
                  <button
                    type="button" onClick={verifyAndRegister} disabled={isLoading || otp.length !== 6}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    {isLoading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Verifying...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Verify & Register</>
                    )}
                  </button>

                  <div className="text-center mt-4">
                    <button 
                       type="button" 
                       disabled={isSendingOtp}
                       onClick={async () => {
                         setIsSendingOtp(true);
                         try {
                           await sendOtpAPI(formData.email);
                           toast.success('Verification code resent!');
                         } catch (error) {
                           toast.error(error.message || 'Failed to resend code');
                         } finally {
                           setIsSendingOtp(false);
                         }
                       }}
                       className="text-sm text-blue-600 hover:underline font-medium disabled:opacity-50"
                    >
                      {isSendingOtp ? 'Sending...' : 'Didn\'t receive code? Resend'}
                    </button>
                  </div>
                </div>
              )}

            </div>
            
            {/* Sign in link footer */}
            <div className="bg-gray-50 border-t border-gray-100 p-5 text-center">
              <p className="text-sm text-gray-500 font-medium">
                Already have an account?{' '}
                <button onClick={() => navigate('/login')} className="text-blue-600 hover:text-blue-700 hover:underline">Sign in</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
