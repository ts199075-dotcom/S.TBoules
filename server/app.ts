import express, { NextFunction, Request, Response } from 'express';
import {
  AppNotification,
  BibleSession,
  ClassId,
  ServantLessonPost,
  SessionGrade,
  UserProfile,
  UserRole,
} from '../src/types';
import { CLASSES_LIST, SAMPLE_USERS } from '../src/data/mockData';
import {
  clamp,
  computeClassLeaderboard,
  computeStudentScoreSummary,
  nextFridayIso,
  publicUser,
} from '../src/lib/scores';
import { createToken, hashPassword, sessionExpiry, verifyPassword } from './auth';
import { DbShape, loadDb, resetDb, saveDb, withDb } from './store';

const CLASS_IDS: ClassId[] = [
  'primary_4',
  'primary_5',
  'primary_6',
  'prep_1',
  'prep_2_3',
  'secondary',
  'adults',
];

const PHONE_RE = /^(01\d{9}|\d{10,15})$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface AuthedRequest extends Request {
  user?: UserProfile;
}

function nowStamp() {
  return new Date().toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit' });
}

function todayIso() {
  return new Date().toISOString().split('T')[0];
}

function jsonError(res: Response, status: number, message: string) {
  return res.status(status).json({ success: false, message });
}

function stripUser(u: UserProfile) {
  return publicUser(u);
}

function sessionForRole(session: BibleSession, role?: UserRole): BibleSession {
  if (role === 'admin' || role === 'assistant' || role === 'servant') return session;
  const { qrSecretCode: _secret, ...rest } = session;
  return { ...rest, qrSecretCode: '' };
}

function filterNotifications(db: DbShape, user: UserProfile | null): AppNotification[] {
  if (!user) return [];
  if (user.role === 'admin' || user.role === 'assistant') return db.notifications;
  return db.notifications.filter((n) => {
    if (n.audienceUserId && n.audienceUserId === user.id) return true;
    if (n.audienceRoles?.includes(user.role)) return true;
    if (n.type === 'post_approved' && (user.role === 'student' || user.role === 'servant')) return true;
    return false;
  });
}

function statePayload(db: DbShape, user: UserProfile | null) {
  return {
    currentUser: user ? stripUser(user) : null,
    users: db.users.map(stripUser),
    classes: CLASSES_LIST,
    sessions: db.sessions.map((s) => sessionForRole(s, user?.role)),
    grades: db.grades,
    finalExamScores: db.finalExamScores,
    servantSubmissions: db.servantSubmissions,
    notifications: filterNotifications(db, user),
    lessonPosts: db.lessonPosts.filter((p) => {
      if (!user) return p.status === 'approved';
      if (user.role === 'admin' || user.role === 'assistant') return true;
      if (user.role === 'servant') return p.servantId === user.id || p.status === 'approved';
      return p.status === 'approved' && p.classId === user.classId;
    }),
  };
}

function getToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) return header.slice(7);
  const q = req.headers['x-session-token'];
  if (typeof q === 'string' && q) return q;
  return null;
}

function resolveUser(db: DbShape, req: Request): UserProfile | null {
  const token = getToken(req);
  if (!token) return null;
  const now = Date.now();
  db.authSessions = db.authSessions.filter((s) => new Date(s.expiresAt).getTime() > now);
  const found = db.authSessions.find((s) => s.token === token);
  if (!found) return null;
  return db.users.find((u) => u.id === found.userId) || null;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const db = loadDb();
  const user = resolveUser(db, req);
  if (!user) return jsonError(res, 401, 'يلزم تسجيل الدخول.');
  req.user = user;
  next();
}

function requireRoles(roles: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return jsonError(res, 401, 'يلزم تسجيل الدخول.');
    if (!roles.includes(req.user.role)) return jsonError(res, 403, 'صلاحية غير كافية.');
    next();
  };
}

function findUserByIdentifier(db: DbShape, identifier: string) {
  const inputTrim = identifier.trim().toLowerCase();
  const phone = identifier.trim();
  return db.users.find(
    (u) =>
      (u.email && u.email.toLowerCase() === inputTrim) ||
      u.phone === phone ||
      u.name.toLowerCase() === inputTrim
  );
}

