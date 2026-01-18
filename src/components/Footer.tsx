import Link from "next/link";
import Image from "next/image";

export default function Footer() {
    return (
        <footer className="bg-charcoal text-white py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* Footer Navigation */}
                <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 mb-8">
                    <Link
                        href="/"
                        className="text-sm font-semibold text-white hover:text-career-blue-light transition-colors uppercase tracking-wide"
                    >
                        Home
                    </Link>
                    <Link
                        href="/builder/step-1"
                        className="text-sm font-semibold text-white hover:text-career-blue-light transition-colors uppercase tracking-wide"
                    >
                        Builder
                    </Link>
                    <Link
                        href="/career-roadmap"
                        className="text-sm font-semibold text-white hover:text-career-blue-light transition-colors uppercase tracking-wide"
                    >
                        Career Roadmap
                    </Link>
                </div>

                {/* Divider */}
                <div className="border-t border-gray-700 my-8" />

                {/* Logo and Copyright */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <Image
                        src="/logo.svg"
                        alt="FirstCareerSteps"
                        width={200}
                        height={45}
                        className="h-11 w-auto"
                    />
                    <p className="text-gray-400 text-sm text-center">
                        © {new Date().getFullYear()} FirstCareerSteps. Built for students,
                        by educators.
                    </p>
                </div>
            </div>
        </footer>
    );
}
