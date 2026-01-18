import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function CareerRoadmapPage() {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center bg-gradient-hero px-4 py-12">
                <div className="text-center max-w-2xl">
                    <h1 className="text-4xl sm:text-5xl font-poppins font-bold text-charcoal mb-4">
                        Career Roadmap
                    </h1>
                    <p className="text-lg text-charcoal-light">
                        Coming soon! We&apos;re building an interactive career roadmap to help you plan your professional journey.
                    </p>
                </div>
            </main>

            <Footer />
        </div>
    );
}
