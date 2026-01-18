import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
    try {
        const { title, organization, description, type } = await request.json();

        if (!title || !organization || !description) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const prompt = `Transform this ${type || 'experience'} description into 3-5 professional bullet points for a resume:

Role: ${title}
Organization: ${organization}
Description: ${description}

Requirements:
- Start each bullet with a strong action verb
- Quantify achievements where possible
- ATS-friendly format
- Professional but authentic to a student
- Each bullet should be 1-2 lines maximum
- Focus on impact and results

Return ONLY the bullet points, one per line, starting with "•" symbol.`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: 'You are a professional resume writer. Create impactful, ATS-friendly bullet points for student experiences.',
                },
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0.7,
            max_tokens: 300,
        });

        const response = completion.choices[0]?.message?.content || '';
        const bullets = response
            .split('\n')
            .filter(line => line.trim() && line.includes('•'))
            .map(line => line.replace(/^[•\-\*]\s*/, '').trim())
            .slice(0, 5);

        return NextResponse.json({ bullets });
    } catch (error) {
        console.error('OpenAI API Error:', error);
        return NextResponse.json(
            { error: 'Failed to enhance experience' },
            { status: 500 }
        );
    }
}
