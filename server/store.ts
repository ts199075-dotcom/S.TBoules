import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AppNotification,
  BibleSession,
  LibraryBook,
  ServantAttendanceSubmission,
  ServantLessonPost,
  SessionGrade,
  UserProfile,
  AcademicTerm,
  ChurchEvent,
} from '../src/types';
import {
  INITIAL_FINAL_EXAM_SCORES,
  INITIAL_LESSON_POSTS,
  INITIAL_LIBRARY_BOOKS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SERVANT_SUBMISSIONS,
  INITIAL_SESSION_GRADES,
  INITIAL_SESSIONS,
  INITIAL_USERS,
  INITIAL_TERMS,
} from '../src/data/mockData';
import { hashPassword } from './auth';

export interface SessionToken {
  token: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
}

export interface DbShape {
  users: UserProfile[];
  sessions: BibleSession[];
  grades: SessionGrade[];
  finalExamScores: Record<string, number>;
  servantSubmissions: ServantAttendanceSubmission[];
  notifications: AppNotification[];
  lessonPosts: ServantLessonPost[];
  libraryBooks: LibraryBook[];
  yearWorkApprovedClasses: Record<string, boolean>;
  academicTerms: AcademicTerm[];
  classAssignedBooks?: Record<string, any>;
  churchEvents: ChurchEvent[];
  authSessions: SessionToken[];
}

const dir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(dir, 'data');
const dbPath = path.join(dataDir, 'db.json');
const backupPath = path.join(dataDir, 'db.backup.json');

function seedUsers(): UserProfile[] {
  return INITIAL_USERS.map((u) => ({
    ...u,
    password: u.password ? hashPassword(u.password) : undefined,
  }));
}

function emptyDb(): DbShape {
  return {
    users: seedUsers(),
    sessions: [],
    grades: [],
    finalExamScores: {},
    servantSubmissions: [],
    notifications: [],
    lessonPosts: [],
    libraryBooks: [],
    yearWorkApprovedClasses: {},
    academicTerms: INITIAL_TERMS,
    classAssignedBooks: {},
    churchEvents: [],
    authSessions: [],
  };
}

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

export function loadDb(): DbShape {
  ensureDir();

  // Try reading primary dbPath, fallback to backupPath
  let raw: string | null = null;
  if (fs.existsSync(dbPath)) {
    try {
      raw = fs.readFileSync(dbPath, 'utf8');
    } catch {
      raw = null;
    }
  }

  if (!raw && fs.existsSync(backupPath)) {
    try {
      raw = fs.readFileSync(backupPath, 'utf8');
    } catch {
      raw = null;
    }
  }

  if (!raw) {
    const seeded = emptyDb();
    saveDb(seeded);
    return seeded;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DbShape>;
    const seededUsers = seedUsers();
    const existingUsers = Array.isArray(parsed.users) ? parsed.users : [];
    
    // Ensure admin and default users are always present, but retain all registered users
    const userMap = new Map<string, UserProfile>();
    for (const su of seededUsers) {
      userMap.set(su.id, su);
    }
    for (const eu of existingUsers) {
      if (eu && eu.id) userMap.set(eu.id, eu);
    }

    const mergedDb: DbShape = {
      users: Array.from(userMap.values()),
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      grades: Array.isArray(parsed.grades) ? parsed.grades : [],
      finalExamScores: parsed.finalExamScores && typeof parsed.finalExamScores === 'object' ? parsed.finalExamScores : {},
      servantSubmissions: Array.isArray(parsed.servantSubmissions) ? parsed.servantSubmissions : [],
      notifications: Array.isArray(parsed.notifications) ? parsed.notifications : [],
      lessonPosts: Array.isArray(parsed.lessonPosts) ? parsed.lessonPosts : [],
      libraryBooks: Array.isArray(parsed.libraryBooks) ? parsed.libraryBooks : [],
      yearWorkApprovedClasses: parsed.yearWorkApprovedClasses && typeof parsed.yearWorkApprovedClasses === 'object' ? parsed.yearWorkApprovedClasses : {},
      academicTerms: Array.isArray(parsed.academicTerms) && parsed.academicTerms.length > 0 ? parsed.academicTerms : INITIAL_TERMS,
      classAssignedBooks: parsed.classAssignedBooks && typeof parsed.classAssignedBooks === 'object' ? parsed.classAssignedBooks : {},
      churchEvents: Array.isArray(parsed.churchEvents) ? parsed.churchEvents : [],
      authSessions: Array.isArray(parsed.authSessions) ? parsed.authSessions : [],
    };

    return mergedDb;
  } catch {
    const seeded = emptyDb();
    saveDb(seeded);
    return seeded;
  }
}

