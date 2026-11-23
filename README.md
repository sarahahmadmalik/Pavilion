# PAVILION — Community & Guest House Management

A role-based community and guest house operations platform built with **React**, **Vite**, and **Supabase**. PAVILION centralizes suite occupancy, guest stays, maintenance workflows, fleet tracking, utility billing, community projects, vendor governance, policy documents, support tickets, and real-time team messaging.

---

## Key Features

### Role-Based Executive Overview
- **Personalized KPIs** tailored to **Super Admin**, **Admin**, and **Staff** roles.
- **Maintenance Ticket Status** (Pie Chart) & **Needs Attention** priority panel.
- **Utility & Vendor Bill Disbursements** (Bar Chart) & **Recent Activity** feed with scrollable audit preview.
- **Operations Health**, **Upcoming Community Events**, **Active Projects**, and **Community & Governance** overview cards.

### Guest House & Community Modules
- **Suites & Occupancy:** Live room/villa status (`Occupied`, `Available`, `Reserved`, `Maintenance`), housekeeping readiness, and quick reserve/release actions.
- **Guest House List:** Guest check-ins/check-outs, country, suite allocation, and purpose of stay.
- **GH Maintenance & Office Maintenance:** Work order tracking, assigned technicians, cost logging, and status transitions.
- **GH Inventory:** Asset and linen stock levels, condition tracking, serial numbers, and locations.
- **Office Bill Payments & Vehicles Maint:** Community utility disbursements and shuttle/fleet servicing logs.
- **Community Projects:** 4-stage Kanban board (`Todo`, `In Progress`, `Review`, `Completed`) with budgets, priorities, and pagination.
- **Notices & Events:** Community announcements, maintenance windows, and RSVP tracking.
- **Vendors & Contracts:** Preferred contractors, SLA scores, annual spend, and renewal tracking.
- **Community Staff & Document Vault:** Filterable staff directory and centralized SOP/compliance policy vault.

### Secure Communication & Notifications
- **Team Chat (Admin & Staff):** Combined `#community-ops` workspace channel and private 1-on-1 DMs (Super Admin excluded via UI and database RLS).
- **Delivery & Read Receipts:** Real-time Sent (`✓`), Delivered (`✓✓`), and Read (`✓✓`) status indicators.
- **Attachments:** Private Supabase Storage bucket (`chat-attachments`) with signed URLs and file validation.
- **Multi-Channel Notifications:** In-app notification drawer, browser desktop notifications, distinct chimes for system alerts vs. chat messages, email alerts via Edge Functions, and per-user **Notification Settings** in Profile Settings.

### Security, Governance & UX
- **Supabase Auth + Row Level Security (RLS)** with granular per-module `view / add / edit / delete` permissions for Staff.
- **Brute-Force Protection & XSS Sanitization:** Login rate-limiting after 5 failed attempts and input sanitization across all forms.
- **Plain-English Error Handling:** Friendly error translation, **404 Page Not Found**, and **Something Went Wrong** Error Boundary.
- **Light & Dark Themes**, custom animated dropdowns (`CustomSelect`), pagination, Excel exports, and mobile-responsive layouts.

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and add your Supabase project credentials:
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-publishable-or-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Initialize Supabase Database
Run the SQL files in order inside your **Supabase SQL Editor**:
1. `supabase/schema.sql`
2. `supabase/notifications_schema.sql`
3. `supabase/tickets_schema.sql`
4. `supabase/ticket_attachments_schema.sql`
5. `supabase/rls_policies.sql`
6. `supabase/sample_extensions_schema.sql`
7. `supabase/chat_schema.sql`

### 4. Seed Initial Users & Sample Data (Optional)
```bash
npm run seed
```

### 5. Run Locally & Build
```bash
npm run dev      # Start development server
npm run build    # Build production bundle
npm run preview  # Preview production build
```

---

## Project Structure
- `index.html` — Application entry HTML and security meta headers
- `public/` — SVG brand assets (`logo.svg`, `favicon.svg`)
- `src/pages/` — All dashboard, operations, community, chat, and auth pages
- `src/components/` — Reusable UI components (`BrandLogo`, `CustomSelect`, `Pagination`, `ConfirmDialog`, `ErrorBoundary`, charts, layout)
- `src/lib/` — Supabase client, service layer, error translator, security & notification utilities
- `supabase/` — SQL schemas, RLS policies, and Edge Functions
- `scripts/` — Database seeding and auth setup utilities
