import React from 'react';
import { CheckCircle, Clock, Search, Settings, Package } from 'lucide-react';

const STEPS = [
  { key: 'pending', label: 'Pending', icon: Clock },
  { key: 'verifying', label: 'Verifying', icon: Search },
  { key: 'processing', label: 'Processing', icon: Settings },
  { key: 'completed', label: 'Completed', icon: Package },
];

const STATUS_TO_STEP = {
  pending: 0,
  assigned: 0,
  verifying: 1,
  'in-progress': 2,
  processing: 2,
  completed: 3,
  resolved: 3,
  approved: 3,
};

export default React.memo(function WorkflowStepper({ status = 'pending' }) {
  const currentStep = STATUS_TO_STEP[status] ?? 0;

  return (
    <div className="flex items-center w-full" id="workflow-stepper">
      {STEPS.map((step, idx) => {
        const Icon = step.icon;
        const isCompleted = idx < currentStep;
        const isActive = idx === currentStep;
        const isPending = idx > currentStep;

        return (
          <React.Fragment key={step.key}>
            {/* Step Node */}
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
                  <CheckCircle className="w-4.5 h-4.5" />
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

            {/* Connector Line */}
            {idx < STEPS.length - 1 && (
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
