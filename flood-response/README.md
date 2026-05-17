# Community Beacon App
A mobile-first React web application for two-way flood alert and community response coordination. Residents receive SMS/voice alerts, reply with their status and needs, and those reports appear as live markers on a public map so neighbors and emergency responders can coordinate.

[**Website Link**](https://urban-lamp-9qjr69xg9qrc9xw-5173.app.github.dev/)

[**Code Link**](https://vscode.dev/editor/liveshare/A928943E1B388836E43A6F34093E0FEF08C8)
### *Disaster Response & Resilience Track -- Hackathon 2026*
A text- and call- based two-way communication system designed to keep communitites connected during natural disasters, even in low-signal environments.

### Overview
Community Beacon is a mobile-first disaster communication platform that empowers residents to receive alerts, report emergencies, and request help through SMS, calls, or app-based interaction. It is designed to be inclusive, supporting smartphone users, dumbphone users, and landline users alike.

By relying on text and voice, the system remains functional even when WiFi and data networks fail.

### Core Problem 
During natural disasters, communication networks fail, leaving vulnerable populations without access to help. Existing systems often rely on:
- Internet connectivity
- Smartphone ownership
- Centralized reporting
Community Beacon solves this by enabling distributed, low-bandwidth, two-way communication that feeds into a shared community map.

### Key Features
- **Two-Way Communication**
  Users can reply to alerts with their status. Their response becomes a ticket on the community map.

- **SMS + Call Support**
  Ensuring accessibility in low-signal areas.

- **Advance Notice Alerts**
  Integrates NOAA data to push early warnings.

- **Community Map**
  Displays active emergenies, volunteer responses, and resolved cases.

- **Emergency Guidance Page**
  Offline-friendly instructions for what to do in various disaster scenarios.

- **Opt-in / Opt-out System**
  Users control their participation.

### Ticket System
Each user report becomes a ticket with:
- **Location**
    - Smartphone users: GPS
    - Dumbphone users: text-based location
    - Landline users: call-based AI agent
      
- **Status**
    - Active
    - Pending (volunteer en route)
    - Resolved

- **Emergency Classification**
    - Medical
    - Hazards/Obstructions
    - Food/Water
    - Transportation
    - Other

### How It Works
1. Disaster alert arrives from NOAA
2. Users receive SMS or call with the alert
3. Users may post their status which becomes a ticket
4. Ticket appears on the community map
5. Volunteers can mark tickets as pending and provide help
6. Users confirm when the issue is resolved

---

## Quick start

```bash
# 1. Install Node.js (>= 20) — project uses nvm
nvm install --lts && nvm use --lts

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local
# Edit .env.local — leave VITE_API_BASE_URL blank to use MSW mocks

# 4. Start the dev server (MSW intercepts all API calls automatically)
npm run dev
```

Open https://urban-lamp-9qjr69xg9qrc9xw-5173.app.github.dev/

---

## Tech stack

| Layer | Choice |
|---|---|
| Bundler | Vite 8 |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 (@tailwindcss/vite) |
| Routing | React Router v7 (browser router) |
| Server state | TanStack Query v5 |
| Map | React-Leaflet + OpenStreetMap tiles |
| API mocks | MSW v2 (Mock Service Worker) |

---

## Project structure

```
src/
  api/
    browser.ts        MSW worker bootstrap
    client.ts         Typed fetch wrappers for every endpoint
    handlers.ts       MSW request handlers with in-memory seed data
  components/
    AppShell.tsx      Top nav + layout wrapper
    ClassificationBadge.tsx
    Map.tsx           Full-screen Leaflet map with filter bar + detail panel
    OptInForm.tsx
    StatusFilter.tsx
    TicketCard.tsx
    TicketMarker.tsx
  data/
    guidance.json     Static flood guidance content (edit without code changes)
    seedTickets.json  18 realistic Houston-area seed tickets
  hooks/
    useGeolocation.ts
    useSubscription.ts
    useTickets.ts
  lib/
    classificationColors.ts   Color/label maps for classification + status
    geo.ts                    Haversine distance, bbox parsing, proximity cluster
  pages/
    AdminPage.tsx     Moderator queue (stub -- no auth gate yet)
    GuidancePage.tsx  Before/during/after flood guidance
    MapPage.tsx       Home page
    OptInPage.tsx     Sign up / opt out for alerts
    ReportPage.tsx    Web form mirroring the SMS reply flow
  types/
    index.ts          All shared TypeScript types
  App.tsx
  main.tsx            MSW bootstrap -> React render
  router.tsx          createBrowserRouter with lazy-loaded pages
```

---

## Pages and routes

| Route | Page | Status |
|---|---|---|
| / | Map -- live ticket markers | Wired to MSW seed data |
| /report | Submit a report (web form) | POSTs to MSW |
| /guidance | Flood guidance content | Reads guidance.json |
| /alerts | Opt-in / opt-out | POSTs to MSW |
| /admin | Moderator queue | Stub -- no auth |

---

## Backend API contract

The frontend calls a REST API at VITE_API_BASE_URL/api/...
All endpoints are fully mocked by MSW during local development.
See BACKEND_SPEC.md for the complete FastAPI service specification.

Endpoint summary:
  GET    /api/tickets?status=&bbox=        List tickets (filterable)
  GET    /api/tickets/:id                  Single ticket
  POST   /api/tickets                      Create ticket
  POST   /api/tickets/:id/flag             Increment flag count
  POST   /api/tickets/:id/resolve          Mark resolved
  POST   /api/subscriptions                Create alert subscription
  DELETE /api/subscriptions/:id            Remove subscription

bbox format: minLng,minLat,maxLng,maxLat

---

## Stubbed features (TODOs in code)

- Rate limiting per phone hash         src/api/handlers.ts
- Duplicate-location clustering        src/lib/geo.ts (clusterByProximity ready)
- Flag threshold auto-hide             src/api/handlers.ts (FLAG_THRESHOLD stub)
- Moderator auth gate                  src/pages/AdminPage.tsx
- Approve action                       src/pages/AdminPage.tsx (button disabled)
- Language toggle                      src/types/index.ts (Locale type defined)
- Opt-out by phone hash                src/pages/OptInPage.tsx

---

## Accessibility

- WCAG AA color contrast on all badges
- aria-label on every Leaflet marker and interactive button
- Keyboard navigation on map filter controls (aria-pressed toggles)
- Skip-to-content link in AppShell.tsx
- role="alert" on all error and success feedback regions
- Language toggle scaffolded (English only for now)

---

## Environment variables

See .env.example for the full list.

| Variable | Required | Purpose |
|---|---|---|
| VITE_API_BASE_URL | No (defaults to /api) | FastAPI service base URL |
| VITE_GOOGLE_MAPS_API_KEY | No (not called yet) | Geocoding |
| VITE_MAPBOX_TOKEN | No | Alternative tile provider |

---

## License

MIT
