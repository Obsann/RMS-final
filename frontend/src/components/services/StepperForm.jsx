import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Send, ArrowLeft, ArrowRight, CheckCircle, Loader2, Eye, EyeOff, Shield, Camera } from 'lucide-react';
import DualCalendarField from '../ui/DualCalendarField';
import DocumentUpload from './DocumentUpload';
import { toast } from 'sonner';
import { getMeAPI, uploadFile } from '../../utils/api';
import { buildProfileDefaults } from './profileAutoFill';

function maskValue(val) {
  if (!val || typeof val !== 'string' || val.length < 5) return val;
  return '•'.repeat(val.length - 4) + val.slice(-4);
}

export default function StepperForm({ service, onBack, onSubmitRequest }) {
  const steps = service.steps || [
    { id: 'identity', label: 'Registrant Identity', icon: '🪪' },
    { id: 'details', label: 'Event Details', icon: '📋' },
    { id: 'evidence', label: 'Evidence & Review', icon: '📎' },
  ];

  const [currentStep, setCurrentStep] = useState(0);
  const [attachments, setAttachments] = useState([]);
  const [showMasked, setShowMasked] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState({});

  const {
    register,
    handleSubmit,
    control,
    trigger,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: service.fields?.reduce((acc, f) => {
      acc[f.name] = '';
      return acc;
    }, {}) || {},
    mode: 'onTouched',
  });

  // Auto-fill from user profile
  useEffect(() => {
    let ignore = false;
    const fillFromProfile = async () => {
      try {
        const res = await getMeAPI();
        const user = res.user || res;
        if (!ignore) {
          const defaults = buildProfileDefaults(service.fields, user);
          reset(defaults);
        }
      } catch {
        // Keep empty defaults if profile fetch fails
      }
    };
    fillFromProfile();
    return () => { ignore = true; };
  }, [service, reset]);

  const allValues = watch();

  const getFieldsForStep = (stepIndex) => {
    const stepId = steps[stepIndex]?.id;
    return (service.fields || []).filter(f => f.step === stepId);
  };

  const isLastContentStep = currentStep === steps.length - 1;
  const isReviewStep = currentStep === steps.length;
  const totalStepsWithReview = steps.length + 1;

  const handleNext = async () => {
    const stepFields = getFieldsForStep(currentStep);
    const fieldNames = stepFields.map(f => f.name);
    const valid = await trigger(fieldNames);
    if (!valid) {
      toast.error('Please fill in all required fields before proceeding.');
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(prev => prev - 1);
  };

  const onSubmit = async (formData) => {
    try {
      await onSubmitRequest(formData, attachments);
      setSubmitted(true);
    } catch (err) {
      toast.error(err.message || 'Failed to submit request');
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center" id="stepper-form-success">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Registration Submitted!</h3>
        <p className="text-gray-600 mb-1">Your <strong>{service.label}</strong> registration has been submitted.</p>
        <p className="text-sm text-gray-500 mb-6">A registrar will review your documents and verify the information.</p>
        <div className="flex justify-center gap-3">
          <button onClick={onBack} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  const renderField = (field) => {
    if (field.type === 'date') {
      return (
        <Controller
          name={field.name}
          control={control}
          rules={{ required: field.required ? `${field.label} is required` : false }}
          render={({ field: { value, onChange } }) => (
            <DualCalendarField
              id={`field-${field.name}`}
              value={value}
              onChange={onChange}
              required={field.required}
            />
          )}
        />
      );
    }

    if (field.type === 'photo') {
      return (
        <Controller
          name={field.name}
          control={control}
          render={({ field: { value, onChange } }) => (
            <div>
              <div className="flex items-center gap-4">
                {(photoPreviews[field.name] || value) && (
                  <img
                    src={photoPreviews[field.name] || `/uploads/${value}`}
                    alt={field.label}
                    className="w-20 h-24 object-cover rounded-lg border-2 border-blue-300 shadow-sm"
                  />
                )}
                <label
                  htmlFor={`photo-${field.name}`}
                  className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl cursor-pointer transition-colors text-sm font-medium"
                >
                  <Camera className="w-4 h-4" />
                  {value ? 'Change Photo' : 'Upload Photo'}
                </label>
                <input
                  id={`photo-${field.name}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setPhotoPreviews(prev => ({ ...prev, [field.name]: URL.createObjectURL(file) }));
                    try {
                      const uploaded = await uploadFile(file);
                      if (uploaded?.filename) {
                        onChange(uploaded.filename);
                      }
                    } catch (err) {
                      toast.error('Failed to upload photo.');
                    }
                  }}
                />
              </div>
              {field.helperText && <p className="text-xs text-gray-500 mt-1.5">{field.helperText}</p>}
            </div>
          )}
        />
      );
    }

    if (field.type === 'select') {
      return (
        <select
          id={`field-${field.name}`}
          {...register(field.name, { required: field.required ? `${field.label} is required` : false })}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-shadow"
        >
          <option value="">Select {field.label.toLowerCase()}</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return (
        <textarea
          id={`field-${field.name}`}
          {...register(field.name, {
            required: field.required ? `${field.label} is required` : false,
            maxLength: { value: 2000, message: 'Maximum 2000 characters' },
          })}
          rows={3}
          placeholder={field.placeholder || ''}
          className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm transition-shadow"
        />
      );
    }

    return (
      <input
        id={`field-${field.name}`}
        type={field.type === 'phone' ? 'tel' : field.type === 'email' ? 'email' : field.type === 'number' ? 'number' : 'text'}
        step={field.type === 'number' ? '0.01' : undefined}
        {...register(field.name, {
          required: field.required ? `${field.label} is required` : false,
          maxLength: { value: 200, message: 'Maximum 200 characters' },
          ...(field.min !== undefined ? { min: { value: field.min, message: `Minimum value is ${field.min}` } } : {}),
        })}
        placeholder={field.placeholder || ''}
        className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
      />
    );
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" id="stepper-form">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{service.label}</h3>
            <p className="text-sm text-gray-500">{service.description}</p>
          </div>
        </div>
      </div>

      {/* Stepper Indicator */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          {[...steps, { id: 'review', label: 'Review & Submit', icon: '✅' }].map((step, idx) => {
            const isActive = idx === currentStep;
            const isCompleted = idx < currentStep;
            return (
              <React.Fragment key={step.id}>
                {idx > 0 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-colors duration-300 ${isCompleted ? 'bg-blue-500' : 'bg-gray-300'}`} />
                )}
                <div className="flex flex-col items-center">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                    ${isCompleted ? 'bg-blue-600 text-white shadow-md' : ''}
                    ${isActive ? 'bg-blue-600 text-white shadow-lg ring-4 ring-blue-100 scale-110' : ''}
                    ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-500' : ''}
                  `}>
                    {isCompleted ? <CheckCircle className="w-5 h-5" /> : <span>{step.icon || idx + 1}</span>}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium whitespace-nowrap ${isActive ? 'text-blue-700' : isCompleted ? 'text-blue-600' : 'text-gray-400'}`}>
                    {step.label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
        {/* Step Content */}
        {!isReviewStep && (
          <>
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
              <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">
                Step {currentStep + 1} of {totalStepsWithReview}: <strong>{steps[currentStep]?.label}</strong>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getFieldsForStep(currentStep).map((field) => {
                const isFullWidth = field.type === 'textarea' || field.type === 'date';
                return (
                  <div key={field.name} className={isFullWidth ? 'md:col-span-2' : ''}>
                    <label htmlFor={`field-${field.name}`} className="block text-sm font-medium text-gray-700 mb-1.5">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {renderField(field)}
                    {errors[field.name] && (
                      <p className="text-xs text-red-500 mt-1">{errors[field.name].message}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Evidence upload on the last content step */}
            {isLastContentStep && (
              <div className="pt-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  📎 Evidence / Supporting Documents <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Upload the required evidence (e.g., hospital birth notification, court order, medical certificate). PDF or JPEG only, max 15MB.
                </p>
                <DocumentUpload
                  value={attachments}
                  onChange={setAttachments}
                  maxSize={15 * 1024 * 1024}
                  acceptedTypes={['application/pdf', 'image/jpeg']}
                  categoryTag={service.categoryTag}
                />
              </div>
            )}
          </>
        )}

        {/* Review Step */}
        {isReviewStep && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 flex items-start gap-3">
              <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-800">
                <strong>Review your information.</strong> Please verify all details before submitting. ID numbers are masked for security.
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowMasked(!showMasked)}
                className="text-xs flex items-center gap-1 text-gray-500 hover:text-gray-700 transition-colors"
              >
                {showMasked ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                {showMasked ? 'Show full values' : 'Mask sensitive data'}
              </button>
            </div>

            {steps.map((step, stepIdx) => {
              const stepFields = getFieldsForStep(stepIdx);
              if (stepFields.length === 0) return null;
              return (
                <div key={step.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <span>{step.icon}</span> {step.label}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                    {stepFields.map((field) => {
                      const val = allValues[field.name];
                      if (field.type === 'photo') {
                        return (
                          <div key={field.name} className="py-1.5">
                            <dt className="text-xs text-gray-500">{field.label}</dt>
                            <dd className="mt-1">
                              {val ? (
                                <img src={photoPreviews[field.name] || `/uploads/${val}`} alt={field.label} className="w-14 h-18 object-cover rounded-lg border border-gray-300" />
                              ) : (
                                <span className="text-sm text-gray-400">No photo uploaded</span>
                              )}
                            </dd>
                          </div>
                        );
                      }
                      const isSensitive = field.name.toLowerCase().includes('id') || field.name.toLowerCase().includes('resident');
                      const displayVal = val ? (isSensitive && showMasked ? maskValue(String(val)) : String(val)) : '—';
                      return (
                        <div key={field.name} className="py-1.5">
                          <dt className="text-xs text-gray-500">{field.label}</dt>
                          <dd className="text-sm font-medium text-gray-900 mt-0.5">{displayVal}</dd>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {attachments.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">📎 Uploaded Evidence</h4>
                <ul className="space-y-1">
                  {attachments.map((a, i) => (
                    <li key={i} className="text-sm text-gray-700">• {a.originalName}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="pt-4 flex gap-3 border-t border-gray-100">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}

          <div className="flex-1" />

          {!isReviewStep ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              Next <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                <><Send className="w-4 h-4" /> Submit Registration</>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
