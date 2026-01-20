"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { createBrowserClient } from "@/lib/supabase";
import { logger, dbLogger } from "@/lib/logger";

// Types
export interface Experience {
  id: string;
  type: "job" | "volunteer" | "extracurricular" | "project" | "other" | "sport" | "club" | "fulltime" | "parttime" | "remote" | "freelance" | "hybrid" | "onsite";
  title: string;
  organization: string;
  description: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  location?: string;
}

export interface ProfileData {
  // Step 1: Student Basics
  fullName: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  highSchool: string;
  graduationYear: string;
  interests: string[];

  // Step 2: Headline
  headline: string;

  // Step 3: About Section
  aboutMe: string;
  proudestAccomplishment: string;
  futureGoals: string;
  generatedAbout: string;

  // Step 4: Experience
  experiences: Experience[];

  // Step 5: Skills
  skills: string[];

  // Step 6: Photo
  photoUrl: string | null;
  photoEnhancedUrl: string | null;
  showPhotoOnResume: boolean;
  photoSettings: {
    brightness: number;
    contrast: number;
    cropX: number;
    cropY: number;
    zoom: number;
  };

  // Certifications
  certifications: Array<{
    id: string;
    name: string;
    issuer?: string;
    dateIssued?: string;
  }>;
}

interface ProfileContextType {
  profile: ProfileData;
  updateProfile: (updates: Partial<ProfileData>) => Promise<void>;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isStepComplete: (step: number) => boolean;
  resetProfile: () => void;
  loading: boolean;
  saving: boolean;
}

