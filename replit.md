# replit.md

## Overview

A full-stack React application with an Express backend, featuring a minimalist message board interface. Users can view and create messages stored in a PostgreSQL database. The app uses a modern tech stack with TypeScript throughout, shadcn/ui components, and Framer Motion for animations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui (Radix UI primitives + Tailwind CSS)
- **Styling**: Tailwind CSS with CSS variables for theming
- **Animations**: Framer Motion for smooth transitions
- **Build Tool**: Vite with custom plugins for Replit integration

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (compiled with tsx in dev, esbuild for production)
- **API Pattern**: RESTful endpoints with typed routes in `shared/routes.ts`
- **Validation**: Zod schemas shared between client and server via `drizzle-zod`

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with schema defined in `shared/schema.ts`
- **Migrations**: Drizzle Kit (`db:push` command)
- **Connection**: Node pg Pool via `DATABASE_URL` environment variable

### Project Structure
```
client/           # React frontend
  src/
    components/   # UI components (shadcn/ui in ui/, custom in root)
    hooks/        # Custom React hooks
    lib/          # Utilities and query client
    pages/        # Route components
server/           # Express backend
  index.ts        # Server entry point
  routes.ts       # API route handlers
  storage.ts      # Database access layer
  db.ts           # Drizzle database connection
shared/           # Shared code between client/server
  schema.ts       # Drizzle table definitions
  routes.ts       # Typed API route contracts
```

### Design Decisions
- **Monorepo Structure**: Single repository with client, server, and shared directories enables type sharing
- **Typed API Contracts**: Routes defined with Zod schemas in `shared/routes.ts` ensure type safety across the stack
- **Storage Abstraction**: `IStorage` interface in `storage.ts` decouples business logic from database implementation
- **Minimalist UI**: Clean grayscale palette with Inter/Outfit fonts per user requirements

## External Dependencies

### Database
- **PostgreSQL**: Primary database via `DATABASE_URL` environment variable
- **Supabase**: Client SDK included (`@supabase/supabase-js`) with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables

### Key NPM Packages
- **drizzle-orm**: Type-safe SQL ORM
- **@tanstack/react-query**: Async state management
- **framer-motion**: Animation library (per requirements)
- **zod**: Runtime type validation
- **shadcn/ui ecosystem**: Radix UI primitives, class-variance-authority, tailwind-merge

### Development Tools
- **Vite**: Frontend dev server and bundler
- **esbuild**: Production server bundling
- **Drizzle Kit**: Database schema management