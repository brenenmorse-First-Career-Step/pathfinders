"use client";

import React from "react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export function ProgressBar({
  currentStep,
  totalSteps,
  stepLabels,
}: ProgressBarProps) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* Progress Bar */}
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-career-blue to-step-green rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Step Counter */}
      <div className="flex justify-between items-center mt-2">
        <span className="text-sm font-medium text-charcoal">
          Step {currentStep} of {totalSteps}
        </span>
        {stepLabels && stepLabels[currentStep - 1] && (
          <span className="text-sm text-gray-500">
            {stepLabels[currentStep - 1]}
          </span>
        )}
      </div>
    </div>
  );
}

