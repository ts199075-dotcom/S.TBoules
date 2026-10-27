import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '15mb' }));

// Central Data Store File Path
const DATA_DIR = path.resolve(__dirname, 'data');
const DB_FILE = path.resolve(DATA_DIR, 'st_paul_db.json');

// Initial baseline users with admin credentials
const INITIAL_ADMIN = {
  id: 'admin-ts',
  name: 'أمين الخدمة ومسؤول النظام',
  email: 'ts199075@gmail.com',
  phone: '01000000000',
  password: '987321987',
  age: 35,
  role: 'admin',
  status: 'active',
  registeredAt: '2026-09-01',
  notes: 'الحساب الرئيسي لإدارة مدرسة سانت بولس للكتاب المقدس',
};

// Initial sessions for the 7 classes
const INITIAL_SESSIONS = [
  {
    id: 'sess-p4-1',
    title: 'اللقاء الأول: خلقة العالم ومحبة الله الفائقة',
    classId: 'primary_4',
    date: '2026-10-24',
    biblePassage: 'تكوين ١ : ١ - تكوين ٢ : ٧',
    servantName: 'أمانة الخدمة',
    maxScorePerMetric: 10,
    qrSecretCode: 'STPAUL-P4-101',
    qrActive: true,
  },
  {
    id: 'sess-p5-1',
    title: 'اللقاء الأول: خروج الشعب وخروف الفصح',
    classId: 'primary_5',
    date: '2026-10-24',
    biblePassage: 'خروج ١٢ : ١ - خروج ١٢ : ١٤',
    servantName: 'أمانة الخدمة',
    maxScorePerMetric: 10,
    qrSecretCode: 'STPAUL-P5-101',
    qrActive: true,
  },
  {
    id: 'sess-p6-1',
    title: 'اللقاء الأول: يشوع بن نون وعبور الأردن',
    classId: 'primary_6',
    date: '2026-10-24',
    biblePassage: 'يشوع ٣ : ١ - يشوع ٣ : ١٧',
    servantName: 'أمانة الخدمة',
    maxScorePerMetric: 10,
    qrSecretCode: 'STPAUL-P6-101',
    qrActive: true,
  },
  {
    id: 'sess-prep1-1',
    title: 'اللقاء الأول: مزامير داود النبي والرجاء المسياني',
    classId: 'prep_1',
    date: '2026-10-24',
    biblePassage: 'مزمور ٢٢ : ١ - مزمور ٢٢ : ٣١',
    servantName: 'أمانة الخدمة',
    maxScorePerMetric: 10,
    qrSecretCode: 'STPAUL-PR1-101',
    qrActive: true,
  },
  {
    id: 'sess-prep23-1',
    title: 'اللقاء الأول: دعوة القديس بولس وررسالته إلى غلاطية',
    classId: 'prep_2_3',
    date: '2026-10-24',
    biblePassage: 'غلاطية ١ : ١ - غلاطية ١ : ٢٤',
    servantName: 'أمانة الخدمة',
    maxScorePerMetric: 10,
    qrSecretCode: 'STPAUL-PR23-101',
    qrActive: true,
  },
  {
    id: 'sess-sec-1',
    title: 'اللقاء الأول: لاهوت الفداء وبر الله في رسالة رومية',
    classId: 'secondary',
    date: '2026-10-24',
    biblePassage: 'رومية ٣ : ٢١ - رومية ٥ : ١',
    servantName: 'أمانة الخدمة',
    maxScorePerMetric: 10,
    qrSecretCode: 'STPAUL-SEC-101',
    qrActive: true,
  },
  {
    id: 'sess-adults-1',
    title: 'اللقاء الأول: المدخل الآبائي لدراسة العهد الجديد',
    classId: 'adults',
    date: '2026-10-24',
    biblePassage: 'عبرانيين ١ : ١ - عبرانيين ٢ : ٤',
    servantName: 'أمانة الخدمة',
    maxScorePerMetric: 10,
    qrSecretCode: 'STPAUL-AD-101',
    qrActive: true,
  },
];

