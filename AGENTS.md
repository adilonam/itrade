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
- The trade header balance dropdown selection must be persisted and applied globally across user-facing trade data components; position/financial components must refresh immediately when it changes, and the change must emit a webhook event. see src/lib/balance-selection.ts
