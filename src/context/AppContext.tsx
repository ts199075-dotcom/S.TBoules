import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  UserProfile,
  ClassId,
  SessionGrade,
  BibleSession,
  ServantAttendanceSubmission,
  AppNotification,
  ClassInfo,
  StudentScoreSummary,
  ServantLessonPost,
} from '../types';
import {
  CLASSES_LIST,
  INITIAL_USERS,
  INITIAL_SESSIONS,
  INITIAL_SESSION_GRADES,
  INITIAL_FINAL_EXAM_SCORES,
  INITIAL_SERVANT_SUBMISSIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_LESSON_POSTS,
  SAMPLE_USERS,
} from '../data/mockData';
import { readStoredJson, readStoredString, writeStoredJson } from '../lib/storage';
import { apiHealth, apiRequest, ApiError, getApiToken, setApiToken } from '../lib/api';
import { clamp, computeClassLeaderboard, computeStudentScoreSummary, nextFridayIso } from '../lib/scores';

type BackendStatus = 'connecting' | 'online' | 'offline';

interface AppContextType {
  currentUser: UserProfile | null;
  users: UserProfile[];
  classes: ClassInfo[];
  sessions: BibleSession[];
  grades: SessionGrade[];
  finalExamScores: Record<string, number>;
  servantSubmissions: ServantAttendanceSubmission[];
  notifications: AppNotification[];
  lessonPosts: ServantLessonPost[];
  theme: 'light' | 'dark';
  backendStatus: BackendStatus;
  toggleTheme: () => void;
  setCurrentUser: (user: UserProfile | null) => void;
  switchUserById: (userId: string) => void;
  login: (identifier: string, password: string) => Promise<{ success: boolean; message: string }>;
  registerUser: (data: Omit<UserProfile, 'id' | 'status' | 'registeredAt'>) => Promise<UserProfile>;
  logout: () => void;
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  toggleAssistantRole: (userId: string) => void;
  deleteUser: (userId: string) => void;
  saveSessionGrade: (gradeData: Partial<SessionGrade> & { studentId: string; sessionId: string }) => void;
  recordQrAttendance: (
    studentId: string,
    sessionId: string,
    secretCode?: string
  ) => Promise<{ success: boolean; message: string }>;
  toggleSessionQr: (sessionId: string, active: boolean) => void;
  updateFinalExamScore: (studentId: string, score: number) => void;
  addNewSession: (session: Omit<BibleSession, 'id' | 'qrSecretCode' | 'qrActive'>) => BibleSession;
  submitServantCheckIn: (data: {
    status: 'attending' | 'absent';
    absenceReason?: string;
    prepTitle?: string;
    prepBibleVerse?: string;
    prepAttachmentName?: string;
    prepAttachmentType?: 'document' | 'pdf' | 'notes';
    prepNotes?: string;
  }) => void;
  createLessonPost: (postData: {
    title: string;
    category: 'lesson_handout' | 'bible_study' | 'quiz' | 'announcement';
    bibleVerse: string;
    content: string;
    attachmentName?: string;
    classId: ClassId;
  }) => void;
  approveLessonPost: (postId: string) => void;
  rejectLessonPost: (postId: string, reason?: string) => void;
  getStudentScoreSummary: (studentId: string) => StudentScoreSummary;
  getClassLeaderboard: (classId: ClassId) => StudentScoreSummary[];
  getStudentSessionGrades: (studentId: string) => SessionGrade[];
  addStudentByAdmin: (studentData: Omit<UserProfile, 'id' | 'role' | 'status' | 'registeredAt'>) => Promise<UserProfile>;
  changeStudentClass: (studentId: string, newClassId: ClassId) => void;
  updateServantProfile: (servantId: string, updates: { role?: UserProfile['role']; classId?: ClassId }) => void;
  yearWorkApprovedClasses: Record<string, boolean>;
  calculateAndLockYearWork: (classId: ClassId) => void;
  unlockYearWorkCalculation: (classId: ClassId) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  resetDemoData: () => void;
  seedDemoData: () => void;
  clearAllStudentsAndServants: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'st_paul_users_v5',
  CURRENT_USER_ID: 'st_paul_current_uid_v5',
  SESSIONS: 'st_paul_sessions_v5',
  GRADES: 'st_paul_grades_v5',
  FINAL_SCORES: 'st_paul_final_scores_v5',
  SERVANT_SUBS: 'st_paul_servant_subs_v5',
  NOTIFS: 'st_paul_notifs_v5',
  POSTS: 'st_paul_posts_v5',
  THEME: 'st_paul_theme_v5',
};