interface CentralDB {
  users: any[];
  sessions: any[];
  grades: any[];
  finalExamScores: Record<string, number>;
  servantSubmissions: any[];
  notifications: any[];
  lessonPosts: any[];
  yearWorkApprovedClasses: Record<string, boolean>;
}

function getInitialDB(): CentralDB {
  return {
    users: [INITIAL_ADMIN],
    sessions: INITIAL_SESSIONS,
    grades: [],
    finalExamScores: {},
    servantSubmissions: [],
    notifications: [],
    lessonPosts: [],
    yearWorkApprovedClasses: {},
  };
}

function loadDB(): CentralDB {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDB();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const content = fs.readFileSync(DB_FILE, 'utf8');
    const parsed = JSON.parse(content);
    // Ensure admin user is always present
    if (!parsed.users || !parsed.users.some((u: any) => u.email === INITIAL_ADMIN.email)) {
      parsed.users = [INITIAL_ADMIN, ...(parsed.users || [])];
      saveDB(parsed);
    }
    return parsed;
  } catch (err) {
    console.error('Error reading DB, using initial DB:', err);
    return getInitialDB();
  }
}

function saveDB(db: CentralDB): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  } catch (err) {
    console.error('Error writing DB:', err);
  }
}

// In-memory cache synced to disk
let currentDB = loadDB();

// API Endpoints for Central Database

// 1. Health & Status
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Fetch Central State (Used by all devices on load and polling)
app.get('/api/state', (_req: Request, res: Response) => {
  // Reload in case file was touched externally
  currentDB = loadDB();
  res.json({ success: true, data: currentDB });
});

