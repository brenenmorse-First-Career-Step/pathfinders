# Career Roadmap Feature Implementation

## Overview
This document describes the implementation of the Career Roadmap feature that allows users to generate personalized career roadmaps using AI.

## What Was Implemented

### 1. Database Schema
- **File**: `add-career-roadmaps-table.sql`
- Creates `career_roadmaps` table with:
  - User ID reference
  - Career name
  - Roadmap data (JSONB)
  - Infographic and milestone roadmap image URLs
  - Timestamps
- Includes RLS policies for user data security
- Auto-updates `updated_at` timestamp

### 2. Storage Bucket
- **File**: `setup-roadmap-storage-bucket.sql`
- Creates `roadmaps` storage bucket
- Sets up RLS policies for:
  - Authenticated users can upload
  - Public read access
  - Users can update/delete their own images

### 3. API Route
- **File**: `src/app/api/ai/generate-roadmap/route.ts`
- Generates career roadmap using OpenAI GPT-4
- Creates two images using DALL-E 3:
  - Infographic (left-to-right career timeline)
  - Milestone roadmap (with finish line)
- Downloads images from OpenAI and uploads to Supabase storage
- Saves roadmap to database
- Returns complete roadmap data with formatted content

### 4. TypeScript Types
- **File**: `src/types/roadmap.ts`
- Defines interfaces for:
  - `CareerRoadmap` - Main roadmap data structure
  - `Course` - Course information with links
  - `RoadmapStep` - Individual steps in the plan
  - `RoadmapResponse` - API response structure

### 5. Career Roadmap Page
- **File**: `src/app/career-roadmap/page.tsx`
- Public page (accessible to all users)
- Input form asking "What do you want to be when you grow up?"
- Generates roadmap on submit
- Displays:
  - Two generated images (infographic and milestone)
  - Key skills
  - Tools & software
  - Free courses with links
  - Step-by-step plan with hashtags
  - Timeline
  - Starter projects
  - Communities & hashtags

### 6. Dashboard Roadmaps Page
- **File**: `src/app/dashboard/roadmaps/page.tsx`
- Lists all user's saved roadmaps
- View detailed roadmap
- Delete roadmaps
- Create new roadmap button

### 7. Navigation
- **File**: `src/components/DashboardSidebar.tsx`
- Added "Career Roadmaps" navigation item
- Positioned between "My Resumes" and "Settings"

## Setup Instructions

### Step 1: Run Database Migration
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste contents of `add-career-roadmaps-table.sql`
4. Click "Run"

### Step 2: Setup Storage Bucket
1. In Supabase Dashboard, go to SQL Editor
2. Copy and paste contents of `setup-roadmap-storage-bucket.sql`
3. Click "Run"
4. Alternatively, create bucket manually:
   - Go to Storage
   - Create new bucket named `roadmaps`
   - Set as Public
   - Apply the policies from the SQL file

### Step 3: Verify Environment Variables
Ensure these are set in your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
OPENAI_API_KEY=your_openai_api_key
```

### Step 4: Test the Feature
1. Navigate to `/career-roadmap`
2. Enter a career goal (e.g., "Software Engineer")
3. Click "Generate My Career Roadmap"
4. Wait for generation (may take 30-60 seconds)
5. View the generated roadmap
6. Check `/dashboard/roadmaps` to see saved roadmaps

## Features

### Roadmap Content Includes:
- ✅ Key skills to learn (8-12 skills)
- ✅ Tools & software to master (5-8 tools)
- ✅ At least 5 free online courses with direct links
- ✅ Step-by-step plan (6-10 steps)
- ✅ Estimated learning timeline
- ✅ Suggested starter projects
- ✅ Communities & hashtags
- ✅ Two AI-generated visual infographics

### User Experience:
- ✅ Public access to roadmap generator
- ✅ Login required to save roadmaps
- ✅ All roadmaps saved to user dashboard
- ✅ View, manage, and delete roadmaps
- ✅ Beautiful, modern UI matching site design

## API Endpoint

**POST** `/api/ai/generate-roadmap`

**Request Body:**
```json
{
  "careerGoal": "Software Engineer",
  "userId": "user-uuid"
}
```

**Response:**
```json
{
  "roadmap": { /* CareerRoadmap object */ },
  "formattedContent": "Markdown formatted content",
  "infographicUrl": "https://...",
  "milestoneRoadmapUrl": "https://...",
  "roadmapId": "uuid"
}
```

## Database Schema

```sql
career_roadmaps
├── id (UUID, Primary Key)
├── user_id (UUID, Foreign Key → users.id)
├── career_name (TEXT)
├── roadmap_data (JSONB)
├── infographic_url (TEXT, nullable)
├── milestone_roadmap_url (TEXT, nullable)
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)
```

## Storage Structure

```
roadmaps/
└── {userId}/
    ├── infographic-{timestamp}.png
    └── milestone-{timestamp}.png
```

## Notes

- Roadmap generation uses GPT-4 for high-quality content
- Images are generated using DALL-E 3
- All course links are real and accessible
- Roadmaps are automatically saved when generated
- Images are stored in Supabase storage for fast access
- RLS policies ensure users can only see their own roadmaps

## Troubleshooting

### Images not uploading
- Check storage bucket exists and is public
- Verify RLS policies are applied
- Check service role key has correct permissions

### Roadmap generation fails
- Verify OpenAI API key is set
- Check API key has access to GPT-4 and DALL-E 3
- Check network connectivity

### Database errors
- Verify RLS policies are created
- Check user is authenticated
- Verify table exists in database
