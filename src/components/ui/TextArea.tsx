"use client";

import React, { forwardRef } from "react";

interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
  showCount?: boolean;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  (
    {
      label,
      error,
      helperText,
      maxLength,
      showCount = false,
      className = "",
      id,
      value,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const currentLength = typeof value === "string" ? value.length : 0;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-charcoal mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={inputId}
            value={value}
            maxLength={maxLength}
            className={`
              w-full px-4 py-3 rounded-xl border-2 bg-white
              placeholder:text-gray-400 text-charcoal font-inter
              focus:outline-none focus:ring-0 transition-colors duration-200
              resize-none min-h-[120px]
              ${
                error
                  ? "border-red-400 focus:border-red-500"
                  : "border-gray-200 focus:border-career-blue"
              }
              ${className}
            `}
            {...props}
          />
          {showCount && maxLength && (
            <div
              className={`absolute bottom-3 right-3 text-xs ${
                currentLength >= maxLength ? "text-red-500" : "text-gray-400"
              }`}
            >
              {currentLength}/{maxLength}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

TextArea.displayName = "TextArea";

