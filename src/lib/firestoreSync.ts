import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  writeBatch,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import {
  db,
  auth,
  OperationType,
  handleFirestoreError,
  ADMIN_BOOTSTRAP_EMAIL,
} from '../firebase';
import {
  AcademicTerm,
  AppNotification,
  BibleSession,
  ChurchEvent,
  ClassAssignedBook,
  ClassId,
  LibraryBook,
  ServantAttendanceSubmission,
  ServantLessonPost,
  SessionGrade,
  SessionQrSecret,
  UserProfile,
  UserRole,
} from '../types';

export const COLLECTIONS = {
  USERS: 'users',
  PUBLIC_PROFILES: 'public_profiles',
  ADMINS: 'admins',
  ACADEMIC_TERMS: 'academic_terms',
  CLASS_ASSIGNED_BOOKS: 'class_assigned_books',
  SESSIONS: 'sessions',
  SESSION_QR_SECRETS: 'session_qr_secrets',
  GRADES: 'grades',
  FINAL_EXAMS: 'final_exams',
  SERVANT_SUBMISSIONS: 'servant_submissions',
  LESSON_POSTS: 'lesson_posts',
  LIBRARY_BOOKS: 'library_books',
  CHURCH_EVENTS: 'church_events',
  YEAR_WORK_LOCKS: 'year_work_locks',
  NOTIFICATIONS: 'notifications',
} as const;

const VALID_CLASSES: ClassId[] = [
  'primary_4',
  'primary_5',
  'primary_6',
  'prep_1',
  'prep_2_3',
  'secondary',
  'adults',
];

export function sanitizeFirestoreId(raw: string): string {
  const cleaned = String(raw || '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '_');
  const sliced = cleaned.slice(0, 128);
  return sliced || `doc_${Date.now()}`;
}

export function generateQrSecretCode(sessionNumber?: number): string {
  let rand = '';
  try {
    const bytes = new Uint8Array(6);
    globalThis.crypto.getRandomValues(bytes);
    rand = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  } catch {
    rand = Math.random().toString(36).slice(2, 10).toUpperCase();
  }
  return `STP-S${sessionNumber || 1}-${rand}`;
}

function clampStr(val: unknown, maxLen: number): string | undefined {
  if (val === undefined || val === null) return undefined;
  const s = String(val);
  if (!s) return undefined;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

function safeFileData(val: unknown): string | undefined {
  if (typeof val !== 'string' || !val) return undefined;
  if (val.length > 745000) return undefined;
  return val;
}

function stripUndefined<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) {
      result[k] = v;
    }
  }
  return result;
}

function normalizeClassId(c: unknown): ClassId | undefined {
  return VALID_CLASSES.includes(c as ClassId) ? (c as ClassId) : undefined;
}

export function isVerifiedAdminEmail(email?: string | null, emailVerified?: boolean): boolean {
  return Boolean(
    emailVerified && email && email.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase()
  );
}

export function isPasswordProviderUser(
  fbUser: { providerData?: Array<{ providerId?: string | null }> } | null | undefined
): boolean {
  return Boolean(fbUser?.providerData?.some((p) => p?.providerId === 'password'));
}

export function isPermittedAuthUser(
  fbUser:
    | { emailVerified?: boolean; providerData?: Array<{ providerId?: string | null }> }
    | null
    | undefined
): boolean {
  if (!fbUser) return false;
  return Boolean(fbUser.emailVerified || isPasswordProviderUser(fbUser));
}

export async function checkIsAdminMarker(uid: string): Promise<boolean> {
  if (!uid) return false;
  const docId = sanitizeFirestoreId(uid);
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.ADMINS, docId));
    return snap.exists();
  } catch {
    return false;
  }
}

