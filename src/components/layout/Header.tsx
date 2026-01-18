"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";

interface HeaderProps {
  showBack?: boolean;
  onBack?: () => void;
  minimal?: boolean;
}

export function Header({ showBack = false, onBack, minimal = false }: HeaderProps) {
  return (
    <header className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left: Back button or Logo */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-soft-sky rounded-full transition-colors"
              aria-label="Go back"
            >
              <svg
                className="w-6 h-6 text-charcoal"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
          )}
          <Link href="/">
            <Image
              src="/logo.svg"
              alt="FirstCareerSteps"
              width={220}
              height={50}
              className="h-12 w-auto"
            />
          </Link>
        </div>

        {/* Center: Navigation */}
        {!minimal && (
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide"
            >
              Home
            </Link>
            <Link
              href="/builder/step-1"
              className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide"
            >
              LinkedIn Build
            </Link>
            <Link
              href="/builder/step-1"
              className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide"
            >
              Resume Build
            </Link>
            <Link
              href="/career-roadmap"
              className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide"
            >
              Career Roadmap
            </Link>
          </nav>
        )}

        {/* Right: CTA */}
        {!minimal && (
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-career-blue text-white font-medium rounded-xl hover:bg-career-blue-dark transition-all duration-200 active:scale-[0.98]"
          >
            Get Started
          </Link>
        )}
      </div>
    </header>
  );
}

