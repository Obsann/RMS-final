import React from 'react';
import { CheckCircle, Clock, Loader2, Package, XCircle } from 'lucide-react';
import { STATUS_STEPS, STATUS_TO_STEP_INDEX } from './serviceConfig';

const STEP_ICONS = [Clock, Loader2, Package];

export default React.memo(function RequestTracker({ status = 'pending', compact = false }) {
  const currentStep = STATUS_TO_STEP_INDEX[status] ?? 0;
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
          <XCircle className="w-4 h-4 text-red-500" />
        </div>
        <span className="text-xs font-semibold text-red-600">Cancelled</span>
      </div>
    );
  }

  if (compact) {
    // Compact inline version for table cells
    return (
      <div className="flex items-center gap-1.5">
        {STATUS_STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isActive = idx === currentStep;

          return (
            <React.Fragment key={step.key}>
              <div
                className={`
                  w-2.5 h-2.5 rounded-full transition-all duration-300
                  ${isCompleted
                    ? 'bg-green-500 shadow-sm shadow-green-200'
                    : isActive
                      ? 'bg-blue-600 shadow-sm shadow-blue-200 animate-pulse'
                      : 'bg-gray-200'
                  }
                `}
                title={step.label}
              />
              {idx < STATUS_STEPS.length - 1 && (
                <div className={`w-4 h-0.5 ${isCompleted ? 'bg-green-400' : 'bg-gray-200'}`} />
              )}
            </React.Fragment>
          );
        })}
        <span className={`ml-1.5 text-xs font-medium ${
          currentStep >= 2 ? 'text-green-600' : currentStep >= 1 ? 'text-blue-600' : 'text-amber-600'
        }`}>
          {STATUS_STEPS[Math.min(currentStep, STATUS_STEPS.length - 1)]?.label}
        </span>
      </div>
    );
  }

  // Full stepper
  return (
    <div className="flex items-center w-full" id="request-tracker">
      {STATUS_STEPS.map((step, idx) => {
        const Icon = STEP_ICONS[idx];
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;

        return (
          <React.Fragment key={step.key}>
            <div className="flex flex-col items-center relative z-10">
              <div
                className={`
                  w-9 h-9 rounded-full flex items-center justify-center transition-all duration-500 border-2
                  ${isCompleted
                    ? 'bg-green-500 border-green-500 text-white shadow-md shadow-green-200'
                    : isActive
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-200 animate-pulse'
                      : 'bg-white border-gray-200 text-gray-400'
                  }
                `}
              >
                {isCompleted ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={`text-[10px] font-semibold mt-1.5 whitespace-nowrap ${
                  isCompleted ? 'text-green-600' : isActive ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {idx < STATUS_STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-1 relative -top-2.5">
                <div className="h-full bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isCompleted ? 'bg-green-500 w-full' : 'bg-gray-200 w-0'
                    }`}
                    style={{ width: isCompleted ? '100%' : '0%' }}
                  />
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
});
