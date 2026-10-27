# Connecting the Mobile App to the Backend

What the Flutter user app (for example `Pansit10/CampusSafe_User`, which currently uses mock data) must write and read so it works with the dashboard and the Cloud Functions. Field-level details are in [data-model.md](data-model.md); access rules are in [`firestore.rules`](../firestore.rules).

## 1. Register and sign in
- Firebase Auth email/password.
- After sign-up, create `users/{uid}` with `name`, `studentId`, `email` (must equal the Auth email), `mobileNo`, `role: "student"` and `createdAt: FieldValue.serverTimestamp()`. Any other role is rejected by the rules.
- Read the role from the ID token claim `role` (missing means student). When `users/{uid}.roleUpdatedAt` changes, call `getIdToken(true)` to pick up a new role.

## 2. Report an incident or SOS
1. Compress each photo to **≤ 1 MB** (max 3) and upload it to Storage at `incidents/{uid}/{incidentId}/{fileName}`. Generate `incidentId` first with `FirebaseFirestore.instance.collection('incidents').doc().id`.
2. Write `incidents/{incidentId}` with **only** these fields:

| Field | Value |
|---|---|
| `reporterId` | current uid |
| `typeId` | an id from `incidentTypes` (show only `active == true`) |
| `description` | text, ≤ 2000 chars (may be empty for SOS) |
| `photoUrls` | download URLs from step 1 |
| `isSOS` | `true` for the SOS button |
| `location` | `{lat, lng, accuracy}` from the GPS (accuracy in meters) |
| `locationTagId` | the scanned QR tag id, or `null` |
| `status` | `"Pending"` |
| `clientCreatedAt` | the phone's time when the user submitted (`Timestamp.now()`) |
| `createdAt` | `FieldValue.serverTimestamp()` |

The rules reject `priority`, `assignedResponderId` and any other status. The `onIncidentCreated` function adds `priority` within a second or two.

**SOS (≤ 2 taps):** the same write with `isSOS: true`, `typeId: "other"`, an empty description and the current GPS.

## 3. Status names
The backend uses exactly **`Pending` → `Responding` → `Resolved`** (the panel's required workflow). The current mock app shows "Under Review"; map it to `Pending` (or display "Under review" for `Pending` only in the UI).

## 4. My reports, chat and alerts
- My reports: `incidents` where `reporterId == uid` ordered by `createdAt` desc (the index exists). Listen with `snapshots()` for live status.
- Chat: `incidents/{id}/messages` ordered by `sentAt`; send `{senderId: uid, text, sentAt: serverTimestamp()}`.
- Alerts: `alerts` ordered by `sentAt` desc.
- Call Security: read `config/app.securityHotline` and launch `tel:`.

## 5. QR location tags
Printed QR codes contain `campussafe://location/<tagId>`. After scanning, check that `locationTags/<tagId>` exists, show its `name`, and save the id as `locationTagId`.

## 6. Push notifications (FCM)
- Save the device token to `users/{uid}.fcmToken`.
- Subscribe students to the topic `all-users`, responders to `all-users` and `responders`.
- Messages include `data.incidentId` or `data.alertId`, so tapping a notification can open the right screen.

## 7. Responder mode
For `role == "responder"`: list `incidents` where `assignedResponderId == uid`. To update, write only `status` (`Responding` or `Resolved`), the matching `respondingAt` / `resolvedAt` (server timestamp) and `updatedBy: uid`.

## 8. Offline queue
Firestore caches text writes offline, but Storage uploads need a connection. Keep unsent reports (with local photo paths and the original `clientCreatedAt`) in local storage and submit them in the order above once online.
