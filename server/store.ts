import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  AppNotification,
  BibleSession,
  ServantAttendanceSubmission,
  ServantLessonPost,
  SessionGrade,
  UserProfile,
} from '../src/types';
import {
  INITIAL_FINAL_EXAM_SCORES,
  INITIAL_LESSON_POSTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SERVANT_SUBMISSIONS,
  INITIAL_SESSION_GRADES,
  INITIAL_SESSIONS,
  INITIAL_USERS,
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
    sessions: INITIAL_SESSIONS,
    grades: INITIAL_SESSION_GRADES,
    finalExamScores: { ...INITIAL_FINAL_EXAM_SCORES },
    servantSubmissions: INITIAL_SERVANT_SUBMISSIONS,
    notifications: INITIAL_NOTIFICATIONS,
    lessonPosts: INITIAL_LESSON_POSTS,
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
    const parsed = JSON.parse(fs.readFileSync(dbPath, 'utf8')) as DbShape;
    return {
      ...emptyDb(),
      ...parsed,
      users: parsed.users?.length ? parsed.users : seedUsers(),
      sessions: parsed.sessions || INITIAL_SESSIONS,
      grades: parsed.grades || [],
      finalExamScores: parsed.finalExamScores || {},
      servantSubmissions: parsed.servantSubmissions || [],
      notifications: parsed.notifications || [],
      lessonPosts: parsed.lessonPosts || [],
      authSessions: parsed.authSessions || [],
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
