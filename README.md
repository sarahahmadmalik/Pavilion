# MTA Ghana — Operations Portal

A web-based admin dashboard prototype for MTA Ghana. This repository contains the frontend application (Vite + Node), Supabase configuration, and design/feature specifications for local development and deployment.

## Project overview

MTA Ghana is an institutional admin dashboard that manages guest house operations, office assets, maintenance requests, and bill payments. The goal is to replace a multi-sheet Excel workflow with a role-based web application offering auditing, export, and permission controls for Super Admin, Admin, and Staff users.

## Features

The following features are taken from the project design prompt used for Stitch AI (kept here as the canonical feature list for designers and implementers):

Branding & Theme
- App name: MTA Ghana with navy-blue brand color (#1A3FA0).
- Logo displayed top-left in the sidebar/header on every screen.
- Light/Dark mode toggle (sun/moon) in the top nav; state persists across screens.
- Light mode: white/light-gray backgrounds with navy accents. Dark mode: deep charcoal/navy backgrounds with light text and brand accent.

Authentication
- Login page with centered card: logo, title "MTA Ghana Dashboard", email/username, password (show/hide), "Remember me", "Forgot password?" link, and primary Log In button.
- No self-service password reset: only Super Admin can reset passwords via User Management.

App Shell & Navigation
- Persistent left sidebar (collapsible) with permission-driven menu (shows only pages user has access to).
- Top header: page title, search, notifications bell, theme toggle, user avatar menu (Profile, Settings, Logout).
- Sidebar menu items (permission controlled): Dashboard, Guest List, Guest House Maintenance, Guest House Inventory, Office Bill Payments, Office Asset List, Office Maintenance, Activity Log (Admin+Super Admin), User Management (Super Admin only).

Dashboard / Home
- Personalized summary view after login, scoped to the user's role and module access.
- Super Admin: KPI cards include Total Users (with breakdown), Total Guests Currently Checked In, Open Maintenance Issues, Total Inventory Items, Pending Bill Payments; Users Overview panel; charts (maintenance by status, payments by month); recent activity feed; Activity Log access.
- Admin: KPI cards for modules (no Total Users card), charts, recent activity, Activity Log access.
- Staff: KPI cards and activity feed scoped to assigned modules only.

Module Pages (common layout for all modules)
- Page header with title/description.
- Action bar: "+ Add New" button, search, filters, and "Export to Google Sheets" button.
- Data table with sortable columns and row-level actions (Edit, Delete, View).
- Pagination, empty states, slide-in side panel or modal for Add/Edit forms, and delete confirmation dialogs.
- Role-based permissions: view-only for users without edit rights; modules hidden entirely for users with no access.

Module-specific fields
- Guest List: columns (Name, Check In, Check Out, Country, Room Allocated, Purpose); Add/Edit with date pickers and dropdowns.
- Guest House Maintenance: reported on, issue, status (Open/In Progress/Resolved), updates, location, worker name, cost (GHS).
- Guest House Inventory: item, qty, condition (Good/Fair/Damaged), location, notes.
- Office Bill Payments: date, company, cheque no., payee, amount (GHS).
- Office Asset List: barcode, description, status (In Use/In Storage/Retired), location (barcode has "scan" placeholder).
- Office Maintenance: same structure as Guest House Maintenance.

Export to Google Sheets
- Export modal offering "Export all records" or "Export filtered view only" and a Confirm Export action.
- On success show a toast with an "Open in Google Sheets" link.

Activity Log (Admin & Super Admin)
- Audit table capturing every create/edit/delete across the six modules and User Management.
- Columns: Timestamp, User, Action (Created/Edited/Deleted), Module/Page, Record affected, Details (expandable before/after values).
- Filters by user/module/action/date range and search.
- Read-only with export option (CSV/Google Sheets).

User Management (Super Admin only)
- Roles: Super Admin (full access + user management), Admin (full module access but no user management), Staff (granular module permissions).
- Users table: Name, Email, Role, Assigned Modules (chips), Status, Last Login; row actions: Edit, Deactivate, Delete, Reset Password.
- Add/Edit user panel: name, email, password (new users), role selector, and a module-access matrix with View/Add/Edit/Delete toggles. Super Admin/Admin roles auto-fill and lock to full access; Staff requires manual per-module permissions.

Additional Screens
- 403 / Access Denied for unauthorized access attempts.
- Profile / Settings page: user details, change password, and personal theme preference.

Design notes
- Modern institutional admin aesthetic (rounded cards, soft shadows, generous whitespace).
- Use MTA Ghana navy blue as dominant accent; status badges color-coded (green/amber/red).
- Responsive layout: sidebar collapses to icons on smaller widths.
- Deliverable mockups: Login, Dashboard/Home, one CRUD table page (Guest List) with Add/Edit open, Export modal, Activity Log, User Management permissions panel, and both light/dark Dashboard mockups.

## Quick start

Prerequisites:
- Node.js (14+ recommended)
- npm (or yarn/pnpm)

Install dependencies:

```bash
npm install
```

Create environment variables (example):

```
VITE_SUPABASE_URL=https://your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Run development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

## Project structure
- [index.html](</D:/mta ghana/index.html>) — App entry HTML
- [src/](</D:/mta ghana/src>) — Application source code
- [public/](</D:/mta ghana/public>) — Static assets
- [supabase/](</D:/mta ghana/supabase>) — Supabase-related configuration and migrations
- [package.json](</D:/mta ghana/package.json>) — NPM scripts and dependencies

## Contributing
- Open an issue to discuss changes.
- Create feature branches and open pull requests for reviews.

## License
Specify your project license (e.g., MIT). Add a LICENSE file at the repo root when ready.

---

If you'd like the README to be trimmed to a shorter summary or expanded with CI/deployment instructions, say which sections to adjust and they will be updated.