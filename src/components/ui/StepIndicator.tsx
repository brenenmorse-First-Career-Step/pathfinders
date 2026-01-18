"use client";

import React from "react";

interface Step {
  number: number;
  label: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number;
  completedSteps: number[];
}

export function StepIndicator({
  steps,
  currentStep,
  completedSteps,
}: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between w-full max-w-md mx-auto">
      {steps.map((step, index) => {
        const isComplete = completedSteps.includes(step.number);
        const isCurrent = currentStep === step.number;
        const isPending = !isComplete && !isCurrent;

        return (
          <React.Fragment key={step.number}>
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center font-poppins font-semibold text-sm
                  transition-all duration-300
                  ${isComplete ? "bg-step-green text-white" : ""}
                  ${isCurrent ? "bg-career-blue text-white ring-4 ring-soft-sky" : ""}
                  ${isPending ? "bg-gray-200 text-gray-500" : ""}
                `}
              >
                {isComplete ? (
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              {/* Label - hidden on mobile, visible on larger screens */}
              <span
                className={`
                  hidden sm:block mt-2 text-xs font-medium text-center max-w-[60px]
                  ${isCurrent ? "text-career-blue" : ""}
                  ${isComplete ? "text-step-green" : ""}
                  ${isPending ? "text-gray-400" : ""}
                `}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 mx-2 h-0.5 relative">
                <div className="absolute inset-0 bg-gray-200 rounded-full" />
                <div
                  className={`
                    absolute inset-0 rounded-full transition-all duration-500
                    ${isComplete ? "bg-step-green" : "bg-gray-200"}
                  `}
                  style={{
                    width: isComplete ? "100%" : isCurrent ? "50%" : "0%",
                    background: isCurrent
                      ? "linear-gradient(to right, #43A047, #1E88E5)"
                      : undefined,
                  }}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

