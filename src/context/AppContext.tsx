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
  LibraryBook,
  AcademicTerm,
  ClassAssignedBook,
  ChurchEvent,
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
  INITIAL_LIBRARY_BOOKS,
  INITIAL_TERMS,
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
  academicTerms: AcademicTerm[];
  classAssignedBooks: Record<string, ClassAssignedBook>;
  assignBookForClass: (data: ClassAssignedBook) => Promise<void>;
  currentTermId: string;
  setCurrentTermId: (termId: string) => void;
  addAcademicTerm: (termData: Omit<AcademicTerm, 'id'>) => Promise<AcademicTerm>;
  deleteAcademicTerm: (termId: string) => void;
  sessions: BibleSession[];
  grades: SessionGrade[];
  finalExamScores: Record<string, number>;
  servantSubmissions: ServantAttendanceSubmission[];
  notifications: AppNotification[];
  lessonPosts: ServantLessonPost[];
  libraryBooks: LibraryBook[];
  churchEvents: ChurchEvent[];
  addChurchEvent: (eventData: Omit<ChurchEvent, 'id' | 'createdAt'>) => Promise<ChurchEvent>;
  updateChurchEvent: (id: string, updates: Partial<ChurchEvent>) => Promise<void>;
  deleteChurchEvent: (id: string) => Promise<void>;
  exportBackupJson: () => void;
  restoreBackupJson: (file: File) => Promise<{ success: boolean; message: string }>;
  forceSyncDatabase: () => Promise<void>;
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
  deleteSession: (sessionId: string) => void;
  deleteLessonPost: (postId: string) => void;
  saveSessionGrade: (gradeData: Partial<SessionGrade> & { studentId: string; sessionId: string; sessionTitle?: string; termId?: string }) => void;
  saveBatchGrades: (data: { sessionId?: string; sessionMeta: any; grades: any[] }) => Promise<void>;
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
    prepAttachmentType?: 'document' | 'pdf' | 'notes' | 'image';
    prepAttachmentData?: string;
    prepNotes?: string;
  }) => void;
  createLessonPost: (postData: {
    title: string;
    category: 'lesson_handout' | 'bible_study' | 'quiz' | 'announcement';
    bibleVerse: string;
    content: string;
    attachmentName?: string;
    fileData?: string;
    fileType?: string;
    classId: ClassId;
    targetAudience?: 'all' | 'servants_only' | 'students';
    targetScope?: 'all_classes' | 'specific_class';
  }) => void;
  approveLessonPost: (postId: string) => void;
  rejectLessonPost: (postId: string, reason?: string) => void;
  addLibraryBook: (bookData: Omit<LibraryBook, 'id' | 'addedAt' | 'addedBy'>) => Promise<LibraryBook>;
  deleteLibraryBook: (bookId: string) => void;
  getStudentScoreSummary: (studentId: string, termId?: string) => StudentScoreSummary;
  getClassLeaderboard: (classId: ClassId, termId?: string) => StudentScoreSummary[];
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
  USERS: 'st_paul_users_v6',
  CURRENT_USER_ID: 'st_paul_current_uid_v6',
  SESSIONS: 'st_paul_sessions_v6',
  GRADES: 'st_paul_grades_v6',
  FINAL_SCORES: 'st_paul_final_scores_v6',
  SERVANT_SUBS: 'st_paul_servant_subs_v6',
  NOTIFS: 'st_paul_notifs_v6',
  POSTS: 'st_paul_posts_v6',
  LIBRARY: 'st_paul_library_v6',
  THEME: 'st_paul_theme_v6',
  TERMS: 'st_paul_terms_v6',
  ASSIGNED_BOOKS: 'st_paul_assigned_books_v6',
  EVENTS: 'st_paul_events_v6',
};

type RemoteState = {
  currentUser?: UserProfile | null;
  users?: UserProfile[];
  academicTerms?: AcademicTerm[];
  classAssignedBooks?: Record<string, ClassAssignedBook>;
  sessions?: BibleSession[];
  grades?: SessionGrade[];
  finalExamScores?: Record<string, number>;
  servantSubmissions?: ServantAttendanceSubmission[];
  notifications?: AppNotification[];
  lessonPosts?: ServantLessonPost[];
  libraryBooks?: LibraryBook[];
  yearWorkApprovedClasses?: Record<string, boolean>;
  churchEvents?: ChurchEvent[];
};

