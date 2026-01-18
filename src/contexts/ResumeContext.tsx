'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserClient } from '@/lib/supabase';

// Resume draft data (separate from user profile)
export interface ResumeDraft {
    // Builder step data (NOT saved to profile)
    experiences: Record<string, unknown>[];
    skills: string[];

    // Metadata
    resumeTitle: string;
    lastSavedStep: number;
}

interface ResumeContextType {
    resumeDraft: ResumeDraft;
    updateResumeDraft: (updates: Partial<ResumeDraft>) => void;
    saveResumeDraft: () => Promise<void>;
    currentStep: number;
    setCurrentStep: (step: number) => void;
    resetDraft: () => void;
}

const initialDraft: ResumeDraft = {
    experiences: [],
    skills: [],
    resumeTitle: 'My Resume',
    lastSavedStep: 1,
};

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export function ResumeProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [resumeDraft, setResumeDraft] = useState<ResumeDraft>(initialDraft);
    const [currentStep, setCurrentStep] = useState(1);

    const updateResumeDraft = (updates: Partial<ResumeDraft>) => {
        setResumeDraft(prev => ({ ...prev, ...updates }));
    };

    const saveResumeDraft = async () => {
        if (!user) return;

        try {
            const supabase = createBrowserClient();

            // Save experiences to database
            if (resumeDraft.experiences.length > 0) {
                const { error } = await supabase
                    .from('experiences')
                    .upsert(
                        resumeDraft.experiences.map(exp => ({
                            ...exp,
                            user_id: user.id,
                        }))
                    );

                if (error) throw error;
            }

            console.log('Resume draft saved successfully');
        } catch (error) {
            console.error('Error saving resume draft:', error);
        }
    };

    const resetDraft = () => {
        setResumeDraft(initialDraft);
        setCurrentStep(1);
    };

    return (
        <ResumeContext.Provider
            value={{
                resumeDraft,
                updateResumeDraft,
                saveResumeDraft,
                currentStep,
                setCurrentStep,
                resetDraft,
            }}
        >
            {children}
        </ResumeContext.Provider>
    );
}

export function useResume() {
    const context = useContext(ResumeContext);
    if (!context) {
        throw new Error('useResume must be used within ResumeProvider');
    }
    return context;
}
