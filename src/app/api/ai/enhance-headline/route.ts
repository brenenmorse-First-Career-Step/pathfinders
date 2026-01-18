import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(request: NextRequest) {
    try {
        // Check if API key exists
        if (!process.env.OPENAI_API_KEY) {
            console.error('OPENAI_API_KEY is not set in environment variables');
            return NextResponse.json(
                { error: 'OpenAI API key not configured' },
                { status: 500 }
            );
        }

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const { interests, school, graduationYear, currentHeadline } = await request.json();

        console.log('Headline API called with:', { interests, school, graduationYear, currentHeadline });

        if (!interests || !school || !graduationYear) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Build context-aware prompt
        const contextNote = currentHeadline
            ? `The student has written: "${currentHeadline}". Use this as inspiration and context for their career interests.`
            : '';

        const prompt = `Generate 3 professional headline options for a high school student's resume with the following details:
- School: ${school}
- Graduation Year: ${graduationYear}
- Interests: ${interests.join(', ')}
${contextNote}

Requirements:
- Keep each headline under 120 characters
- Make them professional and ATS-friendly
- Include graduation year
- Highlight main interest/passion
${currentHeadline ? '- Align with the career direction indicated in their draft headline' : ''}
- Format: Return ONLY 3 headlines, one per line, no numbering or extra text

Example format:
Aspiring Technology Professional | Class of 2025
Motivated Student Passionate About Computer Science | 2025 Graduate
Future Software Developer | Technology Enthusiast`;

        console.log('Calling OpenAI API...');

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional resume writer specializing in student resumes. Generate concise, impactful headlines.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 200,
        });

        console.log('OpenAI API response received');

        const response = completion.choices[0]?.message?.content || '';
        const suggestions = response
            .split('\n')
            .filter(line => line.trim())
            .slice(0, 3);

        console.log('Generated suggestions:', suggestions);

        return NextResponse.json({ suggestions });
    } catch (error: unknown) {
        const errorDetails = error instanceof Error ? {
            message: error.message,
            name: error.name,
        } : { message: 'Unknown error occurred' };

        console.error('OpenAI API Error Details:', errorDetails);
        return NextResponse.json(
            { error: 'Failed to generate headlines', details: errorDetails.message },
            { status: 500 }
        );
    }
}
