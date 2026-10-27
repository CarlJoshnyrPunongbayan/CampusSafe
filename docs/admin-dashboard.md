# Admin Web Dashboard and Backend

The security office's web dashboard (`web/`) and the Firebase backend (`functions/`, `firestore.rules`) built from the revision matrix (CCMS-IT-WMA-2026-006). The look follows the CampusSafe mobile app (`Pansit10/CampusSafe_User`): the same color tokens from `app_colors.dart`, 16 px bordered cards, 13 px rounded controls, tinted status chips and the shield logo tile.

## Pages

| Page | What it does | Paper requirement |
|---|---|---|
| **Login** | Admin-only sign in, remember me, password reset | Role-based access (Section 4.1.2) |
| **Overview** | Live KPIs (pending, responding, resolved today, avg. time to acknowledge), escalation banner, the "needs attention" queue, recent alerts | Centralized security dashboard (Significance, item 10) |
| **Incident Queue** | Real-time list of reports; tabs Active / Pending / Responding / Escalated / Resolved / All; search; priority and type filters. Order: escalated, then unhandled, then priority, then longest waiting | Workflow step 3, dashboard notified (item 8) |
| **Incident details** | Description, photos, map with GPS accuracy and QR tag, **Acknowledge**, confirm or override priority, **assign responder**, **Pending → Responding → Resolved**, reopen, reporter card with **Call** button, chat, response-time timeline, activity log | Workflow steps 4–7 (item 8); call (item 52); chat (item 53) |
| **Broadcast Alerts** | Compose Info / Warning / Emergency alerts with templates, confirmation step, sent history | Emergency alert broadcasting (Section 2.2) |
| **Analytics** | Reports per day, by type, by priority, by location; avg. time to acknowledge and resolve; % of High reports acknowledged on time; measured report-to-dashboard time; **CSV export** | Response-time tracking, data-driven decisions (items 5, 10); Table XII measurements |
| **Users** | Search and filter all accounts; change role student / responder / admin through the `setUserRole` Cloud Function | User management with roles (item 54) |
| **Incident Types** | Add and edit types, default priority, keywords that raise to High, hide or show in app | Incident type management (item 51); rule-based priority tagging (items 1, 9) |
| **Location Tags** | Add and edit campus locations, live QR preview, printable QR sheet | QR-based campus location tagging (item 9) |
| **Settings** | Security hotline dialed by the app; escalation minutes | Call feature (item 52); escalation rule (Table XI) |

Live behavior on every page: a new **High-priority or SOS** report or an **escalation** plays an alert tone and shows a red toast linking to the incident. The sidebar shows the pending count, and the top bar shows escalated and high-priority counts.

## Backend (Cloud Functions)

| Function | Trigger | What it does |
|---|---|---|
| `onIncidentCreated` | New `incidents/{id}` | **Rule-based priority tagging** (SOS → High; type keyword in description → High; else the type's default), sets `priorityReason`, starts the activity log, notifies the `security-office` topic |
| `onIncidentUpdated` | Incident changed | Logs acknowledge, priority, assignment, status and escalation changes with the actor (`updatedBy`); notifies the reporter of status changes and the responder of assignments |
| `escalateUnacknowledged` | Every minute | High + Pending + not acknowledged after `config/app.escalationMinutes` (default 2) → `escalated: true`, notifies the security office |
| `onAlertCreated` | New `alerts/{id}` | Push notification to the `all-users` topic |
| `setUserRole` | Callable (admin only) | Sets the role custom claim and `users/{uid}.role` |

Push notifications use **FCM topics**: `all-users`, `responders`, `security-office`. In the emulator they are logged instead of sent.

## Measurements for the evaluation (Table XII)

- **Report → dashboard display time:** recorded automatically by the dashboard in `metrics` (`kind: dashboard_display_ms`) whenever a new report appears. Analytics shows the average, the % within 5 s and the number of trials. The value compares the server timestamp to the officer's computer clock, so keep that computer's time synced (Windows: Settings → Time → Sync now).
- **Time to acknowledge / respond / resolve:** from `createdAt`, `acknowledgedAt`, `respondingAt`, `resolvedAt`. Use **Export CSV** on Analytics to compute the statistics for Chapter 4.
- **Priority tagging accuracy (≥ 80% agreement):** compare `priorityReason` and the system's priority with the officer's confirmed priority (activity log `priority_confirmed` / `priority_changed`).

## Running it

```bash
npm run emulators            # terminal 1
npm run seed -- --demo       # terminal 2: reference data, test accounts and demo incidents
npm --prefix web run dev     # terminal 3: http://localhost:5173 (admin@campussafe.test / Admin123!)
```

The demo data (`--demo`, emulator only) adds 12 students, 3 responders, about 60 incidents over 30 days with realistic response times, chat messages, alerts and measurement data, so every page has content for presentations.

Optional: set `VITE_GOOGLE_MAPS_API_KEY` in `web/.env.local` to show the live Google Map on incident pages. Without it, the page shows the coordinates and an "Open in Google Maps" link.
