"use client";

import React from "react";

interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
  disabled?: boolean;
  size?: "sm" | "md";
}

export function Chip({
  label,
  selected = false,
  onClick,
  removable = false,
  onRemove,
  disabled = false,
  size = "md",
}: ChipProps) {
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-2 rounded-full font-medium
        transition-all duration-200 border-2
        ${sizes[size]}
        ${
          selected
            ? "bg-career-blue text-white border-career-blue"
            : "bg-white text-charcoal border-gray-200 hover:border-career-blue hover:text-career-blue"
        }
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
    >
      {label}
      {removable && selected && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              onRemove?.();
            }
          }}
          className="ml-1 hover:bg-white/20 rounded-full p-0.5"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </span>
      )}
    </button>
  );
}

