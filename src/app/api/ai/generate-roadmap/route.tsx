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
    
    // Calculate spacing for arrow boxes
    const margin = 120;
    const availableWidth = width - (margin * 2);
    const boxWidth = 180;
    const boxSpacing = (availableWidth - (boxWidth * steps.length)) / (steps.length - 1);

    // Brand colors
    const colors = {
        careerBlue: '#1E88E5',
        careerBlueDark: '#1565C0',
        stepGreen: '#43A047',
        optimismOrange: '#FB8C00',
        softSky: '#E3F2FD',
        charcoal: '#263238',
    };

    // Use brand colors - alternate between blue, green, and orange
    const getStepColor = (index: number) => {
        const colorIndex = index % 3;
        if (colorIndex === 0) return colors.careerBlue;
        if (colorIndex === 1) return colors.stepGreen;
        return colors.optimismOrange;
    };

    const imageResponse = new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: colors.charcoal, // Dark charcoal background
                    padding: '60px 80px',
                    justifyContent: 'center',
                }}
            >
                {/* Title */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '60px',
                    }}
                >
                    <div
                        style={{
                            fontSize: 72,
                            fontWeight: 'bold',
                            color: '#ffffff',
                            textAlign: 'center',
                            display: 'flex',
                        }}
                    >
                        Career Roadmap
                    </div>
                </div>

                {/* Timeline Container - Centered vertically */}
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flex: 1,
                    }}
                >
                    {/* Arrow-shaped boxes timeline */}
                    <div
                        style={{
                            position: 'relative',
                            width: '100%',
                            display: 'flex',
                            justifyContent: 'flex-start',
                            alignItems: 'center',
                            paddingLeft: `${margin}px`,
                        }}
                    >
                        {steps.map((step, index) => {
                            const stepColor = getStepColor(index);
                            const stepX = (index * (boxWidth + boxSpacing));
                            const titleLines = wrapText(step.title, 240, 22);
                            const isEven = index % 2 === 0;

                            return (
                                <div
                                    key={step.number}
                                    style={{
                                        position: 'absolute',
                                        left: `${stepX}px`,
                                        top: '0px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                    }}
                                >
                                    {/* Arrow-shaped box - using connected rectangles */}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                        }}
                                    >
                                        {/* Main box */}
                                        <div
                                            style={{
                                                width: `${boxWidth}px`,
                                                height: '80px',
                                                backgroundColor: stepColor,
                                                borderRadius: '8px 0 0 8px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            {/* Step number */}
                                            <span
                                                style={{
                                                    fontSize: 36,
                                                    fontWeight: 'bold',
                                                    color: '#ffffff',
                                                    display: 'flex',
                                                }}
                                            >
                                                {step.number}
                                            </span>
                                        </div>
                                        
                                        {/* Arrow point (triangle shape using border) */}
                                        {index < steps.length - 1 && (
                                            <div
                                                style={{
                                                    width: '0',
                                                    height: '0',
                                                    borderTop: '40px solid transparent',
                                                    borderBottom: '40px solid transparent',
                                                    borderLeft: `30px solid ${stepColor}`,
                                                    display: 'flex',
                                                }}
                                            />
                                        )}
                                    </div>

                                    {/* Event marker (circle with icon placeholder) */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: isEven ? '-120px' : '100px',
                                            width: '60px',
                                            height: '60px',
                                            borderRadius: '50%',
                                            border: '2px dashed #F8F8F8',
                                            backgroundColor: 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '40px',
                                                height: '40px',
                                                borderRadius: '50%',
                                                backgroundColor: '#F8F8F8',
                                                display: 'flex',
                                            }}
                                        />
                                    </div>

                                    {/* Dotted line connecting box to marker */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: isEven ? '-60px' : '80px',
                                            width: '2px',
                                            height: '60px',
                                            borderLeft: '2px dashed #F8F8F8',
                                            display: 'flex',
                                        }}
                                    />

                                    {/* Event description text */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: isEven ? '-180px' : '180px',
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            width: '240px',
                                        }}
                                    >
                                        {titleLines.map((line, lineIndex) => (
                                            <div
                                                key={lineIndex}
                                                style={{
                                                    fontSize: 22,
                                                    fontWeight: 'normal',
                                                    color: '#F8F8F8',
                                                    textAlign: 'center',
                                                    marginBottom: lineIndex < titleLines.length - 1 ? '4px' : '0',
                                                    display: 'flex',
                                                    width: '100%',
                                                    justifyContent: 'center',
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
                        // Diagonal path coordinates
                        const pathStartX = 12; // 12% from left
                        const pathEndX = 88; // 88% from left
                        const pathStartY = 75; // 75% from top
                        const pathEndY = 25; // 25% from top
                        
                        const stepX = pathStartX + (pathEndX - pathStartX) * progress;
                        const stepY = pathStartY - (pathStartY - pathEndY) * progress;
                        
                        // Alternate colors for visual interest
                        const stepColor = index % 3 === 0 
                            ? colors.careerBlue 
                            : index % 3 === 1 
                            ? colors.stepGreen 
                            : colors.optimismOrange;
                        
                        // Calculate text position to avoid overlap
                        // Alternate text position: left side for even steps, right side for odd steps
                        const textSide = index % 2 === 0 ? 'left' : 'right';
                        const textOffsetX = textSide === 'left' ? -200 : 200;
                        const textAlign = textSide === 'left' ? 'right' : 'left';
                        
                        // Wrap text properly
                        const titleLines = wrapText(step.title, 320, 26);

                        return (
                            <div
                                key={step.number}
                                style={{
                                    position: 'absolute',
                                    left: `${stepX}%`,
                                    top: `${stepY}%`,
                                    transform: 'translate(-50%, -50%)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    zIndex: 1,
                                }}
                            >
                                {/* Step Block */}
                                <div
                                    style={{
                                        width: '130px',
                                        height: '65px',
                                        backgroundColor: `${stepColor}20`,
                                        border: `3px solid ${stepColor}`,
                                        borderRadius: '10px',
                                        marginBottom: '40px',
                                        display: 'flex',
                                        boxShadow: `0 4px 12px ${stepColor}30`,
                                    }}
                                />

                                {/* Step Number Circle */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '-32px',
                                        width: '64px',
                                        height: '64px',
                                        borderRadius: '50%',
                                        backgroundColor: stepColor,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: `0 4px 12px ${stepColor}40`,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontSize: 36,
                                            fontWeight: 'bold',
                                            color: '#ffffff',
                                            display: 'flex',
                                        }}
                                    >
                                        {step.number}
                                    </span>
                                </div>

                                {/* Step Title - Positioned to avoid overlap */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: `${textOffsetX}px`,
                                        top: '50%',
                                        transform: textSide === 'left' 
                                            ? 'translateX(-100%) translateY(-50%)' 
                                            : 'translateX(0) translateY(-50%)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: textSide === 'left' ? 'flex-end' : 'flex-start',
                                        width: '320px',
                                    }}
                                >
                                    {titleLines.map((line, lineIndex) => (
                                        <div
                                            key={lineIndex}
                                            style={{
                                                fontSize: 26,
                                                fontWeight: 'normal',
                                                color: colors.charcoal,
                                                textAlign: textAlign,
                                                marginBottom: lineIndex < titleLines.length - 1 ? '5px' : '0',
                                                display: 'flex',
                                                width: '100%',
                                                justifyContent: textSide === 'left' ? 'flex-end' : 'flex-start',
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
