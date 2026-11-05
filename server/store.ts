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
  authSessions: SessionToken[];
}

const dir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(dir, 'data');
const dbPath = path.join(dataDir, 'db.json');

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
    authSessions: [],
  };
}

function ensureDir() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

export function loadDb(): DbShape {
  ensureDir();
  if (!fs.existsSync(dbPath)) {
    const seeded = emptyDb();
    saveDb(seeded);
    return seeded;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf8')) as Partial<DbShape>;
    return {
      users: Array.isArray(parsed.users) && parsed.users.length > 0 ? parsed.users : seedUsers(),
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
      authSessions: Array.isArray(parsed.authSessions) ? parsed.authSessions : [],
    };
  } catch {
    const seeded = emptyDb();
    saveDb(seeded);
    return seeded;
  }
}

export function saveDb(db: DbShape): void {
  ensureDir();
  const tmp = `${dbPath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  try {
    fs.renameSync(tmp, dbPath);
  } catch {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    fs.renameSync(tmp, dbPath);
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
