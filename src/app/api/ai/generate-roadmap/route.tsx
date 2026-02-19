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

        // Generate milestone roadmap using Canvas with descriptions
        const milestoneSteps = roadmapData.steps.map(step => ({
            number: step.step,
            title: step.title,
            description: step.description
        }));

        const milestoneBuffer = await generateMilestoneRoadmapImage(
            roadmapStructure.careerName,
            milestoneSteps
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
    steps: Array<{ number: number; title: string; description: string }>
): Promise<Buffer> {
    const width = 1792;
    const height = 1024;

    // Brand colors from newcode.tsx
    const COLORS = [
        { name: 'orange', hex: '#F59E0B' }, // text-amber-500
        { name: 'blue', hex: '#3B82F6' },   // text-blue-500
        { name: 'green', hex: '#22C55E' },  // text-green-500
        { name: 'red', hex: '#EF4444' },    // text-red-500
    ];

    // Scaling constants for the 1792x1024 canvas
    // newcode.tsx used stride=300, stepHeight=140 for a dynamic width.
    // For 7 steps, we'll use a stride that fits 1792px.
    const padding = 100;
    const startX = 100;
    const stride = (width - padding * 3) / (steps.length || 1);
    const stepHeight = (height - padding * 4) / (steps.length || 1);
    const cornerRadius = 40;
    const strokeWidth = 14;
    const horizontalSegmentLength = stride * 0.7;

    // We start from the bottom-left
    const totalHeight = steps.length * stepHeight + padding * 2;
    const startY = height - 150;

    const getStepColor = (index: number) => COLORS[index % COLORS.length];

    const imageResponse = new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: '#FFFFFF',
                    padding: '60px 80px',
                }}
            >
                {/* Header Section */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '40px',
                    }}
                >
                    <h1
                        style={{
                            fontSize: '72px',
                            fontWeight: 'bold',
                            color: '#263238',
                            textAlign: 'center',
                            display: 'flex',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                        }}
                    >
                        Milestone Roadmap
                    </h1>
                </div>

                {/* Timeline Container */}
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        flex: 1,
                        display: 'flex',
                        minHeight: '800px',
                    }}
                >
                    {/* SVG Path Container */}
                    <svg
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                        }}
                        viewBox={`0 0 ${width} ${height - 200}`}
                    >
                        {steps.map((_, index) => {
                            const currentX = startX + index * stride;
                            const currentY = startY - index * stepHeight - 200; // Adjusted for header
                            const color = getStepColor(index);

                            // Last Step: Simple straight line with arrow
                            if (index === steps.length - 1) {
                                return (
                                    <g key={`arrow-${index}`}>
                                        <path
                                            d={`M ${currentX} ${currentY} L ${currentX + horizontalSegmentLength} ${currentY}`}
                                            stroke={color.hex}
                                            strokeWidth={strokeWidth}
                                            strokeLinecap="round"
                                            fill="none"
                                        />
                                        <path
                                            d={`M ${currentX + horizontalSegmentLength} ${currentY} Q ${currentX + horizontalSegmentLength + cornerRadius} ${currentY} ${currentX + horizontalSegmentLength + cornerRadius} ${currentY - cornerRadius} L ${currentX + horizontalSegmentLength + cornerRadius} ${currentY - cornerRadius - 30}`}
                                            stroke={color.hex}
                                            strokeWidth={strokeWidth}
                                            fill="none"
                                        />
                                        <path
                                            d={`M ${currentX + horizontalSegmentLength + cornerRadius - 20} ${currentY - cornerRadius - 25} L ${currentX + horizontalSegmentLength + cornerRadius} ${currentY - cornerRadius - 60} L ${currentX + horizontalSegmentLength + cornerRadius + 20} ${currentY - cornerRadius - 25} Z`}
                                            fill={color.hex}
                                        />
                                    </g>
                                );
                            }

                            const nextColor = getStepColor(index + 1);
                            const nextY = currentY - stepHeight;

                            const segmentH_End = currentX + horizontalSegmentLength;
                            const segmentV_X = segmentH_End + cornerRadius;
                            const segmentV_Top = nextY + cornerRadius;
                            const curveRightEnd = segmentV_X + cornerRadius;
                            const nextStepStart = startX + (index + 1) * stride;

                            return (
                                <g key={index}>
                                    {/* Horizontal Line */}
                                    <path
                                        d={`M ${currentX} ${currentY} L ${segmentH_End} ${currentY}`}
                                        stroke={color.hex}
                                        strokeWidth={strokeWidth}
                                        strokeLinecap="round"
                                        fill="none"
                                    />
                                    {/* Curve Up */}
                                    <path
                                        d={`M ${segmentH_End} ${currentY} Q ${segmentV_X} ${currentY} ${segmentV_X} ${currentY - cornerRadius}`}
                                        stroke={color.hex}
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                    />
                                    {/* Vertical Line (Transition to next color) */}
                                    <path
                                        d={`M ${segmentV_X} ${currentY - cornerRadius} L ${segmentV_X} ${segmentV_Top}`}
                                        stroke={nextColor.hex}
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                    />
                                    {/* Curve Right */}
                                    <path
                                        d={`M ${segmentV_X} ${segmentV_Top} Q ${segmentV_X} ${nextY} ${segmentV_X + cornerRadius} ${nextY}`}
                                        stroke={nextColor.hex}
                                        strokeWidth={strokeWidth}
                                        fill="none"
                                    />
                                    {/* Connector */}
                                    {nextStepStart > curveRightEnd && (
                                        <path
                                            d={`M ${curveRightEnd} ${nextY} L ${nextStepStart} ${nextY}`}
                                            stroke={nextColor.hex}
                                            strokeWidth={strokeWidth}
                                            fill="none"
                                        />
                                    )}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Text Content Overlay */}
                    {steps.map((step, index) => {
                        const color = getStepColor(index);
                        const currentX = startX + index * stride;
                        const currentY = startY - index * stepHeight - 200;
                        const textWidth = stride * 1.2;

                        return (
                            <div key={step.number}>
                                {/* Step Number - Above Line */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: currentX,
                                        top: currentY - 50,
                                        width: `${textWidth}px`,
                                        color: color.hex,
                                        fontWeight: 'bold',
                                        fontSize: '24px',
                                        textTransform: 'uppercase',
                                        display: 'flex',
                                        paddingLeft: '20px',
                                    }}
                                >
                                    Step {String(step.number).padStart(2, '0')}
                                </div>

                                {/* Title & Desc - Below Line */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: currentX,
                                        top: currentY + 20,
                                        width: `${textWidth}px`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        paddingLeft: '20px',
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: '28px',
                                            fontWeight: 'bold',
                                            margin: '0 0 8px 0',
                                            textTransform: 'uppercase',
                                            color: color.hex,
                                            display: 'flex',
                                        }}
                                    >
                                        {step.title}
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: '20px',
                                            color: '#666666',
                                            margin: 0,
                                            display: 'flex',
                                        }}
                                    >
                                        {step.description}
                                    </p>
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