async function safeUpsert(
  colName: string,
  rawId: string,
  createPayload: Record<string, any>,
  updatePayload: Record<string, any>
): Promise<void> {
  const docId = sanitizeFirestoreId(rawId);
  const path = `${colName}/${docId}`;
  const ref = doc(db, colName, docId);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(
        ref,
        stripUndefined({
          ...createPayload,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    } else {
      await updateDoc(
        ref,
        stripUndefined({
          ...updatePayload,
          serverUpdatedAt: serverTimestamp(),
        })
      );
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteDocFromFirestore(colName: string, rawId: string): Promise<void> {
  const docId = sanitizeFirestoreId(rawId);
  const path = `${colName}/${docId}`;
  try {
    await deleteDoc(doc(db, colName, docId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function ensureAdminMarker(uid: string, email: string): Promise<void> {
  const docId = sanitizeFirestoreId(uid);
  const path = `${COLLECTIONS.ADMINS}/${docId}`;
  const ref = doc(db, COLLECTIONS.ADMINS, docId);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid: docId,
        email: clampStr(email, 200) || ADMIN_BOOTSTRAP_EMAIL,
        serverCreatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function removeAdminMarker(uid: string): Promise<void> {
  const docId = sanitizeFirestoreId(uid);
  try {
    await deleteDoc(doc(db, COLLECTIONS.ADMINS, docId));
  } catch {
    /* ignore if absent */
  }
}

export async function fetchUserFromFirestore(uid: string): Promise<UserProfile | null> {
  const docId = sanitizeFirestoreId(uid);
  const path = `${COLLECTIONS.USERS}/${docId}`;
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.USERS, docId));
    if (!snap.exists()) return null;
    const d = snap.data() as any;
    return {
      id: d.id || docId,
      name: d.name,
      email: d.email,
      phone: d.phone,
      age: Number(d.age || 14),
      role: d.role,
      requestedRole: d.requestedRole,
      status: d.status,
      classId: d.classId,
      guardianPhone: d.guardianPhone,
      confessionFather: d.confessionFather,
      address: d.address,
      avatar: d.avatar,
      registeredAt: d.registeredAt || new Date().toISOString().split('T')[0],
      notes: d.notes,
      mergedIntoUid: d.mergedIntoUid,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function upsertUserToFirestore(user: UserProfile, docUidOverride?: string): Promise<void> {
  const docId = sanitizeFirestoreId(docUidOverride || user.id);
  const classId = normalizeClassId(user.classId);
  const fullPrivate = {
    id: docId,
    uid: docId,
    name: clampStr(user.name, 150) || 'مستخدم',
    email: clampStr(user.email, 200),
    phone: clampStr(user.phone || '01000000000', 30) || '01000000000',
    age: Math.min(120, Math.max(5, Number(user.age || 14))),
    role: user.role,
    requestedRole: user.requestedRole === 'servant' ? 'servant' : user.requestedRole === 'student' ? 'student' : undefined,
    status: user.status,
    classId,
    guardianPhone: clampStr(user.guardianPhone, 30),
    confessionFather: clampStr(user.confessionFather, 150),
    address: clampStr(user.address, 300),
    avatar: clampStr(user.avatar, 500),
    registeredAt: clampStr(user.registeredAt, 40) || new Date().toISOString().split('T')[0],
    notes: clampStr(user.notes, 1000),
    mergedIntoUid: user.mergedIntoUid ? sanitizeFirestoreId(user.mergedIntoUid) : undefined,
  };

  await safeUpsert(COLLECTIONS.USERS, docId, fullPrivate, {
    name: fullPrivate.name,
    email: fullPrivate.email,
    phone: fullPrivate.phone,
    age: fullPrivate.age,
    role: fullPrivate.role,
    requestedRole: fullPrivate.requestedRole,
    status: fullPrivate.status,
    classId: fullPrivate.classId,
    guardianPhone: fullPrivate.guardianPhone,
    confessionFather: fullPrivate.confessionFather,
    address: fullPrivate.address,
    avatar: fullPrivate.avatar,
    notes: fullPrivate.notes,
    mergedIntoUid: fullPrivate.mergedIntoUid,
  });

  const publicProfile = {
    id: docId,
    uid: docId,
    name: fullPrivate.name,
    role: fullPrivate.role,
    status: fullPrivate.status,
    classId: fullPrivate.classId,
    age: fullPrivate.age,
    registeredAt: fullPrivate.registeredAt,
  };

  await safeUpsert(COLLECTIONS.PUBLIC_PROFILES, docId, publicProfile, {
    name: publicProfile.name,
    role: publicProfile.role,
    status: publicProfile.status,
    classId: publicProfile.classId,
    age: publicProfile.age,
  });
}

export async function registerPendingUserToFirestore(
  user: UserProfile,
  docUidOverride?: string
): Promise<void> {
  const docId = sanitizeFirestoreId(docUidOverride || user.id);
  const authUser = auth.currentUser;
  if (!authUser || sanitizeFirestoreId(authUser.uid) !== docId) {
    throw new Error('AUTH_UID_MISMATCH');
  }
  if (!isPermittedAuthUser(authUser)) {
    throw new Error('UNVERIFIED_EMAIL');
  }

  const classId = normalizeClassId(user.classId);
  if (!classId) {
    throw new Error('INVALID_CLASS_ID');
  }

  const requestedRole = user.requestedRole === 'servant' ? 'servant' : 'student';
  const cleanName = clampStr(user.name?.trim(), 150) || 'عضو جديد';
  const cleanPhone = clampStr(user.phone?.trim(), 30) || '01000000000';
  const cleanAge = Math.min(120, Math.max(5, Number(user.age || 14)));
  const cleanRegisteredAt =
    clampStr(user.registeredAt, 40) || new Date().toISOString().split('T')[0];

  const fullPrivate = {
    id: docId,
    uid: docId,
    name: cleanName,
    email: clampStr(user.email?.trim(), 200),
    phone: cleanPhone,
    age: cleanAge,
    role: 'student' as const,
    requestedRole,
    status: 'pending' as const,
    classId,
    guardianPhone: clampStr(user.guardianPhone?.trim(), 30),
    confessionFather: clampStr(user.confessionFather?.trim(), 150),
    address: clampStr(user.address?.trim(), 300),
    avatar: clampStr(user.avatar?.trim(), 500),
    registeredAt: cleanRegisteredAt,
    notes: clampStr(user.notes?.trim(), 1000),
  };

  const publicProfile = {
    id: docId,
    uid: docId,
    name: cleanName,
    role: 'student' as const,
    status: 'pending' as const,
    classId,
    age: cleanAge,
    registeredAt: cleanRegisteredAt,
  };

  const userRef = doc(db, COLLECTIONS.USERS, docId);
  const pubRef = doc(db, COLLECTIONS.PUBLIC_PROFILES, docId);
  const path = `${COLLECTIONS.USERS}/${docId}`;

  try {
    const [userSnap, pubSnap] = await Promise.all([getDoc(userRef), getDoc(pubRef)]);
    const batch = writeBatch(db);

    if (userSnap.exists()) {
      const existing = userSnap.data() as Record<string, any>;
      if (existing.status === 'active') {
        throw new Error('ACCOUNT_ALREADY_ACTIVE');
      }
      if (existing.status === 'rejected') {
        throw new Error('ACCOUNT_REJECTED');
      }
      if (existing.status === 'suspended') {
        throw new Error('ACCOUNT_SUSPENDED');
      }
      // Existing pending document: update only owner-permitted keys per firestore.rules
      batch.update(
        userRef,
        stripUndefined({
          name: fullPrivate.name,
          phone: fullPrivate.phone,
          guardianPhone: fullPrivate.guardianPhone,
          confessionFather: fullPrivate.confessionFather,
          address: fullPrivate.address,
          avatar: fullPrivate.avatar,
          age: fullPrivate.age,
          requestedRole: fullPrivate.requestedRole,
          serverUpdatedAt: serverTimestamp(),
        })
      );
    } else {
      batch.set(
        userRef,
        stripUndefined({
          ...fullPrivate,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    }

    if (pubSnap.exists()) {
      const existingPub = pubSnap.data() as Record<string, any>;
      if (existingPub.status !== 'rejected' && existingPub.status !== 'suspended') {
        // Update only owner-permitted keys per firestore.rules
        batch.update(pubRef, {
          name: publicProfile.name,
          age: publicProfile.age,
          serverUpdatedAt: serverTimestamp(),
        });
      }
    } else {
      batch.set(
        pubRef,
        stripUndefined({
          ...publicProfile,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
    }

    await batch.commit();
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message === 'ACCOUNT_ALREADY_ACTIVE' ||
        error.message === 'ACCOUNT_REJECTED' ||
        error.message === 'ACCOUNT_SUSPENDED')
    ) {
      throw error;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function updateOwnProfileToFirestore(
  uid: string,
  updates: Partial<Pick<UserProfile, 'name' | 'phone' | 'guardianPhone' | 'confessionFather' | 'address' | 'avatar' | 'age' | 'requestedRole'>>
): Promise<void> {
  const docId = sanitizeFirestoreId(uid);
  const privateUpdate = stripUndefined({
    name: updates.name !== undefined ? clampStr(updates.name, 150) : undefined,
    phone: updates.phone !== undefined ? clampStr(updates.phone, 30) : undefined,
    guardianPhone: updates.guardianPhone !== undefined ? clampStr(updates.guardianPhone, 30) : undefined,
    confessionFather: updates.confessionFather !== undefined ? clampStr(updates.confessionFather, 150) : undefined,
    address: updates.address !== undefined ? clampStr(updates.address, 300) : undefined,
    avatar: updates.avatar !== undefined ? clampStr(updates.avatar, 500) : undefined,
    age: updates.age !== undefined ? Math.min(120, Math.max(5, Number(updates.age))) : undefined,
    requestedRole: updates.requestedRole,
    serverUpdatedAt: serverTimestamp(),
  });
  await updateDoc(doc(db, COLLECTIONS.USERS, docId), privateUpdate);

  const pubUpdate: Record<string, any> = {};
  if (privateUpdate.name !== undefined) pubUpdate.name = privateUpdate.name;
  if (privateUpdate.age !== undefined) pubUpdate.age = privateUpdate.age;
  if (Object.keys(pubUpdate).length > 0) {
    pubUpdate.serverUpdatedAt = serverTimestamp();
    await updateDoc(doc(db, COLLECTIONS.PUBLIC_PROFILES, docId), pubUpdate);
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  await deleteDocFromFirestore(COLLECTIONS.USERS, userId);
  await deleteDocFromFirestore(COLLECTIONS.PUBLIC_PROFILES, userId);
}

export async function upsertTermToFirestore(term: AcademicTerm, actorUid: string): Promise<void> {
  const id = sanitizeFirestoreId(term.id);
  const uid = sanitizeFirestoreId(actorUid);
  const payload = {
    id,
    title: clampStr(term.title, 150) || 'الترم',
    bookSubject: clampStr(term.bookSubject, 200) || 'دراسة كتابية',
    description: clampStr(term.description, 1000),
    sessionsCount: Math.min(52, Math.max(1, Number(term.sessionsCount || 8))),
    isCurrent: Boolean(term.isCurrent),
    startDate: clampStr(term.startDate, 40),
    endDate: clampStr(term.endDate, 40),
    createdByUid: uid,
  };
  await safeUpsert(COLLECTIONS.ACADEMIC_TERMS, id, payload, {
    title: payload.title,
    bookSubject: payload.bookSubject,
    description: payload.description,
    sessionsCount: payload.sessionsCount,
    isCurrent: payload.isCurrent,
    startDate: payload.startDate,
    endDate: payload.endDate,
  });
}

export async function upsertAssignedBookToFirestore(
  book: ClassAssignedBook,
  actorUid: string
): Promise<void> {
  const docKey = sanitizeFirestoreId(`${book.classId}_${book.termId || 'term_1'}`);
  const uid = sanitizeFirestoreId(actorUid);
  const payload = {
    id: docKey,
    classId: book.classId,
    bookId: clampStr(book.bookId, 128) || 'book',
    bookName: clampStr(book.bookName, 150) || 'سفر كتابي',
    testament: book.testament === 'new' ? 'new' : 'old',
    termId: clampStr(book.termId, 128) || 'term_1',
    assignedByServantName: clampStr(book.assignedByServantName, 150),
    assignedAt: clampStr(book.assignedAt, 40),
    targetSessionsCount: book.targetSessionsCount
      ? Math.min(52, Math.max(1, Number(book.targetSessionsCount)))
      : undefined,
    notes: clampStr(book.notes, 1000),
    customOverview: clampStr(book.customOverview, 3000),
    updatedByUid: uid,
  };
  await safeUpsert(COLLECTIONS.CLASS_ASSIGNED_BOOKS, docKey, payload, {
    bookId: payload.bookId,
    bookName: payload.bookName,
    testament: payload.testament,
    termId: payload.termId,
    assignedByServantName: payload.assignedByServantName,
    assignedAt: payload.assignedAt,
    targetSessionsCount: payload.targetSessionsCount,
    notes: payload.notes,
    customOverview: payload.customOverview,
    updatedByUid: uid,
  });
}

export async function upsertSessionToFirestore(
  session: BibleSession,
  actorUid: string
): Promise<void> {
  const id = sanitizeFirestoreId(session.id);
  const uid = sanitizeFirestoreId(actorUid);
  const cleanMemoryVerses = Array.isArray(session.memoryVerses)
    ? session.memoryVerses.slice(0, 30).map((mv, idx) => ({
        id: clampStr(mv.id || `mv_${idx}`, 128) || `mv_${idx}`,
        verse: clampStr(mv.verse, 1000) || '',
        reference: clampStr(mv.reference, 200) || '',
      }))
    : undefined;

  // Deliberately omit qrSecretCode from /sessions (secrets live in /session_qr_secrets)
  const payload = {
    id,
    title: clampStr(session.title, 200) || 'لقاء دراسة الكتاب المقدس',
    classId: session.classId,
    termId: clampStr(session.termId, 128),
    date: clampStr(session.date, 40) || new Date().toISOString().split('T')[0],
    biblePassage: clampStr(session.biblePassage, 300),
    servantName: clampStr(session.servantName, 150) || 'خادم الفصل',
    maxScorePerMetric: Math.min(100, Math.max(1, Number(session.maxScorePerMetric || 10))),
    qrActive: Boolean(session.qrActive),
    expiresAtMs: session.expiresAtMs || Date.now() + 3 * 60 * 60 * 1000,
    sessionNumber: session.sessionNumber
      ? Math.min(52, Math.max(1, Number(session.sessionNumber)))
      : undefined,
    bookId: clampStr(session.bookId, 128),
    bookName: clampStr(session.bookName, 150),
    testament: session.testament,
    coveredChapters: clampStr(session.coveredChapters, 200),
    objective: clampStr(session.objective, 1000),
    memoryVerse: clampStr(session.memoryVerse, 1000),
    memoryVerseRef: clampStr(session.memoryVerseRef, 200),
    memoryVerses: cleanMemoryVerses,
    lessonSummary: clampStr(session.lessonSummary, 5000),
    attachmentName: clampStr(session.attachmentName, 255),
    fileData: safeFileData(session.fileData),
    fileType: clampStr(session.fileType, 100),
    fileSize: clampStr(session.fileSize, 40),
    createdByUid: uid,
  };
  await safeUpsert(COLLECTIONS.SESSIONS, id, payload, {
    title: payload.title,
    termId: payload.termId,
    date: payload.date,
    biblePassage: payload.biblePassage,
    servantName: payload.servantName,
    qrActive: payload.qrActive,
    expiresAtMs: payload.expiresAtMs,
    sessionNumber: payload.sessionNumber,
    bookId: payload.bookId,
    bookName: payload.bookName,
    testament: payload.testament,
    coveredChapters: payload.coveredChapters,
    objective: payload.objective,
    memoryVerse: payload.memoryVerse,
    memoryVerseRef: payload.memoryVerseRef,
    memoryVerses: payload.memoryVerses,
    lessonSummary: payload.lessonSummary,
    attachmentName: payload.attachmentName,
    fileData: payload.fileData,
    fileType: payload.fileType,
    fileSize: payload.fileSize,
  });
}

export async function upsertSessionQrSecretToFirestore(
  secret: SessionQrSecret,
  actorUid: string
): Promise<SessionQrSecret> {
  const sessionId = sanitizeFirestoreId(secret.sessionId);
  const uid = sanitizeFirestoreId(actorUid);
  const expiresAtMs = secret.expiresAtMs || Date.now() + 3 * 60 * 60 * 1000;
  const code = clampStr(secret.qrSecretCode, 128) || generateQrSecretCode();
  const payload = {
    sessionId,
    classId: secret.classId,
    qrSecretCode: code,
    qrActive: Boolean(secret.qrActive),
    expiresAtMs,
    updatedByUid: uid,
  };
  await safeUpsert(COLLECTIONS.SESSION_QR_SECRETS, sessionId, payload, {
    qrSecretCode: payload.qrSecretCode,
    qrActive: payload.qrActive,
    expiresAtMs: payload.expiresAtMs,
    updatedByUid: uid,
  });
  return { ...payload };
}

export async function rotateSessionQrSecret(
  sessionId: string,
  classId: ClassId,
  actorUid: string,
  qrActive = true,
  ttlHours = 3
): Promise<SessionQrSecret> {
  const newSecret: SessionQrSecret = {
    sessionId: sanitizeFirestoreId(sessionId),
    classId,
    qrSecretCode: generateQrSecretCode(),
    qrActive,
    expiresAtMs: Date.now() + ttlHours * 60 * 60 * 1000,
    updatedByUid: sanitizeFirestoreId(actorUid),
  };
  const saved = await upsertSessionQrSecretToFirestore(newSecret, actorUid);
  try {
    await updateDoc(doc(db, COLLECTIONS.SESSIONS, newSecret.sessionId), {
      qrActive,
      expiresAtMs: newSecret.expiresAtMs,
      serverUpdatedAt: serverTimestamp(),
    });
  } catch {
    /* session doc may be updated separately */
  }
  return saved;
}

export async function upsertGradeToFirestore(
  grade: SessionGrade,
  actorUid: string,
  classId?: ClassId
): Promise<void> {
  const docId = sanitizeFirestoreId(grade.id || `${grade.sessionId}_${grade.studentId}`);
  const uid = sanitizeFirestoreId(actorUid);
  const resolvedClassId = normalizeClassId(classId || grade.classId);
  const payload = {
    id: docId,
    sessionId: sanitizeFirestoreId(grade.sessionId),
    sessionTitle: clampStr(grade.sessionTitle, 200) || 'لقاء الكتاب المقدس',
    date: clampStr(grade.date, 40) || new Date().toISOString().split('T')[0],
    studentId: sanitizeFirestoreId(grade.studentId),
    classId: resolvedClassId,
    termId: clampStr(grade.termId, 128),
    exam: Math.min(10, Math.max(0, Number(grade.exam || 0))),
    homework: Math.min(10, Math.max(0, Number(grade.homework || 0))),
    attendance: Math.min(1, Math.max(0, Number(grade.attendance || 0))),
    participation: Math.min(1, Math.max(0, Number(grade.participation || 0))),
    prayer: Math.min(1, Math.max(0, Number(grade.prayer || 0))),
    tools: Math.min(1, Math.max(0, Number(grade.tools || 0))),
    notes: clampStr(grade.notes, 1000),
    qrAttendedAt: clampStr(grade.qrAttendedAt, 60),
    updatedByUid: uid,
  };
  await safeUpsert(COLLECTIONS.GRADES, docId, payload, {
    sessionTitle: payload.sessionTitle,
    date: payload.date,
    classId: payload.classId,
    termId: payload.termId,
    exam: payload.exam,
    homework: payload.homework,
    attendance: payload.attendance,
    participation: payload.participation,
    prayer: payload.prayer,
    tools: payload.tools,
    notes: payload.notes,
    qrAttendedAt: payload.qrAttendedAt,
    updatedByUid: uid,
  });
}

export async function upsertBatchGradesToFirestore(
  grades: SessionGrade[],
  actorUid: string,
  classId: ClassId
): Promise<void> {
  if (grades.length === 0) return;
  const uid = sanitizeFirestoreId(actorUid);
  const CHUNK_SIZE = 350;

  for (let i = 0; i < grades.length; i += CHUNK_SIZE) {
    const chunk = grades.slice(i, i + CHUNK_SIZE);
    const existingFlags = await Promise.all(
      chunk.map(async (g) => {
        const docId = sanitizeFirestoreId(g.id || `${g.sessionId}_${g.studentId}`);
        const snap = await getDoc(doc(db, COLLECTIONS.GRADES, docId));
        return { docId, exists: snap.exists(), grade: g };
      })
    );

    const batch = writeBatch(db);
    for (const item of existingFlags) {
      const ref = doc(db, COLLECTIONS.GRADES, item.docId);
      const g = item.grade;
      const base = stripUndefined({
        sessionTitle: clampStr(g.sessionTitle, 200) || 'لقاء الكتاب المقدس',
        date: clampStr(g.date, 40) || new Date().toISOString().split('T')[0],
        classId,
        termId: clampStr(g.termId, 128),
        exam: Math.min(10, Math.max(0, Number(g.exam || 0))),
        homework: Math.min(10, Math.max(0, Number(g.homework || 0))),
        attendance: Math.min(1, Math.max(0, Number(g.attendance || 0))),
        participation: Math.min(1, Math.max(0, Number(g.participation || 0))),
        prayer: Math.min(1, Math.max(0, Number(g.prayer || 0))),
        tools: Math.min(1, Math.max(0, Number(g.tools || 0))),
        notes: clampStr(g.notes, 1000),
        qrAttendedAt: clampStr(g.qrAttendedAt, 60),
        updatedByUid: uid,
      });

      if (!item.exists) {
        batch.set(
          ref,
          stripUndefined({
            id: item.docId,
            sessionId: sanitizeFirestoreId(g.sessionId),
            studentId: sanitizeFirestoreId(g.studentId),
            ...base,
            serverCreatedAt: serverTimestamp(),
            serverUpdatedAt: serverTimestamp(),
          })
        );
      } else {
        batch.update(ref, {
          ...base,
          serverUpdatedAt: serverTimestamp(),
        });
      }
    }
    await batch.commit();
  }
}

export async function submitStudentQrAttendanceToFirestore(params: {
  session: BibleSession;
  studentId: string;
  classId: ClassId;
  submittedQrCode: string;
  qrAttendedAt: string;
}): Promise<void> {
  const { session, studentId, classId, submittedQrCode, qrAttendedAt } = params;
  const uid = sanitizeFirestoreId(studentId);
  const sessionId = sanitizeFirestoreId(session.id);
  const docId = sanitizeFirestoreId(`${sessionId}_${uid}`);
  const ref = doc(db, COLLECTIONS.GRADES, docId);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
    await setDoc(
      ref,
      stripUndefined({
        id: docId,
        sessionId,
        sessionTitle: clampStr(session.title, 200) || 'لقاء الكتاب المقدس',
        date: clampStr(session.date, 40) || new Date().toISOString().split('T')[0],
        studentId: uid,
        classId,
        termId: clampStr(session.termId, 128),
        exam: 0,
        homework: 0,
        attendance: 1,
        participation: 0,
        prayer: 0,
        tools: 0,
        submittedQrCode: clampStr(submittedQrCode, 128),
        qrAttendedAt: clampStr(qrAttendedAt, 60),
        updatedByUid: uid,
        serverCreatedAt: serverTimestamp(),
        serverUpdatedAt: serverTimestamp(),
      })
    );
  } else {
    const existing = snap.data() as SessionGrade;
    if (Number(existing.attendance || 0) >= 1) {
      throw new Error('تم تسجيل حضورك في هذه الحصة مسبقاً!');
    }
    await updateDoc(ref, {
      attendance: 1,
      submittedQrCode: clampStr(submittedQrCode, 128),
      qrAttendedAt: clampStr(qrAttendedAt, 60),
      updatedByUid: uid,
      serverUpdatedAt: serverTimestamp(),
    });
  }
}

export async function upsertFinalExamToFirestore(
  studentId: string,
  score: number,
  actorUid: string,
  classId?: ClassId
): Promise<void> {
  const docId = sanitizeFirestoreId(studentId);
  const uid = sanitizeFirestoreId(actorUid);
  const clamped = Math.min(40, Math.max(0, Number(score || 0)));
  const resolvedClass = normalizeClassId(classId);
  await safeUpsert(
    COLLECTIONS.FINAL_EXAMS,
    docId,
    {
      studentId: docId,
      classId: resolvedClass,
      score: clamped,
      updatedByUid: uid,
    },
    {
      classId: resolvedClass,
      score: clamped,
      updatedByUid: uid,
    }
  );
}

export async function upsertServantSubmissionToFirestore(
  sub: ServantAttendanceSubmission,
  actorUid: string
): Promise<void> {
  const id = sanitizeFirestoreId(sub.id);
  const uid = sanitizeFirestoreId(actorUid);
  const payload = {
    id,
    servantId: sanitizeFirestoreId(sub.servantId),
    createdByUid: uid,
    servantName: clampStr(sub.servantName, 150) || 'خادم',
    servantPhone: clampStr(sub.servantPhone, 30),
    meetingDate: clampStr(sub.meetingDate, 40) || new Date().toISOString().split('T')[0],
    meetingTitle: clampStr(sub.meetingTitle, 200) || 'اجتماع الخدمة',
    status: sub.status === 'absent' ? 'absent' : 'attending',
    absenceReason: clampStr(sub.absenceReason, 1000),
    prepTitle: clampStr(sub.prepTitle, 200),
    prepBibleVerse: clampStr(sub.prepBibleVerse, 300),
    prepAttachmentName: clampStr(sub.prepAttachmentName, 255),
    prepAttachmentType: sub.prepAttachmentType,
    prepAttachmentData: safeFileData(sub.prepAttachmentData),
    prepNotes: clampStr(sub.prepNotes, 3000),
    classId: normalizeClassId(sub.classId),
    submittedAt: clampStr(sub.submittedAt, 60) || new Date().toISOString(),
    viewedByAdmin: Boolean(sub.viewedByAdmin),
  };
  await safeUpsert(COLLECTIONS.SERVANT_SUBMISSIONS, id, payload, {
    prepTitle: payload.prepTitle,
    prepBibleVerse: payload.prepBibleVerse,
    prepAttachmentName: payload.prepAttachmentName,
    prepAttachmentType: payload.prepAttachmentType,
    prepAttachmentData: payload.prepAttachmentData,
    prepNotes: payload.prepNotes,
    absenceReason: payload.absenceReason,
    viewedByAdmin: payload.viewedByAdmin,
  });
}

export async function upsertLessonPostToFirestore(
  post: ServantLessonPost,
  actorUid: string
): Promise<void> {
  const id = sanitizeFirestoreId(post.id);
  const uid = sanitizeFirestoreId(actorUid);
  const payload = {
    id,
    servantId: sanitizeFirestoreId(post.servantId),
    createdByUid: uid,
    servantName: clampStr(post.servantName, 150) || 'خادم',
    classId: post.classId,
    title: clampStr(post.title, 200) || 'منشور تعليمي',
    category: post.category,
    bibleVerse: clampStr(post.bibleVerse, 1000),
    content: clampStr(post.content, 8000) || '-',
    attachmentName: clampStr(post.attachmentName, 255),
    attachmentUrl: clampStr(post.attachmentUrl, 1000),
    fileData: safeFileData(post.fileData),
    fileType: clampStr(post.fileType, 100),
    createdAt: clampStr(post.createdAt, 60) || new Date().toISOString().split('T')[0],
    status: post.status,
    rejectionReason: clampStr(post.rejectionReason, 1000),
    approvedBy: clampStr(post.approvedBy, 150),
    approvedAt: clampStr(post.approvedAt, 60),
    targetAudience: post.targetAudience,
    targetScope: post.targetScope,
  };
  await safeUpsert(COLLECTIONS.LESSON_POSTS, id, payload, {
    title: payload.title,
    bibleVerse: payload.bibleVerse,
    content: payload.content,
    attachmentName: payload.attachmentName,
    attachmentUrl: payload.attachmentUrl,
    fileData: payload.fileData,
    fileType: payload.fileType,
    status: payload.status,
    rejectionReason: payload.rejectionReason,
    approvedBy: payload.approvedBy,
    approvedAt: payload.approvedAt,
  });
}

export async function upsertLibraryBookToFirestore(
  book: LibraryBook,
  actorUid: string
): Promise<void> {
  const id = sanitizeFirestoreId(book.id);
  const uid = sanitizeFirestoreId(actorUid);
  const payload = {
    id,
    title: clampStr(book.title, 250) || 'كتاب',
    author: clampStr(book.author, 150) || 'غير محدد',
    category: book.category,
    description: clampStr(book.description, 3000) || '',
    targetClassId: clampStr(book.targetClassId, 64),
    downloadUrl: clampStr(book.downloadUrl, 1000),
    fileName: clampStr(book.fileName, 255),
    fileData: safeFileData(book.fileData),
    fileType: clampStr(book.fileType, 100),
    fileSize: clampStr(book.fileSize, 40),
    pageCount: book.pageCount ? Math.min(10000, Math.max(1, Number(book.pageCount))) : undefined,
    addedBy: clampStr(book.addedBy, 150) || 'أمين الخدمة',
    addedAt: clampStr(book.addedAt, 60) || new Date().toISOString().split('T')[0],
    createdByUid: uid,
  };
  await safeUpsert(COLLECTIONS.LIBRARY_BOOKS, id, payload, {
    title: payload.title,
    author: payload.author,
    category: payload.category,
    description: payload.description,
    targetClassId: payload.targetClassId,
    downloadUrl: payload.downloadUrl,
    fileName: payload.fileName,
    fileData: payload.fileData,
    fileType: payload.fileType,
    fileSize: payload.fileSize,
    pageCount: payload.pageCount,
  });
}

export async function upsertChurchEventToFirestore(
  event: ChurchEvent,
  actorUid: string
): Promise<void> {
  const id = sanitizeFirestoreId(event.id);
  const uid = sanitizeFirestoreId(actorUid);
  const payload = {
    id,
    title: clampStr(event.title, 250) || 'مناسبة',
    date: clampStr(event.date, 40) || new Date().toISOString().split('T')[0],
    time: clampStr(event.time, 40),
    location: clampStr(event.location, 250),
    description: clampStr(event.description, 3000) || '',
    type: event.type,
    targetAudience: event.targetAudience,
    targetClassId: clampStr(event.targetClassId, 64),
    status: event.status,
    createdBy: clampStr(event.createdBy, 150),
    createdByUid: uid,
    createdAt: clampStr(event.createdAt, 60) || new Date().toISOString().split('T')[0],
  };
  await safeUpsert(COLLECTIONS.CHURCH_EVENTS, id, payload, {
    title: payload.title,
    date: payload.date,
    time: payload.time,
    location: payload.location,
    description: payload.description,
    type: payload.type,
    targetAudience: payload.targetAudience,
    targetClassId: payload.targetClassId,
    status: payload.status,
  });
}

export async function upsertYearWorkLockToFirestore(
  classId: ClassId,
  locked: boolean,
  actorUid: string
): Promise<void> {
  const uid = sanitizeFirestoreId(actorUid);
  await safeUpsert(
    COLLECTIONS.YEAR_WORK_LOCKS,
    classId,
    {
      classId,
      locked: Boolean(locked),
      updatedByUid: uid,
    },
    {
      locked: Boolean(locked),
      updatedByUid: uid,
    }
  );
}

export async function upsertNotificationToFirestore(
  notif: AppNotification,
  actorUid: string
): Promise<void> {
  const id = sanitizeFirestoreId(notif.id);
  const uid = sanitizeFirestoreId(actorUid);
  const payload = {
    id,
    title: clampStr(notif.title, 200) || 'إشعار',
    message: clampStr(notif.message, 1000) || '',
    timestamp: clampStr(notif.timestamp, 60) || 'الآن',
    type: notif.type,
    read: Boolean(notif.read),
    actionUrl: clampStr(notif.actionUrl, 200),
    audienceUserId: clampStr(notif.audienceUserId, 128),
    audienceRoles: Array.isArray(notif.audienceRoles) ? notif.audienceRoles.slice(0, 4) : undefined,
    createdByUid: uid,
  };
  await safeUpsert(COLLECTIONS.NOTIFICATIONS, id, payload, {
    read: payload.read,
  });
}

export async function markNotificationReadInFirestore(notifId: string): Promise<void> {
  const id = sanitizeFirestoreId(notifId);
  try {
    await updateDoc(doc(db, COLLECTIONS.NOTIFICATIONS, id), {
      read: true,
      serverUpdatedAt: serverTimestamp(),
    });
  } catch {
    /* ignore */
  }
}

export async function linkLegacyUserToFirebaseUid(
  legacyUserId: string,
  realFirebaseUid: string,
  actorUid: string
): Promise<{ migratedGrades: number; migratedFinalExam: boolean }> {
  const srcId = sanitizeFirestoreId(legacyUserId);
  const destId = sanitizeFirestoreId(realFirebaseUid);
  const adminUid = sanitizeFirestoreId(actorUid);
  if (srcId === destId) return { migratedGrades: 0, migratedFinalExam: false };

  let migratedGrades = 0;
  let migratedFinalExam = false;

  const gradesSnap = await getDocs(
    query(collection(db, COLLECTIONS.GRADES), where('studentId', '==', srcId))
  );

  const destUserSnap = await getDoc(doc(db, COLLECTIONS.USERS, destId));
  const destClassId = destUserSnap.exists() ? (destUserSnap.data() as any).classId : undefined;

  const CHUNK = 350;
  for (let i = 0; i < gradesSnap.docs.length; i += CHUNK) {
    const slice = gradesSnap.docs.slice(i, i + CHUNK);
    const batch = writeBatch(db);
    for (const gDoc of slice) {
      const g = gDoc.data() as SessionGrade;
      const newGradeId = sanitizeFirestoreId(`${g.sessionId}_${destId}`);
      const existingDest = await getDoc(doc(db, COLLECTIONS.GRADES, newGradeId));
      if (!existingDest.exists()) {
        batch.set(
          doc(db, COLLECTIONS.GRADES, newGradeId),
          stripUndefined({
            id: newGradeId,
            sessionId: g.sessionId,
            sessionTitle: g.sessionTitle,
            date: g.date,
            studentId: destId,
            classId: g.classId || destClassId,
            termId: g.termId,
            exam: Number(g.exam || 0),
            homework: Number(g.homework || 0),
            attendance: Number(g.attendance || 0),
            participation: Number(g.participation || 0),
            prayer: Number(g.prayer || 0),
            tools: Number(g.tools || 0),
            notes: g.notes,
            qrAttendedAt: g.qrAttendedAt,
            updatedByUid: adminUid,
            serverCreatedAt: serverTimestamp(),
            serverUpdatedAt: serverTimestamp(),
          })
        );
        migratedGrades++;
      }
    }
    await batch.commit();
  }

  const finalSnap = await getDoc(doc(db, COLLECTIONS.FINAL_EXAMS, srcId));
  if (finalSnap.exists()) {
    const destFinalRef = doc(db, COLLECTIONS.FINAL_EXAMS, destId);
    const destFinalSnap = await getDoc(destFinalRef);
    if (!destFinalSnap.exists()) {
      const fData = finalSnap.data() as any;
      await setDoc(
        destFinalRef,
        stripUndefined({
          studentId: destId,
          classId: fData.classId || destClassId,
          score: Number(fData.score || 0),
          updatedByUid: adminUid,
          serverCreatedAt: serverTimestamp(),
          serverUpdatedAt: serverTimestamp(),
        })
      );
      migratedFinalExam = true;
    }
  }

  const legacyBatch = writeBatch(db);
  const srcUserRef = doc(db, COLLECTIONS.USERS, srcId);
  const srcPubRef = doc(db, COLLECTIONS.PUBLIC_PROFILES, srcId);
  const srcUserSnap = await getDoc(srcUserRef);
  if (srcUserSnap.exists()) {
    legacyBatch.update(srcUserRef, {
      status: 'suspended',
      mergedIntoUid: destId,
      serverUpdatedAt: serverTimestamp(),
    });
  }
  const srcPubSnap = await getDoc(srcPubRef);
  if (srcPubSnap.exists()) {
    legacyBatch.update(srcPubRef, {
      status: 'suspended',
      serverUpdatedAt: serverTimestamp(),
    });
  }
  await legacyBatch.commit();

  return { migratedGrades, migratedFinalExam };
}

export async function bootstrapExistingDataToFirestore(
  actorUid: string,
  state: {
    users: UserProfile[];
    academicTerms: AcademicTerm[];
    classAssignedBooks: Record<string, ClassAssignedBook>;
    sessions: BibleSession[];
    grades: SessionGrade[];
    finalExamScores: Record<string, number>;
    servantSubmissions: ServantAttendanceSubmission[];
    lessonPosts: ServantLessonPost[];
    libraryBooks: LibraryBook[];
    churchEvents: ChurchEvent[];
    yearWorkApprovedClasses: Record<string, boolean>;
    notifications: AppNotification[];
  }
): Promise<number> {
  let uploadedCount = 0;
  const email = auth.currentUser?.email || ADMIN_BOOTSTRAP_EMAIL;
  await ensureAdminMarker(actorUid, email);

  try {
    const existingUsersSnap = await getDocs(collection(db, COLLECTIONS.USERS));
    const existingUserIds = new Set(existingUsersSnap.docs.map((d) => d.id));
    for (const u of state.users) {
      const id = sanitizeFirestoreId(u.id);
      if (!existingUserIds.has(id)) {
        await upsertUserToFirestore(u, id);
        uploadedCount++;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.USERS);
  }

  try {
    const existingTerms = await getDocs(collection(db, COLLECTIONS.ACADEMIC_TERMS));
    const termIds = new Set(existingTerms.docs.map((d) => d.id));
    for (const t of state.academicTerms) {
      if (!termIds.has(sanitizeFirestoreId(t.id))) {
        await upsertTermToFirestore(t, actorUid);
        uploadedCount++;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.ACADEMIC_TERMS);
  }

  try {
    const existingAssigned = await getDocs(collection(db, COLLECTIONS.CLASS_ASSIGNED_BOOKS));
    const bookIds = new Set(existingAssigned.docs.map((d) => d.id));
    for (const b of Object.values(state.classAssignedBooks)) {
      const key = sanitizeFirestoreId(`${b.classId}_${b.termId || 'term_1'}`);
      if (!bookIds.has(key)) {
        await upsertAssignedBookToFirestore(b, actorUid);
        uploadedCount++;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.CLASS_ASSIGNED_BOOKS);
  }

  try {
    const existingSessions = await getDocs(collection(db, COLLECTIONS.SESSIONS));
    const sessionIds = new Set(existingSessions.docs.map((d) => d.id));
    for (const s of state.sessions) {
      const sid = sanitizeFirestoreId(s.id);
      if (!sessionIds.has(sid)) {
        await upsertSessionToFirestore(s, actorUid);
        await upsertSessionQrSecretToFirestore(
          {
            sessionId: sid,
            classId: s.classId,
            qrSecretCode: s.qrSecretCode || generateQrSecretCode(s.sessionNumber),
            qrActive: Boolean(s.qrActive),
            expiresAtMs: s.expiresAtMs || Date.now() + 3 * 60 * 60 * 1000,
          },
          actorUid
        );
        uploadedCount++;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.SESSIONS);
  }

  try {
    const existingGrades = await getDocs(collection(db, COLLECTIONS.GRADES));
    const gradeIds = new Set(existingGrades.docs.map((d) => d.id));
    for (const g of state.grades) {
      const gid = sanitizeFirestoreId(g.id || `${g.sessionId}_${g.studentId}`);
      if (!gradeIds.has(gid)) {
        const student = state.users.find((u) => u.id === g.studentId);
        const sess = state.sessions.find((s) => s.id === g.sessionId);
        await upsertGradeToFirestore(
          { ...g, id: gid },
          actorUid,
          g.classId || sess?.classId || student?.classId
        );
        uploadedCount++;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.GRADES);
  }

  try {
    const existingFinals = await getDocs(collection(db, COLLECTIONS.FINAL_EXAMS));
    const finalIds = new Set(existingFinals.docs.map((d) => d.id));
    for (const [studentId, score] of Object.entries(state.finalExamScores)) {
      if (!finalIds.has(sanitizeFirestoreId(studentId))) {
        const st = state.users.find((u) => u.id === studentId);
        await upsertFinalExamToFirestore(studentId, score, actorUid, st?.classId);
        uploadedCount++;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.FINAL_EXAMS);
  }

  try {
    const existingSubs = await getDocs(collection(db, COLLECTIONS.SERVANT_SUBMISSIONS));
    const subIds = new Set(existingSubs.docs.map((d) => d.id));
    for (const sub of state.servantSubmissions) {
      if (!subIds.has(sanitizeFirestoreId(sub.id))) {
        await upsertServantSubmissionToFirestore(sub, actorUid);
        uploadedCount++;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.SERVANT_SUBMISSIONS);
  }

  try {
    const existingPosts = await getDocs(collection(db, COLLECTIONS.LESSON_POSTS));
    const postIds = new Set(existingPosts.docs.map((d) => d.id));
    for (const p of state.lessonPosts) {
      if (!postIds.has(sanitizeFirestoreId(p.id))) {
        await upsertLessonPostToFirestore(p, actorUid);
        uploadedCount++;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.LESSON_POSTS);
  }

  try {
    const existingLib = await getDocs(collection(db, COLLECTIONS.LIBRARY_BOOKS));
    const libIds = new Set(existingLib.docs.map((d) => d.id));
    for (const b of state.libraryBooks) {
      if (!libIds.has(sanitizeFirestoreId(b.id))) {
        await upsertLibraryBookToFirestore(b, actorUid);
        uploadedCount++;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.LIBRARY_BOOKS);
  }

  try {
    const existingEvents = await getDocs(collection(db, COLLECTIONS.CHURCH_EVENTS));
    const evtIds = new Set(existingEvents.docs.map((d) => d.id));
    for (const ev of state.churchEvents) {
      if (!evtIds.has(sanitizeFirestoreId(ev.id))) {
        await upsertChurchEventToFirestore(ev, actorUid);
        uploadedCount++;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.CHURCH_EVENTS);
  }

  try {
    const existingLocks = await getDocs(collection(db, COLLECTIONS.YEAR_WORK_LOCKS));
    const lockIds = new Set(existingLocks.docs.map((d) => d.id));
    for (const [cid, locked] of Object.entries(state.yearWorkApprovedClasses)) {
      if (VALID_CLASSES.includes(cid as ClassId) && !lockIds.has(cid)) {
        await upsertYearWorkLockToFirestore(cid as ClassId, Boolean(locked), actorUid);
        uploadedCount++;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.YEAR_WORK_LOCKS);
  }

  try {
    const existingNotifs = await getDocs(collection(db, COLLECTIONS.NOTIFICATIONS));
    const notifIds = new Set(existingNotifs.docs.map((d) => d.id));
    for (const n of state.notifications) {
      if (!notifIds.has(sanitizeFirestoreId(n.id))) {
        await upsertNotificationToFirestore(n, actorUid);
        uploadedCount++;
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.LIST, COLLECTIONS.NOTIFICATIONS);
  }

  return uploadedCount;
}

export interface FirestoreSyncCallbacks {
  onUsers: (users: UserProfile[]) => void;
  onTerms: (terms: AcademicTerm[]) => void;
  onAssignedBooks: (books: Record<string, ClassAssignedBook>) => void;
  onSessions: (sessions: BibleSession[]) => void;
  onSessionQrSecrets: (secrets: Record<string, SessionQrSecret>) => void;
  onGrades: (grades: SessionGrade[]) => void;
  onFinalExams: (scores: Record<string, number>) => void;
  onServantSubs: (subs: ServantAttendanceSubmission[]) => void;
  onLessonPosts: (posts: ServantLessonPost[]) => void;
  onLibraryBooks: (books: LibraryBook[]) => void;
  onChurchEvents: (events: ChurchEvent[]) => void;
  onYearWorkLocks: (locks: Record<string, boolean>) => void;
  onNotifications: (notifs: AppNotification[]) => void;
  onError: (err: unknown) => void;
}

export function subscribeSchoolFirestore(
  role: UserRole,
  classId: ClassId | undefined,
  uid: string,
  cb: FirestoreSyncCallbacks
): () => void {
  const unsubs: Unsubscribe[] = [];
  const safeError = (op: OperationType, path: string) => (err: unknown) => {
    cb.onError(err);
    try {
      handleFirestoreError(err, op, path);
    } catch {
      /* surfaced via cb.onError */
    }
  };

  const isAdmin = role === 'admin';
  const isAdminOrAssistant = role === 'admin' || role === 'assistant';
  const isServant = role === 'servant';
  const scopedClass = normalizeClassId(classId) || 'primary_4';

  if (isAdmin) {
    unsubs.push(
      onSnapshot(
        collection(db, COLLECTIONS.USERS),
        (snap) => {
          cb.onUsers(snap.docs.map((d) => d.data() as UserProfile));
        },
        safeError(OperationType.LIST, COLLECTIONS.USERS)
      )
    );
  } else {
    unsubs.push(
      onSnapshot(
        query(collection(db, COLLECTIONS.PUBLIC_PROFILES), where('status', '==', 'active')),
        (snap) => {
          cb.onUsers(
            snap.docs.map((d) => {
              const data = d.data() as any;
              return {
                id: data.id,
                name: data.name,
                phone: '',
                age: Number(data.age || 14),
                role: data.role,
                status: data.status,
                classId: data.classId,
                registeredAt: data.registeredAt,
              } as UserProfile;
            })
          );
        },
        safeError(OperationType.LIST, COLLECTIONS.PUBLIC_PROFILES)
      )
    );
  }

  unsubs.push(
    onSnapshot(
      collection(db, COLLECTIONS.ACADEMIC_TERMS),
      (snap) => {
        cb.onTerms(snap.docs.map((d) => d.data() as AcademicTerm));
      },
      safeError(OperationType.LIST, COLLECTIONS.ACADEMIC_TERMS)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, COLLECTIONS.CLASS_ASSIGNED_BOOKS),
      (snap) => {
        const map: Record<string, ClassAssignedBook> = {};
        for (const d of snap.docs) {
          const item = d.data() as ClassAssignedBook;
          map[item.classId] = item;
          map[`${item.classId}_${item.termId}`] = item;
        }
        cb.onAssignedBooks(map);
      },
      safeError(OperationType.LIST, COLLECTIONS.CLASS_ASSIGNED_BOOKS)
    )
  );

  unsubs.push(
    onSnapshot(
      isAdminOrAssistant
        ? collection(db, COLLECTIONS.SESSIONS)
        : query(collection(db, COLLECTIONS.SESSIONS), where('classId', '==', scopedClass)),
      (snap) => {
        cb.onSessions(snap.docs.map((d) => d.data() as BibleSession));
      },
      safeError(OperationType.LIST, COLLECTIONS.SESSIONS)
    )
  );

  if (isAdminOrAssistant || isServant) {
    unsubs.push(
      onSnapshot(
        isAdminOrAssistant
          ? collection(db, COLLECTIONS.SESSION_QR_SECRETS)
          : query(collection(db, COLLECTIONS.SESSION_QR_SECRETS), where('classId', '==', scopedClass)),
        (snap) => {
          const map: Record<string, SessionQrSecret> = {};
          for (const d of snap.docs) {
            const item = d.data() as SessionQrSecret;
            map[item.sessionId || d.id] = item;
          }
          cb.onSessionQrSecrets(map);
        },
        safeError(OperationType.LIST, COLLECTIONS.SESSION_QR_SECRETS)
      )
    );
  } else {
    cb.onSessionQrSecrets({});
  }

  unsubs.push(
    onSnapshot(
      isAdminOrAssistant
        ? collection(db, COLLECTIONS.GRADES)
        : isServant
          ? query(collection(db, COLLECTIONS.GRADES), where('classId', '==', scopedClass))
          : query(collection(db, COLLECTIONS.GRADES), where('studentId', '==', uid)),
      (snap) => {
        cb.onGrades(snap.docs.map((d) => d.data() as SessionGrade));
      },
      safeError(OperationType.LIST, COLLECTIONS.GRADES)
    )
  );

  unsubs.push(
    onSnapshot(
      isAdminOrAssistant
        ? collection(db, COLLECTIONS.FINAL_EXAMS)
        : isServant
          ? query(collection(db, COLLECTIONS.FINAL_EXAMS), where('classId', '==', scopedClass))
          : query(collection(db, COLLECTIONS.FINAL_EXAMS), where('studentId', '==', uid)),
      (snap) => {
        const scores: Record<string, number> = {};
        for (const d of snap.docs) {
          const data = d.data() as any;
          scores[data.studentId || d.id] = Number(data.score || 0);
        }
        cb.onFinalExams(scores);
      },
      safeError(OperationType.LIST, COLLECTIONS.FINAL_EXAMS)
    )
  );

  if (isAdminOrAssistant || isServant) {
    unsubs.push(
      onSnapshot(
        isAdmin
          ? collection(db, COLLECTIONS.SERVANT_SUBMISSIONS)
          : query(collection(db, COLLECTIONS.SERVANT_SUBMISSIONS), where('createdByUid', '==', uid)),
        (snap) => {
          cb.onServantSubs(snap.docs.map((d) => d.data() as ServantAttendanceSubmission));
        },
        safeError(OperationType.LIST, COLLECTIONS.SERVANT_SUBMISSIONS)
      )
    );
  } else {
    cb.onServantSubs([]);
  }

  if (isAdmin) {
    unsubs.push(
      onSnapshot(
        collection(db, COLLECTIONS.LESSON_POSTS),
        (snap) => {
          cb.onLessonPosts(snap.docs.map((d) => d.data() as ServantLessonPost));
        },
        safeError(OperationType.LIST, COLLECTIONS.LESSON_POSTS)
      )
    );
  } else if (isServant || role === 'assistant') {
    let approvedPosts: ServantLessonPost[] = [];
    let ownPosts: ServantLessonPost[] = [];
    const emitMerged = () => {
      const merged = new Map<string, ServantLessonPost>();
      for (const p of approvedPosts) merged.set(p.id, p);
      for (const p of ownPosts) merged.set(p.id, p);
      cb.onLessonPosts(Array.from(merged.values()));
    };
    unsubs.push(
      onSnapshot(
        query(collection(db, COLLECTIONS.LESSON_POSTS), where('status', '==', 'approved')),
        (snap) => {
          approvedPosts = snap.docs.map((d) => d.data() as ServantLessonPost);
          emitMerged();
        },
        safeError(OperationType.LIST, COLLECTIONS.LESSON_POSTS)
      )
    );
    unsubs.push(
      onSnapshot(
        query(collection(db, COLLECTIONS.LESSON_POSTS), where('createdByUid', '==', uid)),
        (snap) => {
          ownPosts = snap.docs.map((d) => d.data() as ServantLessonPost);
          emitMerged();
        },
        safeError(OperationType.LIST, COLLECTIONS.LESSON_POSTS)
      )
    );
  } else {
    unsubs.push(
      onSnapshot(
        query(collection(db, COLLECTIONS.LESSON_POSTS), where('status', '==', 'approved')),
        (snap) => {
          cb.onLessonPosts(snap.docs.map((d) => d.data() as ServantLessonPost));
        },
        safeError(OperationType.LIST, COLLECTIONS.LESSON_POSTS)
      )
    );
  }

  unsubs.push(
    onSnapshot(
      collection(db, COLLECTIONS.LIBRARY_BOOKS),
      (snap) => {
        cb.onLibraryBooks(snap.docs.map((d) => d.data() as LibraryBook));
      },
      safeError(OperationType.LIST, COLLECTIONS.LIBRARY_BOOKS)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, COLLECTIONS.CHURCH_EVENTS),
      (snap) => {
        cb.onChurchEvents(snap.docs.map((d) => d.data() as ChurchEvent));
      },
      safeError(OperationType.LIST, COLLECTIONS.CHURCH_EVENTS)
    )
  );

  unsubs.push(
    onSnapshot(
      collection(db, COLLECTIONS.YEAR_WORK_LOCKS),
      (snap) => {
        const map: Record<string, boolean> = {};
        for (const d of snap.docs) {
          const item = d.data() as any;
          map[item.classId || d.id] = Boolean(item.locked);
        }
        cb.onYearWorkLocks(map);
      },
      safeError(OperationType.LIST, COLLECTIONS.YEAR_WORK_LOCKS)
    )
  );

  if (isAdmin) {
    unsubs.push(
      onSnapshot(
        collection(db, COLLECTIONS.NOTIFICATIONS),
        (snap) => {
          cb.onNotifications(snap.docs.map((d) => d.data() as AppNotification));
        },
        safeError(OperationType.LIST, COLLECTIONS.NOTIFICATIONS)
      )
    );
  } else {
    let directNotifs: AppNotification[] = [];
    let roleNotifs: AppNotification[] = [];
    const emitNotifs = () => {
      const merged = new Map<string, AppNotification>();
      for (const n of directNotifs) merged.set(n.id, n);
      for (const n of roleNotifs) merged.set(n.id, n);
      cb.onNotifications(Array.from(merged.values()));
    };
    unsubs.push(
      onSnapshot(
        query(collection(db, COLLECTIONS.NOTIFICATIONS), where('audienceUserId', '==', uid)),
        (snap) => {
          directNotifs = snap.docs.map((d) => d.data() as AppNotification);
          emitNotifs();
        },
        safeError(OperationType.LIST, COLLECTIONS.NOTIFICATIONS)
      )
    );
    unsubs.push(
      onSnapshot(
        query(collection(db, COLLECTIONS.NOTIFICATIONS), where('audienceRoles', 'array-contains', role)),
        (snap) => {
          roleNotifs = snap.docs.map((d) => d.data() as AppNotification);
          emitNotifs();
        },
        safeError(OperationType.LIST, COLLECTIONS.NOTIFICATIONS)
      )
    );
  }

  return () => {
    for (const u of unsubs) {
      try {
        u();
      } catch {
        /* ignore */
      }
    }
  };
}
