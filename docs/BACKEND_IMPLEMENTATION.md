# Backend Implementation Guide

> **Note**: This document outlines the planned backend architecture for FirstCareerSteps. This is for **Milestone 2** implementation only. The current frontend MVP uses mock data.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Supabase Setup](#supabase-setup)
4. [Database Schema](#database-schema)
5. [Authentication Flow](#authentication-flow)
6. [AI Integration](#ai-integration)
7. [PDF Generation](#pdf-generation)
8. [File Storage](#file-storage)
9. [Payment Integration](#payment-integration)
10. [Security Considerations](#security-considerations)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Next.js)                         │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │   Pages/    │  │  Components  │  │  Context/State         │  │
│  │   Routes    │  │              │  │  Management            │  │
│  └──────┬──────┘  └──────────────┘  └────────────────────────┘  │
└─────────┼───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NEXT.JS API ROUTES                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌───────────┐  │
│  │   /auth    │  │  /profile  │  │    /ai     │  │  /export  │  │
│  └─────┬──────┘  └─────┬──────┘  └─────┬──────┘  └─────┬─────┘  │
└────────┼───────────────┼───────────────┼───────────────┼────────┘
         │               │               │               │
         ▼               ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         SUPABASE                                │
│  ┌─────────────┐  ┌────────────┐  ┌─────────────┐               │
│  │    Auth     │  │  Database  │  │   Storage   │               │
│  │  (GoTrue)   │  │ (Postgres) │  │   (S3-like) │               │
│  └─────────────┘  └────────────┘  └─────────────┘               │
└─────────────────────────────────────────────────────────────────┘
         │                               │
         ▼                               ▼
┌─────────────────┐             ┌─────────────────┐
│   OpenAI API    │             │     Stripe      │
│   (GPT-4.1)     │             │   (Payments)    │
└─────────────────┘             └─────────────────┘
```

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js 20+ | Server-side JavaScript |
| Platform | Supabase | Auth, Database, Storage, Edge Functions |
| Database | PostgreSQL (via Supabase) | Data persistence |
| AI | OpenAI GPT-4.1 | Content generation |
| PDF | React-PDF / @react-pdf/renderer | Resume PDF generation |
| Payments | Stripe | Subscription & one-time payments |
| Hosting | Vercel | Frontend + API routes |

---

## Supabase Setup

### 1. Create Project

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize project
supabase init

# Link to your project
supabase link --project-ref your-project-ref
```

### 2. Environment Variables

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

OPENAI_API_KEY=sk-your-openai-key

STRIPE_SECRET_KEY=sk_live_your-stripe-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your-publishable-key
```

### 3. Supabase Client Setup

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}
```

---

## Database Schema

### Tables

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  high_school TEXT,
  graduation_year INTEGER,
  interests TEXT[] DEFAULT '{}',
  headline TEXT,
  about_me TEXT,
  proudest_accomplishment TEXT,
  future_goals TEXT,
  generated_about TEXT,
  skills TEXT[] DEFAULT '{}',
  photo_url TEXT,
  photo_settings JSONB DEFAULT '{"brightness": 100, "contrast": 100, "zoom": 1}',
  subscription_tier TEXT DEFAULT 'free', -- 'free', 'premium', 'school'
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Experiences table
CREATE TABLE public.experiences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('job', 'volunteer', 'extracurricular', 'project', 'other')),
  title TEXT NOT NULL,
  organization TEXT NOT NULL,
  description TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT,
  is_current BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated content history
CREATE TABLE public.generated_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('headline', 'about', 'experience', 'linkedin', 'resume')),
  input_data JSONB,
  output_content TEXT NOT NULL,
  model_used TEXT DEFAULT 'gpt-4.1',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resume exports
CREATE TABLE public.resume_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  template TEXT DEFAULT 'default',
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment history
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stripe_payment_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  product_type TEXT, -- 'subscription', 'one_time'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_experiences_user_id ON public.experiences(user_id);
CREATE INDEX idx_generated_content_user_id ON public.generated_content(user_id);
CREATE INDEX idx_resume_exports_user_id ON public.resume_exports(user_id);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
```

### Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Experiences: Users can CRUD their own experiences
CREATE POLICY "Users can view own experiences"
  ON public.experiences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own experiences"
  ON public.experiences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own experiences"
  ON public.experiences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own experiences"
  ON public.experiences FOR DELETE
  USING (auth.uid() = user_id);

-- Similar policies for other tables...
```

### Database Functions

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_experiences_updated_at
  BEFORE UPDATE ON public.experiences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Authentication Flow

### Sign Up Flow

```typescript
// src/lib/auth/signup.ts
import { createClient } from '@/lib/supabase/client'

export async function signUp(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  
  if (error) throw error
  return data
}
```

### Sign In Flow

```typescript
// src/lib/auth/signin.ts
export async function signIn(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}
```

### OAuth (Google)

```typescript
// src/lib/auth/oauth.ts
export async function signInWithGoogle() {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  
  if (error) throw error
  return data
}
```

### Auth Callback Route

```typescript
// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/builder/step-1'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`)
}
```

### Protected Routes Middleware

```typescript
// src/middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect builder routes
  if (request.nextUrl.pathname.startsWith('/builder') && !user) {
    return NextResponse.redirect(new URL('/signup', request.url))
  }

  return response
}

export const config = {
  matcher: ['/builder/:path*', '/api/:path*'],
}
```

---

## AI Integration

### OpenAI Client Setup

```typescript
// src/lib/openai/client.ts
import OpenAI from 'openai'

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})
```

### System Prompts

```typescript
// src/lib/openai/prompts.ts
export const SYSTEM_PROMPTS = {
  headline: `You are a career advisor helping high school and college students create professional LinkedIn headlines.

Rules:
- Keep headlines under 120 characters
- Be professional but age-appropriate
- Do NOT exaggerate or embellish
- Focus on aspirations, current status, and interests
- Use language appropriate for students
- Avoid buzzwords and clichés

Output 3-4 headline options, each on a new line.`,

  about: `You are a career advisor helping students write their LinkedIn About section.

Rules:
- Write in first person
- Be authentic and genuine
- Do NOT exaggerate accomplishments
- Keep language student-appropriate
- Focus on growth mindset and genuine interests
- 150-300 words maximum
- Structure: Introduction → Accomplishments → Goals → Closing

Combine the user's inputs into a cohesive, professional narrative.`,

  experience: `You are helping a student describe their experience professionally.

Rules:
- Transform casual descriptions into professional bullet points
- Do NOT add fake responsibilities or exaggerate
- Keep descriptions honest and accurate
- Use action verbs appropriately for student-level work
- 3-4 bullet points maximum
- Be realistic about student-level responsibilities

Make the description professional while keeping it truthful.`,
}
```

### AI API Endpoints

```typescript
// src/app/api/ai/headline/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { openai } from '@/lib/openai/client'
import { SYSTEM_PROMPTS } from '@/lib/openai/prompts'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fullName, interests, graduationYear } = await request.json()

    const completion = await openai.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: SYSTEM_PROMPTS.headline },
        {
          role: 'user',
          content: `Generate professional headlines for:
Name: ${fullName}
Graduation Year: ${graduationYear}
Interests: ${interests.join(', ')}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 200,
    })

    const headlines = completion.choices[0].message.content
      ?.split('\n')
      .filter(Boolean)

    // Log generation for history
    await supabase.from('generated_content').insert({
      user_id: user.id,
      content_type: 'headline',
      input_data: { fullName, interests, graduationYear },
      output_content: headlines?.join('\n') || '',
    })

    return NextResponse.json({ headlines })
  } catch (error) {
    console.error('Headline generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate headlines' },
      { status: 500 }
    )
  }
}
```

### Rate Limiting

```typescript
// src/lib/ratelimit.ts
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 requests per hour
  analytics: true,
})

// Usage in API route
const { success, limit, remaining } = await ratelimit.limit(user.id)
if (!success) {
  return NextResponse.json(
    { error: 'Rate limit exceeded' },
    { status: 429 }
  )
}
```

---

## PDF Generation

### React-PDF Setup

```typescript
// src/lib/pdf/ResumeTemplate.tsx
import React from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer'

// Register fonts
Font.register({
  family: 'Inter',
  fonts: [
    { src: '/fonts/Inter-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/Inter-Medium.ttf', fontWeight: 'medium' },
    { src: '/fonts/Inter-Bold.ttf', fontWeight: 'bold' },
  ],
})

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Inter',
    fontSize: 11,
    color: '#263238',
  },
  header: {
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headline: {
    fontSize: 12,
    color: '#1E88E5',
    marginBottom: 8,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#1E88E5',
    paddingBottom: 4,
    marginBottom: 8,
  },
  // ... more styles
})

interface ResumeData {
  fullName: string
  headline: string
  about: string
  experiences: Experience[]
  skills: string[]
  highSchool: string
  graduationYear: string
}

export function ResumeDocument({ data }: { data: ResumeData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.fullName}</Text>
          <Text style={styles.headline}>{data.headline}</Text>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text>{data.about}</Text>
        </View>

        {/* Education */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Education</Text>
          <Text>{data.highSchool}</Text>
          <Text>Expected Graduation: {data.graduationYear}</Text>
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience</Text>
          {data.experiences.map((exp, index) => (
            <View key={index} style={{ marginBottom: 8 }}>
              <Text style={{ fontWeight: 'bold' }}>{exp.title}</Text>
              <Text>{exp.organization}</Text>
              <Text style={{ fontSize: 10, color: '#666' }}>
                {exp.startDate} - {exp.endDate}
              </Text>
              <Text>{exp.description}</Text>
            </View>
          ))}
        </View>

        {/* Skills */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills</Text>
          <Text>{data.skills.join(' • ')}</Text>
        </View>
      </Page>
    </Document>
  )
}
```

### PDF Generation API

```typescript
// src/app/api/export/resume/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import { createClient } from '@/lib/supabase/server'
import { ResumeDocument } from '@/lib/pdf/ResumeTemplate'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const { data: experiences } = await supabase
      .from('experiences')
      .select('*')
      .eq('user_id', user.id)
      .order('sort_order')

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      <ResumeDocument
        data={{
          fullName: profile.full_name,
          headline: profile.headline,
          about: profile.generated_about,
          experiences: experiences || [],
          skills: profile.skills,
          highSchool: profile.high_school,
          graduationYear: profile.graduation_year,
        }}
      />
    )

    // Upload to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-resume.pdf`
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('resumes')
      .upload(fileName, pdfBuffer, {
        contentType: 'application/pdf',
      })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('resumes')
      .getPublicUrl(fileName)

    // Save to resume_exports
    await supabase.from('resume_exports').insert({
      user_id: user.id,
      pdf_url: publicUrl,
    })

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('PDF generation error:', error)
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    )
  }
}
```

---

## File Storage

### Storage Buckets Setup

```sql
-- Create storage buckets (run via Supabase dashboard or CLI)
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('resumes', 'resumes', false);

