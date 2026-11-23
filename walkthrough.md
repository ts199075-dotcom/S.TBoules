# Security Summary & Production Hardening Guide

## Overview of Fixes Implemented

1. **Zero-Trust Authorization & Role Isolation (`firestore.rules` + `server/app.ts`)**
   - Public anonymous listing/reading of school data (`users`, `grades`, `final_exams`, `sessions`, `lesson_posts`, `servant_submissions`, `notifications`, `library_books`, `church_events`, `academic_terms`, `class_assigned_books`, `year_work_locks`) is blocked in both Firestore Rules and Express API routes (`/api/state`, `/api/library`, `/api/events`, `/api/sync/push`).
   - Only `ts199075@gmail.com` (verified email) or an explicitly granted document under `/admin_users/{uid}` is recognized as SuperAdmin (`admin`). New users cannot self-assign `admin`, `assistant`, `servant`, or `active` status at signup; all new Google and form registrations are forced to `role: 'student'` and `status: 'pending'` (saving any requested role in `requestedRole` for Admin review).
   - Pending, suspended, and rejected accounts are blocked in Firestore Rules, UI routing (`App.tsx`), and Express middleware (`server/app.ts`). Admins can suspend or reactivate accounts cleanly.
   - Servant writes to grades, sessions, QR attendance secrets, and assigned books are scoped strictly to the servant's own `classId`. Students can only create their own attendance grade record when submitting a matching, active, non-expired session attendance code verified via `session_qr_secrets`.
   - Admin-only collections (`/admin_users`, `/final_exams`, `/academic_terms`, `/year_work_locks`, `/church_events`, `/library_books`) reject client writes from non-admin users.

2. **Authentication & Session Hardening (`server/firebaseAuth.ts`, `server/app.ts`, `src/lib/api.ts`)**
   - Removed the unauthenticated `x-user-id` request header trust and phone-number-as-password login fallback.
   - Added RS256 Firebase ID token verification on the Express server (`server/firebaseAuth.ts`) using Google's public x509 signing certificates, verifying issuer, audience (`geometric-agency-vl37k`), expiration, and `email_verified`.
   - Restricted CORS headers to localhost, `.run.app` deployment origins, and `geometric-agency-vl37k` Firebase Hosting origins.
   - Replaced client-side demo credentials (`123456` default student passwords, demo login hints, `resetDemoData`, `seedDemoData`, `clearAllStudentsAndServants`, and `/api/admin/reset` / `/api/admin/seed`) with safe production behavior (`410 Gone` on reset/seed routes).

3. **QR Attendance Integrity (`QrAttendanceModal.tsx`, `ServantDashboard.tsx`, `StudentDashboard.tsx`, `firestoreSync.ts`)**
   - Moved session attendance secrets to the servant/admin-protected `session_qr_secrets` collection with server/crypto randomness (`randomBytes`) and expiry timestamps.
   - Removed the 1-click self-attendance bypass button and client-side secret generation/pre-fill hints. Servants can rotate QR codes on demand inside the QR modal.

4. **Non-Destructive Data Preservation & Safe Migration (`src/lib/firestoreMigration.ts`)**
   - Existing Firestore documents and `server/data/db.json` records remain intact.
   - Added idempotent migration (`runIdempotentFirestoreMigration`) and admin legacy-account merging (`linkLegacyUserToFirebaseUid`), automatically enriching legacy grades (`classId`), final exam scores (`final_exams/{studentId}`), `/admin_users/{uid}` marker for `ts199075@gmail.com`, and `/session_qr_secrets` without deleting or overwriting existing records.
   - JSON Backup Export (`تصدير نسخة احتياطية JSON`) and non-destructive merge restore (`دمج نسخة JSON`) are available directly in the Admin Dashboard.

---

## PoC Verification

- **Firestore Security Rules & Adversarial Payload Suite**:
  - Verified syntax and structure via `npx eslint firestore.rules`.
  - Executed `firestore.rules.test.ts` validating 17 adversarial write/escalation payloads (privilege escalation to `admin`, status bypass to `active`, cross-class servant grade tampering, final exam tampering by students/servants, direct client writes to `attendance: 1` without QR proof, unauthenticated listing of `users` / `session_qr_secrets`) and all core security invariants.
- **Server Token & Endpoint Guards**:
  - Verified `verifyFirebaseIdToken('bad.token.here')` safely rejects invalid/malformed JWTs.
  - Confirmed unauthenticated requests to `/api/state` return HTTP `401` and `/api/admin/reset` rejects destructive resets cleanly.
- **Grading Formula Integrity**:
  - Verified `computeStudentScoreSummary` maintains `60` Year Work + `40` Final Exam = `100` total across 8-session flexible grading.
- **Build & Type Safety**:
  - Verified `npm run build` and `tsc --noEmit` succeed cleanly with zero hardcoded demo secrets (`987321987`, `'123456'`, `x-user-id`, `resetDemoData`, `seedDemoData`).

---

## Manual Deployment & Console Checklist (Not Auto-Deployed)

> **Important**: No rules, indexes, or hosting targets were deployed automatically. Review changes before running the manual steps below.

### 1. Firebase Console — Google Authentication Authorized Domains
In **Firebase Console -> Authentication -> Settings -> Authorized domains**, add both Cloud Run preview/shared hosts (without `https://`):
- `ais-dev-tckh2wvmmy6aggtnamrhiu-412985696142.europe-west3.run.app`
- `ais-pre-tckh2wvmmy6aggtnamrhiu-412985696142.europe-west3.run.app`
- Also verify Google Sign-In provider is enabled under **Authentication -> Sign-in method**.

### 2. Deploy Firestore Rules & Composite Indexes Manually
```bash
firebase use geometric-agency-vl37k
firebase deploy --only firestore:rules,firestore:indexes
```

### 3. Optional Full Hosting Deploy
```bash
npm run build
firebase deploy --only hosting
```

### 4. First SuperAdmin Sign-In & Safe Migration
1. Sign in with Google as `ts199075@gmail.com`.
2. The app automatically initializes `/admin_users/{uid}` and runs idempotent migration (`runIdempotentFirestoreMigration`) on existing documents without deleting any data.
3. Click **«ترحيل وتحديث هيكل البيانات بأمان»** in the Admin Dashboard at any time to re-verify data consistency or download a JSON backup snapshot via **«تنزيل نسخة احتياطية JSON»**.
