/**
 * REAL Firestore Emulator Security Rules Integration Test Suite
 *
 * Targets the project ID and named database ID from firebase-applet-config.json
 * strictly inside the local Firebase Firestore Emulator (never production).
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
} from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { initializeApp, deleteApp, type FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  connectFirestoreEmulator,
  terminate,
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
  type Firestore,
  type EmulatorMockTokenOptions,
} from 'firebase/firestore';

const appletConfig = JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), 'firebase-applet-config.json'), 'utf8')
) as {
  projectId: string;
  firestoreDatabaseId: string;
};

const PROJECT_ID = appletConfig.projectId;
const DATABASE_ID = appletConfig.firestoreDatabaseId;
const RULES_PATH = path.resolve(process.cwd(), 'firestore.rules');
const ADMIN_EMAIL = 'ts199075@gmail.com';

function resolveLocalEmulatorHostPort(): { host: string; port: number } {
  const raw = process.env.FIRESTORE_EMULATOR_HOST;
  if (!raw) {
    throw new Error(
      'FIRESTORE_EMULATOR_HOST is not set. Run via `npm run test:rules` (firebase emulators:exec --only firestore) to prevent connecting to production.'
    );
  }
  const parsed = new URL(`http://${raw}`);
  const host = parsed.hostname;
  const port = Number(parsed.port || '8080');
  if (host !== '127.0.0.1' && host !== 'localhost' && host !== '::1') {
    throw new Error(`Refusing non-local FIRESTORE_EMULATOR_HOST=${raw}`);
  }
  return { host, port };
}

let testEnv: RulesTestEnvironment;
let emulatorHost = '127.0.0.1';
let emulatorPort = 8180;
const openClients: Array<{ app: FirebaseApp; db: Firestore }> = [];

function createNamedDbClient(mockUserToken?: EmulatorMockTokenOptions | string): Firestore {
  const app = initializeApp(
    { projectId: PROJECT_ID },
    `rules-test-${Date.now()}-${Math.random().toString(36).slice(2)}`
  );
  const db = getFirestore(app, DATABASE_ID);
  if (mockUserToken !== undefined) {
    connectFirestoreEmulator(db, emulatorHost, emulatorPort, { mockUserToken });
  } else {
    connectFirestoreEmulator(db, emulatorHost, emulatorPort);
  }
  openClients.push({ app, db });
  return db;
}

function unauthenticatedDb(): Firestore {
  return createNamedDbClient(undefined);
}

function authDb(uid: string, tokenOptions: Partial<EmulatorMockTokenOptions> = {}): Firestore {
  return createNamedDbClient({
    sub: uid,
    user_id: uid,
    ...tokenOptions,
  } as EmulatorMockTokenOptions);
}

async function cleanupOpenClients(): Promise<void> {
  const toClose = openClients.splice(0, openClients.length);
  await Promise.all(
    toClose.map(async ({ app, db }) => {
      try {
        await terminate(db);
      } catch {
        /* ignore */
      }
      try {
        await deleteApp(app);
      } catch {
        /* ignore */
      }
    })
  );
}

async function clearNamedDatabase(): Promise<void> {
  const resp = await fetch(
    `http://${emulatorHost}:${emulatorPort}/emulator/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}/documents`,
    { method: 'DELETE' }
  );
  if (!resp.ok) {
    throw new Error(`Failed clearing named emulator database (${resp.status}): ${await resp.text()}`);
  }
}

