# STACK.md — Technology Inventory

> **Last Updated**: 2026-02-25

## Runtime

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | ^16.1.6 | App Router, SSR/SSG, routing |
| Language | JavaScript (JSX) | ES2022+ | Component authoring |
| Runtime | Node.js | LTS | Server-side rendering |

## Frontend

| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.3.1 | UI library |
| react-dom | ^18.3.1 | DOM rendering |
| framer-motion | ^12.29.0 | Animations and transitions |
| lucide-react | ^0.563.0 | Icon library |
| tailwindcss | ^3.4.1 | Utility-first CSS framework |
| autoprefixer | ^10.4.18 | CSS vendor prefixing |
| postcss | ^8.4.35 | CSS processing |

## Backend / Services

| Service | Purpose |
|---------|---------|
| Firebase Firestore | NoSQL real-time database |
| Firebase Auth | Authentication (email + Google) |
| Google Maps API | Map-based location picker in AddWarehouse |

## Dev Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| eslint-config-next | Next.js ESLint rules |

## Environment Variables

Stored in `.env` (gitignored):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
