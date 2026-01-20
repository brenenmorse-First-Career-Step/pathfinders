import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import type { RoadmapResponse, CareerRoadmap } from '@/types/roadmap';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const { careerGoal, userId } = await request.json();

        if (!careerGoal || !userId) {
            return NextResponse.json(
                { error: 'Career goal and user ID are required' },
                { status: 400 }
            );
        }

        if (!process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY is not set');
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        // Generate roadmap content using GPT
        const roadmapPrompt = `You are a career planning assistant and visual designer.

The user wants to become: ${careerGoal}

Create a detailed career roadmap including:

1. Key skills they need to learn (list 8-12 skills)
2. Tools or software they should master (list 5-8 tools)
3. At least 5 free online courses or classes. For each course:
   - Course name
   - Direct link to the class (use real URLs from platforms like Coursera, edX, Khan Academy, YouTube, etc.)
   - Explanation of why it matters
   - Make sure no link repeats
4. A step-by-step plan (6-10 steps depending on the career). For each step:
   - Step number
   - Title
   - Detailed description
   - 1-3 relevant hashtags
5. Estimated learning timeline (e.g., "6-12 months" or "1-2 years")
6. Suggested starter projects to build experience (list 3-5 projects)
7. Hashtags or community spaces they could join (list 5-8 relevant hashtags/communities)

Rules:
- Tone should be confident, clear, and professional
- Roadmap should be actionable and beginner-friendly
- Include 1-3 relevant hashtags per section
- Do NOT include real person identification from images
- All course links must be real and accessible

Return ONLY a valid JSON object with this exact structure:
{
  "careerName": "string",
  "keySkills": ["string"],
  "tools": ["string"],
  "courses": [
    {
      "name": "string",
      "link": "string (real URL)",
      "reason": "string"
    }
  ],
  "steps": [
    {
      "step": number,
      "title": "string",
      "description": "string",
      "hashtags": ["string"]
    }
  ],
  "timeline": "string",
  "starterProjects": ["string"],
  "communities": ["string"],
  "hashtags": ["string"]
}`;

        console.log('Generating roadmap content...');
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'You are a career planning assistant. Always return valid JSON. Ensure all course links are real and accessible.',
                },
                {
                    role: 'user',
                    content: roadmapPrompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 3000,
            response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;
        if (!content) {
            throw new Error('No roadmap content generated');
        }

        const roadmapData: CareerRoadmap = JSON.parse(content);

        // Generate formatted content
        const formattedContent = formatRoadmapContent(roadmapData);

        // Generate two images using DALL-E with actual roadmap data
        console.log('Generating infographic...');
        
        // Create step titles list for the prompt
        const stepTitles = roadmapData.steps.map((step) => `Step ${step.step}: ${step.title}`).join(', ');
        
        const infographicPrompt = `Create a professional, clean career roadmap infographic template for "${roadmapData.careerName}". 

Design Requirements:
- Horizontal timeline layout flowing left to right
- Show ${roadmapData.steps.length} distinct milestone markers or steps along a progression path
- Clean, modern infographic style with professional color scheme (blues, teals, purples)
- Visual progression from start (left) to finish (right) 
- Each milestone should be represented by a clear visual marker (circle, icon, or step shape)
- Use a connecting path or timeline bar linking all milestones
- Simple, clean design without cluttered details
- Professional PowerPoint/presentation template aesthetic
- Light background with clear visual hierarchy
- No random text, data, or confusing elements
- Focus on clear visual structure representing career progression

The visual should represent these ${roadmapData.steps.length} career steps: ${stepTitles}

Style: Clean professional infographic template, similar to career roadmap presentation templates, with clear milestone progression.`;
        
        const infographicResponse = await openai.images.generate({
            model: 'dall-e-3',
            prompt: infographicPrompt,
            size: '1024x1024',
            quality: 'standard',
            n: 1,
        });

        const infographicUrl = infographicResponse.data?.[0]?.url;
        if (!infographicUrl) {
            throw new Error('Failed to generate infographic');
        }

        console.log('Generating milestone roadmap...');
        
        const milestonePrompt = `Create a clean, modern career milestone roadmap graphic for "${roadmapData.careerName}".

Design Requirements:
- Show an ascending staircase or progression path with ${roadmapData.steps.length} distinct steps
- Each step should be clearly defined and progressively larger/higher
- Professional color gradient (teal to blue to purple) showing progression
- Clean, minimalist design with ample white space
- Visual path connecting all steps from bottom-left to top-right
- Finish line or destination point at the top labeled with "${roadmapData.careerName}"
- Simple geometric shapes, no complex details
- Professional presentation template style
- Clear visual hierarchy showing career advancement
- No random text, icons, or confusing visual elements
- Focus on clean structure representing ${roadmapData.steps.length} career milestones

Style: Modern career path roadmap template, clean staircase or ascending path design, professional PowerPoint diagram style, simple and clear visual progression.`;
        
        const milestoneResponse = await openai.images.generate({
            model: 'dall-e-3',
            prompt: milestonePrompt,
            size: '1024x1024',
            quality: 'standard',
            n: 1,
        });

        const milestoneRoadmapUrl = milestoneResponse.data?.[0]?.url;
        if (!milestoneRoadmapUrl) {
            throw new Error('Failed to generate milestone roadmap');
        }

        // Download images and upload to Supabase storage
        console.log('Uploading images to storage...');
        const infographicStorageUrl = await uploadImageToStorage(
            infographicUrl,
            userId,
            'infographic'
        );
        const milestoneStorageUrl = await uploadImageToStorage(
            milestoneRoadmapUrl,
            userId,
            'milestone'
        );

        // Save roadmap to database
        console.log('Saving roadmap to database...');
        const { data: roadmapRecord, error: dbError } = await supabase
            .from('career_roadmaps')
            .insert({
                user_id: userId,
                career_name: roadmapData.careerName,
                roadmap_data: roadmapData,
                infographic_url: infographicStorageUrl,
                milestone_roadmap_url: milestoneStorageUrl,
            })
            .select()
            .single();

        if (dbError) {
            console.error('Database error:', dbError);
            throw dbError;
        }

        const response: RoadmapResponse = {
            roadmap: roadmapData,
            formattedContent,
            infographicUrl: infographicStorageUrl,
            milestoneRoadmapUrl: milestoneStorageUrl,
            roadmapId: roadmapRecord.id,
        };

        return NextResponse.json(response);
    } catch (error: unknown) {
        console.error('Roadmap generation error:', error);

        if (error instanceof Error) {
            return NextResponse.json(
                { error: error.message || 'Failed to generate career roadmap' },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to generate career roadmap' },
            { status: 500 }
        );
    }
}

