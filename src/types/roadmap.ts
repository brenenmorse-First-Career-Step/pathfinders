export interface Course {
    name: string;
    link: string;
    reason: string;
}

export interface RoadmapStep {
    step: number;
    title: string;
    description: string;
    hashtags?: string[];
}

export interface CareerRoadmap {
    careerName: string;
    keySkills: string[];
    tools: string[];
    courses: Course[];
    steps: RoadmapStep[];
    timeline: string;
    starterProjects: string[];
    communities: string[];
    hashtags: string[];
}

export interface RoadmapData {
    roadmap: CareerRoadmap;
    formattedContent: string;
}

export interface RoadmapResponse {
    roadmap: CareerRoadmap;
    formattedContent: string;
    infographicUrl: string;
    milestoneRoadmapUrl: string;
    roadmapId: string;
}
