# ArbiTradeX - Crypto Arbitrage Trading Platform

## Overview

ArbiTradeX is a full-stack crypto arbitrage web application that demonstrates a trading platform where users can monitor arbitrage opportunities across multiple cryptocurrency exchanges. The platform features user authentication, personal dashboards, wallet management, and an admin back office for platform management.

**Core Purpose:** Provide a demo platform for crypto arbitrage trading with real-time opportunity monitoring, user portfolio tracking, and comprehensive admin controls.

**Tech Stack:**
- Frontend: React with TypeScript, Vite, TailwindCSS, shadcn/ui components
- Backend: Express.js with TypeScript
- Database: SQLite with better-sqlite3
- Authentication: JWT-based authentication with bcrypt password hashing
- State Management: TanStack Query (React Query)
- Routing: Wouter

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Component Structure:**
- Modern React application using functional components with hooks
- shadcn/ui component library (New York style) for consistent UI elements
- Client-side routing via Wouter for lightweight navigation
- Form management through react-hook-form with Zod validation

**Design System (Premium Fintech):**
- Typography: Inter font with OpenType features (tabular numbers via font-feature-settings: "tnum" 1, "lnum" 1)
- Dark mode enforced by default via `class="dark"` on HTML element in index.html
- Premium color palette: Very dark navy backgrounds (#050915), dark slate cards (#0F172A), finance gold accent (#F3BA2F)
- Modern border radii: 12px (buttons/inputs), 16px (cards), 8px (badges)
- Custom TailwindCSS configuration with enhanced spacing scale, premium shadows (shadow-glow for gold accent)
- Professional fintech aesthetic inspired by Binance/Coinbase Pro with refined interactions (150ms transitions)
- Responsive layouts with mobile-first approach

**State Management:**
- TanStack Query for server state management and caching
- Context API for authentication state (AuthContext)
- Local state with React hooks for component-level state

**Key Pages:**
- Landing page with hero section, features, and marketing content
- Login/Signup pages with form validation
- Dashboard (protected) - user portfolio, transactions, arbitrage opportunities
- Admin panel (protected, admin-only) - user management, transaction approval

### Backend Architecture

**Server Setup:**
- Dual-mode Express server: development (with Vite HMR) and production (static serving)
- TypeScript-first with ES modules
- Middleware: JSON body parsing, request logging, error handling

**API Structure:**
- RESTful API endpoints under `/api` prefix
- Route groups:
  - `/api/auth/*` - Authentication (register, login, get current user)
  - `/api/dashboard` - User dashboard data
  - `/api/arbitrage-opportunities` - Trading opportunities
  - `/api/transactions/*` - Transaction management (deposits, withdrawals)
  - `/api/admin/*` - Admin operations (user management, transaction approval, balance adjustments)

**Authentication Flow:**
- JWT tokens stored in localStorage on client
- Authorization header (`Bearer <token>`) for protected endpoints
- Middleware: `authMiddleware` validates token and injects user info
- Role-based access: `adminMiddleware` restricts admin-only endpoints

**Data Models (SQLite Tables):**
- `users` - User accounts with email, hashed password, admin flag
- `wallets` - User balances (total and available USD)
- `portfolio_positions` - Asset holdings with P&L tracking
- `transactions` - Deposits, withdrawals, trades with status tracking
- `admin_adjustments` - Manual balance adjustments by admins

### Database Layer

**ORM/Query Builder:**
- Drizzle ORM configured for SQLite (schema defined in shared/schema.ts)
- Raw better-sqlite3 driver for actual database operations
- Schema defines tables with TypeScript types and Zod validation schemas

**Storage Pattern:**
- Synchronous SQLite operations via better-sqlite3
- Database file: `database.db` in project root
- Schema initialization on server start (CREATE TABLE IF NOT EXISTS)
- Prepared statements and transactions for data integrity

**Seeding:**
- Default admin user created on initialization:
  - Email: admin@site.com
  - Password: Admin123!
  - isAdmin: true

### Authentication & Authorization

**Security Measures:**
- Passwords hashed with bcryptjs (10 salt rounds)
- JWT secret stored in environment variable (fallback for dev)
- Token expiration: 7 days
- Protected routes check token validity before rendering
- Admin routes require both valid token AND admin flag

**Session Management:**
- Stateless JWT authentication (no server-side sessions)
- Token stored client-side in localStorage
- AuthContext provides login/logout/register methods
- Automatic token validation on app mount

### Development Workflow

**Build Process:**
- Development: Vite dev server with HMR, Express API proxy
- Production: Vite builds client to `dist/public`, esbuild bundles server to `dist/index.js`
- Type checking: Shared types between client/server via `@shared` path alias

**Path Aliases:**
- `@/*` → client/src/*
- `@shared/*` → shared/*
- `@assets/*` → attached_assets/*

**Environment Modes:**
- Development: tsx with hot reload, Vite middleware mode
- Production: Compiled ES modules, static file serving

## External Dependencies

### UI Component Library
- **shadcn/ui**: Comprehensive React component library built on Radix UI primitives
- **Radix UI**: Unstyled, accessible component primitives (dialogs, dropdowns, menus, etc.)
- **TailwindCSS**: Utility-first CSS framework with custom theme configuration
- **class-variance-authority & clsx**: Dynamic className composition

### Database
- **better-sqlite3**: Synchronous SQLite3 driver for Node.js
- **Drizzle Kit**: Schema management and migrations (configured but migrations not currently used)
- **@neondatabase/serverless**: Neon serverless Postgres driver (configured but not actively used; SQLite is primary)

### Authentication & Security
- **bcryptjs**: Password hashing library
- **jsonwebtoken**: JWT token generation and validation

### State & Data Fetching
- **@tanstack/react-query**: Server state management, caching, background refetching
- Configured with infinite stale time and no automatic refetching

### Development Tools
- **Vite**: Frontend build tool and dev server
- **esbuild**: Fast JavaScript bundler for backend production build
- **tsx**: TypeScript execution for development server
- **TypeScript**: Type safety across full stack

### Routing & Navigation
- **wouter**: Lightweight client-side routing (~1.2KB)
- **react-router** alternative for SPA navigation

### Forms & Validation
- **react-hook-form**: Performant form state management
- **zod**: TypeScript-first schema validation
- **@hookform/resolvers**: Bridge between react-hook-form and Zod

### Third-Party Integrations (Planned)
- **CoinGecko API**: Crypto price data and market information (not yet implemented)
- **NowPayments API**: Cryptocurrency payment processing for deposits/withdrawals (mock implementation currently)

### Icons & Assets
- **lucide-react**: Icon library
- **react-icons**: Additional icon sets (Simple Icons for brand logos like Binance, Coinbase)

### Font Loading
- **Google Fonts**: Inter and Space Grotesk fonts loaded via CDN in index.html

### Replit-Specific Plugins
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay
- **@replit/vite-plugin-cartographer**: Code navigation (dev only)
- **@replit/vite-plugin-dev-banner**: Development banner (dev only)