import React, { useRef, useEffect } from "react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels?: string[];
}

export function ProgressBar({
  currentStep,
  totalSteps,
  stepLabels = [],
}: ProgressBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to the active step on smaller screens
  useEffect(() => {
    if (containerRef.current) {
      const activeElement = containerRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentStep]);

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide snap-x"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {Array.from({ length: totalSteps }).map((_, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const label = stepLabels[index] || `Step ${stepNumber}`;

          return (
            <React.Fragment key={stepNumber}>
              <div
                className="flex items-center gap-1.5 whitespace-nowrap snap-center shrink-0"
                data-active={isActive ? "true" : "false"}
              >
                {/* Step Circle */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${isActive
                      ? "bg-career-blue text-white ring-4 ring-soft-sky"
                      : isCompleted
                        ? "bg-step-green text-white"
                        : "bg-gray-100 text-gray-400"
                    }`}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    stepNumber
                  )}
                </div>

                {/* Step Label */}
                <span
                  className={`text-sm font-medium ${isActive
                      ? "text-charcoal"
                      : isCompleted
                        ? "text-charcoal"
                        : "text-gray-400"
                    }`}
                >
                  {label}
                </span>
              </div>

              {/* Arrow Separator */}
              {stepNumber < totalSteps && (
                <div className="shrink-0 text-gray-300 mx-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