// Clean legacy localStorage keys from prior versions to remove dummy mocks
try {
  const legacyKeys = [
    'st_paul_users_v5', 'st_paul_sessions_v5', 'st_paul_grades_v5',
    'st_paul_final_scores_v5', 'st_paul_servant_subs_v5', 'st_paul_notifs_v5',
    'st_paul_posts_v5', 'st_paul_library_v5', 'st_paul_terms_v5',
    'st_paul_users_v4', 'st_paul_sessions_v4', 'st_paul_library_v4',
  ];
  for (const k of legacyKeys) {
    localStorage.removeItem(k);
  }
} catch {
  /* ignore */
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = readStoredString(STORAGE_KEYS.THEME, 'light');
    return saved === 'dark' ? 'dark' : 'light';
  });
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('connecting');
  const [users, setUsers] = useState<UserProfile[]>(() => readStoredJson(STORAGE_KEYS.USERS, INITIAL_USERS));
  const [currentUserId, setCurrentUserId] = useState<string>(() => readStoredString(STORAGE_KEYS.CURRENT_USER_ID, ''));
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>(() =>
    readStoredJson(STORAGE_KEYS.TERMS, INITIAL_TERMS)
  );
  const [currentTermId, setCurrentTermId] = useState<string>('term_1');
  const [classAssignedBooks, setClassAssignedBooks] = useState<Record<string, ClassAssignedBook>>(() =>
    readStoredJson(STORAGE_KEYS.ASSIGNED_BOOKS, {})
  );
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
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>(() =>
    readStoredJson(STORAGE_KEYS.LIBRARY, INITIAL_LIBRARY_BOOKS)
  );
  const [churchEvents, setChurchEvents] = useState<ChurchEvent[]>(() =>
    readStoredJson(STORAGE_KEYS.EVENTS, [])
  );

  const [yearWorkApprovedClasses, setYearWorkApprovedClasses] = useState<Record<string, boolean>>({});

  const applyRemote = useCallback((payload: any) => {
    if (!payload) return;
    const state = payload?.data || payload;
    if (state.currentUser && state.currentUser.id) {
      setCurrentUserId(state.currentUser.id);
    } else if (state.currentUser === null && !getApiToken()) {
      setCurrentUserId('');
    }

    // Smart merge users to prevent data wipe when server restarts
    if (Array.isArray(state.users)) {
      setUsers((prevLocalUsers) => {
        const userMap = new Map<string, UserProfile>();
        for (const u of state.users) {
          if (u && u.id) userMap.set(u.id, u);
        }
        const missingOnServer: UserProfile[] = [];
        for (const lu of prevLocalUsers) {
          if (lu && lu.id && !userMap.has(lu.id)) {
            userMap.set(lu.id, lu);
            missingOnServer.push(lu);
          }
        }
        if (missingOnServer.length > 0) {
          void apiRequest('/api/sync/push', {
            method: 'POST',
            body: JSON.stringify({ users: missingOnServer }),
          }).catch(() => undefined);
        }
        return Array.from(userMap.values());
      });
    }

    if (Array.isArray(state.academicTerms) && state.academicTerms.length > 0) {
      setAcademicTerms(state.academicTerms);
    }
    if (state.classAssignedBooks && typeof state.classAssignedBooks === 'object') {
      setClassAssignedBooks(state.classAssignedBooks);
    }

    // Merge sessions
    if (Array.isArray(state.sessions)) {
      setSessions((prevLocalSessions) => {
        const sMap = new Map<string, BibleSession>();
        for (const s of state.sessions) {
          if (s && s.id) sMap.set(s.id, s);
        }
        const missingOnServer: BibleSession[] = [];
        for (const ls of prevLocalSessions) {
          if (ls && ls.id && !sMap.has(ls.id)) {
            sMap.set(ls.id, ls);
            missingOnServer.push(ls);
          }
        }
        if (missingOnServer.length > 0) {
          void apiRequest('/api/sync/push', {
            method: 'POST',
            body: JSON.stringify({ sessions: missingOnServer }),
          }).catch(() => undefined);
        }
        return Array.from(sMap.values());
      });
    }

    // Merge grades
    if (Array.isArray(state.grades)) {
      setGrades((prevLocalGrades) => {
        const gradeMap = new Map<string, SessionGrade>();
        for (const g of state.grades) {
          if (g && g.sessionId && g.studentId) {
            gradeMap.set(`${g.sessionId}_${g.studentId}`, g);
          }
        }
        const missingOnServer: SessionGrade[] = [];
        for (const lg of prevLocalGrades) {
          const key = `${lg.sessionId}_${lg.studentId}`;
          if (!gradeMap.has(key)) {
            gradeMap.set(key, lg);
            missingOnServer.push(lg);
          }
        }
        if (missingOnServer.length > 0) {
          void apiRequest('/api/sync/push', {
            method: 'POST',
            body: JSON.stringify({ grades: missingOnServer }),
          }).catch(() => undefined);
        }
        return Array.from(gradeMap.values());
      });
    }

    if (state.finalExamScores && typeof state.finalExamScores === 'object') {
      setFinalExamScores((prev) => ({ ...prev, ...state.finalExamScores }));
    }

    // Merge servantSubmissions
    if (Array.isArray(state.servantSubmissions)) {
      setServantSubmissions((prevSubs) => {
        const subMap = new Map<string, ServantAttendanceSubmission>();
        for (const s of state.servantSubmissions) {
          if (s && s.id) subMap.set(s.id, s);
        }
        const missingOnServer: ServantAttendanceSubmission[] = [];
        for (const ls of prevSubs) {
          if (ls && ls.id && !subMap.has(ls.id)) {
            subMap.set(ls.id, ls);
            missingOnServer.push(ls);
          }
        }
        if (missingOnServer.length > 0) {
          void apiRequest('/api/sync/push', {
            method: 'POST',
            body: JSON.stringify({ servantSubmissions: missingOnServer }),
          }).catch(() => undefined);
        }
        return Array.from(subMap.values());
      });
    }

    if (Array.isArray(state.notifications)) setNotifications(state.notifications);

    // Merge lessonPosts
    if (Array.isArray(state.lessonPosts)) {
      setLessonPosts((prevPosts) => {
        const pMap = new Map<string, ServantLessonPost>();
        for (const p of state.lessonPosts) {
          if (p && p.id) pMap.set(p.id, p);
        }
        const missingOnServer: ServantLessonPost[] = [];
        for (const lp of prevPosts) {
          if (lp && lp.id && !pMap.has(lp.id)) {
            pMap.set(lp.id, lp);
            missingOnServer.push(lp);
          }
        }
        if (missingOnServer.length > 0) {
          void apiRequest('/api/sync/push', {
            method: 'POST',
            body: JSON.stringify({ lessonPosts: missingOnServer }),
          }).catch(() => undefined);
        }
        return Array.from(pMap.values());
      });
    }

    // Merge libraryBooks
    if (Array.isArray(state.libraryBooks)) {
      setLibraryBooks((prevBooks) => {
        const bMap = new Map<string, LibraryBook>();
        for (const b of state.libraryBooks) {
          if (b && b.id) bMap.set(b.id, b);
        }
        const missingOnServer: LibraryBook[] = [];
        for (const lb of prevBooks) {
          if (lb && lb.id && !bMap.has(lb.id)) {
            bMap.set(lb.id, lb);
            missingOnServer.push(lb);
          }
        }
        if (missingOnServer.length > 0) {
          void apiRequest('/api/sync/push', {
            method: 'POST',
            body: JSON.stringify({ libraryBooks: missingOnServer }),
          }).catch(() => undefined);
        }
        return Array.from(bMap.values());
      });
    }

    // Merge churchEvents
    if (Array.isArray(state.churchEvents)) {
      setChurchEvents((prevLocalEvents) => {
        const evtMap = new Map<string, ChurchEvent>();
        for (const e of state.churchEvents) {
          if (e && e.id) evtMap.set(e.id, e);
        }
        const missingOnServer: ChurchEvent[] = [];
        for (const le of prevLocalEvents) {
          if (le && le.id && !evtMap.has(le.id)) {
            evtMap.set(le.id, le);
            missingOnServer.push(le);
          }
        }
        if (missingOnServer.length > 0) {
          void apiRequest('/api/sync/push', {
            method: 'POST',
            body: JSON.stringify({ churchEvents: missingOnServer }),
          }).catch(() => undefined);
        }
        return Array.from(evtMap.values());
      });
    }

    if (state.yearWorkApprovedClasses && typeof state.yearWorkApprovedClasses === 'object') {
      setYearWorkApprovedClasses((prev) => ({ ...prev, ...state.yearWorkApprovedClasses }));
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

  // Mirror state continuously into local cache
  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.USERS, users);
  }, [users]);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
    } catch {
      /* ignore */
    }
  }, [currentUserId]);
  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.SESSIONS, sessions);
  }, [sessions]);
  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.GRADES, grades);
  }, [grades]);
  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.FINAL_SCORES, finalExamScores);
  }, [finalExamScores]);
  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.SERVANT_SUBS, servantSubmissions);
  }, [servantSubmissions]);
  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.NOTIFS, notifications);
  }, [notifications]);
  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.POSTS, lessonPosts);
  }, [lessonPosts]);
  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.LIBRARY, libraryBooks);
  }, [libraryBooks]);
  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.TERMS, academicTerms);
  }, [academicTerms]);
  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.ASSIGNED_BOOKS, classAssignedBooks);
  }, [classAssignedBooks]);
  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.EVENTS, churchEvents);
  }, [churchEvents]);

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
    if (found.status === 'pending') {
      return {
        success: false,
        message: 'أسف، برجاء انتظار موافقة أمين الخدمة على حسابك أولاً',
      };
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
    }
    setApiToken('');
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
      const registeredUser = (payload as any)?.user;
      // Pending accounts must NOT be logged in!
      setCurrentUserId('');
      setApiToken('');
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      } catch {
        /* ignore */
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
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'active' } : u)));
    // Decrement notification count by marking registration notification as read
    setNotifications((prev) =>
      prev.map((n) =>
        (n.type === 'new_student' && target && n.message.includes(target.name)) || n.audienceUserId === userId
          ? { ...n, read: true }
          : n
      )
    );
    if (backendStatus === 'online') {
      void remote(`/api/users/${userId}/approve`, { method: 'POST' }).then((res: any) => {
        if (res?.notifications) setNotifications(res.notifications);
      });
    }
  };

  const rejectUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'rejected' } : u)));
    // Decrement notification count by marking registration notification as read
    setNotifications((prev) =>
      prev.map((n) =>
        (n.type === 'new_student' && target && n.message.includes(target.name)) || n.audienceUserId === userId
          ? { ...n, read: true }
          : n
      )
    );
    if (backendStatus === 'online') {
      void remote(`/api/users/${userId}/reject`, { method: 'POST' }).then((res: any) => {
        if (res?.notifications) setNotifications(res.notifications);
      });
    }
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
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setGrades((prev) => prev.filter((g) => g.studentId !== userId));
    setFinalExamScores((prev) => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });
    setServantSubmissions((prev) => prev.filter((s) => s.servantId !== userId));

    if (backendStatus === 'online') {
      void remote(`/api/users/${userId}`, { method: 'DELETE' }).catch(() => {
        void remote('/api/users/action', {
          method: 'POST',
          body: JSON.stringify({ action: 'delete', userId }),
        });
      });
    }
  };

  const deleteSession = (sessionId: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    setGrades((prev) => prev.filter((g) => g.sessionId !== sessionId));
    if (backendStatus === 'online') {
      void remote(`/api/sessions/${sessionId}`, { method: 'DELETE' });
    }
  };

  const deleteLessonPost = (postId: string) => {
    setLessonPosts((prev) => prev.filter((p) => p.id !== postId));
    if (backendStatus === 'online') {
      void remote(`/api/posts/${postId}`, { method: 'DELETE' });
    }
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

  const assignBookForClass = async (data: ClassAssignedBook) => {
    setClassAssignedBooks((prev) => ({
      ...prev,
      [data.classId]: data,
      [`${data.classId}_${data.termId}`]: data,
    }));

    if (backendStatus === 'online') {
      try {
        await remote('/api/assigned-books', {
          method: 'POST',
          body: JSON.stringify(data),
        });
      } catch (e) {
        console.error('Failed to sync assigned book to server:', e);
      }
    }
  };

  const saveSessionGrade = (gradeData: Partial<SessionGrade> & { studentId: string; sessionId: string; sessionTitle?: string; termId?: string }) => {
    const session = sessions.find((s) => s.id === gradeData.sessionId);
    const completeRecord: SessionGrade = {
      id: `grd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sessionId: gradeData.sessionId,
      sessionTitle: gradeData.sessionTitle || session?.title || 'لقاء دراسة الكتاب المقدس',
      date: session?.date || new Date().toISOString().split('T')[0],
      studentId: gradeData.studentId,
      termId: gradeData.termId || session?.termId || currentTermId,
      exam: clamp(Number(gradeData.exam ?? 0), 0, 10),
      homework: clamp(Number(gradeData.homework ?? 0), 0, 10),
      attendance: clamp(Number(gradeData.attendance ?? 0), 0, 1),
      participation: clamp(Number(gradeData.participation ?? 0), 0, 1),
      prayer: clamp(Number(gradeData.prayer ?? 0), 0, 1),
      tools: clamp(Number(gradeData.tools ?? 0), 0, 1),
      notes: gradeData.notes ?? '',
      qrAttendedAt: gradeData.qrAttendedAt,
    };

    // 1. Immediate local optimistic update
    setGrades((prev) => {
      const existingIdx = prev.findIndex(
        (g) => g.sessionId === gradeData.sessionId && g.studentId === gradeData.studentId
      );
      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = { ...updated[existingIdx], ...completeRecord, id: updated[existingIdx].id };
        return updated;
      }
      return [...prev, completeRecord];
    });

    // 2. Synchronize with remote server immediately
    if (backendStatus === 'online') {
      void remote('/api/grades', {
        method: 'POST',
        body: JSON.stringify({
          ...gradeData,
          sessionTitle: completeRecord.sessionTitle,
          date: completeRecord.date,
          termId: completeRecord.termId,
        }),
      }).catch((e) => {
        console.error('Error syncing grade to server:', e);
      });
    }
  };

  const saveBatchGrades = async (data: { sessionId?: string; sessionMeta: any; grades: any[] }) => {
    const sessionId = data.sessionId || data.sessionMeta?.id || `sess-${Date.now()}`;
    const sessionMeta = {
      ...data.sessionMeta,
      id: sessionId,
    };

    // 1. Optimistic update session in state
    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === sessionId);
      const updatedSession: BibleSession = {
        id: sessionId,
        title: sessionMeta.title || 'لقاء دراسة الكتاب المقدس',
        classId: sessionMeta.classId || 'prep_2_3',
        termId: sessionMeta.termId || currentTermId,
        date: sessionMeta.date || new Date().toISOString().split('T')[0],
        biblePassage: sessionMeta.biblePassage || sessionMeta.coveredChapters || 'شواهد مختارة',
        servantName: sessionMeta.servantName || currentUser?.name || 'خادم الفصل',
        maxScorePerMetric: 10,
        qrSecretCode: sessionMeta.qrSecretCode || `STPAUL-${Date.now().toString(36).toUpperCase()}`,
        qrActive: true,
        sessionNumber: sessionMeta.sessionNumber,
        bookId: sessionMeta.bookId,
        bookName: sessionMeta.bookName,
        testament: sessionMeta.testament,
        coveredChapters: sessionMeta.coveredChapters,
        objective: sessionMeta.objective,
        memoryVerse: sessionMeta.memoryVerse,
        memoryVerseRef: sessionMeta.memoryVerseRef,
        lessonSummary: sessionMeta.lessonSummary,
        attachmentName: sessionMeta.attachmentName,
        fileData: sessionMeta.fileData,
        fileType: sessionMeta.fileType,
        fileSize: sessionMeta.fileSize,
      };
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedSession;
        return copy;
      }
      return [updatedSession, ...prev];
    });

    // 2. Optimistic update grades in state
    setGrades((prev) => {
      const copy = [...prev];
      for (const g of data.grades) {
        const idx = copy.findIndex((ex) => ex.sessionId === sessionId && ex.studentId === g.studentId);
        const completeRecord: SessionGrade = {
          id: idx >= 0 ? copy[idx].id : `grd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          sessionId,
          sessionTitle: sessionMeta.title || 'لقاء دراسة الكتاب المقدس',
          date: sessionMeta.date || new Date().toISOString().split('T')[0],
          studentId: g.studentId,
          termId: sessionMeta.termId || currentTermId,
          exam: clamp(Number(g.exam ?? 0), 0, 10),
          homework: clamp(Number(g.homework ?? 0), 0, 10),
          attendance: clamp(Number(g.attendance ?? 0), 0, 1),
          participation: clamp(Number(g.participation ?? 0), 0, 1),
          prayer: clamp(Number(g.prayer ?? 0), 0, 1),
          tools: clamp(Number(g.tools ?? 0), 0, 1),
          notes: g.notes || '',
        };
        if (idx >= 0) copy[idx] = completeRecord;
        else copy.push(completeRecord);
      }
      return copy;
    });

    // 3. Remote server synchronization
    if (backendStatus === 'online') {
      try {
        await remote('/api/grades/batch', {
          method: 'POST',
          body: JSON.stringify({ sessionId, sessionMeta, grades: data.grades }),
        });
      } catch (e) {
        console.error('Error saving batch grades to server:', e);
      }
    }
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
    prepAttachmentType?: 'document' | 'pdf' | 'notes' | 'image';
    prepAttachmentData?: string;
    prepNotes?: string;
  }) => {
    if (!currentUser) return;
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
      prepAttachmentData: data.prepAttachmentData,
      prepNotes: data.prepNotes,
      classId: currentUser.classId,
      submittedAt: new Date().toLocaleString('ar-EG'),
      viewedByAdmin: false,
    };

    // 1. Immediately update state so it is pinned in the UI for both servant and admin
    setServantSubmissions((prev) => [newSub, ...prev.filter((s) => s.servantId !== currentUser.id)]);

    if (data.status === 'attending' && (data.prepTitle || data.prepAttachmentName)) {
      const localPost: ServantLessonPost = {
        id: `post-prep-${Date.now()}`,
        servantId: currentUser.id,
        servantName: currentUser.name,
        classId: currentUser.classId || 'prep_2_3',
        title: data.prepTitle || 'مذكرة تحضير الدرس الأسبوعي',
        category: 'lesson_handout',
        bibleVerse: data.prepBibleVerse || '',
        content: data.prepNotes || `قام الخادم ${currentUser.name} برفع ملف تحضير درس.`,
        attachmentName: data.prepAttachmentName,
        fileData: data.prepAttachmentData,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'pending_approval',
      };
      setLessonPosts((prev) => [localPost, ...prev]);
    }

    // 2. Server synchronization
    if (backendStatus === 'online') {
      void remote('/api/servant/check-in', {
        method: 'POST',
        body: JSON.stringify({ ...newSub, classId: currentUser.classId }),
      }).then((res: any) => {
        if (res?.servantSubmissions) {
          setServantSubmissions(res.servantSubmissions);
        }
      });
    }
  };

  const createLessonPost = (postData: {
    title: string;
    category: 'lesson_handout' | 'bible_study' | 'quiz' | 'announcement';
    bibleVerse: string;
    content: string;
    attachmentName?: string;
    fileData?: string;
    fileType?: string;
    classId: ClassId;
    targetAudience?: 'all' | 'servants_only' | 'students';
    targetScope?: 'all_classes' | 'specific_class';
  }) => {
    if (!currentUser) return;
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
      fileData: postData.fileData,
      fileType: postData.fileType,
      createdAt: new Date().toISOString().split('T')[0],
      status: currentUser.role === 'admin' ? 'approved' : 'pending_approval',
      approvedBy: currentUser.role === 'admin' ? currentUser.name : undefined,
      approvedAt: currentUser.role === 'admin' ? new Date().toISOString().split('T')[0] : undefined,
      targetAudience: postData.targetAudience || 'all',
      targetScope: postData.targetScope || 'specific_class',
    };
    if (backendStatus === 'online') {
      void remote('/api/posts', { method: 'POST', body: JSON.stringify({ action: 'create', post: newPost, ...newPost }) });
      return;
    }
    setLessonPosts((prev) => [newPost, ...prev]);
  };

  const addLibraryBook = async (bookData: Omit<LibraryBook, 'id' | 'addedAt' | 'addedBy'>) => {
    const newBook: LibraryBook = {
      ...bookData,
      id: `book-${Date.now()}`,
      addedBy: currentUser?.name || 'أمين الخدمة',
      addedAt: new Date().toISOString().split('T')[0],
    };
    if (backendStatus === 'online') {
      void remote('/api/library', { method: 'POST', body: JSON.stringify(newBook) });
      return newBook;
    }
    setLibraryBooks((prev) => [newBook, ...prev]);
    return newBook;
  };

  const deleteLibraryBook = (bookId: string) => {
    setLibraryBooks((prev) => prev.filter((b) => b.id !== bookId));
    if (backendStatus === 'online') {
      void remote(`/api/library/${bookId}`, { method: 'DELETE' });
    }
  };

  const addAcademicTerm = async (termData: Omit<AcademicTerm, 'id'>): Promise<AcademicTerm> => {
    const newTerm: AcademicTerm = {
      id: `term_${Date.now()}`,
      ...termData,
    };
    if (backendStatus === 'online') {
      void remote('/api/terms', { method: 'POST', body: JSON.stringify(newTerm) });
      return newTerm;
    }
    setAcademicTerms((prev) => [...prev, newTerm]);
    return newTerm;
  };

  const deleteAcademicTerm = (termId: string) => {
    setAcademicTerms((prev) => prev.filter((t) => t.id !== termId));
    if (backendStatus === 'online') {
      void remote(`/api/terms/${termId}`, { method: 'DELETE' });
    }
  };

  const addChurchEvent = async (eventData: Omit<ChurchEvent, 'id' | 'createdAt'>): Promise<ChurchEvent> => {
    const newEvent: ChurchEvent = {
      ...eventData,
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: currentUser?.name || 'أمين الخدمة',
    };
    setChurchEvents((prev) => [newEvent, ...prev]);
    if (backendStatus === 'online') {
      try {
        await remote('/api/events', {
          method: 'POST',
          body: JSON.stringify(newEvent),
        });
      } catch (e) {
        console.error('Failed to save event to server:', e);
      }
    }
    return newEvent;
  };

  const updateChurchEvent = async (id: string, updates: Partial<ChurchEvent>) => {
    setChurchEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    if (backendStatus === 'online') {
      try {
        await remote(`/api/events/${id}`, {
          method: 'PUT',
          body: JSON.stringify(updates),
        });
      } catch (e) {
        console.error('Failed to update event on server:', e);
      }
    }
  };

  const deleteChurchEvent = async (id: string) => {
    setChurchEvents((prev) => prev.filter((e) => e.id !== id));
    if (backendStatus === 'online') {
      try {
        await remote(`/api/events/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to delete event on server:', e);
      }
    }
  };

  const exportBackupJson = () => {
    const backupObj = {
      version: 1,
      exportedAt: new Date().toISOString(),
      school: 'مدرسة سانت بولس لدراسة الكتاب المقدس',
      data: {
        users,
        sessions,
        grades,
        finalExamScores,
        servantSubmissions,
        notifications,
        lessonPosts,
        libraryBooks,
        churchEvents,
        academicTerms,
        classAssignedBooks,
        yearWorkApprovedClasses,
      },
    };
    const jsonStr = JSON.stringify(backupObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `st-paul-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const restoreBackupJson = async (file: File): Promise<{ success: boolean; message: string }> => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed.data || parsed;
      if (!data || (!Array.isArray(data.users) && !Array.isArray(data.grades))) {
        return { success: false, message: 'صيغة ملف النسخة الاحتياطية غير صالحة.' };
      }
      if (Array.isArray(data.users)) setUsers(data.users);
      if (Array.isArray(data.sessions)) setSessions(data.sessions);
      if (Array.isArray(data.grades)) setGrades(data.grades);
      if (data.finalExamScores) setFinalExamScores(data.finalExamScores);
      if (Array.isArray(data.churchEvents)) setChurchEvents(data.churchEvents);
      if (Array.isArray(data.lessonPosts)) setLessonPosts(data.lessonPosts);
      if (Array.isArray(data.libraryBooks)) setLibraryBooks(data.libraryBooks);
      if (Array.isArray(data.academicTerms)) setAcademicTerms(data.academicTerms);

      if (backendStatus === 'online') {
        await apiRequest('/api/admin/backup/restore', {
          method: 'POST',
          body: JSON.stringify({ data }),
        });
      }
      return { success: true, message: `تم استعادة النسخة الاحتياطية بنجاح (${data.users?.length || 0} مستخدم، ${data.grades?.length || 0} درجات).` };
    } catch (err: any) {
      return { success: false, message: 'تعذر قراءة ملف النسخة الاحتياطية: ' + (err?.message || '') };
    }
  };

  const forceSyncDatabase = async () => {
    try {
      await apiRequest('/api/sync/push', {
        method: 'POST',
        body: JSON.stringify({
          users,
          sessions,
          grades,
          finalExamScores,
          churchEvents,
          lessonPosts,
          libraryBooks,
          academicTerms,
          classAssignedBooks,
        }),
      });
    } catch (e) {
      console.error('Force sync error:', e);
    }
  };

  const approveLessonPost = (postId: string) => {
    const post = lessonPosts.find((p) => p.id === postId);
    setLessonPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, status: 'approved', approvedBy: currentUser?.name || 'أمين الخدمة', approvedAt: new Date().toISOString().split('T')[0] }
          : p
      )
    );
    if (post) {
      setNotifications((prev) =>
        prev.map((n) => (n.type === 'post_pending' && n.message.includes(post.title) ? { ...n, read: true } : n))
      );
    }
    if (backendStatus === 'online') {
      void remote(`/api/posts/${postId}/approve`, { method: 'POST' }).then((res: any) => {
        if (res?.notifications) setNotifications(res.notifications);
      });
    }
  };

  const rejectLessonPost = (postId: string, reason?: string) => {
    const post = lessonPosts.find((p) => p.id === postId);
    setLessonPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status: 'rejected', rejectionReason: reason || 'مرفوض من أمانة الخدمة' } : p))
    );
    if (post) {
      setNotifications((prev) =>
        prev.map((n) => (n.type === 'post_pending' && n.message.includes(post.title) ? { ...n, read: true } : n))
      );
    }
    if (backendStatus === 'online') {
      void remote(`/api/posts/${postId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }).then((res: any) => {
        if (res?.notifications) setNotifications(res.notifications);
      });
    }
  };

  const getStudentScoreSummary = (studentId: string, termId?: string): StudentScoreSummary =>
    computeStudentScoreSummary(studentId, users, sessions, grades, finalExamScores, termId || currentTermId);

  const getClassLeaderboard = (classId: ClassId, termId?: string): StudentScoreSummary[] =>
    computeClassLeaderboard(classId, users, sessions, grades, finalExamScores, termId || currentTermId);

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
        academicTerms,
        currentTermId,
        setCurrentTermId,
        addAcademicTerm,
        deleteAcademicTerm,
        sessions,
        grades,
        finalExamScores,
        servantSubmissions,
        notifications,
        lessonPosts,
        libraryBooks,
        churchEvents,
        addChurchEvent,
        updateChurchEvent,
        deleteChurchEvent,
        exportBackupJson,
        restoreBackupJson,
        forceSyncDatabase,
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
        deleteSession,
        deleteLessonPost,
        saveSessionGrade,
        recordQrAttendance,
        toggleSessionQr,
        updateFinalExamScore,
        addNewSession,
        submitServantCheckIn,
        createLessonPost,
        approveLessonPost,
        rejectLessonPost,
        addLibraryBook,
        classAssignedBooks,
        assignBookForClass,
        saveBatchGrades,
        deleteLibraryBook,
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
