# Design Guidelines: Crypto Arbitrage Trading Platform (Premium Edition)

## Design Approach

**Selected Approach:** Premium Fintech Platform with Professional Trading Dashboard
- **Primary References:** Binance, Coinbase Pro, Robinhood (for professional trading UI)
- **Secondary References:** Stripe, Plaid (for clean fintech aesthetic)
- **Visual Quality:** Enterprise-grade SaaS platform with premium typography and refined interactions

**Core Principles:**
1. **Premium Typography:** Inter font with OpenType features (tabular numbers, ligatures)
2. **Refined Spacing:** Generous whitespace, larger touch targets, professional hierarchy
3. **Subtle Interactions:** Smooth transitions (150ms), gold glow effects, hover shadows
4. **Modern Styling:** 14-20px border radius, thin 1px borders, elegant shadows
5. **Data Clarity:** Monospace numbers, uppercase table headers, color-coded P/L

---

## Premium Typography System

**Font Stack:**
- **Primary:** Inter (Google Fonts) - body text, data tables, UI elements
  - Font weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
  - OpenType features: Kerning, ligatures, tabular/lining numbers
- **Display:** Space Grotesk (Google Fonts) - headlines, hero sections, large numbers
- **Monospace:** Roboto Mono - financial data, numeric tables

**OpenType Features:**
```css
font-feature-settings: "kern" 1, "liga" 1; /* Body text */
font-feature-settings: "tnum" 1, "lnum" 1; /* Financial numbers */
font-variant-numeric: tabular-nums lining-nums; /* Tables */
```

**Type Scale:**
- Hero Headlines: 5xl to 6xl (48-60px), font-weight-700, letter-spacing: -0.025em
- Section Headers: 4xl to 5xl (36-48px), font-weight-700, letter-spacing: -0.020em
- Subsection Headings: 3xl to 4xl (30-36px), font-weight-700, letter-spacing: -0.015em
- Card Titles: xl to 2xl (20-24px), font-weight-600, tracking-tight
- Body Text: base to lg (16-18px), font-weight-400
- Balance Displays: 3xl to 4xl (30-36px), font-weight-700, tabular-nums, letter-spacing: -0.02em
- Data/Numbers: lg to xl (18-20px), font-weight-600, tabular-nums
- Table Headers: xs (12px), font-weight-600, uppercase, letter-spacing: 0.05em
- Captions/Labels: sm (14px), font-weight-500

---

## Premium Color Palette

**Dark Mode (Primary):**
- **Backgrounds:**
  - Main: `#050915` (222° 84% 2%) - Very dark navy, professional trading environment
  - Card: `#0F172A` (222° 47% 6%) - Card backgrounds
  - Sidebar: `#0F172A` - Matching card backgrounds
  - Elevated: `#111827` (222° 32% 9%) - Sidebar accents
- **Borders:**
  - Primary: `#1E293B` (220° 27% 12%) - Subtle, thin 1px borders
- **Text:**
  - Primary: `#F8FAFC` (210° 20% 98%) - High contrast white
  - Secondary: `#94A3B8` (215° 20% 65%) - Muted text
- **Accents:**
  - Finance Gold: `#F3BA2F` (45° 96% 57%) - Primary CTA, highlights
  - Profit Green: `#16A34A` (142° 71% 45%) - Positive P/L
  - Loss Red: `#DC2626` (0° 72% 51%) - Negative P/L

