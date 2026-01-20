import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
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

        // Generate roadmap images programmatically (no DALL-E - full control)
        console.log('Creating infographic...');
        
        // Create structured roadmap data
        const roadmapStructure = {
            careerName: roadmapData.careerName,
            totalSteps: roadmapData.steps.length,
            steps: roadmapData.steps.map(step => ({
                number: step.step,
                title: step.title
            }))
        };
        
        // Create infographic entirely with canvas (no DALL-E)
        const infographicBuffer = await createInfographicImage(
            roadmapStructure.careerName,
            roadmapStructure.steps
        );
        
        // Upload the image
        const infographicUrl = await uploadImageToStorage(
            infographicBuffer,
            userId,
            'infographic'
        );

        console.log('Creating milestone roadmap...');
        
        // Create milestone roadmap entirely with canvas (no DALL-E)
        const milestoneBuffer = await createMilestoneRoadmapImage(
            roadmapStructure.careerName,
            roadmapStructure.steps
        );
        
        // Upload the image
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

async function createInfographicImage(
    careerName: string,
    steps: Array<{ number: number; title: string }>
): Promise<Buffer> {
    const width = 1792;
    const height = 1024;
    const stepSpacing = width / (steps.length + 1);
    const stepY = height / 2 + 50;

    // Create SVG with embedded text
    const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  
  <!-- Main Title -->
  <text x="${width / 2}" y="80" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#1a1a1a" text-anchor="middle">${escapeXml(careerName)} Career Roadmap</text>
  
  <!-- Connecting Line -->
  <line x1="${stepSpacing}" y1="${stepY}" x2="${width - stepSpacing}" y2="${stepY}" stroke="#3b82f6" stroke-width="4"/>
  
  ${steps.map((step, index) => {
        const stepX = stepSpacing * (index + 1);
        const titleLines = wrapText(step.title, stepSpacing * 0.9, 36);
        
        return `
  <!-- Step ${step.number} -->
  <circle cx="${stepX}" cy="${stepY}" r="50" fill="#2563eb"/>
  <text x="${stepX}" y="${stepY + 8}" font-family="Arial, sans-serif" font-size="42" font-weight="bold" fill="#ffffff" text-anchor="middle">${step.number}</text>
  ${titleLines.map((line, lineIndex) => `
  <text x="${stepX}" y="${stepY + 70 + (lineIndex * 45)}" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="#1a1a1a" text-anchor="middle">${escapeXml(line)}</text>`).join('')}
        `;
    }).join('')}
</svg>`;

    // Convert SVG to PNG using sharp
    return await sharp(Buffer.from(svg))
        .png()
        .toBuffer();
}

async function createMilestoneRoadmapImage(
    careerName: string,
    steps: Array<{ number: number; title: string }>
): Promise<Buffer> {
    const width = 1792;
    const height = 1024;
    const startX = width * 0.12;
    const endX = width * 0.88;
    const startY = height * 0.75;
    const endY = height * 0.25;
    const stepCount = steps.length;
    const blockWidth = 120;
    const blockHeight = 60;

    // Build path points
    const pathPoints = steps.map((step, index) => {
        const progress = index / (stepCount - 1);
        const stepX = startX + (endX - startX) * progress;
        const stepY = startY - (startY - endY) * progress;
        return { x: stepX, y: stepY };
    });

    // Create SVG
    const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="#ffffff"/>
  
  <!-- Main Title -->
  <text x="${width / 2}" y="70" font-family="Arial, sans-serif" font-size="72" font-weight="bold" fill="#1a1a1a" text-anchor="middle">${escapeXml(careerName)}</text>
  
  <!-- Finish Line Label -->
  <text x="${width - 50}" y="70" font-family="Arial, sans-serif" font-size="56" font-weight="bold" fill="#1a1a1a" text-anchor="end">${escapeXml(careerName)}</text>
  
  <!-- Connecting Path -->
  <path d="M ${pathPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')}" stroke="#3b82f6" stroke-width="4" fill="none"/>
  
  ${steps.map((step, index) => {
        const { x: stepX, y: stepY } = pathPoints[index];
        const titleLines = wrapText(step.title, 350, 32);
        
        return `
  <!-- Step ${step.number} Block -->
  <rect x="${stepX - blockWidth / 2}" y="${stepY - blockHeight / 2}" width="${blockWidth}" height="${blockHeight}" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
  
  <!-- Step Number Circle -->
  <circle cx="${stepX}" cy="${stepY - blockHeight / 2 - 30}" r="30" fill="#2563eb"/>
  <text x="${stepX}" y="${stepY - blockHeight / 2 - 30 + 8}" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#ffffff" text-anchor="middle">${step.number}</text>
  
  <!-- Step Title -->
  ${titleLines.map((line, lineIndex) => `
  <text x="${stepX + blockWidth / 2 + 20}" y="${stepY - 20 + (lineIndex * 40)}" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#1a1a1a">${escapeXml(line)}</text>`).join('')}
        `;
    }).join('')}
</svg>`;

    // Convert SVG to PNG using sharp
    return await sharp(Buffer.from(svg))
        .png()
        .toBuffer();
}

// Helper function to escape XML/SVG special characters
function escapeXml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Helper function to wrap text (simple approximation)
function wrapText(text: string, maxWidth: number, fontSize: number): string[] {
    // Simple approximation: ~0.6 * fontSize per character
    const avgCharWidth = fontSize * 0.6;
    const maxChars = Math.floor(maxWidth / avgCharWidth);
    
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';

    words.forEach((word) => {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (testLine.length <= maxChars) {
            currentLine = testLine;
        } else {
            if (currentLine) {
                lines.push(currentLine);
            }
            currentLine = word;
        }
    });

    if (currentLine) {
        lines.push(currentLine);
    }

    return lines.length > 0 ? lines : [text];
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
