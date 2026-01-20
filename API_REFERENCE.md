# API Reference

> **Note**: This document outlines the planned API endpoints for FirstCareerSteps. These endpoints are for **Milestone 2** implementation. The current frontend MVP uses mock data and does not make actual API calls.

---

## Table of Contents

1. [Base URL](#base-url)
2. [Authentication](#authentication)
3. [Response Format](#response-format)
4. [Error Codes](#error-codes)
5. [Endpoints](#endpoints)
   - [Auth](#auth-endpoints)
   - [Profile](#profile-endpoints)
   - [Experiences](#experience-endpoints)
   - [AI Generation](#ai-endpoints)
   - [Export](#export-endpoints)
   - [Payments](#payment-endpoints)

---

## Base URL

```
Production: https://firstcareersteps.com/api
Development: http://localhost:3000/api
```

---

## Authentication

All authenticated endpoints require a valid JWT token from Supabase Auth.

### Headers

```
Authorization: Bearer <supabase_access_token>
Content-Type: application/json
```

### Getting the Token

```typescript
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token
```

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## Endpoints

---

### Auth Endpoints

#### POST /api/auth/signup

Create a new user account.

**Request:**
```json
{
  "email": "student@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com"
    },
    "message": "Confirmation email sent"
  }
}
```

**Errors:**
- `VALIDATION_ERROR`: Invalid email or password format
- `CONFLICT`: Email already exists

---

#### POST /api/auth/signin

Sign in with email and password.

**Request:**
```json
{
  "email": "student@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com"
    },
    "session": {
      "access_token": "jwt_token",
      "refresh_token": "refresh_token",
      "expires_at": 1234567890
    }
  }
}
```

---

#### POST /api/auth/signout

Sign out the current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Signed out successfully"
  }
}
```

---

#### POST /api/auth/reset-password

Request a password reset email.

**Request:**
```json
{
  "email": "student@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Password reset email sent"
  }
}
```

---

#### GET /api/auth/user

Get current authenticated user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "student@example.com",
      "created_at": "2024-01-15T10:30:00Z"
    }
  }
}
```

---

### Profile Endpoints

#### GET /api/profile

Get the current user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "student@example.com",
    "full_name": "John Doe",
    "high_school": "Lincoln High School",
    "graduation_year": 2026,
    "interests": ["Technology & Computer Science", "Business & Entrepreneurship"],
    "headline": "Aspiring Software Developer | Class of 2026",
    "about_me": "...",
    "proudest_accomplishment": "...",
    "future_goals": "...",
    "generated_about": "...",
    "skills": ["Leadership", "Communication", "Problem Solving"],
    "photo_url": "https://storage.supabase.co/...",
    "photo_settings": {
      "brightness": 100,
      "contrast": 100,
      "zoom": 1
    },
    "subscription_tier": "free",
    "subscription_expires_at": null,
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-16T14:20:00Z"
  }
}
```

---

#### PATCH /api/profile

Update the current user's profile.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "full_name": "John Doe",
  "high_school": "Lincoln High School",
  "graduation_year": 2026,
  "interests": ["Technology & Computer Science"],
  "headline": "Aspiring Software Developer | Class of 2026",
  "skills": ["Leadership", "Communication"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "full_name": "John Doe",
    ...
    "updated_at": "2024-01-16T14:20:00Z"
  }
}
```

**Validation Rules:**
- `full_name`: 2-100 characters
- `high_school`: 2-200 characters
- `graduation_year`: 4-digit year, current year to current year + 8
- `interests`: Array of max 3 strings
- `headline`: Max 120 characters
- `skills`: Array of max 10 strings

---

#### POST /api/profile/photo

Upload or update profile photo.

**Headers:** 
- `Authorization: Bearer <token>`
- `Content-Type: multipart/form-data`

**Request:** Form data with file field `photo`

**Response:**
```json
{
  "success": true,
  "data": {
    "photo_url": "https://storage.supabase.co/..."
  }
}
```

**Constraints:**
- Max file size: 5MB
- Accepted formats: JPEG, PNG, WebP
- Recommended dimensions: 400x400 minimum

---

#### PATCH /api/profile/photo-settings

Update photo adjustment settings.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "brightness": 110,
  "contrast": 95,
  "zoom": 1.2,
  "cropX": 5,
  "cropY": -3
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "photo_settings": {
      "brightness": 110,
      "contrast": 95,
      "zoom": 1.2,
      "cropX": 5,
      "cropY": -3
    }
  }
}
```

---

### Experience Endpoints

#### GET /api/experiences

Get all experiences for the current user.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "extracurricular",
      "title": "Team Captain",
      "organization": "Robotics Club",
      "description": "Led a team of 8 members...",
      "start_date": "2023-09",
      "end_date": "Present",
      "is_current": true,
      "sort_order": 0,
      "created_at": "2024-01-15T10:30:00Z"
    },
    ...
  ]
}
```

---

#### POST /api/experiences

Create a new experience.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "type": "extracurricular",
  "title": "Team Captain",
  "organization": "Robotics Club",
  "description": "Led a team of 8 members in building competition robots",
  "start_date": "2023-09",
  "end_date": null,
  "is_current": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "extracurricular",
    "title": "Team Captain",
    ...
  }
}
```

**Validation:**
- `type`: One of `job`, `volunteer`, `extracurricular`, `project`, `other`
- `title`: 2-100 characters
- `organization`: 2-200 characters
- `description`: Max 2000 characters
- `start_date`: Format `YYYY-MM`

---

#### PATCH /api/experiences/:id

Update an experience.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "description": "Led a team of 10 members in building competition robots. Won regional championship."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    ...
    "description": "Led a team of 10 members...",
    "updated_at": "2024-01-16T14:20:00Z"
  }
}
```

---

#### DELETE /api/experiences/:id

Delete an experience.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Experience deleted"
  }
}
```

---

#### PATCH /api/experiences/reorder

Reorder experiences.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "order": ["uuid-1", "uuid-3", "uuid-2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Order updated"
  }
}
```