-- RLS policies for avatars bucket
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policies for resumes bucket
CREATE POLICY "Users can upload their own resumes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own resumes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'resumes' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

### Photo Upload Handler

```typescript
// src/lib/storage/upload.ts
import { createClient } from '@/lib/supabase/client'

export async function uploadProfilePhoto(file: File, userId: string) {
  const supabase = createClient()
  
  const fileExt = file.name.split('.').pop()
  const fileName = `${userId}/${Date.now()}.${fileExt}`

  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (error) throw error

  const { data: { publicUrl } } = supabase.storage
    .from('avatars')
    .getPublicUrl(fileName)

  // Update profile with new photo URL
  await supabase
    .from('profiles')
    .update({ photo_url: publicUrl })
    .eq('id', userId)

  return publicUrl
}
```

---

## Payment Integration

### Stripe Setup

```typescript
// src/lib/stripe/client.ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export const PRICES = {
  premium_monthly: 'price_xxx', // $9.99/month
  premium_yearly: 'price_xxx',  // $79.99/year
  one_time: 'price_xxx',        // $4.99 one-time
}
```

### Checkout Session

```typescript
// src/app/api/stripe/checkout/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICES } from '@/lib/stripe/client'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { priceType } = await request.json()

  const session = await stripe.checkout.sessions.create({
    mode: priceType === 'one_time' ? 'payment' : 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: PRICES[priceType as keyof typeof PRICES],
        quantity: 1,
      },
    ],
    success_url: `${request.nextUrl.origin}/builder/review?success=true`,
    cancel_url: `${request.nextUrl.origin}/pricing?canceled=true`,
    customer_email: user.email,
    metadata: {
      userId: user.id,
    },
  })

  return NextResponse.json({ url: session.url })
}
```