type RemoteState = {
  currentUser?: UserProfile | null;
  users?: UserProfile[];
  sessions?: BibleSession[];
  grades?: SessionGrade[];
  finalExamScores?: Record<string, number>;
  servantSubmissions?: ServantAttendanceSubmission[];
  notifications?: AppNotification[];
  lessonPosts?: ServantLessonPost[];
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = readStoredString(STORAGE_KEYS.THEME, 'light');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('connecting');
  const [users, setUsers] = useState<UserProfile[]>(() => readStoredJson(STORAGE_KEYS.USERS, INITIAL_USERS));
  const [currentUserId, setCurrentUserId] = useState<string>(() => readStoredString(STORAGE_KEYS.CURRENT_USER_ID, ''));
  const [sessions, setSessions] = useState<BibleSession[]>(() => readStoredJson(STORAGE_KEYS.SESSIONS, INITIAL_SESSIONS));
  const [grades, setGrades] = useState<SessionGrade[]>(() => readStoredJson(STORAGE_KEYS.GRADES, INITIAL_SESSION_GRADES));
  const [finalExamScores, setFinalExamScores] = useState<Record<string, number>>(() =>
    readStoredJson(STORAGE_KEYS.FINAL_SCORES, INITIAL_FINAL_EXAM_SCORES)
  );
  const [servantSubmissions, setServantSubmissions] = useState<ServantAttendanceSubmission[]>(() =>
    readStoredJson(STORAGE_KEYS.SERVANT_SUBS, INITIAL_SERVANT_SUBMISSIONS)
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    readStoredJson(STORAGE_KEYS.NOTIFS, INITIAL_NOTIFICATIONS)
  );
  const [lessonPosts, setLessonPosts] = useState<ServantLessonPost[]>(() =>
    readStoredJson(STORAGE_KEYS.POSTS, INITIAL_LESSON_POSTS)
  );

  const [yearWorkApprovedClasses, setYearWorkApprovedClasses] = useState<Record<string, boolean>>({});

  const applyRemote = useCallback((payload: any) => {
    if (!payload) return;
    const state = payload?.data || payload;
    if (state.currentUser && state.currentUser.id) {
      setCurrentUserId(state.currentUser.id);
    }
    if (Array.isArray(state.users)) setUsers(state.users);
    if (Array.isArray(state.sessions)) setSessions(state.sessions);
    if (Array.isArray(state.grades)) setGrades(state.grades);
    if (state.finalExamScores && typeof state.finalExamScores === 'object') setFinalExamScores(state.finalExamScores);
    if (Array.isArray(state.servantSubmissions)) setServantSubmissions(state.servantSubmissions);
    if (Array.isArray(state.notifications)) setNotifications(state.notifications);
    if (Array.isArray(state.lessonPosts)) setLessonPosts(state.lessonPosts);
    if (state.yearWorkApprovedClasses && typeof state.yearWorkApprovedClasses === 'object') {
      setYearWorkApprovedClasses(state.yearWorkApprovedClasses);
    }
  }, []);

  // Periodic Polling: checks server every 3 seconds so ANY device update reflects immediately on all other devices!
  useEffect(() => {
    let cancelled = false;
    let timer: any = null;

    const syncState = async () => {
      try {
        const ok = await apiHealth();
        if (cancelled) return;
        setBackendStatus(ok ? 'online' : 'offline');
        if (ok) {
          const data = await apiRequest<any>('/api/state');
          if (!cancelled && data) applyRemote(data);
        }
      } catch {
        if (!cancelled) setBackendStatus('offline');
      }
    };

    void syncState();
    timer = setInterval(syncState, 3000);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, [applyRemote]);

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const persistLocal = backendStatus !== 'online';

  useEffect(() => {
    if (persistLocal) writeStoredJson(STORAGE_KEYS.USERS, users);
  }, [users, persistLocal]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
    } catch {
      /* ignore */
    }
  }, [currentUserId]);
  useEffect(() => {
    if (persistLocal) writeStoredJson(STORAGE_KEYS.SESSIONS, sessions);
  }, [sessions, persistLocal]);
  useEffect(() => {
    if (persistLocal) writeStoredJson(STORAGE_KEYS.GRADES, grades);
  }, [grades, persistLocal]);
  useEffect(() => {
    if (persistLocal) writeStoredJson(STORAGE_KEYS.FINAL_SCORES, finalExamScores);
  }, [finalExamScores, persistLocal]);
  useEffect(() => {
    if (persistLocal) writeStoredJson(STORAGE_KEYS.SERVANT_SUBS, servantSubmissions);
  }, [servantSubmissions, persistLocal]);
  useEffect(() => {
    if (persistLocal) writeStoredJson(STORAGE_KEYS.NOTIFS, notifications);
  }, [notifications, persistLocal]);
  useEffect(() => {
    if (persistLocal) writeStoredJson(STORAGE_KEYS.POSTS, lessonPosts);
  }, [lessonPosts, persistLocal]);

  const currentUser = users.find((u) => u.id === currentUserId) || null;
  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  const setCurrentUser = (user: UserProfile | null) => setCurrentUserId(user ? user.id : '');
  const switchUserById = (userId: string) => setCurrentUserId(userId);

  const remote = async (path: string, options?: RequestInit) => {
    const data = await apiRequest<RemoteState>(path, options);
    applyRemote(data);
    return data;
  };

  const login = async (identifier: string, password: string) => {
    if (backendStatus === 'online') {
      try {
        const data = await remote('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ identifier, password }),
        });
        const authedUser = (data as any)?.user || (data as any)?.currentUser;
        if (authedUser?.id) {
          setCurrentUserId(authedUser.id);
          try {
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, authedUser.id);
          } catch {
            /* ignore */
          }
        }
        return { success: true, message: 'تم تسجيل الدخول.' };
      } catch (err) {
        return { success: false, message: err instanceof ApiError ? err.message : 'تعذر تسجيل الدخول.' };
      }
    }

    const inputTrim = identifier.trim().toLowerCase();
    const passTrim = password.trim();
    const found = users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === inputTrim) ||
        u.phone === identifier.trim() ||
        u.name.toLowerCase() === inputTrim
    );
    if (!found) return { success: false, message: 'لم يتم العثور على حساب بهذا البريد أو رقم الهاتف.' };
    if (found.status === 'rejected') {
      return { success: false, message: 'هذا الطلب مرفوض. تواصل مع أمين الخدمة للمراجعة.' };
    }
    const expectedPassword = found.password || found.phone;
    if (expectedPassword !== passTrim) return { success: false, message: 'كلمة المرور غير صحيحة.' };
    setCurrentUserId(found.id);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, found.id);
    } catch {
      /* ignore */
    }
    return { success: true, message: 'تم تسجيل الدخول.' };
  };

  const logout = () => {
    if (backendStatus === 'online') {
      void apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
      setApiToken('');
    }
    setCurrentUserId('');
    try {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  };

  const registerUser = async (data: Omit<UserProfile, 'id' | 'status' | 'registeredAt'>) => {
    if (backendStatus === 'online') {
      const payload = await remote('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      const registeredUser = (payload as any)?.user || (payload as any)?.currentUser;
      if (registeredUser?.id) {
        setCurrentUserId(registeredUser.id);
        try {
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, registeredUser.id);
        } catch {
          /* ignore */
        }
      }
      return (registeredUser as UserProfile) || users[0];
    }

    const phoneTaken = users.some((u) => u.phone === data.phone.trim());
    const emailTaken = data.email && users.some((u) => u.email?.toLowerCase() === data.email!.toLowerCase());
    if (phoneTaken) throw new Error('رقم الهاتف مسجّل مسبقاً.');
    if (emailTaken) throw new Error('البريد الإلكتروني مسجّل مسبقاً.');

    const newUser: UserProfile = {
      ...data,
      id: `user-${Date.now()}`,
      status: 'pending',
      registeredAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [newUser, ...prev]);
    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}`,
        title: data.role === 'servant' ? 'طلب انضمام خادم جديد' : 'طلب التحاق مخدوم جديد',
        message: `سجل ${newUser.name} وينتظر الموافقة للدخول للفصل.`,
        timestamp: 'الآن',
        type: 'new_student',
        read: false,
        audienceRoles: ['admin', 'assistant'],
      },
      ...prev,
    ]);
    return newUser;
  };

  const approveUser = (userId: string) => {
    if (currentUser?.id === userId) return;
    if (backendStatus === 'online') {
      void remote(`/api/users/${userId}/approve`, { method: 'POST' });
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'active' } : u)));
  };

  const rejectUser = (userId: string) => {
    if (backendStatus === 'online') {
      void remote(`/api/users/${userId}/reject`, { method: 'POST' });
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'rejected' } : u)));
  };

  const toggleAssistantRole = (userId: string) => {
    if (backendStatus === 'online') {
      void remote(`/api/users/${userId}/toggle-assistant`, { method: 'POST' });
      return;
    }
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: u.role === 'assistant' ? 'servant' : 'assistant' } : u))
    );
  };

  const deleteUser = (userId: string) => {
    if (backendStatus === 'online') {
      void remote(`/api/users/${userId}`, { method: 'DELETE' });
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const addStudentByAdmin = async (studentData: Omit<UserProfile, 'id' | 'role' | 'status' | 'registeredAt'>) => {
    const newStudent: UserProfile = {
      ...studentData,
      id: `stud-${Date.now()}`,
      status: 'active',
      role: 'student',
      registeredAt: new Date().toISOString().split('T')[0],
    };
    if (backendStatus === 'online') {
      void remote('/api/users/action', {
        method: 'POST',
        body: JSON.stringify({ action: 'addStudent', student: studentData }),
      });
      return newStudent;
    }
    setUsers((prev) => [newStudent, ...prev]);
    return newStudent;
  };

  const changeStudentClass = (studentId: string, newClassId: ClassId) => {
    if (backendStatus === 'online') {
      void remote('/api/users/action', {
        method: 'POST',
        body: JSON.stringify({ action: 'changeClass', userId: studentId, newClassId }),
      });
      return;
    }
    setUsers((prev) => prev.map((u) => (u.id === studentId ? { ...u, classId: newClassId } : u)));
  };

  const updateServantProfile = (servantId: string, updates: { role?: UserProfile['role']; classId?: ClassId }) => {
    if (backendStatus === 'online') {
      void remote('/api/users/action', {
        method: 'POST',
        body: JSON.stringify({ action: 'updateServant', userId: servantId, ...updates }),
      });
      return;
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === servantId
          ? {
              ...u,
              role: updates.role || u.role,
              classId: updates.classId !== undefined ? updates.classId : u.classId,
            }
          : u
      )
    );
  };

  const calculateAndLockYearWork = (classId: ClassId) => {
    setYearWorkApprovedClasses((prev) => ({ ...prev, [classId]: true }));
    if (backendStatus === 'online') {
      void remote('/api/year-work-lock', {
        method: 'POST',
        body: JSON.stringify({ classId, locked: true }),
      });
    }
  };

  const unlockYearWorkCalculation = (classId: ClassId) => {
    setYearWorkApprovedClasses((prev) => ({ ...prev, [classId]: false }));
    if (backendStatus === 'online') {
      void remote('/api/year-work-lock', {
        method: 'POST',
        body: JSON.stringify({ classId, locked: false }),
      });
    }
  };

  const saveSessionGrade = (gradeData: Partial<SessionGrade> & { studentId: string; sessionId: string }) => {
    if (backendStatus === 'online') {
      void remote('/api/grades', { method: 'POST', body: JSON.stringify(gradeData) });
      return;
    }
    const session = sessions.find((s) => s.id === gradeData.sessionId);
    setGrades((prev) => {
      const existingIdx = prev.findIndex(
        (g) => g.sessionId === gradeData.sessionId && g.studentId === gradeData.studentId
      );
      const prevRow = existingIdx >= 0 ? prev[existingIdx] : undefined;
      const completeRecord: SessionGrade = {
        id: prevRow?.id || `grd-${Date.now()}`,
        sessionId: gradeData.sessionId,
        sessionTitle: session?.title || 'لقاء دراسة الكتاب المقدس',
        date: session?.date || new Date().toISOString().split('T')[0],
        studentId: gradeData.studentId,
        exam: clamp(Number(gradeData.exam ?? prevRow?.exam ?? 0), 0, 10),
        homework: clamp(Number(gradeData.homework ?? prevRow?.homework ?? 0), 0, 10),
        attendance: clamp(Number(gradeData.attendance ?? prevRow?.attendance ?? 0), 0, 1),
        participation: clamp(Number(gradeData.participation ?? prevRow?.participation ?? 0), 0, 1),
        prayer: clamp(Number(gradeData.prayer ?? prevRow?.prayer ?? 0), 0, 1),
        tools: clamp(Number(gradeData.tools ?? prevRow?.tools ?? 0), 0, 1),
        notes: gradeData.notes ?? prevRow?.notes ?? '',
        qrAttendedAt: gradeData.qrAttendedAt ?? prevRow?.qrAttendedAt,
      };
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = completeRecord;
        return updated;
      }
      return [...prev, completeRecord];
    });
  };

  const recordQrAttendance = async (studentId: string, sessionId: string, secretCode?: string) => {
    if (backendStatus === 'online') {
      try {
        const data = await remote('/api/attendance/qr', {
          method: 'POST',
          body: JSON.stringify({ sessionId, secretCode }),
        });
        return { success: true, message: (data as { message?: string }).message || 'تم تسجيل الحضور.' };
      } catch (err) {
        return { success: false, message: err instanceof ApiError ? err.message : 'تعذر تسجيل الحضور.' };
      }
    }

    const session = sessions.find((s) => s.id === sessionId);
    const student = users.find((u) => u.id === studentId);
    if (!session) return { success: false, message: 'اللقاء المحدد غير موجود' };
    if (!session.qrActive) return { success: false, message: 'كود الحضور لهذا اللقاء مغلق حالياً من قِبل الخادم' };
    if (student?.classId && student.classId !== session.classId) {
      return { success: false, message: 'هذا اللقاء ليس لفصلك الدراسي' };
    }
    if (!secretCode || secretCode.trim() !== session.qrSecretCode) {
      return { success: false, message: 'كود الجلسة غير صحيح. انقله كما يظهر مع الخادم.' };
    }

    const timeString = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    setGrades((prev) => {
      const existingIdx = prev.findIndex((g) => g.sessionId === sessionId && g.studentId === studentId);
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], attendance: 1, qrAttendedAt: timeString };
        return updated;
      }
      return [
        ...prev,
        {
          id: `grd-${Date.now()}`,
          sessionId,
          sessionTitle: session.title,
          date: session.date,
          studentId,
          exam: 0,
          homework: 0,
          attendance: 1,
          participation: 0,
          prayer: 0,
          tools: 0,
          qrAttendedAt: timeString,
          notes: 'تم تسجيل الحضور عبر رمز الجلسة بنجاح',
        },
      ];
    });
    return {
      success: true,
      message: `تم تسجيل حضورك بنجاح في ${session.title} وحصلت على درجة الحضور (١ من ١)!`,
    };
  };

  const toggleSessionQr = (sessionId: string, active: boolean) => {
    if (backendStatus === 'online') {
      void remote(`/api/sessions/${sessionId}/qr`, { method: 'POST', body: JSON.stringify({ active }) });
      return;
    }
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, qrActive: active } : s)));
  };

  const updateFinalExamScore = (studentId: string, score: number) => {
    if (backendStatus === 'online') {
      void remote('/api/final-exam', { method: 'POST', body: JSON.stringify({ studentId, score }) });
      return;
    }
    setFinalExamScores((prev) => ({ ...prev, [studentId]: clamp(score, 0, 40) }));
  };

  const addNewSession = (sessionData: Omit<BibleSession, 'id' | 'qrSecretCode' | 'qrActive'>) => {
    const localSession: BibleSession = {
      ...sessionData,
      id: `sess-${Date.now()}`,
      maxScorePerMetric: 10,
      qrSecretCode: `STPAUL-${Date.now().toString(36).toUpperCase()}`,
      qrActive: true,
    };
    if (backendStatus === 'online') {
      void remote('/api/sessions', { method: 'POST', body: JSON.stringify(sessionData) });
      return localSession;
    }
    setSessions((prev) => [localSession, ...prev]);
    return localSession;
  };

  const submitServantCheckIn = (data: {
    status: 'attending' | 'absent';
    absenceReason?: string;
    prepTitle?: string;
    prepBibleVerse?: string;
    prepAttachmentName?: string;
    prepAttachmentType?: 'document' | 'pdf' | 'notes';
    prepNotes?: string;
  }) => {
    if (!currentUser) return;
    if (backendStatus === 'online') {
      void remote('/api/servant/check-in', { method: 'POST', body: JSON.stringify(data) });
      return;
    }
    const newSub: ServantAttendanceSubmission = {
      id: `sub-${Date.now()}`,
      servantId: currentUser.id,
      servantName: currentUser.name,
      servantPhone: currentUser.phone,
      meetingDate: nextFridayIso(),
      meetingTitle: 'اجتماع الجمعة القادم - كنيسة رئيس الملائكة والأمير تادرس الشطبي',
      status: data.status,
      absenceReason: data.absenceReason,
      prepTitle: data.prepTitle,
      prepBibleVerse: data.prepBibleVerse,
      prepAttachmentName: data.prepAttachmentName,
      prepAttachmentType: data.prepAttachmentType,
      prepNotes: data.prepNotes,
      submittedAt: new Date().toLocaleString('ar-EG'),
      viewedByAdmin: false,
    };
    setServantSubmissions((prev) => [newSub, ...prev.filter((s) => s.servantId !== currentUser.id)]);
  };

  const createLessonPost = (postData: {
    title: string;
    category: 'lesson_handout' | 'bible_study' | 'quiz' | 'announcement';
    bibleVerse: string;
    content: string;
    attachmentName?: string;
    classId: ClassId;
  }) => {
    if (!currentUser) return;
    if (backendStatus === 'online') {
      void remote('/api/posts', { method: 'POST', body: JSON.stringify(postData) });
      return;
    }
    const newPost: ServantLessonPost = {
      id: `post-${Date.now()}`,
      servantId: currentUser.id,
      servantName: currentUser.name,
      classId: postData.classId,
      title: postData.title,
      category: postData.category,
      bibleVerse: postData.bibleVerse,
      content: postData.content,
      attachmentName: postData.attachmentName,
      createdAt: new Date().toISOString().split('T')[0],
      status: currentUser.role === 'admin' ? 'approved' : 'pending_approval',
      approvedBy: currentUser.role === 'admin' ? currentUser.name : undefined,
      approvedAt: currentUser.role === 'admin' ? new Date().toISOString().split('T')[0] : undefined,
    };
    setLessonPosts((prev) => [newPost, ...prev]);
  };

  const approveLessonPost = (postId: string) => {
    if (backendStatus === 'online') {
      void remote(`/api/posts/${postId}/approve`, { method: 'POST' });
      return;
    }
    setLessonPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, status: 'approved', approvedBy: currentUser?.name || 'أمين الخدمة', approvedAt: new Date().toISOString().split('T')[0] }
          : p
      )
    );
  };

  const rejectLessonPost = (postId: string, reason?: string) => {
    if (backendStatus === 'online') {
      void remote(`/api/posts/${postId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) });
      return;
    }
    setLessonPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: 'rejected', rejectionReason: reason || 'مرفوض من أمانة الخدمة' } : p))
    );
  };

  const getStudentScoreSummary = (studentId: string): StudentScoreSummary =>
    computeStudentScoreSummary(studentId, users, sessions, grades, finalExamScores);

  const getClassLeaderboard = (classId: ClassId): StudentScoreSummary[] =>
    computeClassLeaderboard(classId, users, sessions, grades, finalExamScores);

  const getStudentSessionGrades = (studentId: string): SessionGrade[] => grades.filter((g) => g.studentId === studentId);

  const markNotificationAsRead = (id: string) => {
    if (backendStatus === 'online') {
      void remote(`/api/notifications/${id}/read`, { method: 'POST' });
      return;
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const clearNotifications = () => {
    if (backendStatus === 'online') {
      void remote('/api/notifications', { method: 'DELETE' });
      return;
    }
    setNotifications([]);
  };

  const resetDemoData = () => {
    if (backendStatus === 'online') {
      void remote('/api/admin/reset', { method: 'POST' }).then(() => setCurrentUserId('admin-ts'));
      return;
    }
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.GRADES);
    localStorage.removeItem(STORAGE_KEYS.FINAL_SCORES);
    localStorage.removeItem(STORAGE_KEYS.SERVANT_SUBS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFS);
    localStorage.removeItem(STORAGE_KEYS.POSTS);
    setUsers(INITIAL_USERS);
    setCurrentUserId('admin-ts');
    setSessions(INITIAL_SESSIONS);
    setGrades(INITIAL_SESSION_GRADES);
    setFinalExamScores(INITIAL_FINAL_EXAM_SCORES);
    setServantSubmissions(INITIAL_SERVANT_SUBMISSIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setLessonPosts(INITIAL_LESSON_POSTS);
  };

  const seedDemoData = () => {
    if (backendStatus === 'online') {
      void remote('/api/admin/seed', { method: 'POST' });
      return;
    }
    setUsers([INITIAL_USERS[0], ...SAMPLE_USERS]);
  };

  const clearAllStudentsAndServants = () => {
    if (backendStatus === 'online') {
      void remote('/api/admin/reset', { method: 'POST' });
      return;
    }
    setUsers(INITIAL_USERS);
    setGrades([]);
    setFinalExamScores({});
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        classes: CLASSES_LIST,
        sessions,
        grades,
        finalExamScores,
        servantSubmissions,
        notifications,
        lessonPosts,
        theme,
        backendStatus,
        toggleTheme,
        setCurrentUser,
        switchUserById,
        login,
        registerUser,
        logout,
        approveUser,
        rejectUser,
        toggleAssistantRole,
        deleteUser,
        saveSessionGrade,
        recordQrAttendance,
        toggleSessionQr,
        updateFinalExamScore,
        addNewSession,
        submitServantCheckIn,
        createLessonPost,
        approveLessonPost,
        rejectLessonPost,
        getStudentScoreSummary,
        getClassLeaderboard,
        getStudentSessionGrades,
        addStudentByAdmin,
        changeStudentClass,
        updateServantProfile,
        yearWorkApprovedClasses,
        calculateAndLockYearWork,
        unlockYearWorkCalculation,
        markNotificationAsRead,
        clearNotifications,
        resetDemoData,
        seedDemoData,
        clearAllStudentsAndServants,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
