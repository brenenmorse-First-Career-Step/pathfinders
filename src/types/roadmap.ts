// TypeScript types for Career Roadmap feature

export interface RoadmapStep {
    step: number;
    title: string;
    description: string;
    timeline: string;
    hashtags?: string[];
}

export interface RoadmapCourse {
    name: string;
    link: string;
    reason: string;
}

export interface RoadmapProject {
    title: string;
    description: string;
    skills: string[];
}

export interface RoadmapContent {
    careerName: string;
    skills: string[];
    tools: string[];
    steps: RoadmapStep[];
    courses: RoadmapCourse[];
    projects: RoadmapProject[];
    hashtags: string[];
    estimatedTimeline: string;
}

export interface Roadmap {
    id: string;
    user_id: string;
    career_name: string;
    roadmap_content: RoadmapContent;
    infographic_url: string | null;
    milestone_graphic_url: string | null;
    created_at: string;
    updated_at: string;
}

export interface GenerateRoadmapRequest {
    careerGoal: string;
}

export interface GenerateRoadmapResponse {
    success: boolean;
    roadmap?: RoadmapContent;
    infographicUrl?: string;
    milestoneGraphicUrl?: string;
    error?: string;
}

export interface UserPayment {
    id: string;
    user_id: string;
    has_paid: boolean;
    payment_amount: number;
    stripe_payment_intent_id: string | null;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
}
