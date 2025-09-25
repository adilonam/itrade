# Copilot Instructions

This project uses:

- **Next.js** (App Router, TypeScript, ESLint strict)
- **pnpm** for package management
- **Radix UI** for accessible, unstyled primitives (use with Tailwind for styling)
- **Tailwind v4** for styling
- **tabler-icons-react** for icons
- **shadcn/ui** for pre-built components (optional, use sparingly)
- **swagger** for API documentation UI

## Guidelines for Copilot

- Always prefer **functional React components** with TypeScript.
- Use **server components** by default; mark as `"use client"` only when needed (hooks, state, Radix UI).
- Import Radix UI components from `@radix-ui/react-*`.
- Style with **Tailwind CSS**, keep classes minimal and semantic.
- Favor **composition over complex props** when wrapping Radix components.
- Follow **pnpm** conventions:
  - Use `pnpm add <pkg>` for dependencies
  - Never suggest `npm` or `yarn` commands
- Keep code clean, modular, and aligned with Next.js best practices.