function pushNotif(
  db: DbShape,
  partial: Omit<AppNotification, 'id' | 'timestamp' | 'read'> & Partial<Pick<AppNotification, 'read'>>
) {
  db.notifications.unshift({
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: nowStamp(),
    read: false,
    ...partial,
  });
  db.notifications = db.notifications.slice(0, 200);
}

function validateRegister(body: Record<string, unknown>) {
  const name = String(body.name || '').trim();
  const phone = String(body.phone || '').trim();
  const password = String(body.password || '').trim();
  const email = String(body.email || '').trim();
  const age = Number(body.age);
  const role = body.role === 'servant' ? 'servant' : 'student';
  const classId = CLASS_IDS.includes(body.classId as ClassId) ? (body.classId as ClassId) : undefined;

  if (!name) return { error: 'برجاء كتابة الاسم الرباعي' };
  if (!PHONE_RE.test(phone)) return { error: 'برجاء إدخال رقم هاتف صحيح' };
  if (password.length < 6) return { error: 'كلمة المرور يجب ألا تقل عن ٦ أحرف' };
  if (!age || age < 6 || age > 90) return { error: 'برجاء إدخال سن صحيح بين ٦ و٩٠' };
  if (email && !EMAIL_RE.test(email)) return { error: 'صيغة البريد الإلكتروني غير صحيحة' };
  if ((role === 'student' || role === 'servant') && !classId) {
    return { error: 'برجاء اختيار الفصل الدراسي' };
  }
  return {
    data: {
      name,
      phone,
      password,
      email: email || undefined,
      age,
      role: role as UserRole,
      classId,
      guardianPhone: String(body.guardianPhone || '').trim() || undefined,
      confessionFather: String(body.confessionFather || '').trim() || undefined,
    },
  };
}