const initialProfile: ProfileData = {
  fullName: "",
  email: "",
  phone: "",
  location: "",
  linkedin: "",
  highSchool: "",
  graduationYear: "",
  interests: [],
  headline: "",
  aboutMe: "",
  proudestAccomplishment: "",
  futureGoals: "",
  generatedAbout: "",
  experiences: [],
  skills: [],
  photoUrl: null,
  photoEnhancedUrl: null,
  showPhotoOnResume: true,
  photoSettings: {
    brightness: 100,
    contrast: 100,
    cropX: 0,
    cropY: 0,
    zoom: 1,
  },
  certifications: [],
};

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<ProfileData>(initialProfile);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const supabase = createBrowserClient();

  // Load profile data from database when user logs in
  useEffect(() => {
    const loadProfile = async () => {
      if (!user || authLoading) {
        setLoading(false);
        return;
      }

      try {
        logger.info('Profile Context', 'Loading profile data', { userId: user.id });
        setLoading(true);

        // Load profile data
        const { data: profileData, error: profileError } = await supabase
          .from('profile')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          dbLogger.error(profileError, { context: 'loadProfile', userId: user.id });
        }

        // Load experiences
        const { data: experiencesData, error: experiencesError } = await supabase
          .from('experiences')
          .select('*')
          .eq('user_id', user.id)
          .order('date_created', { ascending: false });

        if (experiencesError) {
          dbLogger.error(experiencesError, { context: 'loadExperiences', userId: user.id });
        }

        // Load certifications
        const { data: certificationsData, error: certificationsError } = await supabase
          .from('certifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (certificationsError) {
          dbLogger.error(certificationsError, { context: 'loadCertifications', userId: user.id });
        }

        // Load user data for full name
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (userError) {
          dbLogger.error(userError, { context: 'loadUser', userId: user.id });
        }

        // Map database data to profile state
        const loadedProfile: ProfileData = {
          fullName: userData?.full_name || "",
          email: user.email || "",
          phone: profileData?.phone || "",
          location: profileData?.location || "",
          linkedin: profileData?.linkedin || "",
          highSchool: profileData?.high_school || "",
          graduationYear: profileData?.graduation_year || "",
          interests: profileData?.interests || [],
          headline: profileData?.headline || "",
          aboutMe: "", // Part of about_text
          proudestAccomplishment: "", // Part of about_text
          futureGoals: "", // Part of about_text
          generatedAbout: profileData?.about_text || "",
          experiences: experiencesData?.map(exp => ({
            id: exp.id,
            type: exp.type as Experience['type'],
            title: exp.title || "",
            organization: exp.organization || "",
            description: exp.bullets?.join('\n') || "",
            startDate: exp.start_date || "",
            endDate: exp.end_date || "",
            isCurrent: exp.is_current || false,
            location: exp.location || "",
          })) || [],
          skills: profileData?.skills || [],
          photoUrl: profileData?.photo_url || null,
          photoEnhancedUrl: profileData?.photo_enhanced_url || null,
          showPhotoOnResume: profileData?.show_photo_on_resume ?? true,
          photoSettings: {
            brightness: 100,
            contrast: 100,
            cropX: 0,
            cropY: 0,
            zoom: 1,
          },
          certifications: certificationsData?.map(cert => ({
            id: cert.id,
            name: cert.name,
            issuer: cert.issuer || '',
            dateIssued: cert.date_issued || '',
          })) || [],
        };

        setProfile(loadedProfile);
        logger.info('Profile Context', 'Profile loaded successfully', { userId: user.id });
      } catch (error) {
        logger.error('Profile Context', error as Error, { userId: user.id });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user, authLoading, supabase]);

  const updateProfile = async (updates: Partial<ProfileData>) => {
    if (!user) {
      logger.warn('Profile Context', 'Cannot update profile - user not authenticated');
      return;
    }

    try {
      setSaving(true);
      logger.info('Profile Context', 'Updating profile', { userId: user.id, updates: Object.keys(updates) });

      // Update local state immediately for better UX
      setProfile((prev) => ({ ...prev, ...updates }));

      // Prepare database updates
      const profileUpdates: Record<string, unknown> = {};

      if (updates.highSchool !== undefined) {
        profileUpdates.high_school = updates.highSchool;
      }

      if (updates.graduationYear !== undefined) {
        profileUpdates.graduation_year = updates.graduationYear;
      }

      if (updates.interests !== undefined) {
        profileUpdates.interests = updates.interests;
      }

      if (updates.phone !== undefined) {
        profileUpdates.phone = updates.phone;
      }

      if (updates.location !== undefined) {
        profileUpdates.location = updates.location;
      }

      if (updates.linkedin !== undefined) {
        profileUpdates.linkedin = updates.linkedin;
      }

      if (updates.headline !== undefined) {
        profileUpdates.headline = updates.headline;
      }

      if (updates.generatedAbout !== undefined) {
        profileUpdates.about_text = updates.generatedAbout;
      }

      if (updates.skills !== undefined) {
        profileUpdates.skills = updates.skills;
      }

      if (updates.photoUrl !== undefined) {
        profileUpdates.photo_url = updates.photoUrl;
      }

      if (updates.photoEnhancedUrl !== undefined) {
        profileUpdates.photo_enhanced_url = updates.photoEnhancedUrl;
      }

      // Update profile table if there are changes
      if (Object.keys(profileUpdates).length > 0) {
        profileUpdates.date_updated = new Date().toISOString();

        const { error: profileError } = await supabase
          .from('profile')
          .upsert({
            user_id: user.id,
            ...profileUpdates,
          }, {
            onConflict: 'user_id'
          });

        if (profileError) {
          dbLogger.error(profileError, { context: 'updateProfile', userId: user.id });
          throw profileError;
        }

        dbLogger.operation('UPSERT', 'profile', { userId: user.id, fields: Object.keys(profileUpdates) });
      }

      // Update full name and linkedin in users table if changed
      if (updates.fullName !== undefined || updates.linkedin !== undefined) {
        const userUpdates: Record<string, string> = {};
        if (updates.fullName !== undefined) userUpdates.full_name = updates.fullName;
        if (updates.linkedin !== undefined) userUpdates.linkedin_link = updates.linkedin;

        const { error: userError } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', user.id);

        if (userError) {
          dbLogger.error(userError, { context: 'updateUser', userId: user.id });
          throw userError;
        }

        dbLogger.operation('UPDATE', 'users', { userId: user.id, fields: Object.keys(userUpdates) });
      }

      // Handle experiences updates
      if (updates.experiences !== undefined) {
        // Delete all existing experiences
        const { error: deleteError } = await supabase
          .from('experiences')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) {
          dbLogger.error(deleteError, { context: 'deleteExperiences', userId: user.id });
        }

        // Insert new experiences
        if (updates.experiences.length > 0) {
          const experiencesToInsert = updates.experiences.map(exp => ({
            user_id: user.id,
            type: exp.type,
            title: exp.title,
            organization: exp.organization,
            bullets: exp.description.split('\n').filter(b => b.trim()),
            start_date: exp.startDate,
            end_date: exp.endDate,
            is_current: exp.isCurrent,
            location: exp.location,
          }));

          const { error: insertError } = await supabase
            .from('experiences')
            .insert(experiencesToInsert);

          if (insertError) {
            dbLogger.error(insertError, { context: 'insertExperiences', userId: user.id });
            throw insertError;
          }

          dbLogger.operation('INSERT', 'experiences', { userId: user.id, count: experiencesToInsert.length });
        }
      }

      // Handle certifications updates
      if (updates.certifications !== undefined) {
        // Delete all existing certifications
        const { error: deleteError } = await supabase
          .from('certifications')
          .delete()
          .eq('user_id', user.id);

        if (deleteError) {
          dbLogger.error(deleteError, { context: 'deleteCertifications', userId: user.id });
        }

        // Insert new certifications
        if (updates.certifications.length > 0) {
          const certificationsToInsert = updates.certifications.map(cert => ({
            user_id: user.id,
            name: cert.name,
            issuer: cert.issuer || null,
            date_issued: cert.dateIssued || null,
          }))

          console.log('Saving certifications:', certificationsToInsert);

          const { error: insertError } = await supabase
            .from('certifications')
            .insert(certificationsToInsert);

          if (insertError) {
            console.error('Certifications save error:', insertError);
            dbLogger.error(insertError, { context: 'insertCertifications', userId: user.id });
            throw insertError;
          }

          console.log('Certifications saved successfully!');
          dbLogger.operation('INSERT', 'certifications', { userId: user.id, count: certificationsToInsert.length });
        }
      }

      logger.info('Profile Context', 'Profile updated successfully', { userId: user.id });
    } catch (error) {
      logger.error('Profile Context', error as Error, { userId: user.id, updates: Object.keys(updates) });
      // Revert local state on error
      // You might want to reload from database here
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const isStepComplete = (step: number): boolean => {
    switch (step) {
      case 1:
        return (
          profile.fullName.trim() !== "" &&
          profile.highSchool.trim() !== "" &&
          profile.graduationYear !== "" &&
          profile.interests.length > 0
        );
      case 2:
        return profile.headline.trim() !== "";
      case 3:
        return profile.generatedAbout.trim() !== "";
      case 4:
        return profile.experiences.length > 0;
      case 5:
        return profile.skills.length > 0;
      case 6:
        return profile.photoUrl !== null;
      default:
        return false;
    }
  };

  const resetProfile = () => {
    setProfile(initialProfile);
    setCurrentStep(1);
  };

  return (
    <ProfileContext.Provider
      value={{
        profile,
        updateProfile,
        currentStep,
        setCurrentStep,
        isStepComplete,
        resetProfile,
        loading,
        saving,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error("useProfile must be used within a ProfileProvider");
  }
  return context;
}
