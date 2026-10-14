# AI Adaptive Exam Preparation System - Frontend

Web interface for students and administrators, supporting adaptive practice sessions, rich KaTeX mathematical formulas, and detailed performance analytics.

## Tech Stack

- React 19 with TypeScript and Vite
- TanStack Router and TanStack Query
- KaTeX with mhchem for mathematical and chemical notation
- React Hook Form with Zod validation
- Tailwind CSS and Lucide React icons
- Playwright for end to end testing

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file in the root directory based on `.env.example`:

```bash
cp .env.example .env
```

Required variable:

- `VITE_API_URL`: Base URL for the backend API (for example http://localhost:3000/api/v1)

### 3. Run the development server

```bash
npm run dev
```

To build for production:

```bash
npm run build
```

To run lint checks:

```bash
npm run lint
```

## Note

This repository is part of a final year undergraduate engineering project.
