import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Check, Sparkles, FileText, Map, Linkedin, Download } from 'lucide-react';

export default function BuilderLandingPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="bg-gradient-hero pt-20 pb-16 px-4">
                    <div className="max-w-6xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full mb-8 animate-fade-in shadow-sm">
                            <span className="w-2 h-2 bg-career-blue rounded-full animate-pulse" />
                            <span className="text-sm font-medium text-charcoal">
                                Everything you need to launch your career
                            </span>
                        </div>

                        <h1 className="text-4xl md:text-6xl font-poppins font-bold text-charcoal mb-6 leading-tight">
                            Build Your Future <br />
                            <span className="text-gradient">For Just $9.99</span>
                        </h1>

                        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
                            Get unlimited access to our AI Resume Builder, Career Roadmap Generator,
                            and LinkedIn Optimizer. One price, lifetime access.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/builder/step-1"
                                className="px-8 py-4 bg-career-blue text-white font-semibold text-lg rounded-xl hover:bg-career-blue-dark transition-all duration-200 shadow-lg shadow-career-blue/25 hover:-translate-y-1"
                            >
                                Start Building Now
                            </Link>
                            <Link
                                href="#features"
                                className="px-8 py-4 bg-white text-charcoal font-semibold text-lg rounded-xl hover:bg-gray-50 transition-all duration-200 border-2 border-gray-200"
                            >
                                See Features
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Pricing Card Section */}
                <section className="py-20 bg-white">
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="bg-gradient-to-b from-white to-soft-sky/30 rounded-3xl p-1 shadow-2xl">
                            <div className="bg-white rounded-[22px] p-8 md:p-12">
                                <div className="text-center mb-10">
                                    <h2 className="text-3xl font-poppins font-bold text-charcoal mb-4">
                                        All-in-One Career Bundle
                                    </h2>
                                    <div className="flex items-baseline justify-center gap-2">
                                        <span className="text-6xl font-bold text-career-blue">$9.99</span>
                                        <span className="text-xl text-gray-500 font-medium">/ lifetime</span>
                                    </div>
                                    <p className="text-gray-500 mt-2">No subscriptions. No hidden fees.</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-8 mb-10">
                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-charcoal text-lg mb-4 flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-career-blue" />
                                            AI Resume Builder
                                        </h3>
                                        <ul className="space-y-3">
                                            {[
                                                'ATS-friendly templates',
                                                'AI-generated content',
                                                'Step-by-step guidance',
                                                'Unlimited PDF downloads'
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-center gap-3 text-gray-600">
                                                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    </div>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="font-semibold text-charcoal text-lg mb-4 flex items-center gap-2">
                                            <Map className="w-5 h-5 text-optimism-orange" />
                                            Career Roadmap
                                        </h3>
                                        <ul className="space-y-3">
                                            {[
                                                'Personalized career paths',
                                                'Visual infographics',
                                                'Curated free courses',
                                                'LinkedIn optimization'
                                            ].map((item, i) => (
                                                <li key={i} className="flex items-center gap-3 text-gray-600">
                                                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                                        <Check className="w-3 h-3 text-green-600" />
                                                    </div>
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <Link
                                        href="/builder/step-1"
                                        className="inline-flex items-center gap-2 px-10 py-5 bg-step-green text-white font-bold text-xl rounded-xl hover:bg-step-green/90 transition-all shadow-xl hover:scale-105 active:scale-95"
                                    >
                                        Get Full Access for $9.99
                                        <Sparkles className="w-5 h-5" />
                                    </Link>
                                    <p className="mt-4 text-sm text-gray-500">
                                        🔒 Secure payment via Stripe
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Detailed Features Grid */}
                <section id="features" className="py-20 bg-gray-50">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-bold text-charcoal mb-4">Why Students Choose Us</h2>
                            <p className="text-gray-600 max-w-2xl mx-auto">
                                We&apos;ve built the most student-friendly career tools available, designed
                                to help you succeed from day one.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: <Sparkles className="w-8 h-8 text-career-blue" />,
                                    title: "AI Writing Assistant",
                                    desc: "Never struggle with what to write again. Our AI helps you craft professional bullet points."
                                },
                                {
                                    icon: <Map className="w-8 h-8 text-step-green" />,
                                    title: "Visual Career Paths",
                                    desc: "See exactly what steps you need to take to reach your dream career goals."
                                },
                                {
                                    icon: <Linkedin className="w-8 h-8 text-blue-600" />,
                                    title: "LinkedIn Content",
                                    desc: "Expand your professional network with AI-generated headlines and bio content."
                                },
                                {
                                    icon: <Download className="w-8 h-8 text-optimism-orange" />,
                                    title: "Unlimited PDFs",
                                    desc: "Download as many versions of your resume as you need, whenever you need them."
                                },
                                {
                                    icon: <FileText className="w-8 h-8 text-purple-600" />,
                                    title: "ATS-Friendly",
                                    desc: "Templates designed to pass Applicant Tracking Systems and get you noticed."
                                },
                                {
                                    icon: <Check className="w-8 h-8 text-teal-600" />,
                                    title: "Beginner Focused",
                                    desc: "Built specifically for students and first-time job seekers. No experience? No problem."
                                }
                            ].map((feature, i) => (
                                <div key={i} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="mb-4 bg-gray-50 w-16 h-16 rounded-xl flex items-center justify-center">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-xl font-bold text-charcoal mb-3">{feature.title}</h3>
                                    <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
