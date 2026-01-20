import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { ImageResponse } from '@vercel/og';
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

        // Generate roadmap images using Canvas
        console.log('Creating infographic with Canvas...');
        
        // Create structured roadmap data
        const roadmapStructure = {
            careerName: roadmapData.careerName,
            totalSteps: roadmapData.steps.length,
            steps: roadmapData.steps.map(step => ({
                number: step.step,
                title: step.title
            }))
        };
        
        // Generate infographic using Canvas
        const infographicBuffer = await generateInfographicImage(
            roadmapStructure.careerName,
            roadmapStructure.steps
        );
        
        // Upload the infographic
        const infographicUrl = await uploadImageToStorage(
            infographicBuffer,
            userId,
            'infographic'
        );

        console.log('Creating milestone roadmap with Canvas...');
        
        // Generate milestone roadmap using Canvas
        const milestoneBuffer = await generateMilestoneRoadmapImage(
            roadmapStructure.careerName,
            roadmapStructure.steps
        );
        
        // Upload the milestone roadmap
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

async function generateInfographicImage(
    careerName: string,
    steps: Array<{ number: number; title: string }>
): Promise<Buffer> {
    const width = 1792;
    const height = 1024;
    const stepSpacing = (width - 300) / (steps.length + 1);

    // Brand colors
    const colors = {
        careerBlue: '#1E88E5',
        careerBlueDark: '#1565C0',
        stepGreen: '#43A047',
        optimismOrange: '#FB8C00',
        softSky: '#E3F2FD',
        charcoal: '#263238',
    };

    const imageResponse = new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: `linear-gradient(135deg, #ffffff 0%, ${colors.softSky} 50%, #E8F5E9 100%)`,
                    padding: '60px 80px',
                }}
            >
                {/* Title with gradient */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        marginBottom: '40px',
                    }}
                >
                    <div
                        style={{
                            fontSize: 80,
                            fontWeight: 'bold',
                            color: colors.careerBlue,
                            textAlign: 'center',
                            marginBottom: '10px',
                            display: 'flex',
                        }}
                    >
                        {careerName}
                    </div>
                    <div
                        style={{
                            fontSize: 48,
                            fontWeight: '600',
                            color: colors.charcoal,
                            textAlign: 'center',
                        }}
                    >
                        Career Roadmap
                    </div>
                </div>

                {/* Timeline Container */}
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        marginTop: '60px',
                    }}
                >
                    {/* Connecting Line with gradient */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '150px',
                            right: '150px',
                            height: '8px',
                            background: `linear-gradient(90deg, ${colors.careerBlue} 0%, ${colors.stepGreen} 50%, ${colors.optimismOrange} 100%)`,
                            borderRadius: '4px',
                            zIndex: 0,
                        }}
                    />

                    {/* Steps Container */}
                    <div
                        style={{
                            position: 'relative',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'space-around',
                            alignItems: 'center',
                            zIndex: 1,
                        }}
                    >
                        {steps.map((step, index) => {
                            // Alternate colors for visual interest
                            const stepColor = index % 3 === 0 
                                ? colors.careerBlue 
                                : index % 3 === 1 
                                ? colors.stepGreen 
                                : colors.optimismOrange;
                            
                            const titleLines = wrapText(step.title, stepSpacing * 0.85, 32);

                            return (
                                <div
                                    key={step.number}
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        zIndex: 1,
                                    }}
                                >
                                    {/* Step Circle with shadow effect */}
                                    <div
                                        style={{
                                            width: '120px',
                                            height: '120px',
                                            borderRadius: '50%',
                                            background: `linear-gradient(135deg, ${stepColor} 0%, ${stepColor}dd 100%)`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            marginBottom: '30px',
                                            boxShadow: `0 8px 24px ${stepColor}40`,
                                        }}
                                    >
                                        <span
                                            style={{
                                                fontSize: 56,
                                                fontWeight: 'bold',
                                                color: '#ffffff',
                                                display: 'flex',
                                            }}
                                        >
                                            {step.number}
                                        </span>
                                    </div>

                                    {/* Step Title */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            maxWidth: `${stepSpacing * 0.85}px`,
                                        }}
                                    >
                                        {titleLines.map((line, lineIndex) => (
                                            <div
                                                key={lineIndex}
                                                style={{
                                                    fontSize: 32,
                                                    fontWeight: 'bold',
                                                    color: colors.charcoal,
                                                    textAlign: 'center',
                                                    marginBottom: lineIndex < titleLines.length - 1 ? '8px' : '0',
                                                    display: 'flex',
                                                }}
                                            >
                                                {line}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        ),
        {
            width,
            height,
        }
    );

    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

async function generateMilestoneRoadmapImage(
    careerName: string,
    steps: Array<{ number: number; title: string }>
): Promise<Buffer> {
    const width = 1792;
    const height = 1024;

    // Brand colors
    const colors = {
        careerBlue: '#1E88E5',
        careerBlueDark: '#1565C0',
        stepGreen: '#43A047',
        optimismOrange: '#FB8C00',
        softSky: '#E3F2FD',
        charcoal: '#263238',
    };

    const imageResponse = new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    background: `linear-gradient(135deg, ${colors.softSky} 0%, #ffffff 30%, #E8F5E9 100%)`,
                    padding: '50px',
                    position: 'relative',
                }}
            >
                {/* Title */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: '40px',
                    }}
                >
                    <div
                        style={{
                            fontSize: 76,
                            fontWeight: 'bold',
                            color: colors.careerBlue,
                            display: 'flex',
                        }}
                    >
                        {careerName}
                    </div>
                    {/* Finish Line Badge */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                        }}
                    >
                        <div
                            style={{
                                fontSize: 20,
                                fontWeight: '600',
                                color: colors.charcoal,
                                marginBottom: '8px',
                                display: 'flex',
                            }}
                        >
                            FINISH LINE
                        </div>
                        <div
                            style={{
                                fontSize: 48,
                                fontWeight: 'bold',
                                color: colors.stepGreen,
                                display: 'flex',
                            }}
                        >
                            {careerName}
                        </div>
                    </div>
                </div>

                {/* Steps Container */}
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '80px 150px',
                    }}
                >
                    {/* Diagonal Path with gradient */}
                    <div
                        style={{
                            position: 'absolute',
                            left: '12%',
                            bottom: '25%',
                            width: '76%',
                            height: '8px',
                            background: `linear-gradient(135deg, ${colors.careerBlue} 0%, ${colors.stepGreen} 50%, ${colors.optimismOrange} 100%)`,
                            transform: 'rotate(-25deg)',
                            transformOrigin: 'left bottom',
                            borderRadius: '4px',
                            zIndex: 0,
                            boxShadow: `0 4px 12px ${colors.careerBlue}30`,
                        }}
                    />

                    {/* Steps */}
                    {steps.map((step, index) => {
                        const progress = index / (steps.length - 1);
                        const leftPercent = 12 + progress * 76;
                        const topPercent = 75 - progress * 50;
                        
                        // Alternate colors for visual interest
                        const stepColor = index % 3 === 0 
                            ? colors.careerBlue 
                            : index % 3 === 1 
                            ? colors.stepGreen 
                            : colors.optimismOrange;
                        
                        const titleLines = wrapText(step.title, 380, 28);

                        return (
                            <div
                                key={step.number}
                                style={{
                                    position: 'absolute',
                                    left: `${leftPercent}%`,
                                    top: `${topPercent}%`,
                                    transform: 'translate(-50%, -50%)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    zIndex: 1,
                                }}
                            >
                                {/* Step Block with gradient */}
                                <div
                                    style={{
                                        width: '140px',
                                        height: '70px',
                                        background: `linear-gradient(135deg, ${stepColor}15 0%, ${stepColor}25 100%)`,
                                        border: `3px solid ${stepColor}`,
                                        borderRadius: '12px',
                                        marginBottom: '35px',
                                        display: 'flex',
                                        boxShadow: `0 6px 20px ${stepColor}30`,
                                    }}
                                />

                                {/* Step Number Circle */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '-35px',
                                        width: '70px',
                                        height: '70px',
                                        borderRadius: '50%',
                                        background: `linear-gradient(135deg, ${stepColor} 0%, ${stepColor}dd 100%)`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: `0 6px 20px ${stepColor}40`,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 40,
                                            fontWeight: 'bold',
                                            color: '#ffffff',
                                            display: 'flex',
                                        }}
                                    >
                                        {step.number}
                                    </span>
                                </div>

                                {/* Step Title */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'flex-start',
                                        marginLeft: '90px',
                                        maxWidth: '380px',
                                    }}
                                >
                                    {titleLines.map((line, lineIndex) => (
                                        <div
                                            key={lineIndex}
                                            style={{
                                                fontSize: 28,
                                                fontWeight: 'bold',
                                                color: colors.charcoal,
                                                textAlign: 'left',
                                                marginBottom: lineIndex < titleLines.length - 1 ? '6px' : '0',
                                                display: 'flex',
                                            }}
                                        >
                                            {line}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        ),
        {
            width,
            height,
        }
    );

    const arrayBuffer = await imageResponse.arrayBuffer();
    return Buffer.from(arrayBuffer);
}

// Helper function to wrap text
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
