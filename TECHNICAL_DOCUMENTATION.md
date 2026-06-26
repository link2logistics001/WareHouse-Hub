# Technical Documentation: Link2Logistics (Warehouse-Hub)

Welcome to the technical documentation for **Link2Logistics** (often referred to as **Warehouse-Hub** in local development). This document serves as a complete manual for developers, architects, and operators who will maintain, extend, or update this project in the future.

---

## 1. Project Overview & Tech Stack

Link2Logistics is a multi-sided marketplace platform that connects **Business Clients (Merchants)** needing logistics storage with **Warehouse Partners (Owners)** who have available space. It includes workflow tooling for operations (Data Entry) and administration (Admin / Super Admin).

### Core Technology Stack

| Layer | Technology | Version / Details | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | Next.js | `^16.1.6` (App Router) | Core application framework and routing |
| **View Layer** | React | `^19.2.4` | Component-driven UI development |
| **Styling** | Tailwind CSS | `^3.4.1` | Utility-first responsive styling |
| **Animations** | Framer Motion | `^12.29.0` | Fluid state transitions and dashboard animations |
| **Authentication** | Firebase Auth | Client SDK `^12.12.0` | User login (Email/Pass & Google Sign-In) |
| **Primary Database** | Cloud Firestore | Client & Admin SDKs | Real-time database for users, listings, chats, and quotes |
| **File Storage** | Firebase Storage | Client SDK | Storing warehouse images (front view, dock, rate cards) |
| **Server Operations** | Firebase Admin SDK | `^13.8.0` (Vercel Serverless safe) | Email verification links, backend checks |
| **Email Delivery** | Resend API | `^6.10.0` (Client SDK) | Sending custom branded transactional HTML emails |
| **Search Engine** | Fuse.js | `^7.1.0` | Client-side fuzzy search over pre-fetched listings |
| **CSV Parser** | PapaParse | `^5.5.3` | Parsing bulk uploads of warehouses in dashboard panels |
| **Map Suggestions** | Nominatim (OpenStreetMap) | HTTP API | Dynamic city autocomplete suggestions |

---

## 2. Directory Structure

The project follows a standard Next.js App Router directory structure:

```
WareHouse-Hub/
├── cors.json                     # Firebase Storage CORS settings (allows localhost file reading)
├── firebase.json                 # Firebase local emulator configuration
├── firestore.rules               # Cloud Firestore security rules
├── firestore.indexes.json        # Custom Firestore query indexes
├── storage.rules                 # Firebase Storage security policies
├── middleware.js                 # Next.js Edge Middleware (rate limiting)
├── next.config.js                # Next.js bundler and image domain optimization config
├── package.json                  # Dependencies, overrides, and scripts
├── scripts/                      # Automated maintenance and dashboard modification scripts
│   ├── rebuild_admin_dashboard.js
│   ├── rebuild_superadmin_dashboard.js
│   └── robust_fix_edit.js
└── src/
    ├── app/                      # Next.js pages and API routes
    │   ├── api/                  # Serverless endpoint handlers
    │   │   ├── auth/             # Custom email verification logic
    │   │   └── users/            # Backend account checks
    │   ├── contact/              # Static customer contact page
    │   ├── search/               # Main warehouse search page
    │   ├── warehouse/            # Dynamic warehouse detail page (encoded ID)
    │   ├── globals.css           # Global Tailwind configurations
    │   ├── layout.js             # Root application wrapper
    │   └── page.js               # Dynamic index router (State evaluator)
    ├── components/               # Domain-specific UI panels
    │   ├── admin/                # Standard Admin views and forms
    │   ├── common/               # Shared components (Navbar, Login, Chat, Modals)
    │   ├── dataentry/            # Data Entry operators' console
    │   ├── merchant/             # Merchant specific panels & inquiry views
    │   ├── owner/                # Warehouse Owner views & Quote editors
    │   └── superadmin/           # Super Admin master dashboard
    ├── contexts/                 # Global React state contexts
    │   ├── AuthContext.js        # Firebase user profile & role manager
    │   └── CountryContext.js     # Region-specific currency, unit, and locale manager
    ├── hooks/                    # Reusable React hooks
    │   ├── useCityAutocomplete.js# Integrates Nominatim suggest logic
    │   └── useWishlist.js        # Merchant wishlist persistence (in localStorage)
    └── lib/                      # Core business logic services
        ├── auth.js               # Client authentication services & registration backoffs
        ├── emailService.js       # Transactional HTML email templates (Resend)
        ├── firebase.js           # Primary Firebase client initialization
        ├── firebase-admin.js     # Serverless SDK wrapper (handles build-time constraints)
        ├── locationService.js    # OSM API fetch caller
        ├── messaging.js          # Chat channel initialization & word filtering
        ├── phoneAuth.js          # OTP generation & secondary Firebase app isolation
        ├── quotationConstants.js # Quotation template layouts and GST structures
        └── warehouseCollections.js# Firestore hierarchy path resolver
```

