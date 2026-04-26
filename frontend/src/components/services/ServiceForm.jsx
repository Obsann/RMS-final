import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Send, ArrowLeft, Paperclip, CheckCircle, Loader2 } from 'lucide-react';
import { getServiceById } from './serviceConfig';
import DocumentUpload from './DocumentUpload';
import { createRequest } from '../../utils/api';
import { toast } from 'sonner';

export default function ServiceForm({ serviceId, onBack, onSuccess }) {
  const service = getServiceById(serviceId);
  const [attachments, setAttachments] = useState([]);
  const [submitted, setSubmitted] = useState(false);

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

  // Reset form when service changes
  useEffect(() => {
    if (service) {
      const defaults = service.fields.reduce((acc, f) => {
        acc[f.name] = '';
        return acc;
      }, {});
      reset(defaults);
      setAttachments([]);
      setSubmitted(false);
    }
  }, [serviceId, service, reset]);

  if (!service) return null;

  const onSubmit = async (formData) => {
    try {
      // Build the subject line from key fields
      const subjectField = formData.fullName || formData.applicantName || formData.childFullName
        || formData.businessName || formData.eventName || formData.projectTitle
        || formData.deceasedName || service.label;

      const descriptionField = formData.description || formData.projectDescription
        || formData.businessDescription || formData.eventDescription
        || formData.additionalNotes || `${service.label} request`;

      const payload = {
        type: service.requestType,
        category: service.groupLabel,
        subject: `${service.label} — ${subjectField}`,
        description: typeof descriptionField === 'string' ? descriptionField : `${service.label} request submitted`,
        priority: 'medium',
        serviceType: service.label,
        categoryTag: service.categoryTag,
        formData,
        attachments: attachments.map(a => ({
          filename: a.filename,
          originalName: a.originalName,
        })),
      };

      await createRequest(payload);
      setSubmitted(true);
      toast.success('Request submitted successfully!');

      // Auto-redirect after showing success
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 2000);
    } catch (err) {
      toast.error(err.message || 'Failed to submit request');
    }
  };

  // Success state
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" id="service-form">
      {/* Form Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{service.label}</h3>
            <p className="text-sm text-gray-500">{service.description}</p>
          </div>
        </div>
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
        {/* Info Banner */}
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 flex items-start gap-3">
          <Send className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-blue-800">
            Complete the form below. Your request will be automatically assigned to the relevant department.
          </p>
        </div>

        {/* Dynamic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {service.fields.map((field) => {
            const isFullWidth = field.type === 'textarea';
            return (
              <div key={field.name} className={isFullWidth ? 'md:col-span-2' : ''}>
                <label
                  htmlFor={`field-${field.name}`}
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>

                {field.type === 'select' ? (
                  <select
                    id={`field-${field.name}`}
                    {...register(field.name, {
                      required: field.required ? `${field.label} is required` : false,
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm transition-shadow"
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
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm transition-shadow"
                  />
                ) : field.type === 'date' ? (
                  <input
                    id={`field-${field.name}`}
                    type="date"
                    {...register(field.name, {
                      required: field.required ? `${field.label} is required` : false,
                    })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
                  />
                ) : (
                  <input
                    id={`field-${field.name}`}
                    type={field.type === 'phone' ? 'tel' : field.type === 'email' ? 'email' : 'text'}
                    {...register(field.name, {
                      required: field.required ? `${field.label} is required` : false,
                      maxLength: { value: 200, message: 'Maximum 200 characters' },
                    })}
                    placeholder={field.placeholder || ''}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-shadow"
                  />
                )}

                {errors[field.name] && (
                  <p className="text-xs text-red-500 mt-1">{errors[field.name].message}</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Document Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            <Paperclip className="w-4 h-4 inline mr-1" />
            Supporting Documents <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <DocumentUpload value={attachments} onChange={setAttachments} />
        </div>

        {/* Priority */}
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

        {/* Submit */}
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