### Webhook Handler

```typescript
// src/app/api/stripe/webhook/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/client'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId

      if (userId) {
        await supabaseAdmin
          .from('profiles')
          .update({
            subscription_tier: 'premium',
            subscription_expires_at: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          })
          .eq('id', userId)

        await supabaseAdmin.from('payments').insert({
          user_id: userId,
          stripe_payment_id: session.id,
          amount: session.amount_total,
          status: 'completed',
          product_type: session.mode,
        })
      }
      break
    }

    case 'customer.subscription.deleted': {
      // Handle subscription cancellation
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

---

## Security Considerations

### 1. Input Validation

```typescript
// src/lib/validation/schemas.ts
import { z } from 'zod'

export const profileSchema = z.object({
  fullName: z.string().min(2).max(100),
  highSchool: z.string().min(2).max(200),
  graduationYear: z.string().regex(/^\d{4}$/),
  interests: z.array(z.string()).max(3),
  headline: z.string().max(120).optional(),
})

export const experienceSchema = z.object({
  type: z.enum(['job', 'volunteer', 'extracurricular', 'project', 'other']),
  title: z.string().min(2).max(100),
  organization: z.string().min(2).max(200),
  description: z.string().max(2000),
  startDate: z.string(),
  endDate: z.string().optional(),
  isCurrent: z.boolean(),
})
```

### 2. Content Moderation

```typescript
// src/lib/moderation/check.ts
import { openai } from '@/lib/openai/client'

export async function moderateContent(content: string): Promise<boolean> {
  const response = await openai.moderations.create({
    input: content,
  })

  return !response.results[0].flagged
}
```

### 3. Rate Limiting

All API routes should implement rate limiting to prevent abuse:

```typescript
// Apply to all AI endpoints
const { success } = await ratelimit.limit(`ai_${user.id}`)
if (!success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

### 4. CORS & Headers

```typescript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
    ]
  },
}
```

---

## Deployment Checklist

- [ ] Set all environment variables in Vercel
- [ ] Configure Supabase production instance
- [ ] Set up Stripe production keys
- [ ] Configure custom domain
- [ ] Enable Supabase email templates
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure rate limiting (Upstash Redis)
- [ ] Test all authentication flows
- [ ] Verify RLS policies
- [ ] Load test AI endpoints
- [ ] Set up database backups

