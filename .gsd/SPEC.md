# SPEC.md — Project Specification

> **Status**: `FINALIZED`
> **Last Updated**: 2026-02-25

## Vision

WareHouse-Hub is a marketplace platform connecting **Warehouse Owners** who have storage space to rent with **Merchants** who need flexible warehousing solutions. Owners list their warehouses with detailed attributes (size, amenities, location, pricing), merchants discover and inquire about spaces, and an Admin panel governs approvals before listings go live.

## Goals

1. **Owner Portal** — Allow owners to list, manage, and track inquiries for their warehouses
2. **Merchant Portal** — Allow merchants to search, filter, and contact owners about available warehouses
3. **Admin Panel** — Allow admins to review and approve/reject pending warehouse listings before they go live
4. **Authentication** — Secure, role-based sign-up/login (Owner, Merchant, Admin) enforcing one account type per email
5. **Real-time Chat** — In-app messaging between owners and merchants for inquiries
6. **Data Integrity** — Prevent duplicate accounts, enforce input validation, and maintain clean Firestore data

## Non-Goals (Out of Scope)

- Payment processing / billing (not in current version)
- Mobile native app (web only)
- Multi-language / i18n support
- Warehouse reviews or ratings (future phase)
- Automated email notifications (future phase)

## Users

| Role | Description |
|------|-------------|
| **Owner** | Has warehouse space; registers, lists warehouses, manages availability, responds to inquiries |
| **Merchant** | Needs storage; registers, searches/filters warehouses, contacts owners via chat |
| **Admin** | Internal role; approves/rejects pending warehouse listings before they go live |

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js (App Router) |
| Auth + DB | Firebase (Firestore + Firebase Auth) |
| Styling | TailwindCSS |
| Animations | Framer Motion |
| Icons | Lucide React |
| Maps | Google Maps API (for location picking in AddWarehouse) |

## Constraints

- Firebase Firestore is the sole database — no SQL or backend API
- All auth is via Firebase Auth (email/password + Google Sign-In)
- One email = one account type (owner OR merchant, never both)
- Warehouses start as `pending` status; must be admin-approved to become `live`
- Windows development environment (PowerShell)

## Success Criteria

- [ ] Owner can register, add a warehouse with full details (location via map, amenities, pricing), and see it listed as `pending`
- [ ] Admin can log in, see pending warehouses, and approve/reject them
- [ ] Merchant can search and filter `live` warehouses and send inquiries
- [ ] Real-time chat works between owner and merchant for each inquiry
- [ ] Users cannot create duplicate accounts across roles with the same email
- [ ] Input validation prevents bad data (scroll-wheel number changes, empty required fields)
- [ ] App builds and deploys without errors