---

### AI Endpoints

> **Rate Limits:** 10 requests per hour for free tier, 50 for premium.

#### POST /api/ai/headline

Generate professional headlines.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "fullName": "John Doe",
  "graduationYear": "2026",
  "interests": ["Technology & Computer Science", "Business"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "headlines": [
      "Aspiring Software Developer | Class of 2026",
      "Technology & Business Enthusiast | Future Innovator",
      "Computer Science Student | Passionate About Building Solutions",
      "Class of 2026 | Tech & Business Focused"
    ]
  }
}
```

---

#### POST /api/ai/about

Generate About section.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "aboutMe": "I'm a junior at Lincoln High who loves building things...",
  "proudestAccomplishment": "Leading my robotics team to regionals",
  "futureGoals": "I want to study computer science and work at a tech startup",
  "interests": ["Technology & Computer Science"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "about": "I'm a junior at Lincoln High School with a passion for building innovative solutions..."
  }
}
```

---

#### POST /api/ai/experience

Translate experience description to professional format.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "type": "extracurricular",
  "title": "Team Captain",
  "organization": "Robotics Club",
  "description": "I was the captain and organized stuff and we built robots for competitions"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "description": "• Led a team of students in designing and building competitive robots\n• Coordinated team meetings and project timelines\n• Collaborated with team members to solve technical challenges\n• Represented the team at regional robotics competitions"
  }
}
```

---

### Export Endpoints

#### POST /api/export/linkedin

Generate LinkedIn-ready content.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "sections": ["headline", "about", "experience", "skills"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "content": {
      "headline": "Aspiring Software Developer | Class of 2026",
      "about": "I'm a junior at Lincoln High School...",
      "experience": [
        {
          "title": "Team Captain",
          "organization": "Robotics Club",
          "description": "• Led a team of students..."
        }
      ],
      "skills": ["Leadership", "Communication", "Problem Solving"]
    },
    "copyableText": "Full formatted text for copying..."
  }
}
```

---

#### POST /api/export/resume

Generate resume PDF.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "template": "default"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pdfUrl": "https://storage.supabase.co/resumes/...",
    "expiresAt": "2024-01-17T10:30:00Z"
  }
}
```

**Templates Available:**
- `default` - Clean, modern template
- `classic` - Traditional resume format
- `minimal` - Simple, text-focused design

---

#### GET /api/export/history

Get export history.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "resume",
      "template": "default",
      "url": "https://storage.supabase.co/...",
      "created_at": "2024-01-15T10:30:00Z"
    },
    ...
  ]
}
```

---

### Payment Endpoints

#### GET /api/payments/plans

Get available subscription plans.

**Response:**
```json
{
  "success": true,
  "data": {
    "plans": [
      {
        "id": "free",
        "name": "Free",
        "price": 0,
        "features": [
          "Basic profile builder",
          "3 AI generations per day",
          "1 resume template"
        ]
      },
      {
        "id": "premium_monthly",
        "name": "Premium Monthly",
        "price": 999,
        "interval": "month",
        "features": [
          "Unlimited AI generations",
          "All resume templates",
          "Priority support",
          "LinkedIn content export"
        ]
      },
      {
        "id": "premium_yearly",
        "name": "Premium Yearly",
        "price": 7999,
        "interval": "year",
        "features": [
          "Everything in Premium",
          "2 months free",
          "Early access to new features"
        ]
      }
    ]
  }
}
```

---

#### POST /api/payments/checkout

Create a Stripe checkout session.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "planId": "premium_monthly"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "checkoutUrl": "https://checkout.stripe.com/..."
  }
}
```

---

#### GET /api/payments/subscription

Get current subscription status.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "tier": "premium",
    "status": "active",
    "currentPeriodEnd": "2024-02-15T10:30:00Z",
    "cancelAtPeriodEnd": false
  }
}
```

---

#### POST /api/payments/cancel

Cancel subscription at period end.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Subscription will be canceled at the end of the current period",
    "cancelAt": "2024-02-15T10:30:00Z"
  }
}
```

---

#### GET /api/payments/history

Get payment history.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "amount": 999,
      "currency": "usd",
      "status": "succeeded",
      "description": "Premium Monthly Subscription",
      "created_at": "2024-01-15T10:30:00Z"
    },
    ...
  ]
}
```

---

## Webhooks

### Stripe Webhook

**Endpoint:** `POST /api/webhooks/stripe`

**Events Handled:**
- `checkout.session.completed` - Subscription created
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription canceled
- `invoice.payment_failed` - Payment failed

**Security:** Webhook signature verification required.

---

## SDK Usage Examples

### JavaScript/TypeScript

```typescript
// Using fetch
const response = await fetch('/api/profile', {
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
})
const { data } = await response.json()

// Using custom client
import { apiClient } from '@/lib/api'

const profile = await apiClient.getProfile()
const headlines = await apiClient.generateHeadlines({
  fullName: 'John Doe',
  graduationYear: '2026',
  interests: ['Technology'],
})
```

---

## Changelog

### v1.0.0 (Planned)
- Initial API release
- Profile management
- Experience CRUD
- AI generation endpoints
- Resume PDF export
- Stripe payment integration