async function seedWithRulesDisabled(fn: (db: Firestore) => Promise<void>): Promise<void> {
  await testEnv.withSecurityRulesDisabled(async () => {
    const app = initializeApp(
      { projectId: PROJECT_ID },
      `seed-owner-${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    const db = getFirestore(app, DATABASE_ID);
    connectFirestoreEmulator(db, emulatorHost, emulatorPort, {
      mockUserToken: 'owner',
    });
    try {
      await fn(db);
    } finally {
      await terminate(db).catch(() => undefined);
      await deleteApp(app).catch(() => undefined);
    }
  });
}

async function seedBaselineSchoolData(): Promise<void> {
  const now = Timestamp.now();
  const futureExpiry = Date.now() + 3 * 60 * 60 * 1000;
  const pastExpiry = Date.now() - 60 * 1000;

  await seedWithRulesDisabled(async (db) => {
    // Health check doc
    await setDoc(doc(db, 'test', 'connection'), { ok: true });

    // Users & Public Profiles
    const users = [
      {
        id: 'admin_uid',
        uid: 'admin_uid',
        name: 'Super Admin',
        email: ADMIN_EMAIL,
        phone: '01000000001',
        age: 35,
        role: 'admin',
        status: 'active',
        registeredAt: '2026-01-01',
      },
      {
        id: 'assistant_uid',
        uid: 'assistant_uid',
        name: 'Assistant Servant',
        email: 'assistant@example.com',
        phone: '01000000002',
        age: 28,
        role: 'assistant',
        status: 'active',
        registeredAt: '2026-01-01',
      },
      {
        id: 'servant_p4',
        uid: 'servant_p4',
        name: 'Servant Primary 4',
        email: 'serv4@example.com',
        phone: '01000000003',
        age: 24,
        role: 'servant',
        status: 'active',
        classId: 'primary_4',
        registeredAt: '2026-01-01',
      },
      {
        id: 'servant_sec',
        uid: 'servant_sec',
        name: 'Servant Secondary',
        email: 'servsec@example.com',
        phone: '01000000004',
        age: 26,
        role: 'servant',
        status: 'active',
        classId: 'secondary',
        registeredAt: '2026-01-01',
      },
      {
        id: 'student_1',
        uid: 'student_1',
        name: 'Student One',
        email: 'student1@example.com',
        phone: '01000000005',
        age: 10,
        role: 'student',
        status: 'active',
        classId: 'primary_4',
        guardianPhone: '01200000005',
        confessionFather: 'Abouna Marcos',
        registeredAt: '2026-01-01',
      },
      {
        id: 'student_2',
        uid: 'student_2',
        name: 'Student Two',
        email: 'student2@example.com',
        phone: '01000000006',
        age: 10,
        role: 'student',
        status: 'active',
        classId: 'primary_4',
        registeredAt: '2026-01-01',
      },
      {
        id: 'student_sec',
        uid: 'student_sec',
        name: 'Student Secondary',
        email: 'studentsec@example.com',
        phone: '01000000007',
        age: 16,
        role: 'student',
        status: 'active',
        classId: 'secondary',
        registeredAt: '2026-01-01',
      },
      {
        id: 'pending_uid',
        uid: 'pending_uid',
        name: 'Pending Student',
        email: 'pending@example.com',
        phone: '01000000008',
        age: 11,
        role: 'student',
        status: 'pending',
        classId: 'primary_4',
        registeredAt: '2026-01-02',
      },
      {
        id: 'rejected_uid',
        uid: 'rejected_uid',
        name: 'Rejected User',
        email: 'rejected@example.com',
        phone: '01000000009',
        age: 11,
        role: 'student',
        status: 'rejected',
        classId: 'primary_4',
        registeredAt: '2026-01-02',
      },
      {
        id: 'suspended_uid',
        uid: 'suspended_uid',
        name: 'Suspended User',
        email: 'suspended@example.com',
        phone: '01000000010',
        age: 12,
        role: 'student',
        status: 'suspended',
        classId: 'primary_4',
        registeredAt: '2026-01-02',
      },
    ];

    for (const u of users) {
      await setDoc(doc(db, 'users', u.id), {
        ...u,
        serverCreatedAt: now,
        serverUpdatedAt: now,
      });
      await setDoc(doc(db, 'public_profiles', u.id), {
        id: u.id,
        uid: u.uid,
        name: u.name,
        role: u.role,
        status: u.status,
        ...(u.classId ? { classId: u.classId } : {}),
        age: u.age,
        registeredAt: u.registeredAt,
        serverCreatedAt: now,
        serverUpdatedAt: now,
      });
    }

    await setDoc(doc(db, 'admins', 'admin_uid'), {
      uid: 'admin_uid',
      email: ADMIN_EMAIL,
      serverCreatedAt: now,
    });

    // Academic Term
    await setDoc(doc(db, 'academic_terms', 'term_1'), {
      id: 'term_1',
      title: 'الترم الأول',
      bookSubject: 'إنجيل مرقس',
      sessionsCount: 8,
      isCurrent: true,
      createdByUid: 'admin_uid',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });

    // Assigned Book
    await setDoc(doc(db, 'class_assigned_books', 'primary_4_term_1'), {
      id: 'primary_4_term_1',
      classId: 'primary_4',
      bookId: 'mark',
      bookName: 'إنجيل مرقس',
      testament: 'new',
      termId: 'term_1',
      updatedByUid: 'servant_p4',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });

    // Sessions & Isolated QR Secrets
    await setDoc(doc(db, 'sessions', 'sess_1'), {
      id: 'sess_1',
      title: 'اللقاء الأول - رابعة ابتدائي',
      classId: 'primary_4',
      termId: 'term_1',
      date: '2026-03-01',
      servantName: 'Servant Primary 4',
      maxScorePerMetric: 10,
      qrActive: true,
      expiresAtMs: futureExpiry,
      createdByUid: 'servant_p4',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });
    await setDoc(doc(db, 'session_qr_secrets', 'sess_1'), {
      sessionId: 'sess_1',
      classId: 'primary_4',
      qrSecretCode: 'STP-S1-VALID123',
      qrActive: true,
      expiresAtMs: futureExpiry,
      updatedByUid: 'servant_p4',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });

    // Session with pre-existing grade (attendance: 0) for QR update check
    await setDoc(doc(db, 'sessions', 'sess_open_qr'), {
      id: 'sess_open_qr',
      title: 'اللقاء الثاني - رابعة ابتدائي',
      classId: 'primary_4',
      termId: 'term_1',
      date: '2026-03-08',
      servantName: 'Servant Primary 4',
      maxScorePerMetric: 10,
      qrActive: true,
      expiresAtMs: futureExpiry,
      createdByUid: 'servant_p4',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });
    await setDoc(doc(db, 'session_qr_secrets', 'sess_open_qr'), {
      sessionId: 'sess_open_qr',
      classId: 'primary_4',
      qrSecretCode: 'STP-S2-OPENQR99',
      qrActive: true,
      expiresAtMs: futureExpiry,
      updatedByUid: 'servant_p4',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });

    // Inactive QR Session
    await setDoc(doc(db, 'sessions', 'sess_inactive_qr'), {
      id: 'sess_inactive_qr',
      title: 'لقاء مغلق QR',
      classId: 'primary_4',
      date: '2026-03-15',
      servantName: 'Servant Primary 4',
      maxScorePerMetric: 10,
      qrActive: false,
      expiresAtMs: futureExpiry,
      createdByUid: 'servant_p4',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });
    await setDoc(doc(db, 'session_qr_secrets', 'sess_inactive_qr'), {
      sessionId: 'sess_inactive_qr',
      classId: 'primary_4',
      qrSecretCode: 'STP-S3-INACTIVE',
      qrActive: false,
      expiresAtMs: futureExpiry,
      updatedByUid: 'servant_p4',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });

    // Expired QR Session
    await setDoc(doc(db, 'sessions', 'sess_expired_qr'), {
      id: 'sess_expired_qr',
      title: 'لقاء منتهي الصلاحية QR',
      classId: 'primary_4',
      date: '2026-03-22',
      servantName: 'Servant Primary 4',
      maxScorePerMetric: 10,
      qrActive: true,
      expiresAtMs: pastExpiry,
      createdByUid: 'servant_p4',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });
    await setDoc(doc(db, 'session_qr_secrets', 'sess_expired_qr'), {
      sessionId: 'sess_expired_qr',
      classId: 'primary_4',
      qrSecretCode: 'STP-S4-EXPIRED',
      qrActive: true,
      expiresAtMs: pastExpiry,
      updatedByUid: 'servant_p4',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });

    // Foreign Class Session (secondary)
    await setDoc(doc(db, 'sessions', 'sess_foreign_class'), {
      id: 'sess_foreign_class',
      title: 'لقاء ثانوي',
      classId: 'secondary',
      date: '2026-03-01',
      servantName: 'Servant Secondary',
      maxScorePerMetric: 10,
      qrActive: true,
      expiresAtMs: futureExpiry,
      createdByUid: 'servant_sec',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });
    await setDoc(doc(db, 'session_qr_secrets', 'sess_foreign_class'), {
      sessionId: 'sess_foreign_class',
      classId: 'secondary',
      qrSecretCode: 'STP-SEC-SECRET1',
      qrActive: true,
      expiresAtMs: futureExpiry,
      updatedByUid: 'servant_sec',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });

    // Grades
    await setDoc(doc(db, 'grades', 'sess_1_student_1'), {
      id: 'sess_1_student_1',
      sessionId: 'sess_1',
      sessionTitle: 'اللقاء الأول - رابعة ابتدائي',
      date: '2026-03-01',
      studentId: 'student_1',
      classId: 'primary_4',
      termId: 'term_1',
      exam: 8,
      homework: 9,
      attendance: 1,
      participation: 1,
      prayer: 1,
      tools: 1,
      updatedByUid: 'servant_p4',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });
    await setDoc(doc(db, 'grades', 'sess_1_student_2'), {
      id: 'sess_1_student_2',
      sessionId: 'sess_1',
      sessionTitle: 'اللقاء الأول - رابعة ابتدائي',
      date: '2026-03-01',
      studentId: 'student_2',
      classId: 'primary_4',
      termId: 'term_1',
      exam: 7,
      homework: 8,
      attendance: 1,
      participation: 0,
      prayer: 1,
      tools: 1,
      updatedByUid: 'servant_p4',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });
    await setDoc(doc(db, 'grades', 'sess_open_qr_student_1'), {
      id: 'sess_open_qr_student_1',
      sessionId: 'sess_open_qr',
      sessionTitle: 'اللقاء الثاني - رابعة ابتدائي',
      date: '2026-03-08',
      studentId: 'student_1',
      classId: 'primary_4',
      termId: 'term_1',
      exam: 6,
      homework: 7,
      attendance: 0,
      participation: 1,
      prayer: 0,
      tools: 1,
      updatedByUid: 'servant_p4',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });

    // Final Exams
    await setDoc(doc(db, 'final_exams', 'student_1'), {
      studentId: 'student_1',
      classId: 'primary_4',
      score: 36,
      updatedByUid: 'admin_uid',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });
    await setDoc(doc(db, 'final_exams', 'student_2'), {
      studentId: 'student_2',
      classId: 'primary_4',
      score: 31,
      updatedByUid: 'admin_uid',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });

    // Lesson Posts
    await setDoc(doc(db, 'lesson_posts', 'post_approved'), {
      id: 'post_approved',
      servantId: 'servant_p4',
      createdByUid: 'servant_p4',
      servantName: 'Servant Primary 4',
      classId: 'primary_4',
      title: 'ملخص معتمد',
      category: 'lesson_handout',
      content: 'ملخص الدرس المعتمد للطلاب',
      createdAt: '2026-03-01',
      status: 'approved',
      approvedBy: 'Super Admin',
      approvedAt: '2026-03-01',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });
    await setDoc(doc(db, 'lesson_posts', 'post_pending'), {
      id: 'post_pending',
      servantId: 'servant_p4',
      createdByUid: 'servant_p4',
      servantName: 'Servant Primary 4',
      classId: 'primary_4',
      title: 'منشور قيد المراجعة',
      category: 'lesson_handout',
      content: 'محتوى بانتظار اعتماد أمين الخدمة',
      createdAt: '2026-03-02',
      status: 'pending_approval',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });
    await setDoc(doc(db, 'lesson_posts', 'post_rejected'), {
      id: 'post_rejected',
      servantId: 'servant_p4',
      createdByUid: 'servant_p4',
      servantName: 'Servant Primary 4',
      classId: 'primary_4',
      title: 'منشور مرفوض',
      category: 'lesson_handout',
      content: 'محتوى مرفوض',
      createdAt: '2026-03-02',
      status: 'rejected',
      rejectionReason: 'غير مناسب',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });

    // Library Book, Church Event, Year Work Lock, Notifications, Servant Submission
    await setDoc(doc(db, 'library_books', 'book_1'), {
      id: 'book_1',
      title: 'مقدمة في إنجيل مرقس',
      author: 'الأب تادرس يعقوب',
      category: 'new_testament',
      description: 'تفسير وتأملات',
      addedBy: 'Super Admin',
      addedAt: '2026-01-10',
      createdByUid: 'admin_uid',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });
    await setDoc(doc(db, 'church_events', 'evt_1'), {
      id: 'evt_1',
      title: 'يوم روحي للكتاب المقدس',
      date: '2026-05-10',
      description: 'يوم روحي لجميع الفصول',
      type: 'spiritual_day',
      targetAudience: 'all',
      status: 'upcoming',
      createdAt: '2026-02-01',
      createdByUid: 'admin_uid',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });
    await setDoc(doc(db, 'year_work_locks', 'primary_4'), {
      classId: 'primary_4',
      locked: false,
      updatedByUid: 'admin_uid',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });
    await setDoc(doc(db, 'servant_submissions', 'sub_p4_1'), {
      id: 'sub_p4_1',
      servantId: 'servant_p4',
      createdByUid: 'servant_p4',
      servantName: 'Servant Primary 4',
      meetingDate: '2026-03-01',
      meetingTitle: 'تحضير الأسبوع الأول',
      status: 'attending',
      prepTitle: 'بداية الإنجيل',
      classId: 'primary_4',
      submittedAt: '2026-02-28T18:00:00Z',
      viewedByAdmin: false,
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });
    await setDoc(doc(db, 'notifications', 'notif_student_1'), {
      id: 'notif_student_1',
      title: 'تحديث درجات',
      message: 'تم رصد درجات اللقاء الأول',
      timestamp: 'الآن',
      type: 'grade_updated',
      read: false,
      audienceUserId: 'student_1',
      createdByUid: 'servant_p4',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });
    await setDoc(doc(db, 'notifications', 'notif_servants'), {
      id: 'notif_servants',
      title: 'اجتماع الخدام',
      message: 'موعد اجتماع الخدام الأسبوعي',
      timestamp: 'الآن',
      type: 'prep_upload',
      read: false,
      audienceRoles: ['servant'],
      createdByUid: 'admin_uid',
      serverCreatedAt: now,
      serverUpdatedAt: now,
    });
  });
}

beforeAll(async () => {
  const { host, port } = resolveLocalEmulatorHostPort();
  emulatorHost = host;
  emulatorPort = port;

  const rules = fs.readFileSync(RULES_PATH, 'utf8');
  testEnv = await initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: { rules, host, port },
  });

  // Ensure the exact rules file is also loaded for the named database ID
  const rulesResp = await fetch(
    `http://${host}:${port}/emulator/v1/projects/${PROJECT_ID}/databases/${DATABASE_ID}:securityRules`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rules: { files: [{ name: 'firestore.rules', content: rules }] } }),
    }
  );
  if (!rulesResp.ok) {
    throw new Error(
      `Failed loading firestore.rules for named database ${DATABASE_ID} (${rulesResp.status}): ${await rulesResp.text()}`
    );
  }
});