**Light Mode (Secondary):**
- Standard light backgrounds with gold accent (#F3BA2F)
- Maintains same accent colors for consistency

**Shadows & Glows:**
- **Hover shadows:** Subtle 0.10-0.15 opacity, soft depth
- **Gold glow:** `0px 0px 20px 0px hsl(45 96% 57% / 0.30)` on primary buttons
- **Premium shadow:** Multi-layer depth with 0.20-0.30 opacity

---

## Layout System

**Spacing Primitives:** Enhanced Tailwind spacing
- Component padding: p-5 to p-6 (20-24px for better breathing room)
- Section padding: py-16 to py-24
- Card spacing: space-y-6 to space-y-8
- Grid gaps: gap-6 to gap-8
- Large spacing: 18, 112, 128 (custom values for hero sections)

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

## Premium Component Library

### Navigation
- **Public Nav:** Transparent on hero with blur backdrop, solid on scroll, items right-aligned
- **Dashboard Nav:** Top bar with Activity icon, notifications, settings, profile (icons only)
- **Mobile:** Responsive with stacked layout

### Cards & Containers (Premium Styling)
- **Border Radius:** 16px (rounded-card) for main cards, 14px (rounded-md) for nested cards
- **Borders:** Thin 1px solid #1E293B
- **Padding:** p-5 (20px) for better spacing
- **Hover Effect:** Shadow elevation on hover (150ms transition)
- **Summary Cards:** Large numbers (text-3xl), small icons, muted labels
- **Data Cards:** Clean hierarchy with tabular numbers

### Buttons (Premium Styling)
- **Border Radius:** 12px (rounded-button) for modern look
- **Typography:** font-semibold (600 weight) for clarity
- **Transitions:** 150ms ease-out on all properties
- **Primary (Default):**
  - Gold background (#F3BA2F)
  - Gold glow on hover (shadow-glow)
  - min-h-9 default, min-h-11 for large
- **Secondary:** Outlined variant with subtle borders
- **Ghost:** Transparent with hover elevation
- **Sizes:**
  - Small: min-h-8, px-3, text-xs
  - Default: min-h-9, px-4, text-sm
  - Large: min-h-11, px-8, text-base

### Data Display (Premium Styling)
- **Tables:**
  - Headers: uppercase, xs (12px), font-semibold, letter-spacing: 0.05em
  - Body: text-sm (14px), tabular numbers
  - Hover: Row elevation with hover-elevate class
  - Numbers: Right-aligned, monospace font-family
- **Balance Displays:**
  - Class: `.balance-display`
  - Size: text-3xl to text-4xl
  - Weight: font-bold
  - Features: tabular-nums, letter-spacing: -0.02em
- **P/L Indicators:**
  - Profit: Green (#16A34A) with ▲ icon
  - Loss: Red (#DC2626) with ▼ icon
  - Badges for percentages
- **Charts:** Dark theme with gold/green/red color scheme

### Forms (Premium Styling)
- **Input Fields:**
  - Height: h-10 (40px) for comfortable touch targets
  - Border radius: rounded-button (12px)
  - Padding: px-4 (16px horizontal)
  - Transitions: 150ms on focus states
  - Focus ring: 2px gold ring with 1px offset
- **Labels:** Positioned above inputs, clear hierarchy
- **Validation:** Inline error messages with icons

### Badges & Pills (Premium Styling)
- **Border Radius:** rounded-sm (8px) for modern look
- **Padding:** px-2.5 py-0.5
- **Typography:** text-xs, font-semibold
- **Transitions:** 150ms hover elevation
- **Variants:**
  - Default: Gold background (#F3BA2F)
  - Destructive: Red background (#DC2626)
  - Secondary: Muted background

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

### User Dashboard (Binance-Inspired Trading Interface)

**Design System:**
- **Dark Theme:** Very dark backgrounds (#02040A, #0B1020)
- **Primary Accent:** Gold/yellow (#F3BA2F) - Binance-style
- **Profit Color:** Green (#16A34A) with ▲ icon
- **Loss Color:** Red (#DC2626) with ▼ icon
- **Typography:** Inter font with clear hierarchy - large bold numbers for balances, small muted labels

**Layout Structure:**

**Top Navigation Bar:**
- Left: App logo "ArbiTradeX" with icon
- Right: User avatar with dropdown (Profile/Logout), Notification bell icon, Settings gear icon
- Dark background with subtle border

**Row 1 - Summary KPI Cards (4 cards):**
- Total Balance, Realized P/L, Unrealized P/L, Active Positions
- Binance-style with large numbers (text-3xl) in bright white
- Small label below in muted gray
- P/L cards show inline trend icons (up/down arrows with color)
- Card height ~120px, rounded-2xl, dark card background
- Subtle icons for each card type (wallet, chart-line, trending-up, etc.)

**Row 2 - Main Content Split:**
- **Left (60%):** Portfolio/Positions Tabbed Section
  - Tabs: "Portfolio" and "Arbitrage Positions"
  - Dark table with alternating row hover highlights
  - Portfolio tab: Asset | Quantity | Avg Entry | Current Price | Value | P/L USD | P/L %
  - Positions tab: Route with arrow (Kraken → Binance) | P/L with strong color | Status pill (green for open, gray for closed) | Formatted dates
  - Color-coded P/L: green with ▲ for profit, red with ▼ for loss
  
- **Right (40%):** Live Opportunities Panel
  - Vertical card list (not table)
  - Each opportunity card shows: Asset symbol, Spread badge (e.g. "2.40% Spread" in green pill), Buy/Sell lines with prices
  - Filter bar above: Asset dropdown, Minimum spread dropdown, Symbol search input
  - Cards with hover elevation, compact rounded design

**Row 3 - Charts & Actions:**
- **Left:** Price Charts with tab switcher (BTC, ETH, SOL, etc.)
  - Dark chart theme with faint grid lines
  - Current price and 24h change displayed
  
- **Right/Top:** Quick Action Bar
  - Large primary "Deposit" button (gold accent color)
  - Secondary outline "Withdraw" button
  - Rounded corners, slight glow on hover

**Micro-interactions:**
- Card hover: slight scale + shadow
- Button hover: background + border change with 0.15s transition
- Table row hover: row highlight
- All interactions smooth and professional

**Responsive:**
- Mobile: Stack all sections vertically
- Summary cards: 2x2 grid on mobile
- Tables: horizontal scroll with sticky headers
- Filter controls: stack vertically on small screens

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