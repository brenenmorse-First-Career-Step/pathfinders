"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BuilderLayout } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { useProfile } from "@/context/ProfileContext";
import { useResume } from "@/contexts/ResumeContext";
import { LiveResumePreview } from "@/components/LiveResumePreview";

const INTERESTS_OPTIONS = [
  "Technology", "Sports & Fitness", "Arts & Music", "Science",
  "Business", "Social Work & Nonprofits", "Media & Communications",
  "Healthcare", "Education", "Engineering", "Environment", "Other"
];

const GRADUATION_YEARS = Array.from({ length: 11 }, (_, i) => (2020 + i).toString());

export default function Step1Page() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { profile, updateProfile, loading } = useProfile();
  const { setCurrentStep } = useResume();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push(`/login?redirect=${encodeURIComponent('/builder/step-1')}`);
    }
  }, [user, authLoading, router]);

  // Local state for form
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    location: "",
    linkedin: "",
    highSchool: "",
    graduationYear: "",
    interests: [] as string[],
  });

  const [customInterest, setCustomInterest] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCurrentStep(1);
  }, [setCurrentStep]);

  // Initialize form with profile data
  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.fullName || "",
        phone: profile.phone || "",
        location: profile.location || "",
        linkedin: profile.linkedin || "",
        highSchool: profile.highSchool || "",
        graduationYear: profile.graduationYear || "",
        interests: profile.interests || [],
      });
    }
  }, [profile]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleAddCustomInterest = () => {
    if (customInterest.trim() && !formData.interests.includes(customInterest.trim())) {
      setFormData(prev => ({
        ...prev,
        interests: [...prev.interests, customInterest.trim()]
      }));
      setCustomInterest("");
    }
  };

  const removeCustomInterest = (interest: string) => {
    // Only allow removing custom interests (not from predefined list)
    if (!INTERESTS_OPTIONS.includes(interest)) {
      setFormData(prev => ({
        ...prev,
        interests: prev.interests.filter(i => i !== interest)
      }));
    }
  };

  const isFormComplete = () => {
    return (
      formData.fullName.trim() !== "" &&
      formData.highSchool.trim() !== "" &&
      formData.graduationYear !== "" &&
      formData.interests.length > 0
    );
  };

  const handleNext = async () => {
    if (!isFormComplete()) return;

    setSaving(true);
    try {
      await updateProfile(formData);
      setCurrentStep(2);
      router.push("/builder/step-2");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <BuilderLayout
        currentStep={1}
        title="Student Basics"
        subtitle="Your profile information"
        onBack={handleBack}
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-career-blue"></div>
        </div>
      </BuilderLayout>
    );
  }

  return (
    <BuilderLayout
      currentStep={1}
      title="Student Basics"
      subtitle="Tell us about yourself"
      onBack={handleBack}
    >
      {/* Two Column Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Form */}
        <div className="flex-1 space-y-6">
          <Card shadow="sm" className="border-2 border-gray-200" padding="lg">
            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-career-blue focus:outline-none"
                />
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="e.g., +1 234 567 8900"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-career-blue focus:outline-none"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                  placeholder="e.g., New York, NY"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-career-blue focus:outline-none"
                />
              </div>

              {/* LinkedIn */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  LinkedIn Profile
                </label>
                <input
                  type="url"
                  value={formData.linkedin}
                  onChange={(e) => handleInputChange("linkedin", e.target.value)}
                  placeholder="e.g., linkedin.com/in/yourname"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-career-blue focus:outline-none"
                />
              </div>

              {/* High School */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  High School / College <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.highSchool}
                  onChange={(e) => handleInputChange("highSchool", e.target.value)}
                  placeholder="Enter your school name"
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-career-blue focus:outline-none"
                />
              </div>

              {/* Graduation Year */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Graduation Year <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.graduationYear}
                  onChange={(e) => handleInputChange("graduationYear", e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-career-blue focus:outline-none"
                >
                  <option value="">Select year</option>
                  {GRADUATION_YEARS.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              {/* Interests */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Interests <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-500 ml-2">(Select at least one)</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {INTERESTS_OPTIONS.map(interest => (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${formData.interests.includes(interest)
                        ? "bg-career-blue text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                    >
                      {interest}
                    </button>
                  ))}
                </div>

                {/* Custom Interest Input */}
                {formData.interests.includes("Other") && (
                  <div className="mt-3 p-3 bg-soft-sky/30 rounded-lg border border-career-blue/20">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Add Custom Interest
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customInterest}
                        onChange={(e) => setCustomInterest(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomInterest())}
                        placeholder="e.g., Web Development, Robotics"
                        className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:border-career-blue focus:outline-none text-sm"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomInterest}
                        disabled={!customInterest.trim()}
                        className="px-4 py-2 bg-career-blue text-white font-medium rounded-lg hover:bg-career-blue-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}

                {/* Display Custom Interests */}
                {formData.interests.filter(i => !INTERESTS_OPTIONS.includes(i)).length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 mb-2">Your custom interests:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.interests
                        .filter(i => !INTERESTS_OPTIONS.includes(i))
                        .map(interest => (
                          <span
                            key={interest}
                            className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-2"
                          >
                            {interest}
                            <button
                              type="button"
                              onClick={() => removeCustomInterest(interest)}
                              className="text-green-700 hover:text-green-900"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back to Dashboard
            </Button>
            <Button
              onClick={handleNext}
              className="flex-1"
              disabled={!isFormComplete() || saving}
              loading={saving}
            >
              {saving ? "Saving..." : "Continue"}
            </Button>
          </div>
        </div>

        {/* Right Column - Live Preview */}
        <div className="flex-1 lg:sticky lg:top-6 h-fit">
          <h3 className="text-lg font-bold text-charcoal mb-4">Live Preview</h3>
          <LiveResumePreview
            fullName={formData.fullName}
            email={user?.email}
            phone={formData.phone}
            location={formData.location}
            linkedin={formData.linkedin}
            highSchool={formData.highSchool}
            graduationYear={formData.graduationYear}
          />
        </div>
      </div>
    </BuilderLayout>
  );
}
