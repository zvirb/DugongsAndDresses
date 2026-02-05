# Dugongs & Dresses (GEMINI)

The **Dugongs & Dresses** project (Code: **GEMINI**) is a next-generation Dungeons & Dragons campaign management platform. It bridges the gap between physical tabletop play and AI-assisted storytelling through a hybrid digital environment.

## Design System: Agent Mesh
The project uses the **Agent Mesh** design system, characterized by:
- **Neon Blue**: `#2b2bee`
- **Dark Navy**: `#101022`
- **Font**: [Space Grotesk](https://fonts.google.com/specimen/Space+Grotesk)
- **High Contrast**: Performance-oriented UI with glowing accents and technical aesthetics.

## Key Features
- **DM Control Station**: Central hub for campaign orchestration.
- **Player Mobile App**: Thumb-friendly hero interface for real-time tracking.
- **Public Display**: Passive spectator view with dynamic feedback.
- **AI Bridge**: Structured context aggregation for LLMs like Gemini 1.5 Pro.

## Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Styling**: Tailwind CSS 4.0
- **Database**: SQLite with Prisma ORM
- **Testing**: Vitest + React Testing Library

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
