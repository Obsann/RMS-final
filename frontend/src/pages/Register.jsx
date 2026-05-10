import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, User, Mail, Lock, Phone, Home, Globe, AtSign,
  MapPin, Calendar, Users, ChevronRight, ChevronLeft, CheckCircle, Eye, EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';
import { registerAPI, getGoogleOAuthURL, sendOtpAPI, verifyOtpAPI } from '../utils/api';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import TranslateWidget from '../components/TranslateWidget';
import DualCalendarField from '../components/ui/DualCalendarField';

// ── Field validation helpers ────────────────────────────────────────────────
const validate = {
  step1: (d) => {
    const errs = {};
    if (!d.fullName?.trim()) errs.fullName = 'Full name is required. E.g., Abebe Kebede Alemu';
    else if (d.fullName.trim().split(' ').length < 2) errs.fullName = 'Please enter your full name (at least 2 words)';
    if (!d.username?.trim()) errs.username = 'Username is required';
    else if (d.username.length < 3) errs.username = 'Username must be at least 3 characters';
    else if (!/^[a-zA-Z0-9._]+$/.test(d.username)) errs.username = 'Only letters, numbers, dots and underscores allowed';
    if (!d.dateOfBirth) errs.dateOfBirth = 'Date of birth is required';
    if (!d.gender) errs.gender = 'Please select your gender';
    return errs;
  },
  step2: (d) => {
    const errs = {};
    if (!d.unit?.trim()) errs.unit = 'House / Unit number is required. E.g., A-101';
    if (!d.subCity?.trim()) errs.subCity = 'Sub-city is required';
    if (!d.email?.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) errs.email = 'Enter a valid email address. E.g., abebe@gmail.com';
    if (!d.phone?.trim()) errs.phone = 'Phone number is required';
    else if (!/^\+?[0-9\s\-()]{9,15}$/.test(d.phone)) errs.phone = 'Enter a valid phone. E.g., +251 911 123 456';
    if (!d.password) errs.password = 'Password is required';
    else if (d.password.length < 6) errs.password = 'Password must be at least 6 characters';
    if (!d.confirmPassword) errs.confirmPassword = 'Please confirm your password';
    else if (d.password !== d.confirmPassword) errs.confirmPassword = 'Passwords do not match';
    return errs;
  }
};

