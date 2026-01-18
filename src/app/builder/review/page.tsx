"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Header } from "@/components/layout";
import { Button } from "@/components/ui";
import { useProfile } from "@/context/ProfileContext";
import { LiveResumePreview } from "@/components/LiveResumePreview";

export default function ReviewPage() {
  const router = useRouter();
  const { profile, setCurrentStep } = useProfile();
  const { user } = useAuth();

  const handleCompleteAndPay = () => {
    router.push('/checkout');
  };

  const handleEditSection = (step: number) => {
    setCurrentStep(step);
    router.push(`/builder/step-${step}`);
  };



  return (
    <div className="min-h-screen bg-gradient-to-b from-soft-sky/30 to-white">
      <Header showBack onBack={() => router.push("/builder/step-6")} minimal />

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 bg-step-green rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-charcoal mb-2">
            Review Your Resume
          </h1>
          <p className="text-gray-600">
            Everything looks good? Complete your payment to download
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column - Edit Sections */}
          <div className="flex-1 space-y-4">
            <h2 className="text-xl font-bold text-charcoal mb-4">Edit Sections</h2>

            <button
              onClick={() => handleEditSection(1)}
              className="w-full text-left p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-career-blue transition-all"
            >
              <h3 className="font-semibold text-charcoal mb-1">Student Basics</h3>
              <p className="text-sm text-gray-600">Name, school, interests</p>
            </button>

            <button
              onClick={() => handleEditSection(2)}
              className="w-full text-left p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-career-blue transition-all"
            >
              <h3 className="font-semibold text-charcoal mb-1">Headline</h3>
              <p className="text-sm text-gray-600">{profile.headline || "Add your headline"}</p>
            </button>

            <button
              onClick={() => handleEditSection(3)}
              className="w-full text-left p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-career-blue transition-all"
            >
              <h3 className="font-semibold text-charcoal mb-1">About Section</h3>
              <p className="text-sm text-gray-600 line-clamp-2">{profile.generatedAbout || "Add about section"}</p>
            </button>

            <button
              onClick={() => handleEditSection(4)}
              className="w-full text-left p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-career-blue transition-all"
            >
              <h3 className="font-semibold text-charcoal mb-1">Experiences</h3>
              <p className="text-sm text-gray-600">{profile.experiences?.length || 0} experiences added</p>
            </button>

            <button
              onClick={() => handleEditSection(5)}
              className="w-full text-left p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-career-blue transition-all"
            >
              <h3 className="font-semibold text-charcoal mb-1">Skills</h3>
              <p className="text-sm text-gray-600">{profile.skills?.length || 0} skills selected</p>
            </button>

            <button
              onClick={() => handleEditSection(6)}
              className="w-full text-left p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-career-blue transition-all"
            >
              <h3 className="font-semibold text-charcoal mb-1">Profile Photo</h3>
              <p className="text-sm text-gray-600">{profile.photoUrl ? "Photo added" : "No photo"}</p>
            </button>

            {/* Action Buttons */}
            <div className="pt-4">
              <Button
                onClick={handleCompleteAndPay}
                size="lg"
                fullWidth
                className="bg-step-green hover:bg-step-green/90"
              >
                Complete & Pay $9
              </Button>
              <p className="text-xs text-center text-gray-500 mt-2">
                Secure payment via Stripe • LinkedIn content available after payment
              </p>
            </div>
          </div>

          {/* Right Column - Live Preview with Watermark */}
          <div className="flex-1 lg:sticky lg:top-6 h-fit">
            <h2 className="text-xl font-bold text-charcoal mb-4">Preview</h2>
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 font-medium">
                🔒 Watermark will be removed after payment
              </p>
            </div>
            <LiveResumePreview
              fullName={profile.fullName}
              email={user?.email}
              phone={profile.phone}
              location={profile.location}
              linkedin={profile.linkedin}
              headline={profile.headline}
              aboutText={profile.generatedAbout}
              highSchool={profile.highSchool}
              graduationYear={profile.graduationYear}
              skills={profile.skills}
              experiences={profile.experiences}
              certifications={profile.certifications}
              photoUrl={profile.photoUrl}
              showPhoto={profile.showPhotoOnResume}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