afterAll(async () => {
  await cleanupOpenClients();
  await clearNamedDatabase().catch(() => undefined);
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await cleanupOpenClients();
  await testEnv.clearFirestore();
  await clearNamedDatabase();
  await seedBaselineSchoolData();
});

describe('Firestore Security Rules Integration Tests (Local Emulator - Named Database)', () => {
  describe('A. All 17 Adversarial Attack Scenarios', () => {
    it('1. Denies self-promotion to admin on /users registration', async () => {
      const db = authDb('attacker_uid', { email: 'attacker@example.com', email_verified: true });
      await assertFails(
        setDoc(doc(db, 'users', 'attacker_uid'), {
          id: 'attacker_uid',
          uid: 'attacker_uid',
          name: 'Evil User',
          phone: '01000000000',
          age: 20,
          role: 'admin',
          status: 'active',
          registeredAt: '2026-01-01',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('2. Denies shadow / ghost field injection on /users creation', async () => {
      const db = authDb('attacker_uid', { email: 'attacker@example.com', email_verified: true });
      await assertFails(
        setDoc(doc(db, 'users', 'attacker_uid'), {
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
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('3. Denies unverified email spoofing bootstrap admin email on /church_events create', async () => {
      const db = authDb('spoof_1', { email: ADMIN_EMAIL, email_verified: false });
      await assertFails(
        setDoc(doc(db, 'church_events', 'evt_spoof'), {
          id: 'evt_spoof',
          title: 'Spoofed Event',
          date: '2026-05-01',
          description: 'Spoof',
          type: 'general',
          targetAudience: 'all',
          status: 'upcoming',
          createdAt: '2026-05-01',
          createdByUid: 'spoof_1',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('4. Denies cross-user PII snooping via getDoc on /users/{otherUid}', async () => {
      const db = authDb('student_1', { email: 'student1@example.com', email_verified: true });
      await assertFails(getDoc(doc(db, 'users', 'student_2')));
    });

    it('5. Denies unrestricted blanket list query on /users by student', async () => {
      const db = authDb('student_1', { email: 'student1@example.com', email_verified: true });
      await assertFails(getDocs(collection(db, 'users')));
    });

    it('6. Denies identity spoofing (createdByUid != auth.uid) on /sessions create', async () => {
      const db = authDb('servant_p4', { email: 'serv4@example.com', email_verified: true });
      await assertFails(
        setDoc(doc(db, 'sessions', 'sess_spoof'), {
          id: 'sess_spoof',
          title: 'Fake Session',
          classId: 'primary_4',
          date: '2026-03-20',
          servantName: 'Fake',
          maxScorePerMetric: 10,
          qrActive: true,
          createdByUid: 'servant_sec',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('7. Denies student mutating exam and homework scores on /grades update', async () => {
      const db = authDb('student_1', { email: 'student1@example.com', email_verified: true });
      await assertFails(
        updateDoc(doc(db, 'grades', 'sess_open_qr_student_1'), {
          exam: 10,
          homework: 10,
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('8. Denies value poisoning with oversized content (20,000 chars) on /lesson_posts update', async () => {
      const db = authDb('servant_p4', { email: 'serv4@example.com', email_verified: true });
      await assertFails(
        updateDoc(doc(db, 'lesson_posts', 'post_pending'), {
          content: 'X'.repeat(20000),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('9. Denies path variable ID poisoning on /sessions create', async () => {
      const db = authDb('servant_p4', { email: 'serv4@example.com', email_verified: true });
      const badId = 'bad$id_123_' + 'a'.repeat(140);
      await assertFails(
        setDoc(doc(db, 'sessions', badId), {
          id: badId,
          title: 'Poisoned',
          classId: 'primary_4',
          date: '2026-03-20',
          servantName: 'Servant Primary 4',
          maxScorePerMetric: 10,
          qrActive: true,
          createdByUid: 'servant_p4',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('10. Denies terminal state bypass on rejected /lesson_posts update', async () => {
      const db = authDb('servant_p4', { email: 'serv4@example.com', email_verified: true });
      await assertFails(
        updateDoc(doc(db, 'lesson_posts', 'post_rejected'), {
          title: 'Trying to resurrect rejected post',
          status: 'approved',
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('11. Denies client-forged server timestamp on /church_events create even by admin', async () => {
      const db = authDb('admin_uid', { email: ADMIN_EMAIL, email_verified: true });
      const backdated = Timestamp.fromDate(new Date('2020-01-01T00:00:00Z'));
      await assertFails(
        setDoc(doc(db, 'church_events', 'evt_forged_time'), {
          id: 'evt_forged_time',
          title: 'Backdated Event',
          date: '2026-05-01',
          description: 'Test',
          type: 'general',
          targetAudience: 'all',
          status: 'upcoming',
          createdAt: '2020-01-01',
          createdByUid: 'admin_uid',
          serverCreatedAt: backdated,
          serverUpdatedAt: backdated,
        })
      );
    });

    it('12. Denies servant self-approving /lesson_posts on create', async () => {
      const db = authDb('servant_p4', { email: 'serv4@example.com', email_verified: true });
      await assertFails(
        setDoc(doc(db, 'lesson_posts', 'post_self_approve'), {
          id: 'post_self_approve',
          servantId: 'servant_p4',
          createdByUid: 'servant_p4',
          servantName: 'Servant Primary 4',
          classId: 'primary_4',
          title: 'Self Approved',
          category: 'lesson_handout',
          content: 'Lesson notes',
          createdAt: '2026-05-01',
          status: 'approved',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('13. Denies student reading isolated /session_qr_secrets (getDoc and getDocs)', async () => {
      const db = authDb('student_1', { email: 'student1@example.com', email_verified: true });
      await assertFails(getDoc(doc(db, 'session_qr_secrets', 'sess_1')));
      await assertFails(getDocs(collection(db, 'session_qr_secrets')));
    });

    it('14. Denies student submitting wrong QR code on /grades create', async () => {
      // Remove existing grade for sess_open_qr_student_1 so create path is exercised
      await seedWithRulesDisabled(async (db) => {
        await deleteDoc(doc(db, 'grades', 'sess_open_qr_student_1'));
      });
      const db = authDb('student_1', { email: 'student1@example.com', email_verified: true });
      await assertFails(
        setDoc(doc(db, 'grades', 'sess_open_qr_student_1'), {
          id: 'sess_open_qr_student_1',
          sessionId: 'sess_open_qr',
          sessionTitle: 'اللقاء الثاني - رابعة ابتدائي',
          date: '2026-03-08',
          studentId: 'student_1',
          classId: 'primary_4',
          termId: 'term_1',
          attendance: 1,
          exam: 0,
          homework: 0,
          participation: 0,
          prayer: 0,
          tools: 0,
          submittedQrCode: 'FORGED-QR',
          updatedByUid: 'student_1',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('15. Denies cross-class servant modifying foreign class session', async () => {
      const db = authDb('servant_p4', { email: 'serv4@example.com', email_verified: true });
      await assertFails(
        updateDoc(doc(db, 'sessions', 'sess_foreign_class'), {
          title: 'Tampered Foreign Class',
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('16. Denies non-admin (servant) writing /final_exams score', async () => {
      const db = authDb('servant_p4', { email: 'serv4@example.com', email_verified: true });
      await assertFails(
        setDoc(doc(db, 'final_exams', 'student_2'), {
          studentId: 'student_2',
          classId: 'primary_4',
          score: 40,
          updatedByUid: 'servant_p4',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('17. Denies suspended user reading school /sessions (getDoc and getDocs)', async () => {
      const db = authDb('suspended_uid', { email: 'suspended@example.com', email_verified: true });
      await assertFails(getDoc(doc(db, 'sessions', 'sess_1')));
      await assertFails(
        getDocs(query(collection(db, 'sessions'), where('classId', '==', 'primary_4')))
      );
    });
  });

  describe('B. Positive & Negative Student Permissions', () => {
    it('allows approved student to read own profile, public profiles, class sessions, own grades, own final exam, and approved posts', async () => {
      const db = authDb('student_1', { email: 'student1@example.com', email_verified: true });

      const ownUser = await assertSucceeds(getDoc(doc(db, 'users', 'student_1')));
      expect(ownUser.exists()).toBe(true);

      const ownPublic = await assertSucceeds(getDoc(doc(db, 'public_profiles', 'student_1')));
      expect(ownPublic.exists()).toBe(true);

      const activeRoster = await assertSucceeds(
        getDocs(query(collection(db, 'public_profiles'), where('status', '==', 'active')))
      );
      expect(activeRoster.size).toBeGreaterThanOrEqual(2);

      const classSessions = await assertSucceeds(
        getDocs(query(collection(db, 'sessions'), where('classId', '==', 'primary_4')))
      );
      expect(classSessions.size).toBeGreaterThanOrEqual(1);

      const ownGrade = await assertSucceeds(getDoc(doc(db, 'grades', 'sess_1_student_1')));
      expect(ownGrade.data()?.exam).toBe(8);

      const ownGradesList = await assertSucceeds(
        getDocs(query(collection(db, 'grades'), where('studentId', '==', 'student_1')))
      );
      expect(ownGradesList.size).toBeGreaterThanOrEqual(1);

      const ownFinal = await assertSucceeds(getDoc(doc(db, 'final_exams', 'student_1')));
      expect(ownFinal.data()?.score).toBe(36);

      const approvedPost = await assertSucceeds(getDoc(doc(db, 'lesson_posts', 'post_approved')));
      expect(approvedPost.exists()).toBe(true);

      await assertSucceeds(getDocs(collection(db, 'academic_terms')));
      await assertSucceeds(getDocs(collection(db, 'library_books')));
      await assertSucceeds(getDocs(collection(db, 'church_events')));
      await assertSucceeds(getDocs(collection(db, 'year_work_locks')));
    });

    it('allows approved student to update permitted self profile fields without changing role/status', async () => {
      const db = authDb('student_1', { email: 'student1@example.com', email_verified: true });

      await assertSucceeds(
        updateDoc(doc(db, 'users', 'student_1'), {
          confessionFather: 'Abouna Bishoy',
          phone: '01099999999',
          serverUpdatedAt: serverTimestamp(),
        })
      );

      // Cannot escalate role or status via self-update
      await assertFails(
        updateDoc(doc(db, 'users', 'student_1'), {
          role: 'servant',
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('denies student reading another student profile, grades, final exam, foreign sessions, or deleting records', async () => {
      const db = authDb('student_1', { email: 'student1@example.com', email_verified: true });

      await assertFails(getDoc(doc(db, 'users', 'student_2')));
      await assertFails(getDoc(doc(db, 'grades', 'sess_1_student_2')));
      await assertFails(getDoc(doc(db, 'final_exams', 'student_2')));
      await assertFails(getDoc(doc(db, 'sessions', 'sess_foreign_class')));
      await assertFails(getDoc(doc(db, 'lesson_posts', 'post_pending')));
      await assertFails(deleteDoc(doc(db, 'grades', 'sess_1_student_1')));
      await assertFails(deleteDoc(doc(db, 'users', 'student_1')));
    });

    it('allows new verified user to create pending student registration and rejects active/servant self-registration', async () => {
      const newDb = authDb('new_student_uid', { email: 'newstu@example.com', email_verified: true });

      await assertSucceeds(
        setDoc(doc(newDb, 'users', 'new_student_uid'), {
          id: 'new_student_uid',
          uid: 'new_student_uid',
          name: 'New Student',
          email: 'newstu@example.com',
          phone: '01112223334',
          age: 12,
          role: 'student',
          requestedRole: 'student',
          status: 'pending',
          classId: 'primary_4',
          registeredAt: '2026-04-01',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );

      await assertSucceeds(
        setDoc(doc(newDb, 'public_profiles', 'new_student_uid'), {
          id: 'new_student_uid',
          uid: 'new_student_uid',
          name: 'New Student',
          role: 'student',
          status: 'pending',
          classId: 'primary_4',
          age: 12,
          registeredAt: '2026-04-01',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );

      // Cannot register directly as active
      const badDb = authDb('bad_new_uid', { email: 'badnew@example.com', email_verified: true });
      await assertFails(
        setDoc(doc(badDb, 'users', 'bad_new_uid'), {
          id: 'bad_new_uid',
          uid: 'bad_new_uid',
          name: 'Sneaky User',
          phone: '01112223335',
          age: 12,
          role: 'student',
          status: 'active',
          registeredAt: '2026-04-01',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });
  });

  describe('C. Servant & Assistant Class-Scoped RBAC', () => {
    it('allows assigned servant to create/update own class sessions, QR secrets, grades, assigned book, pending posts, and submissions', async () => {
      const db = authDb('servant_p4', { email: 'serv4@example.com', email_verified: true });
      const futureExpiry = Date.now() + 3 * 60 * 60 * 1000;

      // Create session in assigned class
      await assertSucceeds(
        setDoc(doc(db, 'sessions', 'sess_p4_new'), {
          id: 'sess_p4_new',
          title: 'لقاء جديد رابعة ابتدائي',
          classId: 'primary_4',
          termId: 'term_1',
          date: '2026-04-05',
          servantName: 'Servant Primary 4',
          maxScorePerMetric: 10,
          qrActive: true,
          expiresAtMs: futureExpiry,
          createdByUid: 'servant_p4',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );

      // Update own class session
      await assertSucceeds(
        updateDoc(doc(db, 'sessions', 'sess_p4_new'), {
          lessonSummary: 'ملخص محدث للدرس',
          serverUpdatedAt: serverTimestamp(),
        })
      );

      // Create & read QR secret for own class
      await assertSucceeds(
        setDoc(doc(db, 'session_qr_secrets', 'sess_p4_new'), {
          sessionId: 'sess_p4_new',
          classId: 'primary_4',
          qrSecretCode: 'STP-NEW-QR99',
          qrActive: true,
          expiresAtMs: futureExpiry,
          updatedByUid: 'servant_p4',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
      await assertSucceeds(getDoc(doc(db, 'session_qr_secrets', 'sess_p4_new')));

      // Write grade for own class session
      await assertSucceeds(
        setDoc(doc(db, 'grades', 'sess_p4_new_student_1'), {
          id: 'sess_p4_new_student_1',
          sessionId: 'sess_p4_new',
          sessionTitle: 'لقاء جديد رابعة ابتدائي',
          date: '2026-04-05',
          studentId: 'student_1',
          classId: 'primary_4',
          termId: 'term_1',
          exam: 9,
          homework: 10,
          attendance: 1,
          participation: 1,
          prayer: 1,
          tools: 1,
          updatedByUid: 'servant_p4',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );

      // Read class final exam
      await assertSucceeds(
        getDocs(query(collection(db, 'final_exams'), where('classId', '==', 'primary_4')))
      );

      // Create pending lesson post & update while still pending_approval
      await assertSucceeds(
        setDoc(doc(db, 'lesson_posts', 'post_p4_new'), {
          id: 'post_p4_new',
          servantId: 'servant_p4',
          createdByUid: 'servant_p4',
          servantName: 'Servant Primary 4',
          classId: 'primary_4',
          title: 'درس جديد',
          category: 'lesson_handout',
          content: 'تفاصيل الدرس الجديد',
          createdAt: '2026-04-05',
          status: 'pending_approval',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
      await assertSucceeds(
        updateDoc(doc(db, 'lesson_posts', 'post_p4_new'), {
          title: 'درس جديد معدل',
          serverUpdatedAt: serverTimestamp(),
        })
      );

      // Servant preparation submission
      await assertSucceeds(
        setDoc(doc(db, 'servant_submissions', 'sub_p4_2'), {
          id: 'sub_p4_2',
          servantId: 'servant_p4',
          createdByUid: 'servant_p4',
          servantName: 'Servant Primary 4',
          meetingDate: '2026-04-05',
          meetingTitle: 'اجتماع الخدمة',
          status: 'attending',
          prepTitle: 'تحضير الدرس',
          classId: 'primary_4',
          submittedAt: '2026-04-04T19:00:00Z',
          viewedByAdmin: false,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('denies servant creating/reading/updating sessions, QR secrets, or grades for another class', async () => {
      const db = authDb('servant_p4', { email: 'serv4@example.com', email_verified: true });
      const futureExpiry = Date.now() + 3 * 60 * 60 * 1000;

      await assertFails(getDoc(doc(db, 'sessions', 'sess_foreign_class')));
      await assertFails(getDoc(doc(db, 'session_qr_secrets', 'sess_foreign_class')));
      await assertFails(
        getDocs(query(collection(db, 'final_exams'), where('classId', '==', 'secondary')))
      );

      await assertFails(
        setDoc(doc(db, 'sessions', 'sess_cross_create'), {
          id: 'sess_cross_create',
          title: 'محاولة تسلل',
          classId: 'secondary',
          date: '2026-04-05',
          servantName: 'Servant Primary 4',
          maxScorePerMetric: 10,
          qrActive: true,
          expiresAtMs: futureExpiry,
          createdByUid: 'servant_p4',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );

      await assertFails(
        setDoc(doc(db, 'grades', 'sess_foreign_class_student_sec'), {
          id: 'sess_foreign_class_student_sec',
          sessionId: 'sess_foreign_class',
          sessionTitle: 'لقاء ثانوي',
          date: '2026-03-01',
          studentId: 'student_sec',
          classId: 'secondary',
          exam: 10,
          homework: 10,
          attendance: 1,
          participation: 1,
          prayer: 1,
          tools: 1,
          updatedByUid: 'servant_p4',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );

      await assertFails(deleteDoc(doc(db, 'sessions', 'sess_1')));
      await assertFails(deleteDoc(doc(db, 'grades', 'sess_1_student_1')));
    });

    it('allows assistant across classes but blocks admin-only writes', async () => {
      const db = authDb('assistant_uid', { email: 'assistant@example.com', email_verified: true });

      await assertSucceeds(getDoc(doc(db, 'sessions', 'sess_foreign_class')));
      await assertSucceeds(getDoc(doc(db, 'session_qr_secrets', 'sess_foreign_class')));
      await assertSucceeds(getDocs(collection(db, 'final_exams')));

      await assertFails(
        setDoc(doc(db, 'academic_terms', 'term_2'), {
          id: 'term_2',
          title: 'الترم الثاني',
          bookSubject: 'سفر أعمال الرسل',
          sessionsCount: 8,
          isCurrent: false,
          createdByUid: 'assistant_uid',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
      await assertFails(
        setDoc(doc(db, 'final_exams', 'student_1'), {
          studentId: 'student_1',
          classId: 'primary_4',
          score: 40,
          updatedByUid: 'assistant_uid',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });
  });

  describe('D. Authorized Admin Operations', () => {
    it('allows verified admin to approve users, manage terms/events/final exams/locks, approve posts, and delete docs', async () => {
      const db = authDb('admin_uid', { email: ADMIN_EMAIL, email_verified: true });

      // Approve pending student
      await assertSucceeds(
        updateDoc(doc(db, 'users', 'pending_uid'), {
          status: 'active',
          serverUpdatedAt: serverTimestamp(),
        })
      );
      await assertSucceeds(
        updateDoc(doc(db, 'public_profiles', 'pending_uid'), {
          status: 'active',
          serverUpdatedAt: serverTimestamp(),
        })
      );

      // Create & delete academic term
      await assertSucceeds(
        setDoc(doc(db, 'academic_terms', 'term_2'), {
          id: 'term_2',
          title: 'الترم الثاني',
          bookSubject: 'سفر الأعمال',
          sessionsCount: 10,
          isCurrent: false,
          createdByUid: 'admin_uid',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
      await assertSucceeds(deleteDoc(doc(db, 'academic_terms', 'term_2')));

      // Create church event
      await assertSucceeds(
        setDoc(doc(db, 'church_events', 'evt_admin_1'), {
          id: 'evt_admin_1',
          title: 'حفل ختام الترم',
          date: '2026-06-01',
          description: 'توزيع الجوائز',
          type: 'graduation',
          targetAudience: 'all',
          status: 'upcoming',
          createdAt: '2026-04-01',
          createdByUid: 'admin_uid',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );

      // Set final exam & year work lock
      await assertSucceeds(
        updateDoc(doc(db, 'final_exams', 'student_1'), {
          score: 39,
          updatedByUid: 'admin_uid',
          serverUpdatedAt: serverTimestamp(),
        })
      );
      await assertSucceeds(
        updateDoc(doc(db, 'year_work_locks', 'primary_4'), {
          locked: true,
          updatedByUid: 'admin_uid',
          serverUpdatedAt: serverTimestamp(),
        })
      );

      // Approve pending lesson post
      await assertSucceeds(
        updateDoc(doc(db, 'lesson_posts', 'post_pending'), {
          status: 'approved',
          approvedBy: 'Super Admin',
          approvedAt: '2026-04-01',
          serverUpdatedAt: serverTimestamp(),
        })
      );

      // Admin can read full /users collection and delete test doc
      const allUsers = await assertSucceeds(getDocs(collection(db, 'users')));
      expect(allUsers.size).toBeGreaterThanOrEqual(5);
      await assertSucceeds(deleteDoc(doc(db, 'church_events', 'evt_admin_1')));
    });
  });

  describe('E. QR Attendance Lifecycle', () => {
    it('allows valid student QR create once and rejects duplicate/replayed submission', async () => {
      const db = authDb('student_2', { email: 'student2@example.com', email_verified: true });
      const gradeRef = doc(db, 'grades', 'sess_open_qr_student_2');

      // First valid QR scan creates attendance=1 with 0s for other metrics
      await assertSucceeds(
        setDoc(gradeRef, {
          id: 'sess_open_qr_student_2',
          sessionId: 'sess_open_qr',
          sessionTitle: 'اللقاء الثاني - رابعة ابتدائي',
          date: '2026-03-08',
          studentId: 'student_2',
          classId: 'primary_4',
          termId: 'term_1',
          exam: 0,
          homework: 0,
          attendance: 1,
          participation: 0,
          prayer: 0,
          tools: 0,
          submittedQrCode: 'STP-S2-OPENQR99',
          qrAttendedAt: '2026-03-08T10:05:00Z',
          updatedByUid: 'student_2',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );

      // Replay attempt on same grade doc fails
      await assertFails(
        updateDoc(gradeRef, {
          attendance: 1,
          submittedQrCode: 'STP-S2-OPENQR99',
          qrAttendedAt: '2026-03-08T10:06:00Z',
          updatedByUid: 'student_2',
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('allows valid student QR update when existing attendance == 0 and rejects replay afterward', async () => {
      const db = authDb('student_1', { email: 'student1@example.com', email_verified: true });
      const gradeRef = doc(db, 'grades', 'sess_open_qr_student_1');

      await assertSucceeds(
        updateDoc(gradeRef, {
          attendance: 1,
          submittedQrCode: 'STP-S2-OPENQR99',
          qrAttendedAt: '2026-03-08T10:10:00Z',
          updatedByUid: 'student_1',
          serverUpdatedAt: serverTimestamp(),
        })
      );

      // Replay fails because existing().attendance is now 1
      await assertFails(
        updateDoc(gradeRef, {
          attendance: 1,
          submittedQrCode: 'STP-S2-OPENQR99',
          qrAttendedAt: '2026-03-08T10:11:00Z',
          updatedByUid: 'student_1',
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('rejects invalid, inactive, expired, and wrong-class QR submissions', async () => {
      const p4StudentDb = authDb('student_2', { email: 'student2@example.com', email_verified: true });
      const secStudentDb = authDb('student_sec', { email: 'studentsec@example.com', email_verified: true });

      // Wrong code
      await assertFails(
        setDoc(doc(p4StudentDb, 'grades', 'sess_open_qr_student_2'), {
          id: 'sess_open_qr_student_2',
          sessionId: 'sess_open_qr',
          sessionTitle: 'اللقاء الثاني - رابعة ابتدائي',
          date: '2026-03-08',
          studentId: 'student_2',
          classId: 'primary_4',
          exam: 0,
          homework: 0,
          attendance: 1,
          participation: 0,
          prayer: 0,
          tools: 0,
          submittedQrCode: 'INVALID-CODE',
          updatedByUid: 'student_2',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );

      // Inactive QR (qrActive: false)
      await assertFails(
        setDoc(doc(p4StudentDb, 'grades', 'sess_inactive_qr_student_2'), {
          id: 'sess_inactive_qr_student_2',
          sessionId: 'sess_inactive_qr',
          sessionTitle: 'لقاء مغلق QR',
          date: '2026-03-15',
          studentId: 'student_2',
          classId: 'primary_4',
          exam: 0,
          homework: 0,
          attendance: 1,
          participation: 0,
          prayer: 0,
          tools: 0,
          submittedQrCode: 'STP-S3-INACTIVE',
          updatedByUid: 'student_2',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );

      // Expired QR (expiresAtMs <= request.time)
      await assertFails(
        setDoc(doc(p4StudentDb, 'grades', 'sess_expired_qr_student_2'), {
          id: 'sess_expired_qr_student_2',
          sessionId: 'sess_expired_qr',
          sessionTitle: 'لقاء منتهي الصلاحية QR',
          date: '2026-03-22',
          studentId: 'student_2',
          classId: 'primary_4',
          exam: 0,
          homework: 0,
          attendance: 1,
          participation: 0,
          prayer: 0,
          tools: 0,
          submittedQrCode: 'STP-S4-EXPIRED',
          updatedByUid: 'student_2',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );

      // Wrong class student attempting to scan primary_4 QR
      await assertFails(
        setDoc(doc(secStudentDb, 'grades', 'sess_open_qr_student_sec'), {
          id: 'sess_open_qr_student_sec',
          sessionId: 'sess_open_qr',
          sessionTitle: 'اللقاء الثاني - رابعة ابتدائي',
          date: '2026-03-08',
          studentId: 'student_sec',
          classId: 'primary_4',
          exam: 0,
          homework: 0,
          attendance: 1,
          participation: 0,
          prayer: 0,
          tools: 0,
          submittedQrCode: 'STP-S2-OPENQR99',
          updatedByUid: 'student_sec',
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });
  });

  describe('F. Pending / Rejected / Suspended & Unauthenticated Isolation', () => {
    it.each([
      { uid: 'pending_uid', email: 'pending@example.com' },
      { uid: 'rejected_uid', email: 'rejected@example.com' },
      { uid: 'suspended_uid', email: 'suspended@example.com' },
    ])('denies $uid access to school collections', async ({ uid, email }) => {
      const db = authDb(uid, { email, email_verified: true });

      // Can read only own user profile
      await assertSucceeds(getDoc(doc(db, 'users', uid)));

      // Denied on all protected school collections
      await assertFails(getDoc(doc(db, 'sessions', 'sess_1')));
      await assertFails(getDocs(query(collection(db, 'sessions'), where('classId', '==', 'primary_4'))));
      await assertFails(getDocs(query(collection(db, 'grades'), where('studentId', '==', uid))));
      await assertFails(getDoc(doc(db, 'final_exams', uid)));
      await assertFails(getDoc(doc(db, 'lesson_posts', 'post_approved')));
      await assertFails(getDocs(collection(db, 'library_books')));
      await assertFails(getDocs(collection(db, 'church_events')));
      await assertFails(getDocs(collection(db, 'academic_terms')));
      await assertFails(getDocs(query(collection(db, 'public_profiles'), where('status', '==', 'active'))));
    });

    it('denies rejected and suspended users from updating their own profiles', async () => {
      const rejDb = authDb('rejected_uid', { email: 'rejected@example.com', email_verified: true });
      const suspDb = authDb('suspended_uid', { email: 'suspended@example.com', email_verified: true });

      await assertFails(
        updateDoc(doc(rejDb, 'users', 'rejected_uid'), {
          name: 'Attempt Edit',
          serverUpdatedAt: serverTimestamp(),
        })
      );
      await assertFails(
        updateDoc(doc(suspDb, 'users', 'suspended_uid'), {
          name: 'Attempt Edit',
          serverUpdatedAt: serverTimestamp(),
        })
      );
    });

    it('allows only targeted recipients to read and mark notifications as read', async () => {
      const stu1Db = authDb('student_1', { email: 'student1@example.com', email_verified: true });
      const stu2Db = authDb('student_2', { email: 'student2@example.com', email_verified: true });
      const servDb = authDb('servant_p4', { email: 'serv4@example.com', email_verified: true });

      // Recipient reads & marks read
      await assertSucceeds(getDoc(doc(stu1Db, 'notifications', 'notif_student_1')));
      await assertSucceeds(
        getDocs(query(collection(stu1Db, 'notifications'), where('audienceUserId', '==', 'student_1')))
      );
      await assertSucceeds(
        updateDoc(doc(stu1Db, 'notifications', 'notif_student_1'), {
          read: true,
          serverUpdatedAt: serverTimestamp(),
        })
      );

      // Role recipient reads role notification
      await assertSucceeds(
        getDocs(
          query(collection(servDb, 'notifications'), where('audienceRoles', 'array-contains', 'servant'))
        )
      );

      // Non-recipient denied
      await assertFails(getDoc(doc(stu2Db, 'notifications', 'notif_student_1')));
      await assertFails(
        updateDoc(doc(stu2Db, 'notifications', 'notif_student_1'), {
          read: true,
          serverUpdatedAt: serverTimestamp(),
        })
      );
      await assertFails(getDoc(doc(stu1Db, 'notifications', 'notif_servants')));
    });

    it('allows unauthenticated /test/connection get only and denies all school data', async () => {
      const db = unauthenticatedDb();

      const healthSnap = await assertSucceeds(getDoc(doc(db, 'test', 'connection')));
      expect(healthSnap.exists()).toBe(true);

      await assertFails(getDoc(doc(db, 'users', 'student_1')));
      await assertFails(getDocs(collection(db, 'public_profiles')));
      await assertFails(getDocs(collection(db, 'sessions')));
      await assertFails(getDocs(collection(db, 'session_qr_secrets')));
      await assertFails(getDocs(collection(db, 'grades')));
      await assertFails(getDocs(collection(db, 'final_exams')));
      await assertFails(getDocs(collection(db, 'lesson_posts')));
      await assertFails(getDocs(collection(db, 'library_books')));
      await assertFails(getDocs(collection(db, 'church_events')));
      await assertFails(getDocs(collection(db, 'academic_terms')));
    });
  });
});
