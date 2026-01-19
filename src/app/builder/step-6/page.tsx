"use client";

import React, { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BuilderLayout } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import { useProfile } from "@/context/ProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { LiveResumePreview } from "@/components/LiveResumePreview";
import { createBrowserClient } from "@/lib/supabase";

export default function Step6Page() {
  const router = useRouter();
  const { profile, updateProfile, setCurrentStep } = useProfile();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [photoUrl, setPhotoUrl] = useState<string | null>(profile.photoUrl);
  const [settings, setSettings] = useState(
    profile.photoSettings || {
      brightness: 100,
      contrast: 100,
      cropX: 0,
      cropY: 0,
      zoom: 1,
    }
  );
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const uploadPhotoToStorage = useCallback(async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      const supabase = createBrowserClient();

      // Create unique filename in user-specific folder
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const userFolder = `${user?.id}/`;
      const filePath = `${userFolder}profile-photos/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('resume-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      // Get signed URL for private bucket (valid for 1 year)
      const { data: urlData, error: urlError } = await supabase.storage
        .from('resume-assets')
        .createSignedUrl(filePath, 31536000); // 1 year expiry

      if (urlError || !urlData) {
        console.error('Error creating signed URL:', urlError);
        throw urlError || new Error('Failed to create signed URL');
      }

      return urlData.signedUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      setError('Failed to upload photo. Please try again.');
      return null;
    } finally {
      setUploading(false);
    }
  }, [user?.id, setError, setUploading]);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        setError("Please select an image file");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError("Image must be less than 5MB");
        return;
      }

      // Upload to Supabase Storage
      const uploadedUrl = await uploadPhotoToStorage(file);

      if (uploadedUrl) {
        setPhotoUrl(uploadedUrl);
        setError("");
        setSettings({
          brightness: 100,
          contrast: 100,
          cropX: 0,
          cropY: 0,
          zoom: 1,
        });
      }
    },
    [uploadPhotoToStorage]
  );

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      // Upload to Supabase Storage
      const uploadedUrl = await uploadPhotoToStorage(file);

      if (uploadedUrl) {
        setPhotoUrl(uploadedUrl);
        setError("");
        setSettings({
          brightness: 100,
          contrast: 100,
          cropX: 0,
          cropY: 0,
          zoom: 1,
        });
      }
    }
  }, [uploadPhotoToStorage]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleNext = () => {
    updateProfile({
      photoUrl,
      photoSettings: settings,
    });

    setCurrentStep(6);
    router.push("/builder/review");
  };

  const handleBack = () => {
    setCurrentStep(5);
    router.push("/builder/step-5");
  };

  const handleSkip = () => {
    router.push("/builder/review");
  };

  return (
    <BuilderLayout
      currentStep={6}
      title="Add your profile photo"
      subtitle="A professional photo helps you stand out"
      onBack={handleBack}
    >
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column - Photo Upload */}
        <div className="flex-1 space-y-6">
          {/* Upload Area */}
          {!photoUrl && !uploading && (
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-gray-300 rounded-2xl p-8 text-center cursor-pointer hover:border-career-blue hover:bg-soft-sky/30 transition-all"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="w-16 h-16 bg-soft-sky rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-career-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-charcoal font-medium mb-1">
                Tap to upload or drag and drop
              </p>
              <p className="text-sm text-gray-500">PNG, JPG up to 5MB</p>
            </div>
          )}

          {/* Uploading State */}
          {uploading && (
            <div className="border-2 border-dashed border-career-blue rounded-2xl p-8 text-center bg-soft-sky/30">
              <div className="w-16 h-16 bg-soft-sky rounded-full flex items-center justify-center mx-auto mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-career-blue"></div>
              </div>
              <p className="text-charcoal font-medium mb-1">
                Uploading your photo...
              </p>
              <p className="text-sm text-gray-500">Please wait</p>
            </div>
          )}

          {/* Photo Preview & Controls */}
          {photoUrl && (
            <div className="space-y-4">
              <Card shadow="sm" padding="md" className="text-center">
                <div className="relative inline-block">
                  <div
                    className="w-40 h-40 rounded-full overflow-hidden mx-auto border-4 border-white shadow-lg"
                    style={{
                      filter: `brightness(${settings.brightness}%) contrast(${settings.contrast}%)`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photoUrl}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                      style={{
                        transform: `scale(${settings.zoom}) translate(${settings.cropX}%, ${settings.cropY}%)`,
                      }}
                    />
                  </div>
                  <button
                    onClick={() => {
                      setPhotoUrl(null);
                      setSettings({
                        brightness: 100,
                        contrast: 100,
                        cropX: 0,
                        cropY: 0,
                        zoom: 1,
                      });
                    }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </Card>

              {/* Photo Editing Controls */}
              <Card shadow="sm" padding="md">
                <h3 className="font-semibold text-charcoal mb-4">Adjust Photo</h3>

                {/* Brightness */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-600">Brightness</label>
                    <span className="text-sm font-medium text-charcoal">{settings.brightness}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={settings.brightness}
                    onChange={(e) => setSettings({ ...settings, brightness: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Contrast */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-600">Contrast</label>
                    <span className="text-sm font-medium text-charcoal">{settings.contrast}%</span>
                  </div>
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={settings.contrast}
                    onChange={(e) => setSettings({ ...settings, contrast: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Zoom */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm text-gray-600">Zoom</label>
                    <span className="text-sm font-medium text-charcoal">{settings.zoom.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="2"
                    step="0.1"
                    value={settings.zoom}
                    onChange={(e) => setSettings({ ...settings, zoom: parseFloat(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Position Controls */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm text-gray-600">Horizontal</label>
                      <span className="text-sm font-medium text-charcoal">{settings.cropX}</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={settings.cropX}
                      onChange={(e) => setSettings({ ...settings, cropX: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="text-sm text-gray-600">Vertical</label>
                      <span className="text-sm font-medium text-charcoal">{settings.cropY}</span>
                    </div>
                    <input
                      type="range"
                      min="-50"
                      max="50"
                      value={settings.cropY}
                      onChange={(e) => setSettings({ ...settings, cropY: parseInt(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                {/* Reset Button */}
                <button
                  onClick={() => setSettings({
                    brightness: 100,
                    contrast: 100,
                    cropX: 0,
                    cropY: 0,
                    zoom: 1,
                  })}
                  className="w-full mt-4 px-4 py-2 text-sm text-career-blue border border-career-blue rounded-lg hover:bg-soft-sky transition-colors"
                >
                  Reset Adjustments
                </button>
              </Card>
            </div>
          )}

          {/* Tips */}
          <Card
            shadow="none"
            className="bg-soft-sky border border-career-blue/20"
            padding="md"
          >
            <div className="flex gap-3">
              <span className="text-xl">📸</span>
              <div>
                <p className="text-sm text-charcoal font-medium mb-1">
                  Photo tips:
                </p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use a clear, recent headshot</li>
                  <li>• Good lighting makes a difference</li>
                  <li>• Dress as you would for school</li>
                  <li>• A simple background works best</li>
                </ul>
              </div>
            </div>
          </Card>

          {error && (
            <p className="text-sm text-red-500 text-center">{error}</p>
          )}

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleBack} className="flex-1">
              Back
            </Button>
            <Button onClick={handleNext} className="flex-1">
              Continue
            </Button>
          </div>

          <button
            onClick={handleSkip}
            className="w-full text-center text-sm text-gray-500 hover:text-career-blue transition-colors"
          >
            Skip for now
          </button>
        </div>

        {/* Right Column - Preview */}
        <div className="flex-1 lg:max-w-xl">
          <div className="sticky top-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-charcoal">Preview</h2>
            </div>

            <div className="transform scale-[0.6] origin-top lg:scale-[0.85] xl:scale-100 transition-transform">
              <LiveResumePreview
                {...profile}
                photoUrl={photoUrl}
                showPhoto={false}
                variant="document"
              />
            </div>
          </div>
        </div>
      </div>
    </BuilderLayout>
  );
}
