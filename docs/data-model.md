# Data Model

Cloud Firestore collections, based on the ERD (Fig. 7). The TypeScript copy of these types is in [`web/src/lib/types.ts`](../web/src/lib/types.ts), and the access rules are in [`firestore.rules`](../firestore.rules).

## Roles

Roles are stored as a Firebase Auth **custom claim** (`role`), which Security Rules trust. They are set only by the `setUserRole` Cloud Function, so nobody can make themselves an admin. `users/{uid}.role` is a copy for display.

| Role | App | Can |
|---|---|---|
| `student` (default) | Mobile | Report incidents, SOS, chat on own reports, receive alerts |
| `responder` | Mobile | View and update the status of incidents assigned to them |
| `admin` | Web dashboard | Everything: manage incidents, broadcast alerts, users, incident types, location tags |

## Collections

### `users/{uid}`
| Field | Type | Notes |
|---|---|---|
| name | string | |
| studentId | string? | Students only |
| email | string | Must match the Auth email |
| mobileNo | string | `09XXXXXXXXX`, used by the dashboard's call button (FR17) |
| role | `student` \| `responder` \| `admin` | Created as `student`; changed only by `setUserRole` |
| fcmToken | string? | Push notification token (sprint 3) |
| createdAt | timestamp | Server time |
| roleUpdatedAt | timestamp? | Set by `setUserRole`; apps refresh their token when it changes |

### `incidentTypes/{id}` (admin-managed, FR21)
| Field | Type | Notes |
|---|---|---|
| name | string | e.g. "Medical Emergency" |
| defaultPriority | `High` \| `Medium` \| `Low` | Starting priority for this type |
| keywords | string[] | A match in the description raises the report to High |
| active | bool | Inactive types are hidden from the report form |

### `locationTags/{id}` (admin-managed, FR05)
| Field | Type | Notes |
|---|---|---|
| name | string | e.g. "Library, Ground Floor" |
| building, floor | string | |
| lat, lng | number | Encoded in the printed QR code |

### `incidents/{id}`
| Field | Type | Set by |
|---|---|---|
| reporterId | string (uid) | Reporter |
| typeId | string | Reporter |
| description | string (≤ 2000) | Reporter |
| photoUrls | string[] (≤ 3) | Reporter, files in Storage `incidents/{uid}/{incidentId}/` (≤ 1 MB each) |
| isSOS | bool | Reporter |
| location | `{lat, lng, accuracy}` | Reporter (GPS) |
| locationTagId | string? | Reporter (QR scan) |
| status | `Pending` → `Responding` → `Resolved` | Created as `Pending`; then admin or assigned responder |
| priority | `High` \| `Medium` \| `Low` | Cloud Function (rule-based tagging); the admin can override it |
| priorityConfirmed | bool | Admin |
| assignedResponderId | string? | Admin |
| escalated | bool | Cloud Function (High, not acknowledged after 2 min) |
| clientCreatedAt | timestamp | Phone time when the report was made (kept for offline reports) |
| createdAt | timestamp | Server time when the report reached Firestore |
| acknowledgedAt, respondingAt, resolvedAt | timestamp? | Admin / responder, used for the response-time measurements |

Subcollections:
- `incidents/{id}/messages/{id}`: `senderId`, `text`, `sentAt`. Chat between the reporter, the assigned responder and admins (FR17).
- `incidents/{id}/activityLogs/{id}`: `actorId`, `action`, `from`, `to`, `at`. Written only by Cloud Functions; readable by admins.

### `alerts/{id}` (broadcast alerts)
`title`, `body`, `severity` (`Info` \| `Warning` \| `Emergency`), `sentBy`, `sentAt`. Only admins create them; all signed-in users can read them.

### `config/app`
`securityHotline` (number dialed by the app's Call Security button, FR12), `escalationMinutes` (default 2).

### `metrics/{id}`
`kind`, `value`, `refId`, `uid`, `recordedAt`. Timing measurements for the evaluation (Section 5.5). Any user can write their own; only admins can read them.
