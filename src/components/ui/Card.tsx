"use client";

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
}

export function Card({
  children,
  className = "",
  padding = "md",
  shadow = "md",
}: CardProps) {
  const paddings = {
    none: "",
    sm: "p-3",
    md: "p-5",
    lg: "p-8",
  };

  const shadows = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-card",
    lg: "shadow-soft",
  };

  return (
    <div
      className={`
        bg-white rounded-2xl
        ${paddings[padding]}
        ${shadows[shadow]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

