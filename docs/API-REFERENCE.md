# API Reference Documentation

This document provides a comprehensive reference for all API endpoints in the First Career Steps application.

## Base URL

All API endpoints are relative to your application's base URL:
- Development: `http://localhost:3000`
- Production: `https://firstcareerstepslive.vercel.app`

## Authentication

Most endpoints require authentication via Supabase session cookies. The user must be logged in to access protected endpoints.

---

## Payment & Checkout APIs

### Create Resume Checkout Session

Creates a Stripe checkout session for resume access payment.

**Endpoint:** `POST /api/create-checkout`

**Authentication:** Required

**Request Body:** None

**Response:**
```json
{
  "url": "https://checkout.stripe.com/...",
  "sessionId": "cs_test_..."
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Profile not found (user must complete builder first)
- `500 Internal Server Error` - Server error

**Notes:**
- Creates a locked resume record before checkout
- Requires user to have completed their profile
- Returns Stripe checkout URL for payment

---

### Create Roadmap Checkout Session

Creates a Stripe checkout session for career roadmap access.

**Endpoint:** `POST /api/create-roadmap-checkout`

**Authentication:** Required

**Request Body:** None

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - User has already purchased roadmap access
- `500 Internal Server Error` - Server error

**Notes:**
- Price: $9.99 (999 cents)
- One-time payment for unlimited AI-powered career roadmaps
- Prevents duplicate purchases

---

### Check Payment Status

Checks if the authenticated user has paid for access.

**Endpoint:** `GET /api/payment-status`

**Authentication:** Required

**Request Body:** None

**Response:**
```json
{
  "hasPaid": true,
  "paidAt": "2024-01-15T10:30:00Z",
  "amount": 9.99
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Server error

---

### Stripe Webhook

Handles Stripe webhook events for payment processing.

**Endpoint:** `POST /api/webhooks/stripe`

**Authentication:** Not required (uses Stripe webhook signature)

**Request Body:** Stripe webhook event payload

**Supported Events:**
- `checkout.session.completed` - Updates user payment status and unlocks resume
- `payment_intent.succeeded` - Confirms payment completion

**Response:**
```json
{
  "received": true
}
```

**Error Responses:**
- `400 Bad Request` - Invalid webhook signature or payload
- `500 Internal Server Error` - Server error

**Notes:**
- Verifies webhook signature using `STRIPE_WEBHOOK_SECRET`
- Updates `user_payments` table on successful payment
- Unlocks resume by updating status from 'locked' to 'active'
- Creates payment record with amount, timestamp, and Stripe payment intent ID

---

## Roadmap APIs

### Get All Roadmaps

Retrieves all roadmaps for the authenticated user.

**Endpoint:** `GET /api/roadmaps`

**Authentication:** Required

**Request Body:** None

**Response:**
```json
{
  "roadmaps": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "career_name": "Software Engineer",
      "roadmap_content": {...},
      "infographic_url": "https://...",
      "milestone_graphic_url": "https://...",
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `500 Internal Server Error` - Server error

---

### Get Roadmap by ID

Retrieves a specific roadmap by ID.

**Endpoint:** `GET /api/roadmaps/[id]`

**Authentication:** Required

**Request Body:** None

**Response:**
```json
{
  "roadmap": {
    "id": "uuid",
    "user_id": "uuid",
    "career_name": "Software Engineer",
    "roadmap_content": {...},
    "infographic_url": "https://...",
    "milestone_graphic_url": "https://...",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Roadmap not found or doesn't belong to user
- `500 Internal Server Error` - Server error

---

### Create Roadmap

Saves a new roadmap for the authenticated user.

**Endpoint:** `POST /api/roadmaps`

**Authentication:** Required

**Request Body:**
```json
{
  "careerName": "Software Engineer",
  "roadmapContent": {...},
  "infographicUrl": "https://...",
  "milestoneGraphicUrl": "https://..."
}
```

**Response:**
```json
{
  "roadmap": {
    "id": "uuid",
    "user_id": "uuid",
    "career_name": "Software Engineer",
    "roadmap_content": {...},
    "infographic_url": "https://...",
    "milestone_graphic_url": "https://...",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Missing required fields (careerName, roadmapContent)
- `500 Internal Server Error` - Server error

---

### Delete Roadmap

Deletes a roadmap by ID.

**Endpoint:** `DELETE /api/roadmaps/[id]`

**Authentication:** Required

**Request Body:** None

**Response:**
```json
{
  "success": true,
  "message": "Roadmap deleted successfully"
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Roadmap not found or doesn't belong to user
- `500 Internal Server Error` - Server error

---

## AI Generation APIs

### Generate Career Roadmap

Generates an AI-powered career roadmap based on a career goal.

**Endpoint:** `POST /api/ai/generate-roadmap`

**Authentication:** Required

**Payment Required:** Yes (user must have paid)

**Request Body:**
```json
{
  "careerGoal": "Become a Senior Software Engineer"
}
```

**Response:**
```json
{
  "success": true,
  "roadmap": {
    "careerName": "Senior Software Engineer",
    "content": {...},
    "milestones": [...],
    "skills": [...],
    "timeline": "..."
  }
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `403 Forbidden` - Payment required
- `400 Bad Request` - Missing or invalid careerGoal
- `500 Internal Server Error` - Server error or OpenAI API error

**Notes:**
- Uses OpenAI GPT-4 for generation
- Requires user to have paid for roadmap access
- Returns structured roadmap with milestones, skills, and timeline

---

### Enhance Headline

Enhances a resume headline using AI.

**Endpoint:** `POST /api/ai/enhance-headline`

**Authentication:** Required

**Request Body:**
```json
{
  "currentHeadline": "Software Developer"
}
```

**Response:**
```json
{
  "success": true,
  "enhancedHeadline": "Experienced Software Developer Specializing in Full-Stack Development"
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Missing currentHeadline
- `500 Internal Server Error` - Server error

---

### Enhance About Section

Enhances the resume "About" section using AI.

**Endpoint:** `POST /api/ai/enhance-about`

**Authentication:** Required

**Request Body:**
```json
{
  "currentAbout": "I am a software developer..."
}
```

**Response:**
```json
{
  "success": true,
  "enhancedAbout": "Experienced software developer with expertise in..."
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Missing currentAbout
- `500 Internal Server Error` - Server error

---

### Enhance Experience

Enhances a work experience entry using AI.

**Endpoint:** `POST /api/ai/enhance-experience`

**Authentication:** Required

**Request Body:**
```json
{
  "experience": {
    "title": "Software Developer",
    "organization": "Tech Company",
    "description": "Developed web applications...",
    "startDate": "2020-01",
    "endDate": "2022-12"
  }
}
```

**Response:**
```json
{
  "success": true,
  "enhancedExperience": {
    "title": "Software Developer",
    "organization": "Tech Company",
    "description": "Led development of scalable web applications using React and Node.js, resulting in 40% performance improvement...",
    "startDate": "2020-01",
    "endDate": "2022-12"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Missing or invalid experience object
- `500 Internal Server Error` - Server error

---

### Generate LinkedIn Content

Generates LinkedIn profile content from resume data.

**Endpoint:** `POST /api/ai/generate-linkedin`

**Authentication:** Required

**Request Body:**
```json
{
  "resumeData": {
    "fullName": "John Doe",
    "headline": "Software Developer",
    "aboutText": "...",
    "experiences": [...],
    "skills": [...]
  }
}
```

**Response:**
```json
{
  "success": true,
  "linkedinContent": {
    "headline": "...",
    "summary": "...",
    "experience": [...],
    "recommendations": "..."
  }
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Missing or invalid resumeData
- `500 Internal Server Error` - Server error

---

### Generate LinkedIn Profile

Generates a complete LinkedIn profile from resume ID.

**Endpoint:** `POST /api/ai/generate-linkedin-profile`

**Authentication:** Required

**Request Body:**
```json
{
  "resumeId": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "linkedinProfile": {
    "headline": "...",
    "summary": "...",
    "experience": [...],
    "education": [...],
    "skills": [...]
  }
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Missing resumeId or resume not found
- `500 Internal Server Error` - Server error

---

## Resume & LinkedIn APIs

### Get LinkedIn Content for Resume

Retrieves LinkedIn content associated with a resume.

**Endpoint:** `GET /api/resumes/[id]/linkedin`

**Authentication:** Required

**Request Body:** None

**Response:**
```json
{
  "linkedinContent": {
    "id": "uuid",
    "resume_id": "uuid",
    "headline": "...",
    "summary": "...",
    "experience": [...],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `404 Not Found` - Resume or LinkedIn content not found
- `500 Internal Server Error` - Server error

---

### Save LinkedIn Content for Resume

Saves or updates LinkedIn content for a resume.

**Endpoint:** `POST /api/resumes/[id]/linkedin`

**Authentication:** Required

**Request Body:**
```json
{
  "headline": "...",
  "summary": "...",
  "experience": [...],
  "education": [...],
  "skills": [...]
}
```

**Response:**
```json
{
  "success": true,
  "linkedinContent": {
    "id": "uuid",
    "resume_id": "uuid",
    "headline": "...",
    "summary": "...",
    "experience": [...],
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - User not authenticated
- `400 Bad Request` - Missing required fields
- `404 Not Found` - Resume not found
- `500 Internal Server Error` - Server error

---

## Error Handling

All API endpoints follow consistent error handling:

1. **Authentication Errors (401)**: User must be logged in
2. **Authorization Errors (403)**: User doesn't have required permissions (e.g., payment required)
3. **Validation Errors (400)**: Invalid or missing request data
4. **Not Found Errors (404)**: Resource doesn't exist or doesn't belong to user
5. **Server Errors (500)**: Internal server error or external API failure

Error responses follow this format:
```json
{
  "error": "Error message description",
  "hasPaid": false  // Only in payment-related endpoints
}
```

---

## Rate Limiting

Currently, there are no explicit rate limits on API endpoints. However, OpenAI API calls are subject to OpenAI's rate limits, and excessive requests may be throttled.

---

## Environment Variables Required

The following environment variables must be configured:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (for server-side operations)
- `STRIPE_SECRET_KEY` - Stripe secret key
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `NEXT_PUBLIC_APP_URL` - Application base URL

---

## Database Tables Used

- `user_payments` - Stores payment status and transaction details
- `resumes` - Stores resume data and status
- `roadmaps` - Stores career roadmap data
- `profile` - Stores user profile information
- `linkedin_content` - Stores generated LinkedIn content

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All UUIDs are standard UUID v4 format
- Payment amounts are stored in dollars (not cents) in the database
- Stripe amounts are in cents (e.g., 999 = $9.99)
- Resume status can be: 'locked', 'active', 'archived'
- Payment status is boolean (`has_paid`)
