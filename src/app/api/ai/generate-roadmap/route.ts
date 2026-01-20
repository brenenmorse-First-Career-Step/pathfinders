import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { createCanvas, loadImage } from 'canvas';
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

        // Generate two images using DALL-E with readable text
        console.log('Generating infographic...');
        
        // Create structured roadmap data for prompt
        const roadmapStructure = {
            careerName: roadmapData.careerName,
            totalSteps: roadmapData.steps.length,
            steps: roadmapData.steps.map(step => ({
                number: step.step,
                title: step.title
            }))
        };
        
        // Generate visual template WITHOUT text - we'll add text programmatically
        const infographicPrompt = `Create a simple, clean career roadmap visual template. 

ABSOLUTELY NO TEXT - this is a pure visual template only.

Design:
- Wide horizontal layout (landscape format) with white background
- ${roadmapStructure.totalSteps} simple circles or rounded boxes arranged evenly from left to right
- Simple horizontal line or path connecting all ${roadmapStructure.totalSteps} shapes
- Professional colors: light blue or teal for shapes and connecting line
- Clean, minimalist design
- Maximum simplicity - just geometric shapes and lines
- NO text, NO words, NO letters, NO numbers - pure visual structure only`;

        const infographicResponse = await openai.images.generate({
            model: 'dall-e-3',
            prompt: infographicPrompt,
            size: '1792x1024',
            quality: 'standard',
            n: 1,
        });

        const infographicBaseUrl = infographicResponse.data?.[0]?.url;
        if (!infographicBaseUrl) {
            throw new Error('Failed to generate infographic');
        }

        // Add text programmatically using canvas
        console.log('Adding text to infographic...');
        const infographicBuffer = await addTextToInfographic(
            infographicBaseUrl,
            roadmapStructure.careerName,
            roadmapStructure.steps
        );
        
        // Upload the image with text
        const infographicUrl = await uploadImageToStorage(
            infographicBuffer,
            userId,
            'infographic'
        );

        console.log('Generating milestone roadmap...');
        
        // Generate visual template WITHOUT text - we'll add text programmatically
        const milestonePrompt = `Create a simple, clean career milestone roadmap visual template.

ABSOLUTELY NO TEXT - this is a pure visual template only.

Design:
- Wide landscape format with white background
- Simple ascending staircase or progression path
- ${roadmapStructure.totalSteps} rectangular blocks or steps from bottom-left to top-right
- Each step progressively larger/higher
- Simple connecting line or path between steps
- Professional colors: light blue or teal gradient
- Clean, minimalist design
- Maximum simplicity - just geometric shapes
- NO text, NO words, NO letters, NO numbers - pure visual structure only`;

        const milestoneResponse = await openai.images.generate({
            model: 'dall-e-3',
            prompt: milestonePrompt,
            size: '1792x1024',
            quality: 'standard',
            n: 1,
        });

        const milestoneBaseUrl = milestoneResponse.data?.[0]?.url;
        if (!milestoneBaseUrl) {
            throw new Error('Failed to generate milestone roadmap');
        }

        // Add text programmatically using canvas
        console.log('Adding text to milestone roadmap...');
        const milestoneBuffer = await addTextToMilestoneRoadmap(
            milestoneBaseUrl,
            roadmapStructure.careerName,
            roadmapStructure.steps
        );
        
        // Upload the image with text
        const milestoneRoadmapUrl = await uploadImageToStorage(
            milestoneBuffer,
            userId,
            'milestone'
        );

        // Images are already uploaded, use the URLs directly
        const infographicStorageUrl = infographicUrl;
        const milestoneStorageUrl = milestoneRoadmapUrl;

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

