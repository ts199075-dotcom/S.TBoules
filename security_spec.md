# Security Specification: مدرسة القديس بولس للكتاب المقدس (Saint Paul's Bible School)

## 1. Data Invariants

1. **Identity & Authentication Invariant**:
   - Every protected write requires `request.auth != null` and `request.auth.token.email_verified == true`.
   - Bootstrapped administrator identity (`ts199075@gmail.com`) is only honored when `request.auth.token.email_verified == true`, alongside explicit `/admins/{uid}` markers.
   - All document creation payloads carrying an owner/creator UID (`uid`, `createdByUid`, `updatedByUid`) MUST strictly equal `request.auth.uid`.
2. **PII Isolation & Secret Separation**:
   - Sensitive PII (`phone`, `email`, `guardianPhone`, `confessionFather`, `address`) lives exclusively in `/users/{userId}` and is strictly restricted to `isOwner(userId)` or `isAdmin()`.
   - Non-PII roster attributes (`id`, `uid`, `name`, `role`, `status`, `classId`, `age`, `registeredAt`) are mirrored to `/public_profiles/{userId}`.
   - Session QR attendance secrets live exclusively in `/session_qr_secrets/{sessionId}`, strictly readable and writable ONLY by verified Admins, Assistants, and the owning Class Servant (`isServantForClass(classId)`). Students CANNOT read `/session_qr_secrets`.
3. **Class-Scoped RBAC & Master Gate**:
   - Pending, rejected, and suspended accounts (`status != 'active'`) are barred from reading or writing all operational school collections (`isActiveMember()` Master Gate).
   - Servants (`role == 'servant'`) are strictly scoped to their assigned `classId` across `/sessions`, `/session_qr_secrets`, `/grades`, `/final_exams` (read-only), `/class_assigned_books`, and `/lesson_posts`.
   - Final exam scores (`/final_exams/{studentId}`) are strictly Admin-only for writes.
4. **QR Anti-Replay & Expiry Validation**:
   - Student self-attendance on `/grades/{gradeId}` MUST supply `submittedQrCode` matching `/session_qr_secrets/{sessionId}.qrSecretCode`, while `qrActive == true`, `expiresAtMs > request.time.toMillis()`, class membership matches, and existing attendance is `0` (cannot overwrite/replay or tamper with `exam`/`homework`/`participation`/`prayer`/`tools`).
5. **Strict Schema, Boundary Limits & Temporal Integrity**:
   - Every entity validation helper checks `hasAll([...])`, `hasOnly([...])`, string lengths, numeric ranges, enum allow-lists, and path ID validation (`isValidId`).
   - `serverCreatedAt` on create and `serverUpdatedAt` on create/update must equal `request.time`.

---

## 2. Adversarial Verification Payloads (Dirty Dozen + Hardening Extensions)

1. **Attack 1 — Self-Promotion to Admin on Registration** (`/users/attacker_uid`): `PERMISSION_DENIED`.
2. **Attack 2 — Shadow / Ghost Field Injection** (`/users/attacker_uid`): `PERMISSION_DENIED`.
3. **Attack 3 — Unverified Email Spoofing Admin Email** (`/church_events/evt_spoof`): `PERMISSION_DENIED`.
4. **Attack 4 — PII Snooping on Another Student** (`GET /users/victim_uid`): `PERMISSION_DENIED`.
5. **Attack 5 — Blanket List Scraping of `/users`**: `PERMISSION_DENIED`.
6. **Attack 6 — Identity Spoofing in Session Creation**: `PERMISSION_DENIED`.
7. **Attack 7 — Student Tampering With Own Exam/Homework Grade**: `PERMISSION_DENIED`.
8. **Attack 8 — Value Poisoning / Oversized String Exhaustion**: `PERMISSION_DENIED`.
9. **Attack 9 — Path Variable ID Poisoning**: `PERMISSION_DENIED`.
10. **Attack 10 — Terminal State Bypass on Rejected Post / Suspended User**: `PERMISSION_DENIED`.
11. **Attack 11 — Client-Forged Timestamp Manipulation**: `PERMISSION_DENIED`.
12. **Attack 12 — Servant Self-Approving Lesson Post**: `PERMISSION_DENIED`.
13. **Attack 13 — Student Reading Isolated `/session_qr_secrets/{sessionId}`**: `PERMISSION_DENIED`.
14. **Attack 14 — QR Anti-Replay / Wrong or Expired QR Code Check-in**: `PERMISSION_DENIED`.
15. **Attack 15 — Cross-Class Servant Tampering on Foreign Class Session/Grade**: `PERMISSION_DENIED`.
16. **Attack 16 — Non-Admin Writing `/final_exams/{studentId}`**: `PERMISSION_DENIED`.
17. **Attack 17 — Suspended User Accessing School Collections**: `PERMISSION_DENIED`.
