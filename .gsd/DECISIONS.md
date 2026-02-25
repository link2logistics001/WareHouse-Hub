# DECISIONS.md — Architecture Decision Records

> **Purpose**: Track key architectural and design decisions made during development.

---

## ADR-001: Firebase as sole backend

**Date**: Project inception  
**Status**: Accepted

**Decision**: Use Firebase Firestore + Firebase Auth exclusively, with no custom backend API.

**Rationale**: Simplifies deployment, provides real-time data out of the box, and handles authentication with minimal setup.

---

## ADR-002: One email = one role

**Date**: Early development  
**Status**: Accepted

**Decision**: Enforce that each email address can only be registered as one role (Owner OR Merchant, never both).

**Rationale**: Prevents confusion, simplifies data model, and avoids permission conflicts between portals.

**Implementation**: Role check in Login.js, enforced across email/password and Google Sign-In flows.

---

## ADR-003: Admin approval gate for warehouse listings

**Date**: Admin panel phase  
**Status**: Accepted

**Decision**: All new warehouse listings start as `pending` and must be admin-approved before becoming `live` (visible to merchants).

**Rationale**: Quality control to ensure legitimate listings before merchant exposure.

**Firestore field**: `status: "pending" | "live" | "rejected"`

---

## ADR-004: Map location in AddWarehouse Step 1

**Date**: 2026-02-23  
**Status**: Accepted

**Decision**: Move the map-based location picker (lat/lng) to Step 1 of the AddWarehouse form, alongside state, city, address, and zip code.

**Rationale**: Location is foundational — capturing it early ensures all subsequent steps (like amenities and pricing) have proper context.