// ── Reusable input component ────────────────────────────────────────────────
function Field({ label, error, icon: Icon, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
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
  `w-full pl-10 pr-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 transition-colors ${err ? 'border-red-400 focus:ring-red-300 bg-red-50' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
  }`;

const STEPS = [
  { id: 1, label: 'Personal\nIdentity', short: 'Identity' },
  { id: 2, label: 'Location\n& Residency', short: 'Location' },
  { id: 3, label: 'Email\nVerification', short: 'Verification' },
  { id: 4, label: 'Review\n& Submit', short: 'Review' },
];

export default function Register() {
  const navigate = useNavigate();
  const { lang, t, setLang } = useLanguage();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    fullName: '', username: '', dateOfBirth: '', gender: '',
    unit: '', subCity: '', email: '', phone: '', password: '', confirmPassword: '',
  });

  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);

  const set = (field) => (e) => {
    const val = e && e.target ? e.target.value : e;
    setFormData((p) => ({ ...p, [field]: val }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
  };

  const progress = ((step - 1) / (STEPS.length - 1)) * 100;

  const goNext = async () => {
    const errs = step === 1 ? validate.step1(formData) : step === 2 ? validate.step2(formData) : {};
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    
    if (step === 2) {
      setIsSendingOtp(true);
      try {
        await sendOtpAPI(formData.email);
        toast.success(`Verification code sent to ${formData.email}`);
        setStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        toast.error(error.message || 'Failed to send verification code');
      } finally {
        setIsSendingOtp(false);
      }
    } else if (step === 3) {
      if (!otp || otp.length < 6) {
        toast.error("Please enter the complete 6-digit code.");
        return;
      }
      setIsVerifyingOtp(true);
      try {
        await verifyOtpAPI(formData.email, otp);
        toast.success('Email verified successfully!');
        setStep((s) => s + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (error) {
        toast.error(error.message || 'Invalid or expired verification code');
      } finally {
        setIsVerifyingOtp(false);
      }
    } else {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      await registerAPI({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        unit: `${formData.unit}${formData.subCity ? ', ' + formData.subCity : ''}`,
      });
      setRegistered(true);
      toast.success('Registration submitted successfully!');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">Registration Submitted!</h2>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Your application has been submitted and is <strong className="text-gray-700">awaiting admin approval</strong>.
            You will be able to log in once an administrator reviews your account.
          </p>
          <button onClick={() => navigate('/login')} className="w-full bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-all font-medium shadow-sm">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // ── SummaryRow for review step ────────────────────────────────────────────
  const SummaryRow = ({ label, value }) => (
    <div className="flex justify-between items-center py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-800 text-right max-w-[60%]">{value || '—'}</span>
    </div>
  );

  return (
    <div className="min-w-screen min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-950 flex flex-col relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Header controls */}
      <div className="relative z-10 flex justify-between items-center px-6 pt-4">
        <button onClick={() => navigate('/')} className="text-sm text-blue-200 hover:text-white flex items-center gap-1 transition-colors">
          <ChevronLeft className="w-4 h-4" /> Back to Home
        </button>
        <TranslateWidget />
      </div>

      <div className="relative z-10 flex-1 flex items-start justify-center py-8 px-4">
        <div className="w-full max-w-xl">
          {/* Logo + Title */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Create Resident Account</h1>
            <p className="text-gray-500 text-sm mt-1">Kebele Community Resident Management System</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Progress bar */}
            <div className="h-1.5 bg-gray-100">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Step indicators */}
            <div className="flex border-b border-gray-100 bg-gray-50/60">
              {STEPS.map((s, i) => {
                const done = step > s.id;
                const active = step === s.id;
                return (
                  <div key={s.id} className={`flex-1 flex flex-col items-center py-3 gap-1 transition-colors ${active ? 'bg-blue-50' : ''}`}>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${done ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-gray-200 text-gray-500'
                      }`}>
                      {done ? <CheckCircle className="w-4 h-4" /> : s.id}
                    </div>
                    <span className={`text-xs font-medium hidden sm:block text-center leading-tight ${active ? 'text-blue-700' : done ? 'text-green-600' : 'text-gray-400'}`}>
                      {s.short}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="p-6 sm:p-8">
              {/* Info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-6 text-sm text-blue-700 flex gap-2 items-start">
                <span className="text-base">📋</span>
                <span>Registrations are submitted for <strong>admin approval</strong>. You will be registered as a resident.</span>
              </div>

              {/* ── STEP 1: Personal Identity ────────────────────────────── */}
              {step === 1 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Step 1 — Personal Identity</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Tell us who you are</p>
                  </div>

                  <Field label="Full Name" error={errors.fullName} icon={User} required>
                    <input
                      type="text" value={formData.fullName} onChange={set('fullName')}
                      className={inputCls(errors.fullName)}
                      placeholder="E.g., Abebe Kebede Alemu"
                    />
                  </Field>

                  <Field label="Username" error={errors.username} icon={AtSign} required>
                    <input
                      type="text" value={formData.username} onChange={set('username')}
                      className={inputCls(errors.username)}
                      placeholder="E.g., abebe.kebede"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Date of Birth" error={errors.dateOfBirth} icon={Calendar} required>
                      <DualCalendarField
                        id="reg-dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={set('dateOfBirth')}
                        required
                      />
                    </Field>

                    <Field label="Gender" error={errors.gender} icon={Users} required>
                      <select value={formData.gender} onChange={set('gender')} className={inputCls(errors.gender)}>
                        <option value="">Select...</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </Field>
                  </div>
                </div>
              )}

              {/* ── STEP 2: Location & Residency ─────────────────────────── */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Step 2 — Location & Residency</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Your housing and contact details</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Field label="House / Unit No." error={errors.unit} icon={Home} required>
                      <input
                        type="text" value={formData.unit} onChange={set('unit')}
                        className={inputCls(errors.unit)}
                        placeholder="E.g., A-101"
                      />
                    </Field>

                    <Field label="Sub-city" error={errors.subCity} icon={MapPin} required>
                      <input
                        type="text" value={formData.subCity} onChange={set('subCity')}
                        className={inputCls(errors.subCity)}
                        placeholder="E.g., Bole"
                      />
                    </Field>
                  </div>

                  <Field label="Email Address" error={errors.email} icon={Mail} required>
                    <input
                      type="email" value={formData.email} onChange={set('email')}
                      className={inputCls(errors.email)}
                      placeholder="E.g., abebe@gmail.com"
                    />
                  </Field>

                  <Field label="Phone Number" error={errors.phone} icon={Phone} required>
                    <input
                      type="tel" value={formData.phone} onChange={set('phone')}
                      className={inputCls(errors.phone)}
                      placeholder="E.g., +251 911 123 456"
                    />
                  </Field>

                  <Field label="Password" error={errors.password} icon={Lock} required>
                    <input
                      type={showPass ? 'text' : 'password'} value={formData.password} onChange={set('password')}
                      className={inputCls(errors.password) + ' pr-10'}
                      placeholder="At least 6 characters"
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </Field>

                  <Field label="Confirm Password" error={errors.confirmPassword} icon={Lock} required>
                    <input
                      type={showConfirmPass ? 'text' : 'password'} value={formData.confirmPassword} onChange={set('confirmPassword')}
                      className={inputCls(errors.confirmPassword) + ' pr-10'}
                      placeholder="Re-enter your password"
                    />
                    <button type="button" onClick={() => setShowConfirmPass(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </Field>
                </div>
              )}

              {/* ── STEP 3: Email Verification ────────────────────────────── */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Step 3 — Email Verification</h2>
                    <p className="text-sm text-gray-500 mt-0.5">We've sent a 6-digit code to <strong className="text-gray-800">{formData.email}</strong></p>
                  </div>
                  <div className="flex justify-center py-6">
                     <input
                        type="text"
                        maxLength="6"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        className="text-center text-3xl tracking-[0.5em] font-mono border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-blue-500 px-4 py-3 w-64"
                        placeholder="••••••"
                     />
                  </div>
                  <div className="text-center">
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
                      {isSendingOtp ? 'Sending...' : 'Resend Code'}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 4: Review & Submit ───────────────────────────────── */}
              {step === 4 && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Step 4 — Review & Submit</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Please confirm your information before submitting</p>
                  </div>

                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-1">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Personal Identity</h3>
                    <SummaryRow label="Full Name" value={formData.fullName} />
                    <SummaryRow label="Username" value={`@${formData.username}`} />
                    <SummaryRow label="Date of Birth" value={formData.dateOfBirth ? new Date(formData.dateOfBirth).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''} />
                    <SummaryRow label="Gender" value={formData.gender} />
                  </div>

                  <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 space-y-1">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Location & Residency</h3>
                    <SummaryRow label="Unit / House No." value={formData.unit} />
                    <SummaryRow label="Sub-city" value={formData.subCity} />
                    <SummaryRow label="Email" value={formData.email} />
                    <SummaryRow label="Phone" value={formData.phone} />
                    <SummaryRow label="Password" value="••••••••" />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 flex gap-2">
                    <span className="text-base">⚠️</span>
                    <span>After submitting, your account will be <strong>pending admin approval</strong>. You will not be able to log in until approved.</span>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex gap-3">
                {step > 1 && (
                  <button
                    type="button" onClick={goBack}
                    className="flex-1 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                )}

                {step < 4 ? (
                  <button
                    type="button" onClick={goNext} disabled={isSendingOtp || isVerifyingOtp}
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-blue-200 transition-all"
                  >
                    {(isSendingOtp || isVerifyingOtp) ? 'Processing...' : 'Continue'} <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button" onClick={handleSubmit} disabled={isLoading}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm shadow-green-200 transition-all"
                  >
                    {isLoading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting...</>
                    ) : (
                      <><CheckCircle className="w-4 h-4" /> Submit Registration</>
                    )}
                  </button>
                )}
              </div>

              {/* Divider */}
              <div className="flex items-center my-6">
                <div className="flex-1 border-t border-gray-300"></div>
                <span className="px-4 text-sm text-gray-500">OR</span>
                <div className="flex-1 border-t border-gray-300"></div>
              </div>

              {/* Google Sign-Up */}
              <a
                href={getGoogleOAuthURL()}
                className="w-full mb-5 flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors text-gray-700 font-medium"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign up with Google
              </a>

              {/* Sign in link */}
              <p className="mt-5 text-center text-sm text-gray-500">
                Already have an account?{' '}
                <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline font-medium">Sign in</button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
