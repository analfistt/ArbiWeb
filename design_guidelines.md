# Design Guidelines: Crypto Arbitrage Trading Platform

## Design Approach

**Selected Approach:** Fintech Platform Reference with Modern Trading Dashboard
- **Primary References:** Binance, Coinbase Pro, Kraken (for dashboard/trading UI)
- **Secondary References:** Stripe, Plaid (for clean fintech aesthetic)
- **Landing Page Inspiration:** OddsJam structure with crypto/fintech visual treatment

**Core Principles:**
1. Data clarity and hierarchy for trading information
2. Professional trust-building for financial platform
3. Efficient information density without clutter
4. Clear visual distinction between public and authenticated areas

---

## Typography System

**Font Stack:**
- **Primary:** Inter (Google Fonts) - body text, data tables, UI elements
- **Display:** Space Grotesk (Google Fonts) - headlines, hero sections, large numbers

**Type Scale:**
- Hero Headlines: 4xl to 6xl (48-60px), font-weight-700
- Section Headers: 3xl to 4xl (36-48px), font-weight-700
- Card Titles: xl to 2xl (20-24px), font-weight-600
- Body Text: base to lg (16-18px), font-weight-400
- Data/Numbers: lg to xl (18-20px), font-weight-600, tabular-nums
- Captions/Labels: sm (14px), font-weight-500, uppercase tracking-wide for labels

---

## Layout System

**Spacing Primitives:** Tailwind units of 4, 6, 8, 12, 16, 20, 24
- Component padding: p-6 to p-8
- Section padding: py-16 to py-24
- Card spacing: space-y-6
- Grid gaps: gap-6 to gap-8

**Container Widths:**
- Landing page sections: max-w-7xl mx-auto px-6
- Dashboard: max-w-[1400px] mx-auto px-6
- Admin tables: max-w-[1600px] mx-auto px-8

**Grid System:**
- Summary cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- Feature sections: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Portfolio tables: Full width with horizontal scroll on mobile
- Dashboard layout: Two-column on desktop (sidebar 280px + main flex-1)

---

## Component Library

### Navigation
- **Public Nav:** Transparent on hero with blur backdrop, solid on scroll, items right-aligned
- **Dashboard Nav:** Fixed sidebar (280px) with logo, user profile, main navigation items, logout at bottom
- **Mobile:** Hamburger menu with slide-out drawer

### Cards & Containers
- **Summary Cards:** Rounded corners (rounded-xl), subtle border, p-6, hover lift effect
- **Data Cards:** Clean borders, minimal shadows, focus on content hierarchy
- **Portfolio Cards:** Table-like structure with clear column headers and alternating row backgrounds

### Buttons
- **Primary CTA:** Large (px-8 py-4), rounded-lg, prominent on hero and key actions
- **Secondary:** Outlined variant with transparent background
- **Hero Buttons:** Blurred background (backdrop-blur-md bg-white/10), no hover blur changes
- **Icon Buttons:** Square (w-10 h-10), rounded-lg, for table actions

### Data Display
- **Tables:** Full-width, sticky headers, alternating row backgrounds (bg-gray-50/50), right-align numbers
- **Stat Numbers:** Large (text-3xl to text-4xl), tabular-nums, with small label above
- **P/L Indicators:** Inline badges with icons (↑↓), distinct treatments for positive/negative
- **Charts:** Card containers with minimal chrome, full-bleed graphs with axis labels

### Forms
- **Input Fields:** Large touch targets (h-12), rounded-lg borders, clear focus states
- **Labels:** Small caps (text-sm uppercase tracking-wide), above inputs
- **Validation:** Inline error messages below fields

### Badges & Pills
- **Status Badges:** Small (px-3 py-1), rounded-full, uppercase text-xs
- **Asset Symbols:** Pill style with icons (BTC, ETH), inline with asset names

---

## Page-Specific Guidelines

### Landing Page