---

## 3. Core Architectural Frameworks & Security

### A. Dynamic User Dashboard Router
Link2Logistics does not expose `/login`, `/admin`, or `/owner` paths. All users authenticate at the main page `/?mode=login` (built into the home page), and [page.js](file:///c:/Users/HP/WareHouse-Hub/src/app/page.js) acts as a dynamic state machine:
1. **Unauthenticated visitor:** Render the customer marketing landing pages.
2. **Authenticated:** Retrieve user profile from Firestore `users/{uid}`.
3. **Barrier evaluation:**
   - Check if `emailVerified === false`. If so, show the `<VerificationBarrier>`.
   - Check if `isBlocked === true`. If so, show the `<AccountBlocked>` banner.
4. **Dashboard routing:** Mount the corresponding component inside the root page:
   - `superadmin` $\rightarrow$ `<SuperAdminDashboard>`
   - `admin` $\rightarrow$ `<AdminDashboard>`
   - `business_client` $\rightarrow$ `<MerchantDashboard>`
   - `dataentry` $\rightarrow$ `<DataEntryDashboard>`
   - `warehouse_partner` (Owner) $\rightarrow$ `<OwnerDashboard>`

### B. Session Isolation via Session Storage
In [firebase.js](file:///c:/Users/HP/WareHouse-Hub/src/lib/firebase.js), the Firebase Auth persistence is explicitly set to `browserSessionPersistence` (Session Storage):
- **Rationale:** Prevents login status leaking across browser tabs. A developer or user can be logged in as an Admin in one tab and a Merchant in another tab of the same browser without session overwrite conflicts.
- **Race Condition Guard:** The file exports a `persistenceReady` Promise. [AuthContext.js](file:///c:/Users/HP/WareHouse-Hub/src/contexts/AuthContext.js) awaits this promise *before* registering `onAuthStateChanged`. Without this, the listener could fire before local persistence is loaded, causing logged-in users to flash the unauthenticated home page on refresh.

### C. Phone Verification Session Guard (Secondary Firebase App Isolation)
During warehouse creation, the partner's phone number must be verified via SMS OTP.
- **Problem:** Firebase `signInWithPhoneNumber` replaces the current authenticated user on the active Firebase instance. If an owner verifies their phone, they are immediately logged out of their email account and logged in under the temporary phone credential.
- **Solution:** In [phoneAuth.js](file:///c:/Users/HP/WareHouse-Hub/src/lib/phoneAuth.js), a secondary Firebase App named `__phone_auth_app__` is initialized solely for phone verification. All OTP requests (`sendPhoneOtp` / `verifyPhoneOtp`) execute on this isolated instance. The user is signed out of the secondary instance immediately after confirmation, keeping the primary email session intact.

### D. Edge API Rate Limiting
All backend routes under `/api/` are rate-limited directly at the edge in [middleware.js](file:///c:/Users/HP/WareHouse-Hub/src/middleware.js) using an in-memory sliding-window counter:
- General endpoints (`/api/users/check-account`): **30 requests / minute per IP**.
- Auth/SMS endpoints (`/api/auth/send-verification`): **5 requests / minute per IP**.
- Uses CDN headers (`NextRequest.ip` $\rightarrow$ `x-forwarded-for` $\rightarrow$ `x-real-ip`) to determine client location. Returns a `429 Too Many Requests` status with a `Retry-After` header.

### E. Region-Aware Localisation Context
The application supports multiple countries, driven by [CountryContext.js](file:///c:/Users/HP/WareHouse-Hub/src/contexts/CountryContext.js):
- **Preferences:** Saves selection to `localStorage` (as `l2l_country`). If empty, it queries the `ipapi.co` JSON API to auto-detect the user's country code on their first visit.
- **Enabled Markets:** Checked dynamically in real-time from the Firestore document `/settings/countries` (field `enabled`).
- **Formatting Utilities:**
  - `fmtPrice(amount)`: Formats numbers relative to local currencies (e.g., `IN` $\rightarrow$ `₹1,50,000`, `US` $\rightarrow$ `$150,000`, `DE` $\rightarrow$ `€150.000`).
  - `fmtArea(area)`: Maps measurement systems (e.g., `IN`/`US` $\rightarrow$ `sq ft`, `DE`/`AE`/`SA` $\rightarrow$ `sq m`).

---

## 4. Database Schema & Access Rules

Firestore relies on a hybrid flat/nested collection structure.

### Firestore Collections Map

```
/users/{userId} (Flat document structure)
  ├── email: string
  ├── name: string
  ├── userType: 'warehouse_partner' | 'business_client' | 'admin' | 'superadmin' | 'dataentry'
  ├── verified: boolean
  ├── isBlocked: boolean
  └── [phone / company]: string

/contact_details/{role}/users/{userId}
  └── { name, email, phone, company } (Protected cards)

/admin_inquiries/{inquiryId}
  ├── type: 'quick' | 'detailed'
  ├── status: 'pending' | 'approved' | 'rejected'
  ├── submittedBy: string (merchant uid)
  ├── targetOwnerEmails: string[] (owners selected by admin to view the lead)
  └── data: { company, storageNeeded, duration, etc. }

/conversations/{warehouseId}_{merchantId}
  ├── warehouseId: string
  ├── merchantId: string
  ├── ownerId: string
  ├── status: 'pending' | 'access_granted'
  ├── stage: 'new' | 'in_discussion' | 'quoted' | 'finalised'
  └── messages/{messageId} (Subcollection for real-time chat)
        ├── senderId: string
        ├── senderType: 'business_client' | 'warehouse_partner'
        ├── text: string
        └── timestamp: timestamp

/quotations/{quotationId}
  ├── quotation_number: string (Format: QTN-YYYYMMDD-[HEX])
  ├── owner_id: string
  ├── merchant_id: string
  ├── status: 'Sent' | 'Viewed' | 'Accepted' | 'Rejected'
  └── [storage_charges, handling_charges, vas_charges, etc.]: object/arrays

/settings/{settingName}
  └── countries: { enabled: ['IN', 'US', 'AE', ...] }
```

### Warehouse Document Paths (Hierarchy System)
To organize ownership and audit logs, warehouse listings are nested by creator role:
`warehouse_details/{role}/emails/{email}/warehouses/{warehouseId}`
- `{role}` is one of `warehouse_partner`, `dataentry`, or `admin`.
- `{email}` is the lowercase email of the creator.
- `warehouseId` is the auto-generated Firestore document ID.

### Firestore Security Policies (`firestore.rules`)
- **Blocked Users Barrier:** The helper function `isNotBlocked()` queries the user's profile and returns false if `isBlocked == true`, rejecting any create/update operations across the DB.
- **Admin Permissions:** `isAnyAdmin()` verifies the client belongs to either `admin` or `superadmin` types. Admins bypass structural path checks.
- **Warehouse Read Access:** Publicly readable (to populate search/detail pages), but creation or updates require user authentication and an active non-blocked status.
- **Private Conversations:** A conversation document can only be read/updated by the corresponding `merchantId`, `ownerId`, or an `admin`/`superadmin`.
- **Contact Details Protection:** The `/contact_details/` collection is restricted. A client can only read details for a user if they are an admin, the profile owner, or if contact access has been unlocked in the conversation metadata (`status == 'access_granted'`).

---

## 5. Main Functional Workflows

### A. The Search Engine Workflow

```mermaid
sequenceDiagram
    participant User as Search Client
    participant API as OSM Nominatim
    participant DB as Firestore
    participant Fuse as Fuse.js Engine

    User->>API: Input characters (e.g., "Mum")
    API-->>User: Returns City Auto-Suggestions ("Mumbai, Maharashtra, India")
    User->>DB: Trigger query for all approved warehouses (Group Query)
    DB-->>User: Returns active listings (status == 'approved' & isOnline == true)
    Note over User,Fuse: Client caches listings in-memory
    User->>Fuse: Run fuzzy match (Threshold: 0.3)
    Fuse-->>User: Returns ranked match results (name, city, state, facilities)
```

1. **City Autocomplete:** Handles geography inputs. [locationService.js](file:///c:/Users/HP/WareHouse-Hub/src/lib/locationService.js) invokes Nominatim (OSM) API with a required custom User-Agent Header (`Link2Logistics-Warehouse-App/1.0`).
2. **Data Aggregation:** The client performs a `collectionGroup('warehouses')` query, fetching all active properties globally.
3. **Fuzzy Selection:** Fuse.js runs client-side on the keys: `warehouseName`, `city`, `state`, `address`, `warehouseCategory`, `amenities`, and `facilities`. This allows immediate filter switching without database overhead.

---

### B. Lead Generation and Inquiry Workflow

```mermaid
flowchart TD
    A[Merchant submits storage inquiry] -->|Status: pending| B[Saved to admin_inquiries]
    B --> C[Admin reviews inquiries on Dashboard]
    C -->|Rejects| D[Status: rejected]
    C -->|Approves & Assigns Owner Emails| E[Status: approved]
    E --> F[Lead visible to selected Warehouse Owners]
    F --> G[Owner initiates chat / sends Quotation]
```

1. **Submission:** Merchant fills out a `<InquiryModals>` form (quick or detailed). It writes to `admin_inquiries` with status `pending`.
2. **Review:** Admins view pending inquiries on the dashboard. They can select one or more Warehouse Owners (by email) and click **Approve**.
3. **Distribution:** The status is updated to `approved` and `targetOwnerEmails` is populated. Security rules now unlock this inquiry for those specific owners, who can view the requirements under their "Global Leads" tab.

---

### C. Conversational Chat & Contact Unlock
1. **Initiation:** A merchant clicks **Send Inquiry / Chat** on a warehouse page. It creates a document in `conversations` with the ID format `{warehouseId}_{merchantId}`.
2. **Real-time Stream:** Both parties subscribe to `conversations/{convId}/messages` using `onSnapshot` to stream messages.
3. **Word Filtering:** Messages are sanitized locally prior to write via [wordFilter.js](file:///c:/Users/HP/WareHouse-Hub/src/lib/wordFilter.js) using word boundary regexes (`\bword\b`) replacing matches with asterisks.
4. **Access Unlock:** The contact card (email, phone) in the sidebar of the warehouse page is locked by default. The owner can click **Share Contacts** in the chat window, setting the conversation status to `access_granted`. This updates the Firestore rules, allowing the merchant to fetch the owner's actual contact card.

---

### D. Quotation Pipeline
Warehouse owners can build, send, and manage complex pricing quotes directly within their portal:
1. **Templates:** Owners can create custom templates in `/quotation_templates`.
2. **Generation:** To quote a merchant, the owner opens the `<QuotationEditorModal>` (pre-filled with client and warehouse details).
3. **Pricing Matrix:** Formulated using the schema in [quotationConstants.js](file:///c:/Users/HP/WareHouse-Hub/src/lib/quotationConstants.js):
   - Storage Charges (General, Cold, Hazmat, Bonded)
   - Handling Fees (GRN, GDN, Palletization)
   - Value-Added Services (Fumigation, Assembly, Cycle counts)
   - Ancillary Charges (Security, Power)
   - Penalties & GST (default SAC code: `996719`, rate: `18%`).
4. **Negotiation:** The quote is saved in `/quotations/` as `Sent`. The merchant gets a notification in their portal, can open the quote in `<QuotationViewModal>`, and click **Accept** or **Reject**, which updates the status in real-time.

---

## 6. Detailed Role Specifications

The application provides custom dashboard interfaces for 5 different roles:

### 1. Super Admin (`superadmin`)
*Master dashboard. Accesses all administrative functions in one interface.*
- **Overview:** View platform metrics (total warehouses, pending approval, active inquiries, blocked accounts).
- **Warehouse Management:** Approve, reject, or edit *any* warehouse listing globally.
- **Bulk Upload:** Upload files via Bulk CSV handler directly.
- **User Directory:** List all users, change user types, and block/unblock accounts to restrict access instantly.
- **Configuration:** Modify global settings (like enabled country lists).

### 2. Admin (`admin`)
*System moderator role. Focuses on listings and lead approvals.*
- **Overview:** Track warehouse status updates.
- **Review & Approval:** Approve pending warehouses to bring them online.
- **CSV Data Ingestion:** Run bulk uploads of new warehouses.
- **Lead Distribution:** Filter incoming inquiries, review client needs, assign targets, and approve them to distribute leads to owners.

### 3. Data Entry (`dataentry`)
*Operator role. Handles bulk inventory mapping for owners.*
- **Operational Interface:** Features a dashboard tailored to manual entry.
- **Create Listings:** Register warehouses on behalf of owners (uses custom step-forms).
- **Calendar View:** A built-in scheduler (`DECalendar.js`) to log and inspect upcoming warehouse arrivals and bookings.
- **Bulk CSV Upload:** Accesses the PapaParse template engine to upload CSV tables.

### 4. Warehouse Partner (`warehouse_partner`)
*The property owner portal. Focuses on listings and sales.*
- **My Properties:** View active listings, toggle properties online/offline (`isOnline`), edit descriptions, and update photo galleries.
- **Space Availability:** Edit detailed booking slots and square-footage availability per month.
- **Sales Pipelines:**
  - **Inquiries:** Chat directly with merchants who inquired about their properties.
  - **Global Leads:** Claim incoming projects from the admin approved lead pool.
- **Quotations:** Create custom quote templates and send formal rate cards to owners.

### 5. Business Client (`business_client`)
*The merchant buyer portal. Focuses on finding space.*
- **Explorer:** Search for warehouses, apply filters, and view details.
- **Wishlist:** Add properties to a saved list (stored in local browser storage).
- **Inquiry Pipeline:** Track submitted requests and view historical inquiries.
- **Interaction Portal:** Chat with property owners, request contact access, and review, accept, or decline received quotations.

---

## 7. Developer Playbook & Operations

### A. Environment Configuration (`.env`)
Create a `.env` file in the project root with the following variables:

```bash
# Firebase Client Credentials
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyA..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="link2logistics.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="link2logistics"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="link2logistics.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="123456789"
NEXT_PUBLIC_FIREBASE_APP_ID="1:1234:web:abcd"

# Server/API Credentials
NEXT_PUBLIC_APP_URL="http://localhost:3000"
RESEND_API_KEY="re_..."

# Firebase Admin (Required for Serverless Routing)
# Provide these OR place a 'service-account.json' file in the project root
FIREBASE_ADMIN_CLIENT_EMAIL="firebase-adminsdk-...@link2logistics.iam.gserviceaccount.com"
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC..."

# Local Emulator Flag (set true during local development)
NEXT_PUBLIC_USE_AUTH_EMULATOR="true"
```

### B. Local Development & Firebase Emulators
Because Google prevents phone authentication from completing on `localhost`, developers **must** run the Firebase Auth Emulator to test phone OTP verification flow locally:

1. **Install Firebase CLI** (if not already installed):
   ```bash
   npm install -g firebase-tools
   ```
2. **Start the Auth Emulator**:
   ```bash
   firebase emulators:start --only auth
   ```
   *Note: This starts the emulator at port 9099 and its visual dashboard UI at `http://localhost:4000`.*
3. **Configure Next.js**: Ensure `NEXT_PUBLIC_USE_AUTH_EMULATOR="true"` is set in `.env`.
4. **Running Next.js**:
   ```bash
   npm run dev
   ```
5. **Testing OTP:** When the application triggers an SMS verification, the emulator intercepts it. View the code in the Emulator console (`http://localhost:4000/auth`) and enter it in the UI step-form to verify the session.

---

### C. Bulk Upload CSV Specification
When uploading bulk files via the CSV portal, the CSV file **must** exactly match the following headers (case-sensitive) in row 1:

| Column Header | Value Type | Description / Formatting |
| :--- | :--- | :--- |
| `businessType` | String | `Warehouse Owner` \| `3PL Service Provider` |
| `companyName` | String | Corporate partner name |
| `contactPerson` | String | Name of primary contact |
| `mobile` | String | Contact number (E.164 suggested, e.g. `+91...`) |
| `email` | String | Owner email address |
| `ownerGstPan` | String | Owner tax registration ID |
| `warehouseName` | String | Display name of the facility |
| `warehouseCategory` | String | `Bonded` \| `General` \| `FTWZ` \| `Government` |
| `measurementUnit` | String | `sqft` (default) \| `sqm` |
| `totalArea` | Number | Total floor area (numbers only) |
| `availableArea` | Number | Floor area currently available (numbers only) |
| `totalMetricTons` | Number | Weight load capacity (numbers only) |
| `availableMetricTons`| Number | Available weight load capacity (numbers only) |
| `clearHeight` | Number | Ceiling clear height in feet (numbers only) |
| `numberOfDockDoors` | Number | Count of loading docks (numbers only) |
| `containerHandling` | String | `Yes` \| `No` |
| `typeOfConstruction` | String | `RCC` \| `PEB` \| `Shed` \| `Other` |
| `storageTypes` | List (Comma-sep) | e.g. `Hazardous, Non-Hazardous` |
| `warehouseAge` | String | `0-3 years` \| `3-7 years` \| `7+ years` |
| `warehouseGstPan` | String | Facility specific tax registration number |
| `state` | String | Indian State (must match `INDIAN_STATES` array exactly) |
| `city` | String | City name (must match `CITIES_BY_STATE` array exactly) |
| `addressWithZip` | String | Full physical street address including zip/pin code |
| `googleMapPin` | String | HTTP URL link to Google Maps pin location |
| `inboundHandling` | String | Inbound handling charges / description |
| `outboundHandling` | String | Outbound handling charges / description |
| `wmsAvailable` | String | `Yes` \| `No` |
| `daysOfOperation` | String | `Mon-Fri` \| `Mon-Sat` \| `All 7 Days` |
| `operationTime` | String | `24x7` \| `Fixed Hours` |
| `securityFeatures` | List (Comma-sep) | e.g. `CCTV, Fire Safety System, Security Guard` |
| `suitableGoods` | List (Comma-sep) | e.g. `FMCG, Pharma, Chemicals` |
| `valueAddedServices` | List (Comma-sep) | e.g. `Pick & Pack, Kitting / Assembly, Labelling / Barcoding` |
| `pricingUnit` | String | `Per unit` \| `Per pallet` \| `Per CBM` \| `Per SKU` |
| `storageRate` | Number | Charge rate per pricing unit (numbers only) |
| `handlingFees` | Number | Loading/unloading fees (numbers only) |
| `minCommitment` | String | `No Minimum` \| `1 Month` \| `3 Months` \| `6 Months` |
| `shortTermStorage` | String | `Yes (1-3 months)` \| `Yes (3-6 months)` \| `No` |
| `description` | String | General text description of the warehouse facility |

---

### D. Operational Script Directory
The root `scripts/` directory contains node scripts used to modify or migrate dashboard sections:
- `rebuild_superadmin_dashboard.js`: Injects components (like bulk CSV upload, edit modals, and edit button hooks) programmatically into the superadmin page.
- `rebuild_admin_dashboard.js`: Synchronizes UI improvements made in Super Admin down to the standard Admin dashboard.
- `fix_edit_view.js` / `robust_fix_edit.js`: Automates patch edits across form layout nodes to fix alignment problems and broken buttons.
- **Usage:** Run scripts using node:
  ```bash
  node scripts/rebuild_superadmin_dashboard.js
  ```

---

## 8. Summary of Maintenance Guidelines
When taking over this project, keep the following rules in mind:
1. **Adding Countries:** Update [locale.js](file:///c:/Users/HP/WareHouse-Hub/src/lib/locale.js) with the country's configuration and then add the ISO code to the Firestore document `settings/countries` (array field: `enabled`).
2. **Changing Schema:** If you alter any core warehouse registration field, make sure to update:
   - The CSV column headers in [BulkWarehouseUpload.js](file:///c:/Users/HP/WareHouse-Hub/src/components/admin/BulkWarehouseUpload.js).
   - The multi-step form fields in [AddWarehouse.js](file:///c:/Users/HP/WareHouse-Hub/src/components/owner/AddWarehouse.js) and [DEAddWarehouse.js](file:///c:/Users/HP/WareHouse-Hub/src/components/dataentry/DEAddWarehouse.js).
3. **Firebase Rules Deployment:** Always execute `firebase deploy --only firestore:rules` or update the rules in the Firebase console when changing database permissions, and test the changes against `firestore.rules`.
