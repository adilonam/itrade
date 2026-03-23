# Project Guidelines

This project uses:

- Use **Next.js** (App Router, TypeScript, strict ESLint)
- Use **pnpm** for package management
- Use **Radix UI** primitives (unstyled, accessible) with Tailwind CSS for styling
- Use **Tailwind CSS v4** for all styling
- Use **tabler-icons-react** for icons
- Use **shadcn/ui** pre-built components only when necessary (prefer your own components)
- Use **swagger** for API documentation UI
- Always use **Prisma version 7** (client is in `src/lib/prisma.ts`)
- Do not create or check in markdown files
- All links should be placed in `src/constants/data.ts`
- Use **next-auth** for authentication
- Always import types/interfaces from the Prisma schema using: `import type { ... } from '@/lib/prisma/generated/client';`
- Decompose code for good architecture: use components and functions for reusability and clarity
- Positions with room type STOCK or TRADING use balance type REAL, while positions with room type INSTITUTIONAL use balance type INSTITUTIONAL.
