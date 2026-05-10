import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { Send, ArrowLeft, Paperclip, CheckCircle, Loader2, Lock, IdCard, Camera } from 'lucide-react';
import { uploadFile } from '../../utils/api';
import { getServiceById } from './serviceConfig';
import DocumentUpload from './DocumentUpload';
import DualCalendarField from '../ui/DualCalendarField';
import StepperForm from './StepperForm';
import { createRequest, getMyDigitalId, getMeAPI } from '../../utils/api';
import { toast } from 'sonner';
import { buildProfileDefaults } from './profileAutoFill';
import DigitalIDCard from '../ui/DigitalIDCard';

export default function ServiceForm({ serviceId, onBack, onSuccess }) {
  const navigate = useNavigate();
  const service = getServiceById(serviceId);
  const [attachments, setAttachments] = useState([]);
  const [submitted, setSubmitted] = useState(false);
  const [digitalIdStatus, setDigitalIdStatus] = useState(null);
  const [checkingDigitalId, setCheckingDigitalId] = useState(serviceId === 'new_id_application');
  const [passportPreview, setPassportPreview] = useState(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: service?.fields?.reduce((acc, f) => {
      acc[f.name] = '';
      return acc;
    }, {}) || {},
  });

  useEffect(() => {
    if (!service) return;
    let ignore = false;

    const initForm = async () => {
      try {
        const res = await getMeAPI();
        const user = res.user || res;
        if (!ignore) {
          const defaults = buildProfileDefaults(service.fields, user);
          reset(defaults);
        }
      } catch {
        // Fallback to empty defaults if profile fetch fails
        if (!ignore) {
          const defaults = service.fields.reduce((acc, f) => {
            acc[f.name] = '';
            return acc;
          }, {});
          reset(defaults);
        }
      }
      if (!ignore) {
        setAttachments([]);
        setSubmitted(false);
      }
    };

    initForm();
    return () => { ignore = true; };
  }, [serviceId, service, reset]);

  useEffect(() => {
    let ignore = false;

    if (serviceId !== 'new_id_application') {
      setDigitalIdStatus(null);
      setCheckingDigitalId(false);
      return undefined;
    }

    const checkDigitalId = async () => {
      setCheckingDigitalId(true);
      try {
        const digitalId = await getMyDigitalId();
        if (!ignore && digitalId?.status && digitalId.status !== 'none') {
          setDigitalIdStatus(digitalId.status);
        }
      } catch (error) {
        if (error.status !== 404) {
          toast.error('Unable to confirm your current Digital ID status right now.');
        }
      } finally {
        if (!ignore) {
          setCheckingDigitalId(false);
        }
      }
    };

    checkDigitalId();

    return () => {
      ignore = true;
    };
  }, [serviceId]);

  if (!service) return null;

  const isLockedNewIdApplication = serviceId === 'new_id_application' && !!digitalIdStatus && digitalIdStatus !== 'none';
  const statusLabel = (digitalIdStatus || '').replace(/_/g, ' ');
  const isMultiStep = !!service.steps;

  // ── Shared submit handler ──
  const doSubmit = async (formData, formAttachments) => {
    const atts = formAttachments || attachments;
    const { _priority = 'medium', ...requestFormData } = formData;

    const subjectField = requestFormData.firstName
      ? `${requestFormData.firstName} ${requestFormData.fatherName || ''} ${requestFormData.grandfatherName || ''}`.trim()
      : (requestFormData.fullName || requestFormData.regFirstName || requestFormData.childFullName
      || requestFormData.applicantName || requestFormData.businessName || requestFormData.eventName
      || requestFormData.projectTitle || requestFormData.deceasedFullName || requestFormData.groomFullName
      || requestFormData.spouse1FullName || service.label);

    const descriptionField = requestFormData.description || requestFormData.projectDescription
      || requestFormData.businessDescription || requestFormData.eventDescription
      || requestFormData.additionalNotes || `${service.label} request`;

    const payload = {
      type: service.requestType,
      category: service.groupLabel,
      subject: `${service.label} - ${subjectField}`,
      description: typeof descriptionField === 'string' ? descriptionField : `${service.label} request submitted`,
      priority: _priority,
      serviceType: service.label,
      categoryTag: service.categoryTag,
      formData: requestFormData,
      attachments: atts.map(a => ({
        filename: a.filename,
        originalName: a.originalName,
      })),
    };

    await createRequest(payload);
  };

  // ── Multi-step vital event forms ──
  if (isMultiStep) {
    return (
      <StepperForm
        service={service}
        onBack={onBack}
        onSubmitRequest={async (formData, formAttachments) => {
          await doSubmit(formData, formAttachments);
        }}
      />
    );
  }

  // ── Flat form submission ──
  const onSubmit = async (formData) => {
    try {
      await doSubmit(formData);
      setSubmitted(true);
      toast.success('Request submitted successfully!');
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      toast.error(err.message || 'Failed to submit request');
    }
  };

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center" id="service-form-success">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Submitted!</h3>
        <p className="text-gray-600 mb-1">Your <strong>{service.label}</strong> request has been submitted.</p>
        <p className="text-sm text-gray-500 mb-6">
          An employee will be assigned and you can track progress in "My Requests".
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={onBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Submit Another
          </button>
          <button
            onClick={onSuccess}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            View My Requests
          </button>
        </div>
      </div>
    );
  }

  if (checkingDigitalId) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Checking Digital ID eligibility</h3>
        <p className="text-sm text-gray-500">Please wait while we confirm whether a new ID application can be submitted.</p>
      </div>
    );
  }

  if (isLockedNewIdApplication) {
    const isIssued = ['issued', 'approved'].includes(digitalIdData?.status);
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" id="service-form-readonly">
        <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center gap-3">
            <button type="button" onClick={onBack} className="p-2 hover:bg-white rounded-lg transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{service.label}</h3>
              <p className="text-sm text-gray-500">This request is unavailable because you already have a Digital ID record on file.</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-5">
          {isIssued ? (
            <div className="mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-4">Your Currently Issued ID Card:</p>
              <DigitalIDCard digitalId={digitalIdData} resident={digitalIdData.user} currentStatus={digitalIdData.status} />
            </div>
          ) : (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-amber-700" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-900">Application already on file</p>
                <p className="text-sm text-amber-800 mt-1">
                  Your current Digital ID status is <span className="capitalize font-medium">{statusLabel}</span>. Use <strong>ID Renewal</strong>
                  for replacements or updates, or open your Digital ID page to track the existing record.
                </p>
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button type="button" onClick={onBack} className="flex-1 px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors">
              Back to Services
            </button>
            <button type="button" onClick={() => navigate('/resident/digital-id')} className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors">
              <IdCard className="w-4 h-4" />
              Open My Digital ID
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" id="service-form">
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

      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
          <Send className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Complete the form below. Your request will be automatically assigned to the relevant department.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {service.fields.map((field) => {
            const isFullWidth = field.type === 'textarea' || field.type === 'date' || field.type === 'file';
            return (
              <div key={field.name} className={isFullWidth ? 'md:col-span-2' : ''}>
                <label
                  htmlFor={`field-${field.name}`}
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === 'date' ? (
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
                ) : field.type === 'select' ? (
                  <select
                    id={`field-${field.name}`}
                    {...register(field.name, {
                      required: field.required ? `${field.label} is required` : false,
                    })}
                    className="notranslate w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-shadow"
                  >
                    <option value="">Select {field.label.toLowerCase()}</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : field.type === 'textarea' ? (
                  <textarea
                    id={`field-${field.name}`}
                    {...register(field.name, {
                      required: field.required ? `${field.label} is required` : false,
                      maxLength: { value: 2000, message: 'Maximum 2000 characters' },
                    })}
                    rows={4}
                    placeholder={field.placeholder || ''}
                    className="notranslate w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm transition-shadow"
                  />
                ) : field.type === 'file' ? (
                  <div>
                    <div className="flex items-center gap-4">
                      {passportPreview && (
                        <img src={passportPreview} alt="Preview" className="w-16 h-20 object-cover rounded-lg border-2 border-blue-300 shadow-sm" />
                      )}
                      <label
                        htmlFor={`field-${field.name}`}
                        className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl cursor-pointer transition-colors text-sm font-medium"
                      >
                        <Camera className="w-4 h-4" />
                        {passportPreview ? 'Change Photo' : 'Upload Photo'}
                      </label>
                      <input
                        id={`field-${field.name}`}
                        type="file"
                        accept={field.accept || 'image/*'}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          // Show preview
                          setPassportPreview(URL.createObjectURL(file));
                          // Upload immediately
                          try {
                            const uploaded = await uploadFile(file);
                            if (uploaded?.filename) {
                              setAttachments(prev => [...prev.filter(a => a.originalName !== file.name), { filename: uploaded.filename, originalName: file.name }]);
                            }
                          } catch (err) {
                            toast.error('Failed to upload photo.');
                          }
                        }}
                      />
                    </div>
                    {field.helperText && <p className="text-xs text-gray-500 mt-1.5">{field.helperText}</p>}
                  </div>
                ) : (
                  <input
                    id={`field-${field.name}`}
                    type={field.type === 'phone' ? 'tel' : field.type === 'email' ? 'email' : 'text'}
                    {...register(field.name, {
                      required: field.required ? `${field.label} is required` : false,
                      maxLength: { value: 200, message: 'Maximum 200 characters' },
                    })}
                    placeholder={field.placeholder || ''}
                    className="notranslate w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
                  />
                )}

                {errors[field.name] && (
                  <p className="text-xs text-red-500 mt-1">{errors[field.name].message}</p>
                )}
              </div>
            );
          })}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Paperclip className="w-4 h-4 inline mr-1" />
            Supporting Documents <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <DocumentUpload value={attachments} onChange={setAttachments} categoryTag={service.categoryTag} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Priority Level</label>
          <div className="flex gap-2">
            {[
              { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' },
              { value: 'medium', label: 'Medium', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' },
              { value: 'high', label: 'Urgent', color: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100' },
            ].map((p) => (
              <label key={p.value} className="flex-1">
                <input type="radio" {...register('_priority')} value={p.value} className="sr-only peer" defaultChecked={p.value === 'medium'} />
                <div className={`text-center py-2 px-3 rounded-lg border text-sm font-medium cursor-pointer transition-all peer-checked:ring-2 peer-checked:ring-blue-400 peer-checked:border-blue-400 ${p.color}`}>
                  {p.label}
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="pt-4 flex gap-3 border-t border-gray-100">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Request
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onBack}
            className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
