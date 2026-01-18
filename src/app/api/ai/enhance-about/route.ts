import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { aboutMe, accomplishment, goals } = await request.json();

        if (!aboutMe || !accomplishment || !goals) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const prompt = `Create a professional "About Me" section for a high school student's resume based on:
- About: ${aboutMe}
- Key Accomplishment: ${accomplishment}
- Career Goals: ${goals}

Requirements:
- Write in first person
- 3-4 sentences maximum
- Professional tone but authentic to a student
- ATS-friendly (no special characters)
- Highlight strengths and aspirations
- Keep it under 150 words

Return ONLY the about section text, no extra formatting or labels.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional resume writer specializing in student resumes. Create compelling, authentic about sections.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 250,
        });

        const enhancedText = completion.choices[0]?.message?.content?.trim() || '';

        return NextResponse.json({ enhancedText });
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return NextResponse.json(
            { error: 'Failed to enhance about section' },
            { status: 500 }
        );
    }
}
