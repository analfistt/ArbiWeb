# ArbiTradeX - Crypto Arbitrage Trading Platform

## Overview

ArbiTradeX is a full-stack crypto arbitrage web application designed as a demo platform. It allows users to monitor real-time arbitrage opportunities across multiple cryptocurrency exchanges, manage personal wallets, and track their portfolios. The platform includes user authentication and a comprehensive admin back office for platform management. The project aims to showcase a modern, premium fintech-style trading interface inspired by leading platforms like Binance.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is a modern React application built with TypeScript, Vite, TailwindCSS, and shadcn/ui components. It uses Wouter for client-side routing and TanStack Query for server state management and caching. The design system enforces a premium fintech aesthetic, inspired by Binance/Coinbase Pro, with a dark mode default, Inter font, a specific color palette (dark navy, slate, finance gold accent), and modern border radii. Forms are managed with react-hook-form and Zod validation. Key pages include a landing page, login/signup, a protected user dashboard with KPI cards and trading charts, and an admin panel. Trading charts utilize Recharts for Binance-style visualizations with asset-specific color schemes (BTC: gold, ETH: blue, SOL: green) and features like header bars, tooltips, and crosshair cursors.

### Backend Architecture

The backend is an Express.js server built with TypeScript, supporting both development (with Vite HMR) and production environments. It provides a RESTful API with endpoints for authentication, dashboard data, arbitrage opportunities, transactions, and admin operations. JWT-based authentication with bcrypt password hashing is used, storing tokens client-side in localStorage. Middleware handles token validation and role-based access control (`authMiddleware`, `adminMiddleware`).

### Database Layer

The project uses SQLite as its primary database, managed by Drizzle ORM and the better-sqlite3 driver. The schema (defined in `shared/schema.ts`) includes tables for `users`, `wallets`, `portfolio_positions`, `transactions`, and `admin_adjustments`. Database initialization and schema creation are handled on server start. A default admin user (`admin@site.com` / `Admin123!`) is seeded, and admin accounts are guaranteed on every server startup, with password verification and potential reset/promotion.

### Authentication & Authorization

Security measures include bcryptjs (10 salt rounds) for password hashing, JWT tokens (7-day expiration) stored in localStorage, and environment variables for the JWT secret. Protected routes require a valid token, and admin routes additionally check for an admin flag, ensuring role-based access control.

### Development Workflow

The project uses Vite for frontend development and building, with esbuild for backend production builds. Type checking is enforced across the full stack using TypeScript and shared types. Path aliases (`@/*`, `@shared/*`, `@assets/*`) streamline imports.

## External Dependencies

### UI Component Library
- **shadcn/ui**: React component library built on Radix UI.
- **Radix UI**: Unstyled, accessible component primitives.
- **TailwindCSS**: Utility-first CSS framework.
- **class-variance-authority & clsx**: For dynamic className composition.

### Database
- **better-sqlite3**: Synchronous SQLite3 driver for Node.js.
- **Drizzle Kit**: Schema management.
- **@neondatabase/serverless**: Configured but not actively used (SQLite is primary).

### Authentication & Security
- **bcryptjs**: Password hashing.
- **jsonwebtoken**: JWT token generation and validation.

### State & Data Fetching
- **@tanstack/react-query**: Server state management, caching, background refetching.

### Development Tools
- **Vite**: Frontend build tool and dev server.
- **esbuild**: Fast JavaScript bundler for backend.
- **tsx**: TypeScript execution for development server.
- **TypeScript**: Language for type safety.

### Routing & Navigation
- **wouter**: Lightweight client-side routing.

### Forms & Validation
- **react-hook-form**: Form state management.
- **zod**: TypeScript-first schema validation.
- **@hookform/resolvers**: Bridge between react-hook-form and Zod.

### Icons & Assets
- **lucide-react**: Icon library.
- **react-icons**: Additional icon sets (e.g., Simple Icons).

### Font Loading
- **Google Fonts**: Inter font.