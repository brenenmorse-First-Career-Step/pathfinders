import Link from "next/link";
import Image from "next/image";
// Updated navigation - removed LinkedIn Builder, renamed to Builder

export default function Header() {
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

                        {/* Mobile Menu Button */}
                        <button className="md:hidden p-2 text-charcoal hover:bg-soft-sky rounded-lg transition-colors">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <nav className="md:hidden mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3 hidden">
                    <Link href="/" className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide py-2">
                        Home
                    </Link>
                    <Link href="/builder/step-1" className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide py-2">
                        Builder
                    </Link>
                    <Link href="/career-roadmap" className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide py-2">
                        Career Roadmap
                    </Link>
                    <Link href="/login" className="text-sm font-semibold text-charcoal hover:text-career-blue transition-colors uppercase tracking-wide py-2">
                        Sign In
                    </Link>
                </nav>
            </div>
        </header>
    );
}
