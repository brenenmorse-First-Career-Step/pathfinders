
import Image from "next/image";

export default function Footer() {
    return (
        <footer className="bg-charcoal text-white py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
                {/* Footer Navigation */}


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
