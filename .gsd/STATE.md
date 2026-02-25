# STATE.md — Session Memory

> **Last Updated**: 2026-02-25
> **Current Phase**: Phase 5 — Polish & Bug Fixes

## What We're Doing

Working on the WareHouse-Hub marketplace platform — a Next.js + Firebase app connecting warehouse owners with merchants. The platform has 3 user roles: Owner, Merchant, and Admin.

## Current Status

- Core platform is feature-complete across all 3 portals
- Phase 5 (Polish & Bug Fixes) is in progress
- Inquiries.js (owner view) is currently active in the editor

## Recently Completed

- ✅ AddWarehouse multi-step form (map location moved to Step 1)
- ✅ Number input scroll-wheel bug fixed (area/height fields)
- ✅ Merchant portal cross-role redirect bug fixed
- ✅ Admin panel with warehouse approval flow
- ✅ One-email-one-role enforcement across all auth flows

## Active Context

- **Active file**: `src/components/owner/Inquiries.js`
- **Framework**: Next.js (App Router)
- **Database**: Firebase Firestore
- **Auth**: Firebase Auth (email/password + Google)

## Blockers

None currently.

## Next Up

- Continue work on owner Inquiries page
- Phase 6: Launch Readiness (npm audit, build validation, e2e testing)