async function addTextToInfographic(
    imageUrl: string,
    careerName: string,
    steps: Array<{ number: number; title: string }>
): Promise<Buffer> {
    try {
        // Load the base image
        const image = await loadImage(imageUrl);
        const width = 1792;
        const height = 1024;

        // Create canvas
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Draw the base image
        ctx.drawImage(image, 0, 0, width, height);

        // Set text properties
        ctx.fillStyle = '#1a1a1a'; // Dark text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Draw main title at top
        ctx.font = 'bold 64px Arial, sans-serif';
        ctx.fillText(`${careerName} Career Roadmap`, width / 2, 40);

        // Calculate positions for steps (horizontal timeline)
        const stepSpacing = width / (steps.length + 1);
        const stepY = height / 2 + 100; // Below center

        // Draw step numbers and titles
        steps.forEach((step, index) => {
            const stepX = stepSpacing * (index + 1);

            // Draw step number in circle
            ctx.fillStyle = '#2563eb'; // Blue
            ctx.beginPath();
            ctx.arc(stepX, stepY - 20, 40, 0, Math.PI * 2);
            ctx.fill();

            // Step number text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Arial, sans-serif';
            ctx.fillText(step.number.toString(), stepX, stepY - 38);

            // Step title (wrap if too long)
            ctx.fillStyle = '#1a1a1a';
            ctx.font = 'bold 32px Arial, sans-serif';
            const maxWidth = stepSpacing * 0.8;
            const words = step.title.split(' ');
            let line = '';
            let y = stepY + 40;

            words.forEach((word) => {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && line !== '') {
                    ctx.fillText(line, stepX, y);
                    line = word + ' ';
                    y += 40;
                } else {
                    line = testLine;
                }
            });
            ctx.fillText(line, stepX, y);
        });

        // Convert to buffer
        return canvas.toBuffer('image/png');
    } catch (error) {
        console.error('Error adding text to infographic:', error);
        // Fallback: download original image
        const imageResponse = await fetch(imageUrl);
        const imageBlob = await imageResponse.blob();
        const arrayBuffer = await imageBlob.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
}

async function addTextToMilestoneRoadmap(
    imageUrl: string,
    careerName: string,
    steps: Array<{ number: number; title: string }>
): Promise<Buffer> {
    try {
        // Load the base image
        const image = await loadImage(imageUrl);
        const width = 1792;
        const height = 1024;

        // Create canvas
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Draw the base image
        ctx.drawImage(image, 0, 0, width, height);

        // Set text properties
        ctx.fillStyle = '#1a1a1a'; // Dark text
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Draw main title at top
        ctx.font = 'bold 64px Arial, sans-serif';
        ctx.fillText(careerName, width / 2, 30);

        // Draw finish line label at top right
        ctx.font = 'bold 48px Arial, sans-serif';
        ctx.fillText(careerName, width - 200, 30);

        // Calculate positions for steps (ascending staircase)
        const startX = width * 0.15;
        const endX = width * 0.85;
        const startY = height * 0.7;
        const endY = height * 0.2;
        const stepCount = steps.length;

        // Draw step numbers and titles
        steps.forEach((step, index) => {
            const progress = index / (stepCount - 1);
            const stepX = startX + (endX - startX) * progress;
            const stepY = startY - (startY - endY) * progress;

            // Draw step number in circle
            ctx.fillStyle = '#2563eb'; // Blue
            ctx.beginPath();
            ctx.arc(stepX, stepY, 35, 0, Math.PI * 2);
            ctx.fill();

            // Step number text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 32px Arial, sans-serif';
            ctx.fillText(step.number.toString(), stepX, stepY - 16);

            // Step title (to the right of number)
            ctx.fillStyle = '#1a1a1a';
            ctx.font = 'bold 28px Arial, sans-serif';
            ctx.textAlign = 'left';
            
            // Wrap text if needed
            const maxWidth = 300;
            const words = step.title.split(' ');
            let line = '';
            let y = stepY - 10;

            words.forEach((word) => {
                const testLine = line + word + ' ';
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxWidth && line !== '') {
                    ctx.fillText(line, stepX + 50, y);
                    line = word + ' ';
                    y += 35;
                } else {
                    line = testLine;
                }
            });
            ctx.fillText(line, stepX + 50, y);
            ctx.textAlign = 'center';
        });

        // Convert to buffer
        return canvas.toBuffer('image/png');
    } catch (error) {
        console.error('Error adding text to milestone roadmap:', error);
        // Fallback: download original image
        const imageResponse = await fetch(imageUrl);
        const imageBlob = await imageResponse.blob();
        const arrayBuffer = await imageBlob.arrayBuffer();
        return Buffer.from(arrayBuffer);
    }
}

async function uploadImageToStorage(
    imageUrl: string | Buffer,
    userId: string,
    type: 'infographic' | 'milestone'
): Promise<string> {
    try {
        let buffer: Buffer;

        // If it's a base64 string (from canvas), decode it
        if (typeof imageUrl === 'string' && imageUrl.startsWith('data:image')) {
            const base64Data = imageUrl.split(',')[1];
            buffer = Buffer.from(base64Data, 'base64');
        } else if (typeof imageUrl === 'string') {
            // It's a URL, download it
            const imageResponse = await fetch(imageUrl);
            if (!imageResponse.ok) {
                throw new Error('Failed to download image');
            }
            const imageBlob = await imageResponse.blob();
            const arrayBuffer = await imageBlob.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);
        } else {
            // It's already a Buffer
            buffer = imageUrl;
        }

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
        // If it's a string URL, return it; otherwise throw
        if (typeof imageUrl === 'string') {
            return imageUrl;
        }
        throw error;
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
