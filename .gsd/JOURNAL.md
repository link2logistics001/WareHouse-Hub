# JOURNAL.md — Session Log

> **Purpose**: Track what happened in each development session.

---

## 2026-02-25 — GSD Initialization

- Installed GSD framework from https://github.com/toonight/get-shit-done-for-antigravity
- Initialized project with SPEC.md, ROADMAP.md, ARCHITECTURE.md, STATE.md, STACK.md, DECISIONS.md
- Project is brownfield — existing codebase fully developed through Phase 4
- Currently active: Phase 5 (Polish & Bug Fixes)

---

## 2026-02-23 — AddWarehouse Form Refactor

- Moved map location picker (lat/lng) from Step 4 → Step 1
- State, city, address, zip code all now in Step 1 alongside map

---

## 2026-02-22 — Input Validation Fix

- Fixed number inputs (area in sq ft, height in ft) to ignore scroll-wheel changes
- Prevented accidental value changes via keyboard arrow keys

---

## 2026-02-22 — Auth Bug Fix

- Fixed incorrect redirect to merchant portal when signing in as owner with existing merchant email
- Added "user already registered with a different role" message

---

## 2026-02-20 — Admin Panel

- Built admin panel with warehouse approval flow
- Warehouses now go from `pending` → `live` upon admin approval
- Admin sidebar and warehouse review UI created