async function uploadImageToStorage(
    imageUrl: string,
    userId: string,
    type: 'infographic' | 'milestone'
): Promise<string> {
    try {
        // Download the image
        const imageResponse = await fetch(imageUrl);
        if (!imageResponse.ok) {
            throw new Error('Failed to download image from OpenAI');
        }

        const imageBlob = await imageResponse.blob();
        const arrayBuffer = await imageBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Create unique filename
        const timestamp = Date.now();
        const fileExt = 'png';
        const fileName = `${userId}/${type}-${timestamp}.${fileExt}`;
        const filePath = `roadmaps/${fileName}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
            .from('roadmaps')
            .upload(filePath, buffer, {
                contentType: 'image/png',
                upsert: false,
            });

        if (uploadError) {
            console.error('Upload error:', uploadError);
            throw uploadError;
        }

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('roadmaps')
            .getPublicUrl(filePath);

        return publicUrl;
    } catch (error) {
        console.error('Error uploading image to storage:', error);
        // Return original URL as fallback
        return imageUrl;
    }
}

function formatRoadmapContent(roadmap: CareerRoadmap): string {
    let content = `# ${roadmap.careerName} Career Roadmap\n\n`;

    // Key Skills
    content += `## Key Skills to Learn\n\n`;
    roadmap.keySkills.forEach((skill, index) => {
        content += `${index + 1}. ${skill}\n`;
    });
    content += `\n`;

    // Tools
    content += `## Tools & Software to Master\n\n`;
    roadmap.tools.forEach((tool, index) => {
        content += `${index + 1}. ${tool}\n`;
    });
    content += `\n`;

    // Courses
    content += `## Recommended Free Courses\n\n`;
    roadmap.courses.forEach((course, index) => {
        content += `### ${index + 1}. ${course.name}\n`;
        content += `**Link:** [${course.name}](${course.link})\n`;
        content += `**Why it matters:** ${course.reason}\n\n`;
    });

    // Steps
    content += `## Step-by-Step Plan\n\n`;
    roadmap.steps.forEach((step) => {
        content += `### Step ${step.step}: ${step.title}\n`;
        content += `${step.description}\n`;
        if (step.hashtags && step.hashtags.length > 0) {
            content += `\n**Hashtags:** ${step.hashtags.join(', ')}\n`;
        }
        content += `\n`;
    });

    // Timeline
    content += `## Estimated Timeline\n\n`;
    content += `${roadmap.timeline}\n\n`;

    // Starter Projects
    content += `## Starter Projects\n\n`;
    roadmap.starterProjects.forEach((project, index) => {
        content += `${index + 1}. ${project}\n`;
    });
    content += `\n`;

    // Communities
    content += `## Communities & Hashtags\n\n`;
    roadmap.communities.forEach((community, index) => {
        content += `${index + 1}. ${community}\n`;
    });
    if (roadmap.hashtags && roadmap.hashtags.length > 0) {
        content += `\n**Hashtags:** ${roadmap.hashtags.join(', ')}\n`;
    }

    return content;
}
