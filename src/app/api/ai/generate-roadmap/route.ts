import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase-server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        // Get authenticated user
        const supabase = await createServerClient();
        const {
            data: { session },
            error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Check if user has paid
        const { data: paymentData, error: paymentError } = await supabase
            .from('user_payments')
            .select('has_paid')
            .eq('user_id', session.user.id)
            .single();

        if (paymentError || !paymentData?.has_paid) {
            return NextResponse.json(
                { success: false, error: 'Payment required. Please upgrade to access this feature.' },
                { status: 403 }
            );
        }

        // Get career goal from request
        const { careerGoal } = await request.json();

        if (!careerGoal || typeof careerGoal !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Career goal is required' },
                { status: 400 }
            );
        }

        // Generate roadmap content with OpenAI
        const completion = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: [
                {
                    role: 'system',
                    content: `You are a career planning assistant and visual designer. Create detailed, actionable career roadmaps for students and beginners.`,
                },
                {
                    role: 'user',
                    content: `Create a detailed career roadmap for someone who wants to become a ${careerGoal}.

Include:
1. Key skills to learn (5-7 skills)
2. Tools/software to master (3-5 tools)
3. Step-by-step plan (6-10 steps with timeline)
4. 5 FREE online courses with:
   - Course name
   - Direct link (must be unique, real, and accessible)
   - Why it matters
5. Starter projects (2-3 projects)
6. Community hashtags (3-5 hashtags)
7. Estimated total timeline

Format as JSON with this exact structure:
{
  "careerName": "...",
  "skills": ["skill1", "skill2"],
  "tools": ["tool1", "tool2"],
  "steps": [
    {
      "step": 1,
      "title": "...",
      "description": "...",
      "timeline": "2-3 months",
      "hashtags": ["#hashtag1"]
    }
  ],
  "courses": [
    {
      "name": "Course Name",
      "link": "https://...",
      "reason": "Why this matters"
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "description": "...",
      "skills": ["skill1", "skill2"]
    }
  ],
  "hashtags": ["#hashtag1", "#hashtag2"],
  "estimatedTimeline": "6-12 months"
}

IMPORTANT: 
- All course links must be real, working, and free
- No duplicate links
- Be specific and actionable
- Tone should be confident and professional`,
                },
            ],
            response_format: { type: 'json_object' },
            temperature: 0.7,
        });

        const roadmapContent = JSON.parse(
            completion.choices[0].message.content || '{}'
        );

        // Generate infographic with DALL-E
        const infographicPrompt = `Professional left-to-right career timeline infographic for ${careerGoal}. 
Modern, clean design with milestone markers. 
Include key steps: ${roadmapContent.steps?.slice(0, 5).map((s: { title: string }) => s.title).join(', ')}.
Professional color scheme, minimalist style, horizontal flow.
Title: "${careerGoal} Career Roadmap"`;

        const infographicImage = await openai.images.generate({
            model: 'dall-e-3',
            prompt: infographicPrompt,
            size: '1792x1024',
            quality: 'standard',
            n: 1,
        });

        const infographicUrl = infographicImage.data?.[0]?.url || null;

        // Generate milestone graphic
        const milestonePrompt = `Clean, modern milestone roadmap graphic for ${careerGoal} career path.
Vertical or curved path with milestone markers leading to a finish line.
Finish line labeled: "${careerGoal}".
Include ${roadmapContent.steps?.length || 6} milestone points.
Professional, motivational design. Modern color palette.`;

        const milestoneImage = await openai.images.generate({
            model: 'dall-e-3',
            prompt: milestonePrompt,
            size: '1024x1792',
            quality: 'standard',
            n: 1,
        });

        const milestoneGraphicUrl = milestoneImage.data?.[0]?.url || null;

        return NextResponse.json({
            success: true,
            roadmap: roadmapContent,
            infographicUrl,
            milestoneGraphicUrl,
        });
    } catch (error: unknown) {
        console.error('Error generating roadmap:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate roadmap';
        return NextResponse.json(
            {
                success: false,
                error: errorMessage,
            },
            { status: 500 }
        );
    }
}
