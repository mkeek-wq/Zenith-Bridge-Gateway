# Zenith Nova Bridge Wave (ZNBW) Website

## Overview

Professional business website for Zenith Nova Bridge Wave — a market entry consultancy bridging European companies into Southeast Asia, using Singapore as a hub. The site functions as both a public-facing presentation and a content management platform.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/znbw-website)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Session auth**: express-session + bcryptjs (admin)
- **Build**: esbuild (CJS bundle for API)

## Features

### Public Site
- Homepage with animated hero (Singapore skyline), value proposition, and service sections
- About page with firm narrative and approach
- Editorials/News section with paginated published articles from database
- Single article page with full content
- Contact form that stores submissions in database

### Admin System
- Secure admin login at `/admin/login` (session-based, bcrypt passwords)
- Admin dashboard at `/admin` showing all articles (published + drafts)
- Create new articles at `/admin/articles/new`
- Edit existing articles at `/admin/articles/:id/edit`
- Delete articles with confirmation dialog
- Toggle published/featured status per article

## Admin Credentials
- **Username**: admin
- **Password**: znbw@admin2024
- **Login URL**: /admin/login

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Database Schema

- `articles` — editorial articles (title, slug, excerpt, content, category, author, published, featured, coverImage, publishedAt)
- `admin_users` — admin accounts with bcrypt password hashes
- `contact_submissions` — contact form submissions

## Architecture

- `lib/api-spec/openapi.yaml` — single source of truth for all API contracts
- `lib/api-client-react` — generated React Query hooks (from codegen)
- `lib/api-zod` — generated Zod schemas for server-side validation
- `lib/db` — Drizzle ORM setup and schema definitions
- `artifacts/api-server` — Express API server (routes, middleware)
- `artifacts/znbw-website` — React + Vite frontend

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
