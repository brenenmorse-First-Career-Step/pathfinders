'use client';

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
// Updated navigation - removed LinkedIn Builder, renamed to Builder

export default function Header() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            setIsLoggingOut(true);
            await signOut();
            router.push('/');
            router.refresh();
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <header className="w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
                <div className="flex items-center justify-between">
                    <Link href="/">
                        <Image
                            src="/logo.svg"
                            alt="FirstCareerSteps"
                            width={240}
                            height={55}
                            className="h-14 w-auto"
                        />
                    </Link>

                    {/* Desktop Navigation */}
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
                            Builder
                        </Link>
                        <Link
                            href="/career-roadmap"
                            className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide"
                        >
                            Career Roadmap
                        </Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {loading ? (
                            // Show loading state
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-8 bg-gray-200 animate-pulse rounded"></div>
                                <div className="w-24 h-10 bg-gray-200 animate-pulse rounded-xl"></div>
                            </div>
                        ) : user ? (
                            // Show Dashboard and Logout when user is logged in
                            <>
                                <Link
                                    href="/dashboard"
                                    className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    disabled={isLoggingOut}
                                    className="px-5 py-2.5 bg-career-blue text-white font-medium rounded-xl hover:bg-career-blue-dark transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoggingOut ? 'Logging out...' : 'Logout'}
                                </button>
                            </>
                        ) : (
                            // Show Sign In and Get Started when user is not logged in
                            <>
                                <Link
                                    href="/login"
                                    className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-5 py-2.5 bg-career-blue text-white font-medium rounded-xl hover:bg-career-blue-dark transition-all duration-200 active:scale-[0.98]"
                                >
                                    Get Started
                                </Link>
                            </>
                        )}

                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden p-2 text-charcoal hover:bg-soft-sky rounded-lg transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {isMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <nav className={`md:hidden mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3 transition-all duration-300 ${isMenuOpen ? 'block' : 'hidden'}`}>
                    <Link
                        href="/"
                        onClick={() => setIsMenuOpen(false)}
                        className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide py-2"
                    >
                        Home
                    </Link>
                    <Link href="/builder/step-1" className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide py-2">
                        Builder
                    </Link>
                    <Link href="/career-roadmap" className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide py-2">
                        Career Roadmap
                    </Link>
                    {user ? (
                        <>
                            <Link
                                href="/dashboard"
                                onClick={() => setIsMenuOpen(false)}
                                className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide py-2"
                            >
                                Dashboard
                            </Link>
                            <button
                                onClick={() => {
                                    handleLogout();
                                    setIsMenuOpen(false);
                                }}
                                disabled={isLoggingOut}
                                className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide py-2 text-left disabled:opacity-50"
                            >
                                {isLoggingOut ? 'Logging out...' : 'Logout'}
                            </button>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            onClick={() => setIsMenuOpen(false)}
                            className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide py-2"
                        >
                            Sign In
                        </Link>
                    )}
                </nav>
            </div>
        </header>
    );
}
