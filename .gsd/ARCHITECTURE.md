# ARCHITECTURE.md — System Design

> **Last Updated**: 2026-02-25
> **Status**: Brownfield — Existing codebase

## Overview

WareHouse-Hub is a **Next.js** web application with **Firebase** as the backend. It is a marketplace platform with three distinct user roles, each with their own portal/dashboard.

## Architecture Diagram

```
┌─────────────────────────────────────────────┐
│             Next.js App (Frontend)           │
│                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  Owner   │ │ Merchant │ │  Admin   │   │
│  │ Portal   │ │ Portal   │ │ Panel    │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘   │
│       └────────────┼────────────┘          │
│                    │                        │
│          ┌─────────▼──────────┐            │
│          │  Firebase Services  │            │
│          │  ─ Firestore DB     │            │
│          │  ─ Firebase Auth    │            │
│          └────────────────────┘            │
└─────────────────────────────────────────────┘
```

## Directory Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.js           # Root layout
│   ├── page.js             # Landing page
│   └── ...                 # Other routes
├── components/
│   ├── commonfiles/        # Shared components
│   │   ├── Login.js        # Unified login + registration (all roles)
│   │   ├── ChatBox.js      # Real-time chat (owner ↔ merchant)
│   │   ├── DashboardNavbar.js
│   │   ├── Navbar.js
│   │   ├── Hero.js
│   │   ├── GetStarted.js
│   │   ├── SearchFilters.js
│   │   ├── WarehouseCard.js
│   │   └── ...
│   ├── owner/              # Owner portal components
│   │   ├── OwnerDashboard.js    # Main owner layout + routing
│   │   ├── OwnerSidebar.js
│   │   ├── AddWarehouse.js      # Multi-step warehouse listing form
│   │   ├── MyWarehouses.js      # Owner's warehouse list
│   │   ├── DashboardHome.js
│   │   ├── Availability.js
│   │   └── Inquiries.js         # Owner's inquiry management
│   └── merchant/           # Merchant portal components
│       ├── MerchantDashboard.js # Main merchant layout + routing
│       └── MerchantSidebar.js
├── contexts/               # React contexts (auth, etc.)
├── data/                   # Static data / enums
└── lib/                    # Firebase config + utilities
```

## Firestore Data Model

```
users/
  {userId}/
    role: "owner" | "merchant" | "admin"
    email: string
    displayName: string
    ...

warehouses/
  {warehouseId}/
    ownerId: string
    status: "pending" | "live" | "rejected"
    title: string
    location: { lat, lng, address, city, state, zipCode }
    area: number (sq ft)
    height: number (ft)
    amenities: string[]
    pricing: { monthly: number, ... }
    createdAt: timestamp

inquiries/
  {inquiryId}/
    warehouseId: string
    ownerId: string
    merchantId: string
    status: "open" | "closed"
    messages: subcollection → ChatBox
    createdAt: timestamp
```

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Backend | Firebase only | No custom API needed; Firestore handles real-time + auth |
| Auth | Firebase Auth | Built-in email + Google provider support |
| Routing | Next.js App Router | Modern file-based routing |
| Styling | TailwindCSS | Rapid utility-first styling |
| Animations | Framer Motion | Smooth UI transitions |
| One role per email | Enforced in auth flows | Prevents confusion, multi-portal conflicts |
| Warehouse approval | Admin-gated (`pending` → `live`) | Quality control before merchant visibility |