export function createApiApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '512kb' }));

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    if (req.method === 'OPTIONS') return res.status(204).end();
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'st-paul-school' });
  });

  app.post('/api/auth/login', async (req, res) => {
    const identifier = String(req.body?.identifier || '');
    const password = String(req.body?.password || '').trim();
    if (!identifier.trim() || !password) {
      return jsonError(res, 400, 'أدخل البريد أو الهاتف وكلمة المرور.');
    }

    const result = await withDb((db) => {
      const found = findUserByIdentifier(db, identifier);
      if (!found) return { status: 404, message: 'لم يتم العثور على حساب بهذا البريد أو رقم الهاتف.' };
      if (found.status === 'rejected') {
        return { status: 403, message: 'هذا الطلب مرفوض. تواصل مع أمين الخدمة للمراجعة.' };
      }
      const expected = found.password || found.phone;
      const ok = found.password ? verifyPassword(password, found.password) : expected === password;
      if (!ok) return { status: 401, message: 'كلمة المرور غير صحيحة.' };

      const token = createToken();
      db.authSessions.unshift({
        token,
        userId: found.id,
        createdAt: new Date().toISOString(),
        expiresAt: sessionExpiry(),
      });
      db.authSessions = db.authSessions.slice(0, 80);
      return { status: 200, token, user: stripUser(found), state: statePayload(db, found) };
    });

    if (result.status !== 200) return jsonError(res, result.status, result.message || 'فشل الدخول');
    return res.json({ success: true, message: 'تم تسجيل الدخول.', token: result.token, user: result.user, ...result.state });
  });

  app.post('/api/auth/register', async (req, res) => {
    const parsed = validateRegister(req.body || {});
    if ('error' in parsed && parsed.error) return jsonError(res, 400, parsed.error);
    const data = parsed.data!;

    const result = await withDb((db) => {
      const phoneTaken = db.users.some((u) => u.phone === data.phone);
      const emailTaken = data.email && db.users.some((u) => u.email?.toLowerCase() === data.email!.toLowerCase());
      if (phoneTaken) return { status: 409, message: 'رقم الهاتف مسجّل مسبقاً.' };
      if (emailTaken) return { status: 409, message: 'البريد الإلكتروني مسجّل مسبقاً.' };

      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        name: data.name,
        email: data.email,
        password: hashPassword(data.password),
        phone: data.phone,
        age: data.age,
        role: data.role,
        classId: data.classId,
        guardianPhone: data.guardianPhone,
        confessionFather: data.confessionFather,
        status: 'pending',
        registeredAt: todayIso(),
      };
      db.users.unshift(newUser);
      pushNotif(db, {
        title: data.role === 'servant' ? 'طلب انضمام خادم جديد' : 'طلب التحاق مخدوم جديد',
        message: `سجل ${newUser.name} (${data.role === 'servant' ? 'كخادم' : 'كمخدوم'}) وينتظر الموافقة للدخول للفصل.`,
        type: 'new_student',
        audienceRoles: ['admin', 'assistant'],
      });

      const token = createToken();
      db.authSessions.unshift({
        token,
        userId: newUser.id,
        createdAt: new Date().toISOString(),
        expiresAt: sessionExpiry(),
      });
      return { status: 201, token, user: stripUser(newUser), state: statePayload(db, newUser) };
    });

    if (result.status !== 201) return jsonError(res, result.status, result.message || 'تعذر التسجيل');
    return res.status(201).json({
      success: true,
      message: 'تم إرسال الطلب وهو قيد المراجعة.',
      token: result.token,
      user: result.user,
      ...result.state,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    const token = getToken(req);
    if (token) {
      const db = loadDb();
      db.authSessions = db.authSessions.filter((s) => s.token !== token);
      saveDb(db);
    }
    res.json({ success: true });
  });

  app.get('/api/state', (req, res) => {
    const db = loadDb();
    const user = resolveUser(db, req);
    res.json({ success: true, ...statePayload(db, user) });
  });

  app.post('/api/users/:id/approve', requireAuth, requireRoles(['admin', 'assistant']), async (req: AuthedRequest, res) => {
    const result = await withDb((db) => {
      const target = db.users.find((u) => u.id === req.params.id);
      if (!target) return { status: 404, message: 'المستخدم غير موجود.' };
      if (req.user && req.user.id === target.id) return { status: 403, message: 'لا يمكن اعتماد الحساب ذاتياً.' };
      target.status = 'active';
      pushNotif(db, {
        title: 'تم اعتماد الحساب بنجاح',
        message: `تم قبول انضمام ${target.name} وتفعيل حسابه في مدرسة سانت بولس.`,
        type: 'new_student',
        audienceUserId: target.id,
        audienceRoles: ['admin', 'assistant'],
      });
      return { status: 200, state: statePayload(db, req.user || null) };
    });
    if (result.status !== 200) return jsonError(res, result.status, result.message || 'فشل');
    res.json({ success: true, ...result.state });
  });

  app.post('/api/users/:id/reject', requireAuth, requireRoles(['admin', 'assistant']), async (req: AuthedRequest, res) => {
    const result = await withDb((db) => {
      const target = db.users.find((u) => u.id === req.params.id);
      if (!target) return { status: 404, message: 'المستخدم غير موجود.' };
      if (target.role === 'admin') return { status: 403, message: 'لا يمكن رفض حساب المسؤول.' };
      target.status = 'rejected';
      return { status: 200, state: statePayload(db, req.user || null) };
    });
    if (result.status !== 200) return jsonError(res, result.status, result.message || 'فشل');
    res.json({ success: true, ...result.state });
  });

  app.post('/api/users/:id/toggle-assistant', requireAuth, requireRoles(['admin']), async (req: AuthedRequest, res) => {
    const result = await withDb((db) => {
      const target = db.users.find((u) => u.id === req.params.id);
      if (!target) return { status: 404, message: 'المستخدم غير موجود.' };
      if (target.role === 'admin') return { status: 403, message: 'لا يمكن تعديل صلاحية المسؤول.' };
      const isNowAssistant = target.role !== 'assistant';
      target.role = isNowAssistant ? 'assistant' : 'servant';
      pushNotif(db, {
        title: isNowAssistant ? 'تعيين مساعد أمين الخدمة' : 'تحديث صلاحية',
        message: isNowAssistant
          ? `تم منح ${target.name} صلاحيات مساعد إدارة لمدرسة سانت بولس.`
          : `تم إعادة ضبط صلاحيات ${target.name} كخادم.`,
        type: 'role_assigned',
        audienceUserId: target.id,
        audienceRoles: ['admin'],
      });
      return { status: 200, state: statePayload(db, req.user || null) };
    });
    if (result.status !== 200) return jsonError(res, result.status, result.message || 'فشل');
    res.json({ success: true, ...result.state });
  });

  app.delete('/api/users/:id', requireAuth, requireRoles(['admin']), async (req: AuthedRequest, res) => {
    const result = await withDb((db) => {
      const target = db.users.find((u) => u.id === req.params.id);
      if (!target) return { status: 404, message: 'المستخدم غير موجود.' };
      if (target.role === 'admin') return { status: 403, message: 'لا يمكن حذف المسؤول.' };
      db.users = db.users.filter((u) => u.id !== req.params.id);
      db.grades = db.grades.filter((g) => g.studentId !== req.params.id);
      delete db.finalExamScores[req.params.id];
      db.authSessions = db.authSessions.filter((s) => s.userId !== req.params.id);
      return { status: 200, state: statePayload(db, req.user || null) };
    });
    if (result.status !== 200) return jsonError(res, result.status, result.message || 'فشل');
    res.json({ success: true, ...result.state });
  });

  app.post('/api/grades', requireAuth, requireRoles(['admin', 'assistant', 'servant']), async (req: AuthedRequest, res) => {
    const studentId = String(req.body?.studentId || '');
    const sessionId = String(req.body?.sessionId || '');
    if (!studentId || !sessionId) return jsonError(res, 400, 'بيانات الدرجة ناقصة.');

    const result = await withDb((db) => {
      const session = db.sessions.find((s) => s.id === sessionId);
      const student = db.users.find((u) => u.id === studentId);
      if (!session || !student) return { status: 404, message: 'اللقاء أو الطالب غير موجود.' };
      if (req.user?.role === 'servant' && req.user.classId && student.classId !== req.user.classId) {
        return { status: 403, message: 'لا يمكنك رصد درجات خارج فصلك.' };
      }

      const existingIdx = db.grades.findIndex((g) => g.sessionId === sessionId && g.studentId === studentId);
      const prev = existingIdx >= 0 ? db.grades[existingIdx] : undefined;
      const completeRecord: SessionGrade = {
        id: prev?.id || `grd-${Date.now()}`,
        sessionId,
        sessionTitle: session.title,
        date: session.date,
        studentId,
        exam: clamp(Number(req.body.exam ?? prev?.exam ?? 0), 0, 10),
        homework: clamp(Number(req.body.homework ?? prev?.homework ?? 0), 0, 10),
        attendance: clamp(Number(req.body.attendance ?? prev?.attendance ?? 0), 0, 1),
        participation: clamp(Number(req.body.participation ?? prev?.participation ?? 0), 0, 1),
        prayer: clamp(Number(req.body.prayer ?? prev?.prayer ?? 0), 0, 1),
        tools: clamp(Number(req.body.tools ?? prev?.tools ?? 0), 0, 1),
        notes: req.body.notes ?? prev?.notes ?? '',
        qrAttendedAt: req.body.qrAttendedAt ?? prev?.qrAttendedAt,
      };
      if (existingIdx >= 0) db.grades[existingIdx] = completeRecord;
      else db.grades.push(completeRecord);

      pushNotif(db, {
        title: 'تحديث درجات الطالب',
        message: `تم تحديث درجات الطالب "${student.name}" في ${session.title}.`,
        type: 'grade_updated',
        audienceUserId: student.id,
        audienceRoles: ['admin', 'assistant'],
      });
      return { status: 200, state: statePayload(db, req.user || null) };
    });
    if (result.status !== 200) return jsonError(res, result.status, result.message || 'فشل');
    res.json({ success: true, ...result.state });
  });

  app.post('/api/attendance/qr', requireAuth, async (req: AuthedRequest, res) => {
    const sessionId = String(req.body?.sessionId || '');
    const secretCode = String(req.body?.secretCode || '').trim();
    const actor = req.user!;
    if (actor.role !== 'student') return jsonError(res, 403, 'تسجيل الحضور بالرمز مخصص للطلاب.');
    if (actor.status !== 'active') return jsonError(res, 403, 'الحساب قيد المراجعة.');
    if (!secretCode) return jsonError(res, 400, 'أدخل كود الجلسة الظاهر مع الخادم.');

    const result = await withDb((db) => {
      const session = db.sessions.find((s) => s.id === sessionId);
      const student = db.users.find((u) => u.id === actor.id);
      if (!session) return { status: 404, message: 'اللقاء المحدد غير موجود' };
      if (!session.qrActive) return { status: 400, message: 'كود الحضور لهذا اللقاء مغلق حالياً من قِبل الخادم' };
      if (student?.classId && student.classId !== session.classId) {
        return { status: 403, message: 'هذا اللقاء ليس لفصلك الدراسي' };
      }
      if (secretCode !== session.qrSecretCode) {
        return { status: 400, message: 'كود الجلسة غير صحيح. انقله كما يظهر مع الخادم.' };
      }

      const timeString = nowStamp();
      const existingIdx = db.grades.findIndex((g) => g.sessionId === sessionId && g.studentId === actor.id);
      if (existingIdx >= 0) {
        db.grades[existingIdx] = {
          ...db.grades[existingIdx],
          attendance: 1,
          qrAttendedAt: timeString,
        };
      } else {
        db.grades.push({
          id: `grd-${Date.now()}`,
          sessionId,
          sessionTitle: session.title,
          date: session.date,
          studentId: actor.id,
          exam: 0,
          homework: 0,
          attendance: 1,
          participation: 0,
          prayer: 0,
          tools: 0,
          qrAttendedAt: timeString,
          notes: 'تم تسجيل الحضور عبر رمز الجلسة بنجاح',
        });
      }

      pushNotif(db, {
        title: 'تسجيل حضور عبر رمز الجلسة',
        message: `قام الطالب "${student?.name || 'مخدوم'}" بتسجيل حضوره في ${session.title}.`,
        type: 'qr_attendance',
        audienceRoles: ['admin', 'assistant', 'servant'],
        audienceUserId: actor.id,
      });

      return {
        status: 200,
        message: `تم تسجيل حضورك بنجاح في ${session.title} وحصلت على درجة الحضور (١ من ١)!`,
        state: statePayload(db, student || actor),
      };
    });

    if (result.status !== 200) return jsonError(res, result.status, result.message || 'فشل');
    res.json({ success: true, message: result.message, ...result.state });
  });

  app.post('/api/sessions/:id/qr', requireAuth, requireRoles(['admin', 'assistant', 'servant']), async (req: AuthedRequest, res) => {
    const active = Boolean(req.body?.active);
    const result = await withDb((db) => {
      const session = db.sessions.find((s) => s.id === req.params.id);
      if (!session) return { status: 404, message: 'اللقاء غير موجود.' };
      session.qrActive = active;
      return { status: 200, state: statePayload(db, req.user || null) };
    });
    if (result.status !== 200) return jsonError(res, result.status, result.message || 'فشل');
    res.json({ success: true, ...result.state });
  });

  app.post('/api/final-exam', requireAuth, requireRoles(['admin', 'assistant']), async (req: AuthedRequest, res) => {
    const studentId = String(req.body?.studentId || '');
    const score = clamp(Number(req.body?.score ?? 0), 0, 40);
    if (!studentId) return jsonError(res, 400, 'معرّف الطالب ناقص.');
    const result = await withDb((db) => {
      if (!db.users.some((u) => u.id === studentId)) return { status: 404, message: 'الطالب غير موجود.' };
      db.finalExamScores[studentId] = score;
      return { status: 200, state: statePayload(db, req.user || null) };
    });
    if (result.status !== 200) return jsonError(res, result.status, result.message || 'فشل');
    res.json({ success: true, ...result.state });
  });

  app.post('/api/sessions', requireAuth, requireRoles(['admin', 'assistant', 'servant']), async (req: AuthedRequest, res) => {
    const title = String(req.body?.title || '').trim();
    const classId = req.body?.classId as ClassId;
    if (!title) return jsonError(res, 400, 'عنوان اللقاء مطلوب.');
    if (!CLASS_IDS.includes(classId)) return jsonError(res, 400, 'فصل غير صالح.');
    const result = await withDb((db) => {
      const newSession: BibleSession = {
        title,
        classId,
        date: String(req.body?.date || todayIso()),
        biblePassage: String(req.body?.biblePassage || 'شواهد مختارة'),
        servantName: String(req.body?.servantName || req.user?.name || 'أمانة الخدمة'),
        maxScorePerMetric: 10,
        id: `sess-${Date.now()}`,
        qrSecretCode: `STPAUL-${Date.now().toString(36).toUpperCase()}`,
        qrActive: true,
      };
      db.sessions.unshift(newSession);
      return { status: 200, session: newSession, state: statePayload(db, req.user || null) };
    });
    res.json({ success: true, session: result.session, ...result.state });
  });

  app.post('/api/servant/check-in', requireAuth, requireRoles(['servant', 'assistant', 'admin']), async (req: AuthedRequest, res) => {
    const status: 'absent' | 'attending' = req.body?.status === 'absent' ? 'absent' : 'attending';
    const result = await withDb((db) => {
      const currentUser = db.users.find((u) => u.id === req.user!.id)!;
      const newSub = {
        id: `sub-${Date.now()}`,
        servantId: currentUser.id,
        servantName: currentUser.name,
        servantPhone: currentUser.phone,
        meetingDate: nextFridayIso(),
        meetingTitle: 'اجتماع الجمعة القادم - كنيسة رئيس الملائكة والأمير تادرس الشطبي',
        status,
        absenceReason: status === 'absent' ? String(req.body?.absenceReason || '') : undefined,
        prepTitle: status === 'attending' ? String(req.body?.prepTitle || '') : undefined,
        prepBibleVerse: status === 'attending' ? String(req.body?.prepBibleVerse || '') : undefined,
        prepAttachmentName: status === 'attending' ? String(req.body?.prepAttachmentName || '') : undefined,
        prepAttachmentType: req.body?.prepAttachmentType,
        prepNotes: status === 'attending' ? String(req.body?.prepNotes || '') : undefined,
        submittedAt: new Date().toLocaleString('ar-EG'),
        viewedByAdmin: false,
      };
      db.servantSubmissions = [newSub, ...db.servantSubmissions.filter((s) => s.servantId !== currentUser.id)];
      pushNotif(db, {
        title: status === 'attending' ? `رفع تحضير درس: ${currentUser.name}` : `اعتذار خادم: ${currentUser.name}`,
        message:
          status === 'attending'
            ? `قام الخادم ${currentUser.name} برفع تحضير درس (${newSub.prepTitle || 'مذكرة الأسبوع'}).`
            : `قدم الخادم ${currentUser.name} اعتذاراً عن الحضور بسبب: ${newSub.absenceReason || 'ظرف طارئ'}.`,
        type: status === 'attending' ? 'prep_upload' : 'absence',
        audienceRoles: ['admin', 'assistant'],
      });
      return { status: 200, state: statePayload(db, currentUser) };
    });
    res.json({ success: true, ...result.state });
  });

  app.post('/api/posts', requireAuth, async (req: AuthedRequest, res) => {
    const title = String(req.body?.title || '').trim();
    const content = String(req.body?.content || '').trim();
    const classId = req.body?.classId as ClassId;
    if (!title || !content) return jsonError(res, 400, 'العنوان والمحتوى مطلوبان.');
    if (!CLASS_IDS.includes(classId)) return jsonError(res, 400, 'فصل غير صالح.');
    if (req.user!.status !== 'active') return jsonError(res, 403, 'الحساب قيد المراجعة.');

    const result = await withDb((db) => {
      const currentUser = db.users.find((u) => u.id === req.user!.id)!;
      const isAdmin = currentUser.role === 'admin' || currentUser.role === 'assistant';
      const post: ServantLessonPost = {
        id: `post-${Date.now()}`,
        servantId: currentUser.id,
        servantName: currentUser.name,
        classId,
        title,
        category: req.body?.category || 'lesson_handout',
        bibleVerse: String(req.body?.bibleVerse || ''),
        content,
        attachmentName: String(req.body?.attachmentName || '') || undefined,
        createdAt: todayIso(),
        status: isAdmin ? 'approved' : 'pending_approval',
        approvedBy: isAdmin ? currentUser.name : undefined,
        approvedAt: isAdmin ? todayIso() : undefined,
      };
      db.lessonPosts.unshift(post);
      pushNotif(db, {
        title: isAdmin ? 'تم نشر إعلان/مذكرة جديدة' : 'مادة تعليمية جديدة بانتظار الاعتماد',
        message: isAdmin
          ? `قام أمين الخدمة بنشر منشور جديد بعنوان "${title}".`
          : `قام الخادم "${currentUser.name}" برفع منشور بعنوان: "${title}".`,
        type: isAdmin ? 'post_approved' : 'post_pending',
        audienceRoles: isAdmin ? ['admin', 'assistant', 'student', 'servant'] : ['admin', 'assistant'],
      });
      return { status: 200, state: statePayload(db, currentUser) };
    });
    res.json({ success: true, ...result.state });
  });

  app.post('/api/posts/:id/approve', requireAuth, requireRoles(['admin', 'assistant']), async (req: AuthedRequest, res) => {
    const result = await withDb((db) => {
      const post = db.lessonPosts.find((p) => p.id === req.params.id);
      if (!post) return { status: 404, message: 'المنشور غير موجود.' };
      post.status = 'approved';
      post.approvedBy = req.user?.name || 'أمين الخدمة';
      post.approvedAt = todayIso();
      pushNotif(db, {
        title: 'تم اعتماد ونشر المادة التعليمية',
        message: `وافق مسؤول النظام على نشر: "${post.title}" وأصبحت متاحة للطلاب الآن.`,
        type: 'post_approved',
        audienceRoles: ['admin', 'assistant', 'student', 'servant'],
        audienceUserId: post.servantId,
      });
      return { status: 200, state: statePayload(db, req.user || null) };
    });
    if (result.status !== 200) return jsonError(res, result.status, result.message || 'فشل');
    res.json({ success: true, ...result.state });
  });

  app.post('/api/posts/:id/reject', requireAuth, requireRoles(['admin', 'assistant']), async (req: AuthedRequest, res) => {
    const result = await withDb((db) => {
      const post = db.lessonPosts.find((p) => p.id === req.params.id);
      if (!post) return { status: 404, message: 'المنشور غير موجود.' };
      post.status = 'rejected';
      post.rejectionReason = String(req.body?.reason || 'مرفوض من أمانة الخدمة');
      return { status: 200, state: statePayload(db, req.user || null) };
    });
    if (result.status !== 200) return jsonError(res, result.status, result.message || 'فشل');
    res.json({ success: true, ...result.state });
  });

  app.post('/api/notifications/:id/read', requireAuth, async (req: AuthedRequest, res) => {
    const result = await withDb((db) => {
      const n = db.notifications.find((item) => item.id === req.params.id);
      if (n) n.read = true;
      return statePayload(db, req.user || null);
    });
    res.json({ success: true, ...result });
  });

  app.delete('/api/notifications', requireAuth, requireRoles(['admin']), async (req: AuthedRequest, res) => {
    const result = await withDb((db) => {
      db.notifications = [];
      return statePayload(db, req.user || null);
    });
    res.json({ success: true, ...result });
  });

  app.post('/api/admin/reset', requireAuth, requireRoles(['admin']), async (req: AuthedRequest, res) => {
    const db = resetDb();
    const admin = db.users.find((u) => u.role === 'admin') || null;
    res.json({ success: true, ...statePayload(db, admin) });
  });

  app.post('/api/admin/seed', requireAuth, requireRoles(['admin']), async (req: AuthedRequest, res) => {
    const result = await withDb((db) => {
      const extras = SAMPLE_USERS.filter((u) => !db.users.some((x) => x.id === u.id || x.phone === u.phone)).map(
        (u) => ({ ...u, password: hashPassword(u.phone) })
      );
      db.users = [...db.users, ...extras];
      return statePayload(db, req.user || null);
    });
    res.json({ success: true, ...result });
  });

  app.get('/api/scores/:studentId', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    res.json({
      success: true,
      summary: computeStudentScoreSummary(
        req.params.studentId,
        db.users,
        db.sessions,
        db.grades,
        db.finalExamScores
      ),
    });
  });

  app.get('/api/leaderboard/:classId', requireAuth, (req: AuthedRequest, res) => {
    const db = loadDb();
    const classId = req.params.classId as ClassId;
    if (!CLASS_IDS.includes(classId)) return jsonError(res, 400, 'فصل غير صالح.');
    res.json({
      success: true,
      leaderboard: computeClassLeaderboard(classId, db.users, db.sessions, db.grades, db.finalExamScores),
    });
  });

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[api]', err);
    jsonError(res, 500, 'حدث خطأ غير متوقع في الخادم.');
  });

  return app;
}
