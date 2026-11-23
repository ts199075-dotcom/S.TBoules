import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';
import {
  COLLECTIONS,
  generateQrSecretCode,
  sanitizeFirestoreId,
} from './firestoreSync';
import { BibleSession, ClassId, SessionGrade, UserProfile } from '../types';

export interface MigrationReport {
  migratedQrSecrets: number;
  backfilledGradeClassIds: number;
  backfilledFinalExamClassIds: number;
  alreadyClean: boolean;
}

const VALID_CLASSES = new Set<ClassId>([
  'primary_4',
  'primary_5',
  'primary_6',
  'prep_1',
  'prep_2_3',
  'secondary',
  'adults',
]);

/**
 * Idempotent, non-destructive Firestore schema migration helper.
 * Never deletes any existing records; only creates missing /session_qr_secrets docs
 * and backfills missing classId fields on /grades and /final_exams.
 */
export async function runIdempotentFirestoreMigration(
  actorUid: string
): Promise<MigrationReport> {
  const uid = sanitizeFirestoreId(actorUid);
  let migratedQrSecrets = 0;
  let backfilledGradeClassIds = 0;
  let backfilledFinalExamClassIds = 0;

  const [usersSnap, sessionsSnap, secretsSnap, gradesSnap, finalsSnap] = await Promise.all([
    getDocs(collection(db, COLLECTIONS.USERS)),
    getDocs(collection(db, COLLECTIONS.SESSIONS)),
    getDocs(collection(db, COLLECTIONS.SESSION_QR_SECRETS)),
    getDocs(collection(db, COLLECTIONS.GRADES)),
    getDocs(collection(db, COLLECTIONS.FINAL_EXAMS)),
  ]);

  const userClassMap = new Map<string, ClassId>();
  usersSnap.docs.forEach((d) => {
    const u = d.data() as UserProfile;
    if (u.classId && VALID_CLASSES.has(u.classId)) {
      userClassMap.set(u.id || d.id, u.classId);
    }
  });

  const sessionClassMap = new Map<string, ClassId>();
  const existingSecretIds = new Set(secretsSnap.docs.map((d) => d.id));
  const pendingWrites: Array<{ ref: ReturnType<typeof doc>; data: Record<string, any>; isUpdate: boolean }> = [];

  for (const sDoc of sessionsSnap.docs) {
    const s = sDoc.data() as BibleSession;
    const sid = sanitizeFirestoreId(s.id || sDoc.id);
    if (s.classId && VALID_CLASSES.has(s.classId)) {
      sessionClassMap.set(sid, s.classId);
      if (!existingSecretIds.has(sid)) {
        pendingWrites.push({
          ref: doc(db, COLLECTIONS.SESSION_QR_SECRETS, sid),
          data: {
            sessionId: sid,
            classId: s.classId,
            qrSecretCode: s.qrSecretCode || generateQrSecretCode(s.sessionNumber),
            qrActive: Boolean(s.qrActive),
            expiresAtMs: s.expiresAtMs || Date.now() + 7 * 24 * 60 * 60 * 1000,
            updatedByUid: uid,
            serverCreatedAt: serverTimestamp(),
            serverUpdatedAt: serverTimestamp(),
          },
          isUpdate: false,
        });
        migratedQrSecrets++;
      }
    }
  }

  for (const gDoc of gradesSnap.docs) {
    const g = gDoc.data() as SessionGrade;
    if (!g.classId) {
      const inferredClass =
        sessionClassMap.get(sanitizeFirestoreId(g.sessionId)) ||
        userClassMap.get(sanitizeFirestoreId(g.studentId));
      if (inferredClass) {
        pendingWrites.push({
          ref: doc(db, COLLECTIONS.GRADES, gDoc.id),
          data: {
            classId: inferredClass,
            serverUpdatedAt: serverTimestamp(),
          },
          isUpdate: true,
        });
        backfilledGradeClassIds++;
      }
    }
  }

  for (const fDoc of finalsSnap.docs) {
    const f = fDoc.data() as { studentId?: string; classId?: ClassId };
    if (!f.classId) {
      const inferredClass = userClassMap.get(sanitizeFirestoreId(f.studentId || fDoc.id));
      if (inferredClass) {
        pendingWrites.push({
          ref: doc(db, COLLECTIONS.FINAL_EXAMS, fDoc.id),
          data: {
            classId: inferredClass,
            serverUpdatedAt: serverTimestamp(),
          },
          isUpdate: true,
        });
        backfilledFinalExamClassIds++;
      }
    }
  }

  const CHUNK = 350;
  for (let i = 0; i < pendingWrites.length; i += CHUNK) {
    const slice = pendingWrites.slice(i, i + CHUNK);
    const batch = writeBatch(db);
    for (const item of slice) {
      if (item.isUpdate) {
        batch.update(item.ref, item.data);
      } else {
        batch.set(item.ref, item.data);
      }
    }
    await batch.commit();
  }

  return {
    migratedQrSecrets,
    backfilledGradeClassIds,
    backfilledFinalExamClassIds,
    alreadyClean:
      migratedQrSecrets === 0 &&
      backfilledGradeClassIds === 0 &&
      backfilledFinalExamClassIds === 0,
  };
}