**Hero Section (100vh):**
- Large hero image background showing abstract crypto/trading visualization
- Dark overlay (bg-black/40) for text readability
- Centered content with hero headline (text-6xl), supporting subheadline (text-xl max-w-2xl)
- Two prominent CTAs side-by-side: "Sign In to Dashboard" (primary) + "Sign Up" (secondary)
- Both buttons with backdrop-blur-md bg-white/10 treatment

**How It Works (py-20):**
- Three-column grid of steps with numbered badges (1, 2, 3)
- Icon + title + description format
- Each step in its own card with subtle background

**Supported Exchanges (py-16):**
- Six-column logo grid (3 cols mobile, 6 desktop) showing exchange logos
- Grayscale logos with color on hover
- Exchange names: Binance, Kraken, Coinbase, Gemini, Bitfinex, KuCoin

**Why Us (py-20):**
- Two-column feature grid with icons
- Features: Real-time data, Automated engine, Simple dashboard, Secure platform
- Each feature with icon, bold title, descriptive text

**Footer:**
- Three-column layout: About + Quick Links + Newsletter signup
- Social icons, copyright, trust badges

### User Dashboard

**Layout:**
- Fixed sidebar navigation (280px) with main content area
- Dashboard grid: 4 summary cards at top, then 3-column layout for main sections

**Summary Cards (top row):**
- Total Balance, Realized P/L, Unrealized P/L, Active Positions
- Large number display with trend indicators and percentage changes

**Portfolio Section:**
- Full-width table with columns: Asset | Quantity | Avg Entry | Current Price | Value | P/L USD | P/L %
- Asset column with icon + symbol
- P/L columns with badges and arrows
- Sortable headers

**Arbitrage Opportunities:**
- Card-based layout showing spreads
- Three columns per opportunity: Buy Exchange | Asset | Sell Exchange | Spread %
- Highlight spreads >2% with accent treatment

**Price Charts:**
- Two-column grid with charts for BTC, ETH
- Chart.js line charts with minimal styling
- Time period selector tabs (1H, 24H, 7D, 30D)

**Wallet Section:**
- Balance card with large number display
- Deposit and Withdraw buttons prominent and equal width
- Recent transactions list below

### Admin Back Office

**Layout:**
- Same sidebar structure as user dashboard
- Admin-specific navigation items: Users, Transactions, Analytics

**User Management Table:**
- Full-width table with: Email | Balance | P/L | Status | Actions
- Action buttons: View, Adjust Balance, Edit P/L
- Search and filter controls above table

**Transaction Monitoring:**
- Tabs for: All, Pending, Completed, Rejected
- Table columns: User | Type | Amount | Status | Date | Actions
- Approve/Reject buttons for pending withdrawals

**User Detail Modal:**
- Overlay modal (max-w-4xl) with user summary
- Tabs: Profile, Balance, Portfolio, Transactions
- Adjustment form with amount input and note field

---

## Images

**Hero Image:** Abstract visualization of cryptocurrency trading - interconnected nodes, charts, or digital currency symbols. Full-bleed background covering entire hero section (100vh).

**Exchange Logos:** Use actual logos for Binance, Kraken, Coinbase, Gemini, Bitfinex, KuCoin in "Supported Exchanges" section. Display in grayscale by default.

**Cryptocurrency Icons:** Use standard crypto icons (Bitcoin, Ethereum, USDT, etc.) throughout dashboard and portfolio sections. Source from cryptocurrency icon libraries.

---

## Visual Treatments

**Elevation:** Minimal shadows - use subtle borders instead. Reserve shadows for modals and dropdowns only.

**Borders:** 1px solid with low opacity, rounded corners (rounded-lg to rounded-xl).

**Hover States:** Subtle background changes, no dramatic transforms. Border brightness increase on cards.

**Loading States:** Skeleton screens for tables and charts, spinner for button actions.

**Empty States:** Centered icon + message + CTA for empty portfolios/transactions.