// 3. User Registration (Student or Servant from mobile or desktop)
app.post('/api/register', (req: Request, res: Response) => {
  try {
    const data = req.body;
    if (!data.name || !data.phone) {
      res.status(400).json({ success: false, message: 'الاسم ورقم الهاتف مطلوبان' });
      return;
    }

    const newId = `user-${Date.now()}`;
    const newUser = {
      ...data,
      id: newId,
      status: 'pending', // Requires admin approval
      registeredAt: new Date().toISOString().split('T')[0],
    };

    currentDB.users = [newUser, ...currentDB.users];

    // Notification for Admin
    const newNotif = {
      id: `notif-${Date.now()}`,
      title: data.role === 'servant' ? 'طلب انضمام خادم جديد' : 'طلب التحاق مخدوم جديد',
      message: `سجل ${newUser.name} (${data.role === 'servant' ? 'كخادم' : 'كمخدوم'}) وينتظر موافقة أمين الخدمة.`,
      timestamp: 'الآن',
      type: 'new_student',
      read: false,
    };
    currentDB.notifications = [newNotif, ...currentDB.notifications];

    saveDB(currentDB);
    res.json({ success: true, user: newUser, data: currentDB });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Admin User Actions (Approve, Reject, Toggle Assistant, Delete)
app.post('/api/users/action', (req: Request, res: Response) => {
  try {
    const { action, userId } = req.body;
    if (!action || !userId) {
      res.status(400).json({ success: false, message: 'البيانات غير مكتملة' });
      return;
    }

    const targetUser = currentDB.users.find((u) => u.id === userId);

    if (action === 'approve') {
      currentDB.users = currentDB.users.map((u) =>
        u.id === userId ? { ...u, status: 'active' } : u
      );
      if (targetUser) {
        currentDB.notifications = [
          {
            id: `notif-${Date.now()}`,
            title: 'تم اعتماد وتفعيل الحساب ✅',
            message: `تم قبول انضمام ${targetUser.name} وتفعيل حسابه رسمياً.`,
            timestamp: 'الآن',
            type: 'new_student',
            read: false,
          },
          ...currentDB.notifications,
        ];
      }
    } else if (action === 'reject') {
      currentDB.users = currentDB.users.map((u) =>
        u.id === userId ? { ...u, status: 'rejected' } : u
      );
    } else if (action === 'toggleAssistant') {
      currentDB.users = currentDB.users.map((u) => {
        if (u.id === userId) {
          const newRole = u.role === 'assistant' ? 'servant' : 'assistant';
          return { ...u, role: newRole };
        }
        return u;
      });
    } else if (action === 'delete') {
      currentDB.users = currentDB.users.filter((u) => u.id !== userId);
    } else if (action === 'changeClass') {
      const { newClassId } = req.body;
      currentDB.users = currentDB.users.map((u) =>
        u.id === userId ? { ...u, classId: newClassId } : u
      );
    } else if (action === 'updateServant') {
      const { role, classId } = req.body;
      currentDB.users = currentDB.users.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            role: role || u.role,
            classId: classId !== undefined ? classId : u.classId,
          };
        }
        return u;
      });
    } else if (action === 'addStudent') {
      const { student } = req.body;
      if (student) {
        const newStudent = {
          ...student,
          id: `stud-${Date.now()}`,
          status: 'active',
          role: 'student',
          registeredAt: new Date().toISOString().split('T')[0],
        };
        currentDB.users = [newStudent, ...currentDB.users];
      }
    }

    saveDB(currentDB);
    res.json({ success: true, data: currentDB });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Grades (Add / Update session score)
app.post('/api/grades', (req: Request, res: Response) => {
  try {
    const gradeData = req.body;
    const { studentId, sessionId } = gradeData;
    if (!studentId || !sessionId) {
      res.status(400).json({ success: false, message: 'معرف الطالب والحصة مطلوبان' });
      return;
    }

    const existingIndex = currentDB.grades.findIndex(
      (g) => g.studentId === studentId && g.sessionId === sessionId
    );

    if (existingIndex >= 0) {
      currentDB.grades[existingIndex] = {
        ...currentDB.grades[existingIndex],
        ...gradeData,
      };
    } else {
      currentDB.grades.push({
        id: `grd-${Date.now()}`,
        studentId,
        sessionId,
        attendance: 1,
        exam: 0,
        homework: 0,
        participation: 1,
        prayer: 1,
        tools: 1,
        ...gradeData,
      });
    }

    saveDB(currentDB);
    res.json({ success: true, data: currentDB });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 6. QR Attendance Scanner
app.post('/api/qr-attendance', (req: Request, res: Response) => {
  try {
    const { studentId, sessionId } = req.body;
    const session = currentDB.sessions.find((s) => s.id === sessionId);
    if (!session) {
      res.json({ success: false, message: 'الحصة غير موجودة' });
      return;
    }
    if (!session.qrActive) {
      res.json({ success: false, message: 'كود الـ QR الخاص بهذه الحصة غير مفعّل حالياً' });
      return;
    }

    const existingIndex = currentDB.grades.findIndex(
      (g) => g.studentId === studentId && g.sessionId === sessionId
    );

    if (existingIndex >= 0) {
      currentDB.grades[existingIndex] = {
        ...currentDB.grades[existingIndex],
        attendance: 1,
      };
    } else {
      currentDB.grades.push({
        id: `grd-${Date.now()}`,
        studentId,
        sessionId,
        attendance: 1,
        exam: 0,
        homework: 0,
        participation: 1,
        prayer: 1,
        tools: 1,
      });
    }

    saveDB(currentDB);
    res.json({ success: true, message: `تم تسجيل حضورك بنجاح في: ${session.title}` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Final Exam Score
app.post('/api/final-exam', (req: Request, res: Response) => {
  try {
    const { studentId, score } = req.body;
    currentDB.finalExamScores[studentId] = Number(score);
    saveDB(currentDB);
    res.json({ success: true, data: currentDB });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Sessions (Add / Toggle QR)
app.post('/api/sessions', (req: Request, res: Response) => {
  try {
    const { action, session, sessionId, active } = req.body;
    if (action === 'toggleQr') {
      currentDB.sessions = currentDB.sessions.map((s) =>
        s.id === sessionId ? { ...s, qrActive: active } : s
      );
    } else if (action === 'add') {
      const newSession = {
        ...session,
        id: `sess-${Date.now()}`,
        qrSecretCode: `STPAUL-SEC-${Math.floor(100 + Math.random() * 900)}`,
        qrActive: true,
      };
      currentDB.sessions.push(newSession);
    }

    saveDB(currentDB);
    res.json({ success: true, data: currentDB });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Servant Check-in & Lesson Prep
app.post('/api/servant-submissions', (req: Request, res: Response) => {
  try {
    const submission = {
      ...req.body,
      id: `sub-${Date.now()}`,
      submittedAt: new Date().toISOString(),
    };
    currentDB.servantSubmissions = [submission, ...currentDB.servantSubmissions];

    const newNotif = {
      id: `notif-${Date.now()}`,
      title: 'تحضير وحضور خادم جديد',
      message: `قام ${submission.servantName || 'خادم'} بتقديم تحضير درس: ${submission.prepTitle || 'حضور الحصة'}`,
      timestamp: 'الآن',
      type: 'servant_prep',
      read: false,
    };
    currentDB.notifications = [newNotif, ...currentDB.notifications];

    saveDB(currentDB);
    res.json({ success: true, data: currentDB });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Lesson Posts (Targeted per class or all)
app.post('/api/posts', (req: Request, res: Response) => {
  try {
    const { action, post, postId, reason, updated } = req.body;

    if (action === 'create') {
      const newPost = {
        ...post,
        id: `post-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0],
      };
      currentDB.lessonPosts = [newPost, ...currentDB.lessonPosts];

      currentDB.notifications = [
        {
          id: `notif-${Date.now()}`,
          title: newPost.status === 'published' ? 'منشور دراسي جديد' : 'طلب اعتماد منشور لفصل',
          message: `${newPost.authorName}: ${newPost.title}`,
          timestamp: 'الآن',
          type: 'announcement',
          read: false,
        },
        ...currentDB.notifications,
      ];
    } else if (action === 'approve') {
      currentDB.lessonPosts = currentDB.lessonPosts.map((p) =>
        p.id === postId ? { ...p, status: 'published' } : p
      );
    } else if (action === 'reject') {
      currentDB.lessonPosts = currentDB.lessonPosts.map((p) =>
        p.id === postId ? { ...p, status: 'rejected', rejectionReason: reason } : p
      );
    } else if (action === 'delete') {
      currentDB.lessonPosts = currentDB.lessonPosts.filter((p) => p.id !== postId);
    } else if (action === 'update') {
      currentDB.lessonPosts = currentDB.lessonPosts.map((p) =>
        p.id === postId ? { ...p, ...updated } : p
      );
    }

    saveDB(currentDB);
    res.json({ success: true, data: currentDB });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. 8-Session Year-Work Calculation Approval Lock
app.post('/api/year-work-lock', (req: Request, res: Response) => {
  try {
    const { classId, locked } = req.body;
    currentDB.yearWorkApprovedClasses = {
      ...currentDB.yearWorkApprovedClasses,
      [classId]: Boolean(locked),
    };

    if (locked) {
      currentDB.notifications = [
        {
          id: `notif-${Date.now()}`,
          title: 'اعتماد درجات أعمال السنة 🎓',
          message: `تم اعتماد واحتساب متوسط أعمال السنة (٦٠ درجة) للـ ٨ حصص بنجاح.`,
          timestamp: 'الآن',
          type: 'grade_updated',
          read: false,
        },
        ...currentDB.notifications,
      ];
    }

    saveDB(currentDB);
    res.json({ success: true, data: currentDB });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Notifications (Mark read / Clear)
app.post('/api/notifications', (req: Request, res: Response) => {
  try {
    const { action, id } = req.body;
    if (action === 'markRead') {
      currentDB.notifications = currentDB.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
    } else if (action === 'clear') {
      currentDB.notifications = [];
    }

    saveDB(currentDB);
    res.json({ success: true, data: currentDB });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. Admin Demo Seed / Reset
app.post('/api/admin/reset', (req: Request, res: Response) => {
  try {
    const { action } = req.body;
    if (action === 'reset') {
      currentDB = getInitialDB();
    } else if (action === 'clear') {
      currentDB.users = [INITIAL_ADMIN];
      currentDB.grades = [];
      currentDB.finalExamScores = {};
      currentDB.servantSubmissions = [];
      currentDB.lessonPosts = [];
      currentDB.yearWorkApprovedClasses = {};
    }
    saveDB(currentDB);
    res.json({ success: true, data: currentDB });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Vite Middleware for Development / Static Serve for Production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Saint Paul Bible School Central Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
