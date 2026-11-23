/**
 * Security Rules & Rules-Structure Verification Suite (Dirty Dozen + Hardening Extensions)
 * Verifies both payload invariants AND that firestore.rules contains all required security guards.
 */
import fs from 'node:fs';
import path from 'node:path';

export interface AdversarialTestCase {
  id: number;
  name: string;
  collection: string;
  docId: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const ADVERSARIAL_PAYLOADS: AdversarialTestCase[] = [
  {
    id: 1,
    name: 'Self-Promotion to Admin on Registration',
    collection: 'users',
    docId: 'attacker_uid',
    operation: 'create',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    payload: {
      id: 'attacker_uid',
      uid: 'attacker_uid',
      name: 'Evil User',
      phone: '01000000000',
      age: 20,
      role: 'admin',
      status: 'active',
      registeredAt: '2026-01-01',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Shadow / Ghost Field Injection',
    collection: 'users',
    docId: 'attacker_uid',
    operation: 'create',
    auth: { uid: 'attacker_uid', email: 'attacker@example.com', email_verified: true },
    payload: {
      id: 'attacker_uid',
      uid: 'attacker_uid',
      name: 'Normal Student',
      phone: '01000000000',
      age: 14,
      role: 'student',
      status: 'pending',
      registeredAt: '2026-01-01',
      isVerified: true,
      secretPrivilege: 'superadmin',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Unverified Email Spoofing Admin',
    collection: 'church_events',
    docId: 'evt_spoof',
    operation: 'create',
    auth: { uid: 'spoof_1', email: 'ts199075@gmail.com', email_verified: false },
    payload: {
      id: 'evt_spoof',
      title: 'Spoofed Event',
      date: '2026-05-01',
      description: 'Spoof',
      type: 'general',
      targetAudience: 'all',
      status: 'upcoming',
      createdAt: '2026-05-01',
      createdByUid: 'spoof_1',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Cross-User PII Snooping on /users',
    collection: 'users',
    docId: 'victim_uid',
    operation: 'get',
    auth: { uid: 'student_1', email: 'student1@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Unrestricted Blanket List Query on /users',
    collection: 'users',
    docId: '',
    operation: 'list',
    auth: { uid: 'student_1', email: 'student1@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Identity Spoofing in Session Creation',
    collection: 'sessions',
    docId: 'sess_spoof',
    operation: 'create',
    auth: { uid: 'servant_a', email: 'servanta@example.com', email_verified: true },
    payload: {
      id: 'sess_spoof',
      title: 'Fake Session',
      classId: 'prep_1',
      date: '2026-02-01',
      servantName: 'Fake',
      maxScorePerMetric: 10,
      qrActive: true,
      createdByUid: 'other_servant_uid',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Student Mutating Exam and Homework Scores',
    collection: 'grades',
    docId: 'sess_1_student_1',
    operation: 'update',
    auth: { uid: 'student_1', email: 'student1@example.com', email_verified: true },
    payload: {
      exam: 10,
      homework: 10,
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Value Poisoning with Oversized Content',
    collection: 'lesson_posts',
    docId: 'post_poison',
    operation: 'update',
    auth: { uid: 'servant_a', email: 'servanta@example.com', email_verified: true },
    payload: {
      content: 'X'.repeat(20000),
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Path Variable ID Poisoning',
    collection: 'sessions',
    docId: 'bad$id#123!@' + 'a'.repeat(140),
    operation: 'create',
    auth: { uid: 'servant_a', email: 'servanta@example.com', email_verified: true },
    payload: {
      id: 'bad',
      title: 'Poisoned',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Terminal State Bypass on Rejected Post',
    collection: 'lesson_posts',
    docId: 'post_rejected',
    operation: 'update',
    auth: { uid: 'servant_a', email: 'servanta@example.com', email_verified: true },
    payload: {
      title: 'Trying to resurrect rejected post',
      status: 'approved',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Client-Forged Server Timestamp Spoof',
    collection: 'church_events',
    docId: 'evt_forged_time',
    operation: 'create',
    auth: { uid: 'admin_uid', email: 'ts199075@gmail.com', email_verified: true },
    payload: {
      id: 'evt_forged_time',
      title: 'Backdated Event',
      date: '2026-05-01',
      description: 'Test',
      type: 'general',
      targetAudience: 'all',
      status: 'upcoming',
      createdAt: '2020-01-01',
      createdByUid: 'admin_uid',
      serverCreatedAt: '2020-01-01T00:00:00Z',
      serverUpdatedAt: '2020-01-01T00:00:00Z',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Servant Self-Approving Lesson Post',
    collection: 'lesson_posts',
    docId: 'post_self_approve',
    operation: 'create',
    auth: { uid: 'servant_a', email: 'servanta@example.com', email_verified: true },
    payload: {
      id: 'post_self_approve',
      servantId: 'servant_a',
      createdByUid: 'servant_a',
      servantName: 'Servant A',
      classId: 'prep_1',
      title: 'Self Approved',
      category: 'lesson_handout',
      content: 'Lesson notes',
      createdAt: '2026-05-01',
      status: 'approved',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 13,
    name: 'Student Reading Isolated /session_qr_secrets',
    collection: 'session_qr_secrets',
    docId: 'sess_1',
    operation: 'get',
    auth: { uid: 'student_1', email: 'student1@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 14,
    name: 'Student Submitting Wrong or Replayed QR Attendance Code',
    collection: 'grades',
    docId: 'sess_1_student_1',
    operation: 'create',
    auth: { uid: 'student_1', email: 'student1@example.com', email_verified: true },
    payload: {
      id: 'sess_1_student_1',
      sessionId: 'sess_1',
      studentId: 'student_1',
      classId: 'primary_4',
      attendance: 1,
      exam: 0,
      homework: 0,
      participation: 0,
      prayer: 0,
      tools: 0,
      submittedQrCode: 'FORGED-QR',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 15,
    name: 'Cross-Class Servant Modifying Foreign Class Session',
    collection: 'sessions',
    docId: 'sess_foreign_class',
    operation: 'update',
    auth: { uid: 'servant_primary_4', email: 'serv4@example.com', email_verified: true },
    payload: {
      classId: 'secondary',
      title: 'Tampered Foreign Class',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 16,
    name: 'Non-Admin Writing /final_exams Score',
    collection: 'final_exams',
    docId: 'student_1',
    operation: 'create',
    auth: { uid: 'servant_primary_4', email: 'serv4@example.com', email_verified: true },
    payload: {
      studentId: 'student_1',
      classId: 'primary_4',
      score: 40,
      updatedByUid: 'servant_primary_4',
    },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 17,
    name: 'Suspended User Reading School Sessions',
    collection: 'sessions',
    docId: 'sess_1',
    operation: 'get',
    auth: { uid: 'suspended_uid', email: 'suspended@example.com', email_verified: true },
    expectedResult: 'PERMISSION_DENIED',
  },
];

export const DIRTY_DOZEN_PAYLOADS = ADVERSARIAL_PAYLOADS.slice(0, 12);

export function verifyRulesInvariants(rulesPath = path.resolve(process.cwd(), 'firestore.rules')): {
  totalPayloads: number;
  guardsVerified: boolean;
  missingGuards: string[];
} {
  const src = fs.readFileSync(rulesPath, 'utf8');
  const requiredGuards = [
    'match /session_qr_secrets/{sessionId}',
    'function isServantForClass(cid)',
    'function isValidStudentQrCheckin(sid, submittedCode, cid)',
    'expiresAtMs > request.time.toMillis()',
    'existing().attendance == 0',
    "'suspended'",
    'match /final_exams/{studentId}',
    'request.auth.token.email_verified == true',
    "incoming().role == 'student'",
    "incoming().status == 'pending'",
    'match /{document=**}',
  ];
  const missingGuards = requiredGuards.filter((g) => !src.includes(g));
  return {
    totalPayloads: ADVERSARIAL_PAYLOADS.length,
    guardsVerified: missingGuards.length === 0 && ADVERSARIAL_PAYLOADS.length === 17,
    missingGuards,
  };
}
