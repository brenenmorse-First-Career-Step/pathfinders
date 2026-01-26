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

    // Theme colors from TSX component: Orange (#F39200), Blue (#0072BC), Green (#39B54A), Red (#ED1C24)
    const themeColors = {
        orange: "#F39200",
        blue: "#0072BC",
        green: "#39B54A",
        red: "#ED1C24",
        charcoal: "#263238",
        gray: "#6B7280",
    };

    // SVG Path Constants (matching TSX component, scaled for canvas)
    // Original TSX: stepWidth=120, stepHeight=80, startX=50, startY=750, viewBox="0 0 1100 850"
    // Scale factor: canvas is 1792x1024, adjust to fit content properly
    const padding = 60;
    const headerHeight = 80; // Reduced header height
    const availableHeight = height - padding * 2 - headerHeight;
    const availableWidth = width - padding * 2;
    
    // Use a more conservative scale to ensure content fits
    const scaleX = availableWidth / 1100; // ~1.52
    const scaleY = availableHeight / 850; // ~1.06
    const stepWidth = 120 * scaleX;
    const stepHeight = 80 * scaleY;
    const startX = 50 * scaleX;
    // Calculate startY: position steps to leave room for text below
    // Leave space for step number above, heading and description below
    const stepNumberSpace = 30 * scaleY; // Space above line for step numbers
    const textSpace = 120 * scaleY; // Space below line for heading + description
    const startY = availableHeight - textSpace;

    // Get step color based on 4-color cycle
    const getStepColor = (index: number) => {
        const colorIndex = index % 4;
        if (colorIndex === 0) return themeColors.orange;
        if (colorIndex === 1) return themeColors.blue;
        if (colorIndex === 2) return themeColors.green;
        return themeColors.red;
    };

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
                {/* Header Section - Simple Title Only */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '10px',
                    }}
                >
                    <h1
                        style={{
                            fontSize: '64px',
                            fontWeight: 'bold',
                            color: themeColors.charcoal,
                            textAlign: 'center',
                            display: 'flex',
                        }}
                    >
                        Milestone Roadmap
                    </h1>
                </div>

                {/* Timeline Container with SVG */}
                <div
                    style={{
                        position: 'relative',
                        width: '100%',
                        flex: 1,
                        display: 'flex',
                        minHeight: '900px',
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
                        viewBox={`0 0 ${1100 * scaleX} ${availableHeight}`}
                    >
                        {/* Dynamic Path Generation for Steps */}
                        {steps.map((step, index) => {
                            const stepColor = getStepColor(index);
                            const strokeWidth = 20 * Math.min(scaleX, scaleY);
                            
                            if (index === steps.length - 1) {
                                // Final Arrow
                                const x = startX + index * stepWidth;
                                const y = startY - index * stepHeight;
                                const arrowLength = 100 * scaleX;
                                const arrowHeight = 40 * scaleY;
                                return (
                                    <g key={step.number}>
                                        <path
                                            d={`M ${x} ${y} L ${x + arrowLength} ${y} L ${x + arrowLength} ${y - arrowHeight}`}
                                            stroke={stepColor}
                                            strokeWidth={strokeWidth}
                                            strokeLinecap="round"
                                            fill="none"
                                        />
                                        <path
                                            d={`M ${x + arrowLength * 0.8} ${y - arrowHeight * 0.875} L ${x + arrowLength} ${y - arrowHeight * 1.625} L ${x + arrowLength * 1.2} ${y - arrowHeight * 0.875} Z`}
                                            fill={stepColor}
                                        />
                                    </g>
                                );
                            }

                            const currX = startX + index * stepWidth;
                            const currY = startY - index * stepHeight;
                            const nextX = startX + (index + 1) * stepWidth;
                            const nextY = startY - (index + 1) * stepHeight;
                            const cornerOffset = 20 * Math.min(scaleX, scaleY);

                            return (
                                <path
                                    key={step.number}
                                    d={`M ${currX} ${currY} L ${nextX - cornerOffset} ${currY} Q ${nextX} ${currY} ${nextX} ${currY - cornerOffset} L ${nextX} ${nextY}`}
                                    stroke={stepColor}
                                    strokeWidth={strokeWidth}
                                    strokeLinecap="round"
                                    fill="none"
                                />
                            );
                        })}

                        {/* Joint Circles */}
                        {steps.map((step, index) => {
                            const stepColor = getStepColor(index);
                            const circleRadius = 10 * Math.min(scaleX, scaleY);
                            return (
                                <circle
                                    key={`circle-${step.number}`}
                                    cx={startX + index * stepWidth}
                                    cy={startY - index * stepHeight}
                                    r={circleRadius}
                                    fill={stepColor}
                                />
                            );
                        })}
                    </svg>

                    {/* Content Overlay */}
                    {steps.map((step, index) => {
                        const stepColor = getStepColor(index);
                        const x = startX + index * stepWidth;
                        const y = startY - index * stepHeight;
                        const textWidth = 192 * scaleX;
                        const titleLines = wrapText(step.title, textWidth, 12 * scaleY);
                        const descriptionLines = wrapText(step.description || '', textWidth, 11 * scaleY).slice(0, 2);

                        return (
                            <div
                                key={`content-${step.number}`}
                                style={{
                                    position: 'absolute',
                                    left: `${x}px`,
                                    top: `${y}px`,
                                    display: 'flex',
                                }}
                            >
                                {/* Step Number ABOVE the ladder line */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: `${16 * scaleX}px`,
                                        top: `${-stepNumberSpace}px`,
                                        color: stepColor,
                                        fontWeight: 'bold',
                                        fontSize: `${14 * scaleY}px`,
                                        whiteSpace: 'nowrap',
                                        zIndex: 10,
                                        display: 'flex',
                                    }}
                                >
                                    STEP {step.number.toString().padStart(2, '0')}
                                </div>

                                {/* Heading BELOW the line */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        left: `${16 * scaleX}px`,
                                        top: `${20 * scaleY}px`,
                                        width: `${textWidth}px`,
                                        display: 'flex',
                                        flexDirection: 'column',
                                    }}
                                >
                                    <h3
                                        style={{
                                            fontSize: `${13 * scaleY}px`,
                                            fontWeight: 'bold',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                            color: stepColor,
                                            marginBottom: `${8 * scaleY}px`,
                                            display: 'flex',
                                        }}
                                    >
                                        {step.title}
                                    </h3>
                                    
                                    {/* Description BELOW the heading */}
                                    <p
                                        style={{
                                            fontSize: `${11 * scaleY}px`,
                                            lineHeight: '1.5',
                                            color: themeColors.gray,
                                            fontWeight: '500',
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}
                                    >
                                        {descriptionLines.map((line, lineIndex) => (
                                            <span
                                                key={lineIndex}
                                                style={{
                                                    display: 'flex',
                                                    marginBottom: lineIndex < descriptionLines.length - 1 ? `${4 * scaleY}px` : '0',
                                                }}
                                            >
                                                {line}
                                            </span>
                                        ))}
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
