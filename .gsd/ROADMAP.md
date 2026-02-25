# ROADMAP.md

> **Current Phase**: Active Development (Post-MVP refinements)
> **Milestone**: v1.0 — Complete Marketplace Platform

## Must-Haves (from SPEC)

- [x] Owner registration and warehouse listing (AddWarehouse)
- [x] Owner dashboard (manage warehouses, availability, inquiries)
- [x] Merchant dashboard (browse, filter, inquire)
- [x] Admin panel (approve/reject pending warehouses)
- [x] Role-based authentication (Owner/Merchant/Admin)
- [x] Real-time chat (ChatBox)
- [x] Input validation fixes (scroll-wheel number issue)
- [x] Duplicate account protection across roles

## Phases

### Phase 1: Foundation & Authentication ✅
**Status**: ✅ Complete
**Objective**: Set up Next.js project, Firebase, routing, and role-based auth
**Key Deliverables**:
- Firebase Auth (email/password + Google Sign-In)
- Role-based registration (Owner / Merchant)
- One-email-one-role enforcement
- Protected routes per role

---

### Phase 2: Owner Portal ✅
**Status**: ✅ Complete
**Objective**: Full owner experience — list and manage warehouses
**Key Deliverables**:
- Multi-step AddWarehouse form (location, details, amenities, pricing)
- Map-based location picker (lat/lng in Step 1)
- MyWarehouses listing with status badges (pending/live)
- Availability calendar
- Owner dashboard stats

---

### Phase 3: Merchant Portal ✅
**Status**: ✅ Complete
**Objective**: Full merchant experience — discover and contact owners
**Key Deliverables**:
- Browse live warehouses with search + filters
- Warehouse detail cards
- Inquiry flow with real-time ChatBox

---

### Phase 4: Admin Panel ✅
**Status**: ✅ Complete
**Objective**: Admin governance of warehouse listings
**Key Deliverables**:
- Admin login + protected admin routes
- Pending warehouse review queue
- Approve/reject with Firestore status update (`pending` → `live`)

---

### Phase 5: Polish & Bug Fixes 🔄
**Status**: 🔄 In Progress
**Objective**: Fix discovered issues, improve UX, and harden the app
**Key Deliverables**:
- [ ] Fix number input scroll-wheel sensitivity ✅ (done)
- [ ] Fix merchant portal redirect bug on cross-role login ✅ (done)
- [ ] Refine AddWarehouse step order (map to Step 1) ✅ (done)
- [ ] Inquiries page improvements (owner view)
- [ ] General UX polish and edge case handling

---

### Phase 6: Launch Readiness ⬜
**Status**: ⬜ Not Started
**Objective**: Prepare app for production deployment
**Key Deliverables**:
- [ ] npm audit vulnerability fixes
- [ ] Environment variable audit (.env security)
- [ ] Production build validation (`npm run build`)
- [ ] Performance audit
- [ ] Final end-to-end testing across all roles
