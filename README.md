# FirstCareerSteps

> **A mobile-first web application that helps students generate LinkedIn-ready content, resumes, and polished profile photos using AI.**

![FirstCareerSteps](https://via.placeholder.com/1200x630/1E88E5/ffffff?text=FirstCareerSteps)

---

## 🎯 Overview

FirstCareerSteps is designed specifically for high school and college students who are taking their first steps into the professional world. The platform guides users through building a complete professional profile, including:

- **Professional Headline** - AI-generated LinkedIn headlines
- **About Section** - Authentic bio creation with AI assistance
- **Experience Translator** - Transform activities into professional descriptions
- **Skills Showcase** - Highlight relevant abilities
- **Profile Photo** - Polish your photo with adjustment tools
- **Resume Export** - Generate professional PDF resumes

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/firstcareersteps.git
cd firstcareersteps

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Homepage
│   ├── signup/            # Signup page
│   ├── login/             # Login page
│   └── builder/           # Profile builder wizard
│       ├── step-1/        # Student basics
│       ├── step-2/        # Headline builder
│       ├── step-3/        # About section
│       ├── step-4/        # Experience translator
│       ├── step-5/        # Skills selector
│       ├── step-6/        # Photo upload
│       └── review/        # Review & generate
├── components/
│   ├── ui/                # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── TextArea.tsx
│   │   ├── Select.tsx
│   │   ├── Chip.tsx
│   │   ├── Card.tsx
│   │   ├── ProgressBar.tsx
│   │   └── StepIndicator.tsx
│   └── layout/            # Layout components
│       ├── Header.tsx
│       └── BuilderLayout.tsx
├── context/
│   └── ProfileContext.tsx # Global state management
└── lib/                   # Utility functions (future)
```

---

## 🎨 Brand Guidelines

### Colors

| Name | Hex | Usage |
|------|-----|-------|
| Career Blue | `#1E88E5` | Primary actions, CTAs |
| Step Green | `#43A047` | Success states, completed steps |
| Optimism Orange | `#FB8C00` | Accent, highlights |
| Soft Sky Blue | `#E3F2FD` | Backgrounds, secondary |
| Charcoal | `#263238` | Text, headings |

### Typography

- **Headlines**: Poppins (SemiBold–Bold)
- **Body**: Inter (Regular–Medium)
- **Fallbacks**: Arial, Helvetica, sans-serif

### UI Style

- Mobile-first responsive design
- Rounded corners (1rem - 1.5rem)
- Soft shadows
- Clean spacing
- Friendly, student-appropriate tone

---

## 🔧 Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

---

## 📱 Screens

### 1. Homepage
- Hero section with CTA
- Trust signals (Built for students, Trusted by schools, < 10 minutes)
- Feature overview
- Footer

### 2. Signup / Login
- Email & password authentication
- Google OAuth (prepared)
- Form validation

### 3. Profile Builder (6 Steps)

**Step 1: Student Basics**
- Full name input
- High school/college name
- Graduation year selection
- Interest selection (max 3)

**Step 2: Headline Builder**
- AI headline generation
- Selectable options
- Custom input
- Live preview

**Step 3: About Section**
- Guided questions
- AI-powered writing
- Editable output

**Step 4: Experience Translator**
- Experience type selector
- Plain-language input
- AI professional translation
- Multiple experiences support

**Step 5: Skills Selector**
- Categorized skill chips
- Multi-select (3-10)
- Selected skills summary

**Step 6: Photo Upload**
- Drag & drop / file picker
- Brightness adjustment
- Contrast control
- Zoom control
- Preview

### 4. Review & Generate
- Complete profile preview
- Edit links for each section
- Generate LinkedIn content
- Generate Resume PDF

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 15 |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | React Context |
| Fonts | Google Fonts (Poppins, Inter) |
| Deployment | Vercel (planned) |

---

## 📋 Milestone Status

### ✅ Milestone 1: Frontend MVP (Complete)
- [x] Project setup (Next.js + TypeScript + Tailwind)
- [x] Brand configuration (colors, typography, styles)
- [x] Reusable UI components
- [x] Homepage with hero section
- [x] Signup/Login pages
- [x] 6-step profile builder
- [x] Review & Generate screen
- [x] Form validation
- [x] State management
- [x] Mobile-first responsive design
- [x] Backend documentation

### 🔜 Milestone 2: Backend & API (Planned)
- [ ] Supabase Auth integration
- [ ] Database schema implementation
- [ ] OpenAI GPT-4.1 integration
- [ ] PDF generation with React-PDF
- [ ] File storage for photos
- [ ] Stripe payment integration

---

## 📚 Documentation

- [Backend Implementation Guide](./BACKEND_IMPLEMENTATION.md)
- [API Reference](./API_REFERENCE.md)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary and confidential.

---

## 📞 Support

For questions or support, please contact the development team.

---

Built with ❤️ for students taking their first career steps.