export function saveDb(db: DbShape): void {
  ensureDir();
  const serialized = JSON.stringify(db, null, 2);
  const tmp = `${dbPath}.tmp`;
  try {
    fs.writeFileSync(tmp, serialized, 'utf8');
    try {
      fs.renameSync(tmp, dbPath);
    } catch {
      if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
      fs.renameSync(tmp, dbPath);
    }
    // Also update secondary backup
    try {
      fs.writeFileSync(backupPath, serialized, 'utf8');
    } catch {
      /* ignore */
    }
  } catch (err) {
    console.error('Failed to save DB:', err);
  }
}

export function mergeStateIntoDb(db: DbShape, incoming: Partial<DbShape>): void {
  if (Array.isArray(incoming.users)) {
    const uMap = new Map<string, UserProfile>();
    for (const u of db.users) uMap.set(u.id, u);
    for (const u of incoming.users) {
      if (u && u.id) {
        // Retain or update
        if (!uMap.has(u.id)) {
          uMap.set(u.id, u);
        } else {
          uMap.set(u.id, { ...uMap.get(u.id)!, ...u });
        }
      }
    }
    db.users = Array.from(uMap.values());
  }

  if (Array.isArray(incoming.sessions)) {
    const sMap = new Map<string, BibleSession>();
    for (const s of db.sessions) sMap.set(s.id, s);
    for (const s of incoming.sessions) {
      if (s && s.id) sMap.set(s.id, s);
    }
    db.sessions = Array.from(sMap.values());
  }

  if (Array.isArray(incoming.grades)) {
    const gMap = new Map<string, SessionGrade>();
    for (const g of db.grades) gMap.set(`${g.sessionId}_${g.studentId}`, g);
    for (const g of incoming.grades) {
      if (g && g.sessionId && g.studentId) {
        gMap.set(`${g.sessionId}_${g.studentId}`, g);
      }
    }
    db.grades = Array.from(gMap.values());
  }

  if (incoming.finalExamScores && typeof incoming.finalExamScores === 'object') {
    db.finalExamScores = { ...db.finalExamScores, ...incoming.finalExamScores };
  }

  if (Array.isArray(incoming.lessonPosts)) {
    const pMap = new Map<string, ServantLessonPost>();
    for (const p of db.lessonPosts) pMap.set(p.id, p);
    for (const p of incoming.lessonPosts) {
      if (p && p.id) pMap.set(p.id, p);
    }
    db.lessonPosts = Array.from(pMap.values());
  }

  if (Array.isArray(incoming.churchEvents)) {
    const eMap = new Map<string, ChurchEvent>();
    for (const e of db.churchEvents) eMap.set(e.id, e);
    for (const e of incoming.churchEvents) {
      if (e && e.id) eMap.set(e.id, e);
    }
    db.churchEvents = Array.from(eMap.values());
  }

  if (Array.isArray(incoming.libraryBooks)) {
    const bMap = new Map<string, LibraryBook>();
    for (const b of db.libraryBooks) bMap.set(b.id, b);
    for (const b of incoming.libraryBooks) {
      if (b && b.id) bMap.set(b.id, b);
    }
    db.libraryBooks = Array.from(bMap.values());
  }

  if (Array.isArray(incoming.servantSubmissions)) {
    const subMap = new Map<string, ServantAttendanceSubmission>();
    for (const s of db.servantSubmissions) subMap.set(s.id, s);
    for (const s of incoming.servantSubmissions) {
      if (s && s.id) subMap.set(s.id, s);
    }
    db.servantSubmissions = Array.from(subMap.values());
  }

  if (incoming.classAssignedBooks && typeof incoming.classAssignedBooks === 'object') {
    db.classAssignedBooks = { ...(db.classAssignedBooks || {}), ...incoming.classAssignedBooks };
  }

  if (Array.isArray(incoming.academicTerms) && incoming.academicTerms.length > 0) {
    const tMap = new Map<string, AcademicTerm>();
    for (const t of db.academicTerms) tMap.set(t.id, t);
    for (const t of incoming.academicTerms) {
      if (t && t.id) tMap.set(t.id, t);
    }
    db.academicTerms = Array.from(tMap.values());
  }

  if (incoming.yearWorkApprovedClasses && typeof incoming.yearWorkApprovedClasses === 'object') {
    db.yearWorkApprovedClasses = { ...(db.yearWorkApprovedClasses || {}), ...incoming.yearWorkApprovedClasses };
  }
}

export function resetDb(): DbShape {
  const seeded = emptyDb();
  saveDb(seeded);
  return seeded;
}

let writeChain: Promise<void> = Promise.resolve();

export function withDb<T>(mutator: (db: DbShape) => T): Promise<T> {
  const run = writeChain.then(() => {
    const db = loadDb();
    const result = mutator(db);
    saveDb(db);
    return result;
  });
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}
