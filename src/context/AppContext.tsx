import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  UserProfile,
  UserRole,
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
  SessionQrSecret,
} from '../types';
import {
  CLASSES_LIST,
  INITIAL_USERS,
  INITIAL_TERMS,
} from '../data/mockData';
import { readStoredJson, readStoredString, writeStoredJson } from '../lib/storage';
import { apiHealth, apiRequest, ApiError, getApiToken, setApiToken } from '../lib/api';
import { clamp, computeClassLeaderboard, computeStudentScoreSummary, nextFridayIso } from '../lib/scores';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  createAuthAccountWithoutSigningOut,
  signOut,
  onAuthStateChanged,
  testConnection,
  User as FirebaseUser,
  ADMIN_BOOTSTRAP_EMAIL,
  isQuotaExceededError,
} from '../firebase';
import {
  COLLECTIONS,
  bootstrapExistingDataToFirestore,
  checkIsAdminMarker,
  deleteDocFromFirestore,
  deleteUserFromFirestore,
  ensureAdminMarker,
  fetchUserFromFirestore,
  generateQrSecretCode,
  isPermittedAuthUser,
  isVerifiedAdminEmail,
  linkLegacyUserToFirebaseUid,
  markNotificationReadInFirestore,
  registerPendingUserToFirestore,
  removeAdminMarker,
  rotateSessionQrSecret,
  sanitizeFirestoreId,
  subscribeSchoolFirestore,
  submitStudentQrAttendanceToFirestore,
  upsertAssignedBookToFirestore,
  upsertBatchGradesToFirestore,
  upsertChurchEventToFirestore,
  upsertFinalExamToFirestore,
  upsertGradeToFirestore,
  upsertLessonPostToFirestore,
  upsertLibraryBookToFirestore,
  upsertServantSubmissionToFirestore,
  upsertSessionQrSecretToFirestore,
  upsertSessionToFirestore,
  upsertTermToFirestore,
  upsertUserToFirestore,
  upsertYearWorkLockToFirestore,
} from '../lib/firestoreSync';
import { MigrationReport, runIdempotentFirestoreMigration } from '../lib/firestoreMigration';

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
  sessionQrSecrets: Record<string, SessionQrSecret>;
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
  exportBackupJson: () => boolean;
  restoreBackupJson: (file: File) => Promise<{ success: boolean; message: string }>;
  forceSyncDatabase: () => Promise<{ success: boolean; message: string; uploaded?: number }>;
  runSafeMigration: () => Promise<MigrationReport | null>;
  theme: 'light' | 'dark';
  backendStatus: BackendStatus;
  firebaseUser: FirebaseUser | null;
  firebaseAuthReady: boolean;
  firebaseConnected: boolean;
  firebaseSyncing: boolean;
  firebaseError: string | null;
  adminMarkerVerified: boolean | null;
  lastSyncedAt: string | null;
  checkAdminSecurityStatus: () => Promise<{ connected: boolean; adminMarkerVerified: boolean; error?: string }>;
  toggleTheme: () => void;
  setCurrentUser: (user: UserProfile | null) => void;
  login: (identifier: string, password: string) => Promise<{ success: boolean; message: string }>;
  loginWithGoogle: () => Promise<{
    success: boolean;
    message: string;
    role?: UserProfile['role'];
    needsProfileCompletion?: boolean;
    googleProfile?: { uid: string; email: string; name: string };
  }>;
  loginWithEmailPassword: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    message: string;
    role?: UserProfile['role'];
    needsProfileCompletion?: boolean;
    googleProfile?: { uid: string; email: string; name: string };
  }>;
  registerWithEmailPassword: (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    age: number;
    classId: ClassId;
    role?: 'student' | 'servant';
    guardianPhone?: string;
    confessionFather?: string;
  }) => Promise<{ success: boolean; message: string; name?: string }>;
  completeGoogleRegistration: (data: {
    phone: string;
    age: number;
    classId: ClassId;
    role?: 'student' | 'servant';
    guardianPhone?: string;
    confessionFather?: string;
  }) => Promise<{ success: boolean; message: string; name?: string }>;
  syncNowToFirebase: () => Promise<{ success: boolean; message: string; uploaded?: number }>;
  registerUser: (data: Omit<UserProfile, 'id' | 'status' | 'registeredAt'>) => Promise<UserProfile>;
  logout: () => void;
  approveUser: (userId: string) => void;
  approveUserWithDetails: (
    userId: string,
    updates?: { role?: UserProfile['role']; classId?: ClassId; mergeFromLegacyId?: string }
  ) => Promise<void>;
  rejectUser: (userId: string) => void;
  suspendUser: (userId: string) => void;
  reactivateUser: (userId: string) => void;
  toggleAssistantRole: (userId: string) => void;
  deleteUser: (userId: string) => void;
  deleteSession: (sessionId: string) => void;
  deleteLessonPost: (postId: string) => void;
  saveSessionGrade: (
    gradeData: Partial<SessionGrade> & { studentId: string; sessionId: string; sessionTitle?: string; termId?: string }
  ) => void;
  saveBatchGrades: (data: { sessionId?: string; sessionMeta: any; grades: any[] }) => Promise<void>;
  recordQrAttendance: (
    studentId: string,
    sessionId: string,
    secretCode?: string
  ) => Promise<{ success: boolean; message: string }>;
  toggleSessionQr: (sessionId: string, active: boolean) => void;
  rotateSessionQr: (sessionId: string) => Promise<SessionQrSecret | null>;
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
  addStudentByAdmin: (
    studentData: Omit<UserProfile, 'id' | 'role' | 'status' | 'registeredAt'> & { password?: string }
  ) => Promise<UserProfile>;
  changeStudentClass: (studentId: string, newClassId: ClassId) => void;
  updateServantProfile: (servantId: string, updates: { role?: UserProfile['role']; classId?: ClassId }) => void;
  yearWorkApprovedClasses: Record<string, boolean>;
  calculateAndLockYearWork: (classId: ClassId) => void;
  unlockYearWorkCalculation: (classId: ClassId) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
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

// Clean legacy localStorage keys from prior versions to avoid stale schemas
try {
  const legacyKeys = [
    'st_paul_users_v5',
    'st_paul_sessions_v5',
    'st_paul_grades_v5',
    'st_paul_final_scores_v5',
    'st_paul_servant_subs_v5',
    'st_paul_notifs_v5',
    'st_paul_posts_v5',
    'st_paul_library_v5',
    'st_paul_terms_v5',
    'st_paul_users_v4',
    'st_paul_sessions_v4',
    'st_paul_library_v4',
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
  const [currentUserId, setCurrentUserId] = useState<string>(() =>
    getApiToken() ? readStoredString(STORAGE_KEYS.CURRENT_USER_ID, '') : ''
  );
  const [academicTerms, setAcademicTerms] = useState<AcademicTerm[]>(() =>
    readStoredJson(STORAGE_KEYS.TERMS, INITIAL_TERMS)
  );
  const [currentTermId, setCurrentTermId] = useState<string>('term_1');
  const [classAssignedBooks, setClassAssignedBooks] = useState<Record<string, ClassAssignedBook>>(() =>
    readStoredJson(STORAGE_KEYS.ASSIGNED_BOOKS, {})
  );
  const [sessions, setSessions] = useState<BibleSession[]>(() => readStoredJson(STORAGE_KEYS.SESSIONS, []));
  const [sessionQrSecrets, setSessionQrSecrets] = useState<Record<string, SessionQrSecret>>({});
  const [grades, setGrades] = useState<SessionGrade[]>(() => readStoredJson(STORAGE_KEYS.GRADES, []));
  const [finalExamScores, setFinalExamScores] = useState<Record<string, number>>(() =>
    readStoredJson(STORAGE_KEYS.FINAL_SCORES, {})
  );
  const [servantSubmissions, setServantSubmissions] = useState<ServantAttendanceSubmission[]>(() =>
    readStoredJson(STORAGE_KEYS.SERVANT_SUBS, [])
  );
  const [notifications, setNotifications] = useState<AppNotification[]>(() =>
    readStoredJson(STORAGE_KEYS.NOTIFS, [])
  );
  const [lessonPosts, setLessonPosts] = useState<ServantLessonPost[]>(() =>
    readStoredJson(STORAGE_KEYS.POSTS, [])
  );
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>(() =>
    readStoredJson(STORAGE_KEYS.LIBRARY, [])
  );
  const [churchEvents, setChurchEvents] = useState<ChurchEvent[]>(() =>
    readStoredJson(STORAGE_KEYS.EVENTS, [])
  );

  const [yearWorkApprovedClasses, setYearWorkApprovedClasses] = useState<Record<string, boolean>>({});
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [firebaseAuthReady, setFirebaseAuthReady] = useState<boolean>(false);
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(false);
  const [firebaseSyncing, setFirebaseSyncing] = useState<boolean>(false);
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [adminMarkerVerified, setAdminMarkerVerified] = useState<boolean | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  const snapshotRef = React.useRef({
    users,
    academicTerms,
    classAssignedBooks,
    sessions,
    grades,
    finalExamScores,
    servantSubmissions,
    lessonPosts,
    libraryBooks,
    churchEvents,
    yearWorkApprovedClasses,
    notifications,
  });
  snapshotRef.current = {
    users,
    academicTerms,
    classAssignedBooks,
    sessions,
    grades,
    finalExamScores,
    servantSubmissions,
    lessonPosts,
    libraryBooks,
    churchEvents,
    yearWorkApprovedClasses,
    notifications,
  };

  useEffect(() => {
    void testConnection().then((res) => {
      setFirebaseConnected(res.online);
      if (!res.online && res.error) {
        setFirebaseError(res.error);
      }
    });

    let unsubFirestore: (() => void) | null = null;
    const unsubAuth = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      setFirebaseAuthReady(true);

      if (unsubFirestore) {
        unsubFirestore();
        unsubFirestore = null;
      }

      if (!fbUser) {
        setSessionQrSecrets({});
        setAdminMarkerVerified(null);
        if (!getApiToken()) {
          setCurrentUserId('');
        }
        return;
      }

      const isAdminEmail = isVerifiedAdminEmail(fbUser.email, fbUser.emailVerified);
      const uid = sanitizeFirestoreId(fbUser.uid);

      try {
        if (isAdminEmail) {
          setFirebaseSyncing(true);
          const existingAdmin =
            snapshotRef.current.users.find(
              (u) => u.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase()
            ) || INITIAL_USERS[0];
          const adminProfile: UserProfile = {
            ...existingAdmin,
            id: uid,
            email: fbUser.email || ADMIN_BOOTSTRAP_EMAIL,
            role: 'admin',
            status: 'active',
          };
          await ensureAdminMarker(uid, adminProfile.email || ADMIN_BOOTSTRAP_EMAIL);
          setAdminMarkerVerified(true);
          await upsertUserToFirestore(adminProfile, uid);
          await bootstrapExistingDataToFirestore(uid, snapshotRef.current);
          void runIdempotentFirestoreMigration(uid).catch(() => undefined);

          setUsers((prev) => {
            const exists = prev.some((u) => u.id === uid);
            if (exists) return prev.map((u) => (u.id === uid ? { ...u, ...adminProfile } : u));
            return [adminProfile, ...prev.filter((u) => u.id !== 'admin-ts')];
          });
          setCurrentUserId(uid);

          unsubFirestore = subscribeSchoolFirestore('admin', undefined, uid, {
            onUsers: (list) => setUsers(list),
            onTerms: (list) => setAcademicTerms(list.length > 0 ? list : INITIAL_TERMS),
            onAssignedBooks: (map) => setClassAssignedBooks(map),
            onSessions: (list) => setSessions(list),
            onSessionQrSecrets: (secrets) => setSessionQrSecrets(secrets),
            onGrades: (list) => setGrades(list),
            onFinalExams: (scores) => setFinalExamScores(scores),
            onServantSubs: (list) => setServantSubmissions(list),
            onLessonPosts: (list) => setLessonPosts(list),
            onLibraryBooks: (list) => setLibraryBooks(list),
            onChurchEvents: (list) => setChurchEvents(list),
            onYearWorkLocks: (locks) => setYearWorkApprovedClasses(locks),
            onNotifications: (list) => setNotifications(list),
            onError: (err) => {
              if (isQuotaExceededError(err)) {
                setFirebaseError('تم بلوغ الحد اليومي لقراءة البيانات مؤقتاً، يرجى المحاولة لاحقاً.');
              }
            },
          });
          setFirebaseConnected(true);
          setFirebaseError(null);
          setLastSyncedAt(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
        } else if (isPermittedAuthUser(fbUser)) {
          const [hasAdminMarker, fbProfile] = await Promise.all([
            checkIsAdminMarker(uid),
            fetchUserFromFirestore(uid),
          ]);

          if (fbProfile && fbProfile.status === 'active') {
            const effectiveRole: UserRole =
              hasAdminMarker && fbUser.emailVerified ? 'admin' : fbProfile.role;
            setAdminMarkerVerified(effectiveRole === 'admin' ? hasAdminMarker : false);
            const resolvedProfile: UserProfile = {
              ...fbProfile,
              role: effectiveRole,
            };

            if (effectiveRole === 'admin') {
              void runIdempotentFirestoreMigration(uid).catch(() => undefined);
            }

            setUsers((prev) => [resolvedProfile, ...prev.filter((u) => u.id !== uid)]);
            setCurrentUserId(uid);

            unsubFirestore = subscribeSchoolFirestore(effectiveRole, resolvedProfile.classId, uid, {
              onUsers: (list) => {
                if (effectiveRole === 'admin') {
                  setUsers(list);
                } else {
                  setUsers([resolvedProfile, ...list.filter((u) => u.id !== uid)]);
                }
              },
              onTerms: (list) => setAcademicTerms(list.length > 0 ? list : INITIAL_TERMS),
              onAssignedBooks: (map) => setClassAssignedBooks(map),
              onSessions: (list) => setSessions(list),
              onSessionQrSecrets: (secrets) => setSessionQrSecrets(secrets),
              onGrades: (list) => setGrades(list),
              onFinalExams: (scores) => setFinalExamScores(scores),
              onServantSubs: (list) => setServantSubmissions(list),
              onLessonPosts: (list) => setLessonPosts(list),
              onLibraryBooks: (list) => setLibraryBooks(list),
              onChurchEvents: (list) => setChurchEvents(list),
              onYearWorkLocks: (locks) => setYearWorkApprovedClasses(locks),
              onNotifications: (list) => setNotifications(list),
              onError: (err) => {
                if (isQuotaExceededError(err)) {
                  setFirebaseError('تم بلوغ الحد اليومي لقراءة البيانات مؤقتاً، يرجى المحاولة لاحقاً.');
                }
              },
            });
            setFirebaseConnected(true);
            setFirebaseError(null);
            setLastSyncedAt(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
          } else {
            // Unapproved (pending), suspended, or rejected accounts must not enter dashboards or subscribe to data
            setCurrentUserId('');
            setSessionQrSecrets({});
            setAdminMarkerVerified(false);
            if (fbProfile?.status === 'suspended') {
              setFirebaseError('تم إيقاف هذا الحساب مؤقتاً من قِبل أمانة الخدمة.');
            } else if (fbProfile?.status === 'rejected') {
              setFirebaseError('هذا الطلب مرفوض. تواصل مع أمين الخدمة للمراجعة.');
            }
          }
        }
      } catch (err: any) {
        if (isQuotaExceededError(err)) {
          setFirebaseError('تم بلوغ الحد اليومي لقراءة البيانات مؤقتاً.');
        } else {
          setFirebaseError(err?.message || 'تعذر المزامنة السحابية للبيانات.');
        }
      } finally {
        setFirebaseSyncing(false);
      }
    });

    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  const applyRemote = useCallback((payload: any) => {
    if (!payload) return;
    const state = payload?.data || payload;
    if (state.currentUser && state.currentUser.id && !auth.currentUser) {
      setCurrentUserId(state.currentUser.id);
    } else if (state.currentUser === null && !getApiToken() && !auth.currentUser) {
      setCurrentUserId('');
    }

    // Only apply backend list snapshots when Firebase Firestore realtime listener isn't active
    if (auth.currentUser) return;

    if (Array.isArray(state.users)) {
      setUsers(state.users);
    }
    if (Array.isArray(state.academicTerms) && state.academicTerms.length > 0) {
      setAcademicTerms(state.academicTerms);
    }
    if (state.classAssignedBooks && typeof state.classAssignedBooks === 'object') {
      setClassAssignedBooks(state.classAssignedBooks);
    }
    if (Array.isArray(state.sessions)) {
      setSessions(state.sessions);
    }
    if (Array.isArray(state.grades)) {
      setGrades(state.grades);
    }
    if (state.finalExamScores && typeof state.finalExamScores === 'object') {
      setFinalExamScores(state.finalExamScores);
    }
    if (Array.isArray(state.servantSubmissions)) {
      setServantSubmissions(state.servantSubmissions);
    }
    if (Array.isArray(state.notifications)) {
      setNotifications(state.notifications);
    }
    if (Array.isArray(state.lessonPosts)) {
      setLessonPosts(state.lessonPosts);
    }
    if (Array.isArray(state.libraryBooks)) {
      setLibraryBooks(state.libraryBooks);
    }
    if (Array.isArray(state.churchEvents)) {
      setChurchEvents(state.churchEvents);
    }
    if (state.yearWorkApprovedClasses && typeof state.yearWorkApprovedClasses === 'object') {
      setYearWorkApprovedClasses(state.yearWorkApprovedClasses);
    }
  }, []);

  // Single mount health check (+ legacy session hydration only when Express session exists without Firebase Auth)
  useEffect(() => {
    let cancelled = false;
    const checkBackend = async () => {
      try {
        const ok = await apiHealth();
        if (cancelled) return;
        setBackendStatus(ok ? 'online' : 'offline');
        if (ok && getApiToken() && !auth.currentUser) {
          const data = await apiRequest<any>('/api/state').catch(() => null);
          if (!cancelled && data) applyRemote(data);
        }
      } catch {
        if (!cancelled) setBackendStatus('offline');
      }
    };
    void checkBackend();
    return () => {
      cancelled = true;
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
    const found = users.find(
      (u) =>
        (u.email && u.email.toLowerCase() === inputTrim) ||
        u.phone === identifier.trim() ||
        u.name.toLowerCase() === inputTrim
    );
    if (!found) {
      return {
        success: false,
        message: 'يرجى تسجيل الدخول باستخدام حساب جوجل المعتمد.',
      };
    }
    if (found.status === 'suspended') {
      return { success: false, message: 'تم إيقاف هذا الحساب مؤقتاً من قِبل أمانة الخدمة.' };
    }
    if (found.status === 'rejected') {
      return { success: false, message: 'هذا الطلب مرفوض. تواصل مع أمين الخدمة للمراجعة.' };
    }
    if (found.status === 'pending') {
      return {
        success: false,
        message: 'أسف، برجاء انتظار موافقة أمين الخدمة على حسابك أولاً',
      };
    }
    return {
      success: false,
      message: 'يلزم تسجيل الدخول بحساب جوجل للتحقق الآمن من الهوية.',
    };
  };

  const trackFbError = (err: unknown) => {
    if (isQuotaExceededError(err)) {
      setFirebaseError('تم بلوغ الحد اليومي لقراءة البيانات مؤقتاً.');
    } else if (err instanceof Error) {
      setFirebaseError(err.message);
    }
  };

  const getFbUid = (): string | null =>
    auth.currentUser?.uid ? sanitizeFirestoreId(auth.currentUser.uid) : null;

  const loginWithGoogle = async () => {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const fbUser = cred.user;
      const uid = sanitizeFirestoreId(fbUser.uid);
      const email = fbUser.email || '';

      if (!fbUser.emailVerified) {
        return {
          success: false,
          message: 'يرجى تأكيد البريد الإلكتروني في حساب جوجل أولاً قبل تقديم طلب الانضمام.',
        };
      }

      if (isVerifiedAdminEmail(email, fbUser.emailVerified)) {
        setFirebaseSyncing(true);
        const existingAdmin =
          snapshotRef.current.users.find(
            (u) => u.email?.toLowerCase() === ADMIN_BOOTSTRAP_EMAIL.toLowerCase()
          ) || INITIAL_USERS[0];
        const adminProfile: UserProfile = {
          ...existingAdmin,
          id: uid,
          email: email || ADMIN_BOOTSTRAP_EMAIL,
          role: 'admin',
          status: 'active',
        };
        await ensureAdminMarker(uid, adminProfile.email || ADMIN_BOOTSTRAP_EMAIL);
        setAdminMarkerVerified(true);
        await upsertUserToFirestore(adminProfile, uid);
        await bootstrapExistingDataToFirestore(uid, snapshotRef.current);
        void runIdempotentFirestoreMigration(uid).catch(() => undefined);
        setCurrentUserId(uid);
        setLastSyncedAt(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
        setFirebaseSyncing(false);
        return {
          success: true,
          role: 'admin' as const,
          message: 'تم تسجيل دخول أمين الخدمة بنجاح.',
        };
      }

      const [hasAdminMarker, existingFbUser] = await Promise.all([
        checkIsAdminMarker(uid),
        fetchUserFromFirestore(uid),
      ]);

      if (existingFbUser) {
        if (existingFbUser.status === 'suspended') {
          setCurrentUserId('');
          await signOut(auth);
          return {
            success: false,
            message: 'تم إيقاف هذا الحساب مؤقتاً من قِبل أمانة الخدمة.',
          };
        }
        if (existingFbUser.status === 'rejected') {
          setCurrentUserId('');
          await signOut(auth);
          return {
            success: false,
            message: 'هذا الطلب مرفوض. تواصل مع أمين الخدمة للمراجعة.',
          };
        }
        if (existingFbUser.status === 'pending') {
          setCurrentUserId('');
          return {
            success: false,
            message: 'أسف، برجاء انتظار موافقة أمين الخدمة على حسابك أولاً',
          };
        }
        const effectiveRole: UserRole = hasAdminMarker ? 'admin' : existingFbUser.role;
        const resolved = { ...existingFbUser, role: effectiveRole };
        setUsers((prev) => [resolved, ...prev.filter((u) => u.id !== uid)]);
        setCurrentUserId(uid);
        return {
          success: true,
          role: effectiveRole,
          message: 'تم تسجيل الدخول بحساب جوجل بنجاح.',
        };
      }

      return {
        success: false,
        needsProfileCompletion: true,
        googleProfile: {
          uid,
          email,
          name: fbUser.displayName?.trim() || email.split('@')[0] || 'عضو جديد',
        },
        message: 'يرجى استكمال بيانات الفصل ورقم الهاتف لإرسال طلب الانضمام.',
      };
    } catch (err: any) {
      console.error('loginWithGoogle error:', err);
      setFirebaseSyncing(false);
      const rawMsg = err instanceof Error ? err.message : String(err || '');
      let parsedCode = typeof err?.code === 'string' ? err.code : '';
      let parsedError = rawMsg;
      try {
        const parsed = JSON.parse(rawMsg);
        if (parsed?.code) parsedCode = String(parsed.code);
        if (parsed?.error) parsedError = String(parsed.error);
      } catch {
        /* plain string error */
      }

      if (parsedCode === 'auth/popup-closed-by-user' || rawMsg.includes('popup-closed')) {
        return { success: false, message: 'تم إغلاق نافذة تسجيل الدخول بجوجل.' };
      }
      if (parsedCode === 'auth/cancelled-popup-request') {
        return { success: false, message: 'تم إلغاء نافذة تسجيل الدخول السابقة، حاول مرة أخرى.' };
      }
      if (parsedCode === 'auth/popup-blocked') {
        return { success: false, message: 'المتصفح حجب نافذة تسجيل الدخول، يرجى السماح بالنوافذ المنبثقة والمحاولة مرة أخرى.' };
      }
      if (parsedCode === 'auth/unauthorized-domain') {
        return { success: false, message: 'هذا النطاق غير مضاف في النطاقات المصرح بها لتسجيل الدخول بجوجل.' };
      }
      if (isQuotaExceededError(err) || parsedCode === 'resource-exhausted') {
        return {
          success: false,
          message: 'تم بلوغ الحد اليومي لقاعدة البيانات مؤقتاً، يرجى المحاولة لاحقاً.',
        };
      }
      if (
        parsedCode === 'permission-denied' ||
        parsedError.includes('PERMISSION_DENIED') ||
        parsedError.includes('Missing or insufficient permissions')
      ) {
        return {
          success: false,
          message: 'تعذر التحقق من الحساب بسبب صلاحيات قاعدة البيانات. يرجى المحاولة بعد قليل أو مراجعة أمين الخدمة.',
        };
      }
      if (
        parsedCode === 'unavailable' ||
        parsedError.includes('offline') ||
        parsedError.includes('network')
      ) {
        return {
          success: false,
          message: 'تعذر الاتصال حالياً. تأكد من اتصال الإنترنت وحاول مرة أخرى.',
        };
      }
      return {
        success: false,
        message: 'تعذر تسجيل الدخول عبر جوجل، يرجى المحاولة مرة أخرى.',
      };
    }
  };

  const parseFirebaseAuthOrFirestoreError = (err: unknown, fallbackMessage: string): string => {
    const rawMsg = err instanceof Error ? err.message : String(err || '');
    let parsedCode = typeof (err as any)?.code === 'string' ? String((err as any).code) : '';
    let parsedError = rawMsg;
    try {
      const parsed = JSON.parse(rawMsg);
      if (parsed?.code) parsedCode = String(parsed.code);
      if (parsed?.error) parsedError = String(parsed.error);
    } catch {
      /* plain string error */
    }

    if (parsedCode === 'auth/email-already-in-use') {
      return 'هذا البريد الإلكتروني مسجل بالفعل على المنصة. يمكنك تسجيل الدخول به أو استخدام بريد آخر.';
    }
    if (parsedCode === 'auth/invalid-email') {
      return 'صيغة البريد الإلكتروني غير صحيحة (مثال: name@stpaul.school).';
    }
    if (parsedCode === 'auth/weak-password') {
      return 'كلمة المرور ضعيفة جداً؛ يجب أن تتكون من ٦ أحرف أو أرقام على الأقل.';
    }
    if (
      parsedCode === 'auth/invalid-credential' ||
      parsedCode === 'auth/wrong-password' ||
      parsedCode === 'auth/user-not-found'
    ) {
      return 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
    }
    if (parsedCode === 'auth/too-many-requests') {
      return 'تم إيقاف المحاولات مؤقتاً لكثرة المحاولات الخاطئة، يرجى المحاولة بعد قليل.';
    }
    if (parsedCode === 'auth/operation-not-allowed') {
      return 'تسجيل الدخول بالبريد وكلمة المرور غير مفعّل حالياً في إعدادات Firebase Authentication.';
    }
    if (parsedCode === 'auth/user-disabled') {
      return 'تم تعطيل هذا الحساب، يرجى مراجعة أمين الخدمة.';
    }
    if (isQuotaExceededError(err) || parsedCode === 'resource-exhausted') {
      return 'تم بلوغ الحد اليومي لقاعدة البيانات مؤقتاً، يرجى المحاولة لاحقاً أو إبلاغ أمين الخدمة.';
    }
    if (
      parsedCode === 'permission-denied' ||
      parsedError.includes('PERMISSION_DENIED') ||
      parsedError.includes('Missing or insufficient permissions')
    ) {
      return 'تم رفض العملية من قواعد الأمان في قاعدة البيانات. تأكد من تحديث قواعد Firebase أو راجع أمين الخدمة.';
    }
    if (
      parsedCode === 'unavailable' ||
      parsedError.includes('offline') ||
      parsedError.includes('network')
    ) {
      return 'تعذر الاتصال حالياً. تأكد من اتصال الإنترنت وحاول مرة أخرى.';
    }
    return fallbackMessage;
  };

  const loginWithEmailPassword = async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' };
    }
    try {
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const fbUser = cred.user;
      const uid = sanitizeFirestoreId(fbUser.uid);

      const [hasAdminMarker, existingFbUser] = await Promise.all([
        checkIsAdminMarker(uid),
        fetchUserFromFirestore(uid),
      ]);

      if (existingFbUser) {
        if (existingFbUser.status === 'suspended') {
          setCurrentUserId('');
          await signOut(auth);
          return {
            success: false,
            message: 'تم إيقاف هذا الحساب مؤقتاً من قِبل أمانة الخدمة.',
          };
        }
        if (existingFbUser.status === 'rejected') {
          setCurrentUserId('');
          await signOut(auth);
          return {
            success: false,
            message: 'هذا الطلب مرفوض. تواصل مع أمين الخدمة للمراجعة.',
          };
        }
        if (existingFbUser.status === 'pending') {
          setCurrentUserId('');
          await signOut(auth);
          return {
            success: false,
            message: 'أسف، برجاء انتظار موافقة أمين الخدمة على حسابك أولاً',
          };
        }

        const effectiveRole: UserRole =
          hasAdminMarker && fbUser.emailVerified ? 'admin' : existingFbUser.role;
        const resolved = { ...existingFbUser, role: effectiveRole };
        setUsers((prev) => [resolved, ...prev.filter((u) => u.id !== uid)]);
        setCurrentUserId(uid);
        return {
          success: true,
          role: effectiveRole,
          message: 'تم تسجيل الدخول بنجاح.',
        };
      }

      return {
        success: false,
        needsProfileCompletion: true,
        googleProfile: {
          uid,
          email: fbUser.email || cleanEmail,
          name: fbUser.displayName?.trim() || cleanEmail.split('@')[0] || 'عضو جديد',
        },
        message: 'يرجى استكمال بيانات الفصل ورقم الهاتف لإرسال طلب الانضمام.',
      };
    } catch (err) {
      console.error('loginWithEmailPassword error:', err);
      setFirebaseSyncing(false);
      return {
        success: false,
        message: parseFirebaseAuthOrFirestoreError(err, 'تعذر تسجيل الدخول بالبريد وكلمة المرور.'),
      };
    }
  };

  const registerWithEmailPassword = async (data: {
    name: string;
    email: string;
    password: string;
    phone: string;
    age: number;
    classId: ClassId;
    role?: 'student' | 'servant';
    guardianPhone?: string;
    confessionFather?: string;
  }) => {
    const cleanName = data.name.trim();
    const cleanEmail = data.email.trim().toLowerCase();
    if (!cleanName) {
      return { success: false, message: 'يرجى كتابة الاسم الكامل.' };
    }
    if (!cleanEmail) {
      return { success: false, message: 'يرجى إدخال البريد الإلكتروني الخاص بالحساب.' };
    }
    if (!data.password || data.password.length < 6) {
      return { success: false, message: 'يجب أن تكون كلمة المرور ٦ أحرف أو أرقام على الأقل.' };
    }

    try {
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, data.password);
      const fbUser = cred.user;
      try {
        await updateProfile(fbUser, { displayName: cleanName });
      } catch {
        /* non-fatal */
      }
      const uid = sanitizeFirestoreId(fbUser.uid);
      const requestedRole = data.role === 'servant' ? 'servant' : 'student';
      const newProfile: UserProfile = {
        id: uid,
        name: cleanName,
        email: fbUser.email || cleanEmail,
        phone: data.phone.trim(),
        age: Number(data.age || 14),
        role: 'student',
        requestedRole,
        status: 'pending',
        classId: data.classId,
        guardianPhone: data.guardianPhone?.trim() || undefined,
        confessionFather: data.confessionFather?.trim() || undefined,
        registeredAt: new Date().toISOString().split('T')[0],
        notes: requestedRole === 'servant' ? 'طلب انضمام كخادم' : undefined,
      };

      await registerPendingUserToFirestore(newProfile, uid);
      setUsers((prev) => [newProfile, ...prev.filter((u) => u.id !== uid)]);
      setCurrentUserId('');
      await signOut(auth).catch(() => undefined);
      return {
        success: true,
        name: newProfile.name,
        message: 'تم إنشاء الحساب وإرسال طلب الانضمام وينتظر موافقة أمين الخدمة.',
      };
    } catch (err) {
      console.error('registerWithEmailPassword error:', err);
      const rawMsg = err instanceof Error ? err.message : String(err || '');
      if (rawMsg === 'INVALID_CLASS_ID') {
        return { success: false, message: 'يرجى اختيار الفصل الدراسي الصحيح.' };
      }
      if (rawMsg === 'ACCOUNT_ALREADY_ACTIVE') {
        return { success: false, message: 'هذا الحساب مفعل بالفعل، يمكنك تسجيل الدخول مباشرة.' };
      }
      if (rawMsg === 'ACCOUNT_REJECTED') {
        return { success: false, message: 'هذا الطلب مرفوض. تواصل مع أمين الخدمة للمراجعة.' };
      }
      if (rawMsg === 'ACCOUNT_SUSPENDED') {
        return { success: false, message: 'تم إيقاف هذا الحساب مؤقتاً من قِبل أمانة الخدمة.' };
      }
      return {
        success: false,
        message: parseFirebaseAuthOrFirestoreError(err, 'تعذر إنشاء الحساب، يرجى المحاولة مرة أخرى.'),
      };
    }
  };

  const completeGoogleRegistration = async (data: {
    phone: string;
    age: number;
    classId: ClassId;
    role?: 'student' | 'servant';
    guardianPhone?: string;
    confessionFather?: string;
  }) => {
    const fbUser = auth.currentUser;
    if (!fbUser) {
      return { success: false, message: 'يرجى تسجيل الدخول بحسابك أولاً.' };
    }
    if (!isPermittedAuthUser(fbUser)) {
      return { success: false, message: 'يرجى تأكيد البريد الإلكتروني أولاً.' };
    }

    const uid = sanitizeFirestoreId(fbUser.uid);
    const requestedRole = data.role === 'servant' ? 'servant' : 'student';
    const cleanName =
      fbUser.displayName?.trim() || fbUser.email?.split('@')[0]?.trim() || 'عضو جديد';
    const newProfile: UserProfile = {
      id: uid,
      name: cleanName,
      email: fbUser.email || undefined,
      phone: data.phone.trim(),
      age: Number(data.age || 14),
      role: 'student',
      requestedRole,
      status: 'pending',
      classId: data.classId,
      guardianPhone: data.guardianPhone?.trim() || undefined,
      confessionFather: data.confessionFather?.trim() || undefined,
      avatar: fbUser.photoURL || undefined,
      registeredAt: new Date().toISOString().split('T')[0],
      notes: requestedRole === 'servant' ? 'طلب انضمام كخادم' : undefined,
    };

    try {
      await registerPendingUserToFirestore(newProfile, uid);

      setUsers((prev) => [newProfile, ...prev.filter((u) => u.id !== uid)]);
      setCurrentUserId('');
      return {
        success: true,
        name: newProfile.name,
        message: 'تم تسجيل بياناتك بنجاح وينتظر الحساب موافقة أمين الخدمة.',
      };
    } catch (err: any) {
      console.error('completeGoogleRegistration error:', err);
      trackFbError(err);

      const rawMsg = err instanceof Error ? err.message : String(err || '');
      let parsedCode = typeof err?.code === 'string' ? err.code : '';
      let parsedError = rawMsg;
      try {
        const parsed = JSON.parse(rawMsg);
        if (parsed?.code) parsedCode = String(parsed.code);
        if (parsed?.error) parsedError = String(parsed.error);
      } catch {
        /* plain string error */
      }

      if (rawMsg === 'UNVERIFIED_EMAIL') {
        return { success: false, message: 'يرجى تأكيد البريد الإلكتروني في حساب جوجل أولاً.' };
      }
      if (rawMsg === 'INVALID_CLASS_ID') {
        return { success: false, message: 'يرجى اختيار الفصل الدراسي الصحيح.' };
      }
      if (rawMsg === 'ACCOUNT_ALREADY_ACTIVE') {
        return { success: false, message: 'هذا الحساب مفعل بالفعل، يمكنك تسجيل الدخول مباشرة.' };
      }
      if (rawMsg === 'ACCOUNT_REJECTED') {
        return { success: false, message: 'هذا الطلب مرفوض. تواصل مع أمين الخدمة للمراجعة.' };
      }
      if (rawMsg === 'ACCOUNT_SUSPENDED') {
        return { success: false, message: 'تم إيقاف هذا الحساب مؤقتاً من قِبل أمانة الخدمة.' };
      }
      if (isQuotaExceededError(err) || parsedCode === 'resource-exhausted') {
        return {
          success: false,
          message: 'تم بلوغ الحد اليومي لقاعدة البيانات مؤقتاً، يرجى المحاولة لاحقاً أو إبلاغ أمين الخدمة.',
        };
      }
      if (
        parsedCode === 'permission-denied' ||
        parsedError.includes('PERMISSION_DENIED') ||
        parsedError.includes('Missing or insufficient permissions')
      ) {
        return {
          success: false,
          message: 'تم رفض حفظ الطلب من قواعد الحماية (permission-denied). تأكد من تحديث قواعد الأمان في Firebase أو راجع أمين الخدمة.',
        };
      }
      if (
        parsedCode === 'unavailable' ||
        parsedError.includes('offline') ||
        parsedError.includes('network')
      ) {
        return {
          success: false,
          message: 'تعذر الاتصال بقاعدة البيانات حالياً. تأكد من اتصال الإنترنت وحاول مرة أخرى.',
        };
      }
      return { success: false, message: 'تعذر حفظ البيانات. يرجى المحاولة مرة أخرى.' };
    }
  };

  const syncNowToFirebase = async () => {
    const uid = getFbUid();
    const isAdminActor =
      currentUser?.role === 'admin' ||
      isVerifiedAdminEmail(auth.currentUser?.email, auth.currentUser?.emailVerified);
    if (!uid || !isAdminActor) {
      return {
        success: false,
        message: 'يتطلب إتمام المزامنة تسجيل الدخول بحساب مسؤول النظام عبر جوجل.',
      };
    }
    try {
      setFirebaseSyncing(true);
      const uploaded = await bootstrapExistingDataToFirestore(uid, snapshotRef.current);
      setFirebaseConnected(true);
      setFirebaseError(null);
      setLastSyncedAt(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
      return {
        success: true,
        uploaded,
        message:
          uploaded > 0
            ? `تم رفع ومزامنة ${uploaded} سجل جديد إلى قاعدة البيانات السحابية بنجاح.`
            : 'جميع بيانات المدرسة متزامنة ومؤمّنة بالكامل في قاعدة البيانات السحابية.',
      };
    } catch (err: any) {
      trackFbError(err);
      return {
        success: false,
        message: `تعذر إتمام المزامنة السحابية: ${err instanceof Error ? err.message : 'خطأ غير متوقع'}`,
      };
    } finally {
      setFirebaseSyncing(false);
    }
  };

  const checkAdminSecurityStatus = async () => {
    const conn = await testConnection();
    setFirebaseConnected(conn.online);
    if (!conn.online && conn.error) {
      setFirebaseError(conn.error);
    } else if (conn.online) {
      setFirebaseError(null);
    }
    const uid = getFbUid();
    const markerOk = uid ? await checkIsAdminMarker(uid) : false;
    setAdminMarkerVerified(uid ? markerOk : null);
    return {
      connected: conn.online,
      adminMarkerVerified: markerOk,
      error: conn.error,
    };
  };

  const runSafeMigration = async (): Promise<MigrationReport | null> => {
    const uid = getFbUid();
    if (!uid || currentUser?.role !== 'admin') return null;
    try {
      setFirebaseSyncing(true);
      const report = await runIdempotentFirestoreMigration(uid);
      setFirebaseError(null);
      setLastSyncedAt(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
      return report;
    } catch (err: any) {
      trackFbError(err);
      return null;
    } finally {
      setFirebaseSyncing(false);
    }
  };

  const logout = () => {
    if (backendStatus === 'online') {
      void apiRequest('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    }
    void signOut(auth).catch(() => undefined);
    setApiToken('');
    setCurrentUserId('');
    setSessionQrSecrets({});
    setAdminMarkerVerified(null);
    setLastSyncedAt(null);
    setFirebaseError(null);
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
      setCurrentUserId('');
      setApiToken('');
      try {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      } catch {
        /* ignore */
      }
      return (registeredUser as UserProfile) || users[0];
    }

    throw new Error('يرجى التسجيل باستخدام حساب جوجل لإرسال طلبك بأمان.');
  };

  const approveUserWithDetails = async (
    userId: string,
    updates?: { role?: UserProfile['role']; classId?: ClassId; mergeFromLegacyId?: string }
  ) => {
    if (currentUser?.id === userId) return;
    const target = users.find((u) => u.id === userId);
    if (!target) return;

    const resolvedRole: UserRole =
      updates?.role || (target.requestedRole === 'servant' ? 'servant' : target.role);
    const resolvedClassId = updates?.classId !== undefined ? updates.classId : target.classId;
    const updatedTarget: UserProfile = {
      ...target,
      role: resolvedRole,
      classId: resolvedClassId,
      status: 'active',
    };

    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedTarget : u)));
    setNotifications((prev) =>
      prev.map((n) =>
        (n.type === 'new_student' && (n.message.includes(target.name) || n.audienceUserId === userId)) ||
        n.audienceUserId === userId
          ? { ...n, read: true }
          : n
      )
    );

    const fbUid = getFbUid();
    if (fbUid) {
      try {
        await upsertUserToFirestore(updatedTarget, updatedTarget.id);
        if (resolvedRole === 'admin') {
          await ensureAdminMarker(updatedTarget.id, updatedTarget.email || '');
        } else {
          await removeAdminMarker(updatedTarget.id);
        }
        if (updates?.mergeFromLegacyId) {
          await linkLegacyUserToFirebaseUid(updates.mergeFromLegacyId, updatedTarget.id, fbUid);
        }
      } catch (err) {
        trackFbError(err);
      }
    }

    if (backendStatus === 'online') {
      void remote(`/api/users/${userId}/approve`, { method: 'POST' })
        .then((res: any) => {
          if (res?.notifications) setNotifications(res.notifications);
        })
        .catch(() => undefined);
      if (updates?.role || updates?.classId) {
        void remote('/api/users/action', {
          method: 'POST',
          body: JSON.stringify({
            action: 'updateServant',
            userId,
            role: resolvedRole,
            classId: resolvedClassId,
          }),
        }).catch(() => undefined);
      }
    }
  };

  const approveUser = (userId: string) => {
    void approveUserWithDetails(userId);
  };

  const rejectUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target?.role === 'admin') return;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'rejected' } : u)));
    setNotifications((prev) =>
      prev.map((n) =>
        (n.type === 'new_student' && target && (n.message.includes(target.name) || n.audienceUserId === userId)) ||
        n.audienceUserId === userId
          ? { ...n, read: true }
          : n
      )
    );
    const fbUid = getFbUid();
    if (fbUid && target) {
      void upsertUserToFirestore({ ...target, status: 'rejected' }, target.id).catch(trackFbError);
      void removeAdminMarker(target.id);
    }
    if (backendStatus === 'online') {
      void remote(`/api/users/${userId}/reject`, { method: 'POST' }).then((res: any) => {
        if (res?.notifications) setNotifications(res.notifications);
      });
    }
  };

  const suspendUser = (userId: string) => {
    if (currentUser?.id === userId) return;
    const target = users.find((u) => u.id === userId);
    if (!target || target.role === 'admin') return;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'suspended' } : u)));
    const fbUid = getFbUid();
    if (fbUid) {
      void upsertUserToFirestore({ ...target, status: 'suspended' }, target.id).catch(trackFbError);
      void removeAdminMarker(target.id);
    }
    if (backendStatus === 'online') {
      void remote('/api/users/action', {
        method: 'POST',
        body: JSON.stringify({ action: 'suspend', userId }),
      }).catch(() => undefined);
    }
  };

  const reactivateUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: 'active' } : u)));
    const fbUid = getFbUid();
    if (fbUid) {
      void upsertUserToFirestore({ ...target, status: 'active' }, target.id).catch(trackFbError);
    }
    if (backendStatus === 'online') {
      void remote('/api/users/action', {
        method: 'POST',
        body: JSON.stringify({ action: 'reactivate', userId }),
      }).catch(() => undefined);
    }
  };

  const toggleAssistantRole = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target || target.role === 'admin') return;
    const nextRole: UserRole = target.role === 'assistant' ? 'servant' : 'assistant';
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role: nextRole } : u))
    );
    const fbUid = getFbUid();
    if (fbUid) {
      void upsertUserToFirestore({ ...target, role: nextRole }, target.id).catch(trackFbError);
    }
    if (backendStatus === 'online') {
      void remote(`/api/users/${userId}/toggle-assistant`, { method: 'POST' });
    }
  };

  const deleteUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (target?.role === 'admin') return;
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    setGrades((prev) => prev.filter((g) => g.studentId !== userId));
    setFinalExamScores((prev) => {
      const copy = { ...prev };
      delete copy[userId];
      return copy;
    });
    setServantSubmissions((prev) => prev.filter((s) => s.servantId !== userId));

    const fbUid = getFbUid();
    if (fbUid) {
      void deleteUserFromFirestore(userId).catch(trackFbError);
    }
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
    setSessionQrSecrets((prev) => {
      const copy = { ...prev };
      delete copy[sessionId];
      return copy;
    });
    setGrades((prev) => prev.filter((g) => g.sessionId !== sessionId));
    const fbUid = getFbUid();
    if (fbUid) {
      void deleteDocFromFirestore(COLLECTIONS.SESSIONS, sessionId).catch(trackFbError);
      void deleteDocFromFirestore(COLLECTIONS.SESSION_QR_SECRETS, sessionId).catch(() => undefined);
    }
    if (backendStatus === 'online') {
      void remote(`/api/sessions/${sessionId}`, { method: 'DELETE' });
    }
  };

  const deleteLessonPost = (postId: string) => {
    setLessonPosts((prev) => prev.filter((p) => p.id !== postId));
    const fbUid = getFbUid();
    if (fbUid) {
      void deleteDocFromFirestore(COLLECTIONS.LESSON_POSTS, postId).catch(trackFbError);
    }
    if (backendStatus === 'online') {
      void remote(`/api/posts/${postId}`, { method: 'DELETE' });
    }
  };

  const addStudentByAdmin = async (
    studentData: Omit<UserProfile, 'id' | 'role' | 'status' | 'registeredAt'> & { password?: string }
  ) => {
    const { password, ...profileFields } = studentData;
    const cleanEmail = profileFields.email?.trim().toLowerCase();
    const cleanPassword = password?.trim();

    let resolvedId = `stud-${Date.now()}`;
    if (cleanEmail || cleanPassword) {
      if (!cleanEmail) {
        throw new Error('يرجى إدخال البريد الإلكتروني للطالب عند تعيين كلمة مرور.');
      }
      if (!cleanPassword || cleanPassword.length < 6) {
        throw new Error('يجب أن تتكون كلمة مرور الطالب من ٦ أحرف أو أرقام على الأقل.');
      }
      try {
        resolvedId = await createAuthAccountWithoutSigningOut(
          cleanEmail,
          cleanPassword,
          profileFields.name.trim()
        );
      } catch (err) {
        throw new Error(
          parseFirebaseAuthOrFirestoreError(err, 'تعذر إنشاء حساب الدخول للطالب، تأكد من صحة البيانات.')
        );
      }
    }

    const newStudent: UserProfile = {
      ...profileFields,
      ...(cleanEmail ? { email: cleanEmail } : {}),
      id: resolvedId,
      status: 'active',
      role: 'student',
      registeredAt: new Date().toISOString().split('T')[0],
    };
    setUsers((prev) => [newStudent, ...prev.filter((u) => u.id !== resolvedId)]);
    const fbUid = getFbUid();
    if (fbUid) {
      await upsertUserToFirestore(newStudent, newStudent.id).catch((err) => {
        trackFbError(err);
        throw new Error(
          parseFirebaseAuthOrFirestoreError(err, 'تم إنشاء الحساب ولكن تعذر حفظ بيانات الطالب في قاعدة البيانات.')
        );
      });
    }
    if (backendStatus === 'online') {
      void remote('/api/users/action', {
        method: 'POST',
        body: JSON.stringify({ action: 'addStudent', student: profileFields }),
      }).catch(() => undefined);
    }
    return newStudent;
  };

  const changeStudentClass = (studentId: string, newClassId: ClassId) => {
    const target = users.find((u) => u.id === studentId);
    setUsers((prev) => prev.map((u) => (u.id === studentId ? { ...u, classId: newClassId } : u)));
    const fbUid = getFbUid();
    if (fbUid && target) {
      void upsertUserToFirestore({ ...target, classId: newClassId }, target.id).catch(trackFbError);
    }
    if (backendStatus === 'online') {
      void remote('/api/users/action', {
        method: 'POST',
        body: JSON.stringify({ action: 'changeClass', userId: studentId, newClassId }),
      });
    }
  };

  const updateServantProfile = (servantId: string, updates: { role?: UserProfile['role']; classId?: ClassId }) => {
    const target = users.find((u) => u.id === servantId);
    if (!target || target.role === 'admin') return;
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
    const fbUid = getFbUid();
    if (fbUid) {
      void upsertUserToFirestore(
        {
          ...target,
          role: updates.role || target.role,
          classId: updates.classId !== undefined ? updates.classId : target.classId,
        },
        target.id
      ).catch(trackFbError);
    }
    if (backendStatus === 'online') {
      void remote('/api/users/action', {
        method: 'POST',
        body: JSON.stringify({ action: 'updateServant', userId: servantId, ...updates }),
      });
    }
  };

  const calculateAndLockYearWork = (classId: ClassId) => {
    setYearWorkApprovedClasses((prev) => ({ ...prev, [classId]: true }));
    const fbUid = getFbUid();
    if (fbUid) {
      void upsertYearWorkLockToFirestore(classId, true, fbUid).catch(trackFbError);
    }
    if (backendStatus === 'online') {
      void remote('/api/year-work-lock', {
        method: 'POST',
        body: JSON.stringify({ classId, locked: true }),
      });
    }
  };

  const unlockYearWorkCalculation = (classId: ClassId) => {
    setYearWorkApprovedClasses((prev) => ({ ...prev, [classId]: false }));
    const fbUid = getFbUid();
    if (fbUid) {
      void upsertYearWorkLockToFirestore(classId, false, fbUid).catch(trackFbError);
    }
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

    const fbUid = getFbUid();
    if (fbUid) {
      void upsertAssignedBookToFirestore(data, fbUid).catch(trackFbError);
    }
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

  const saveSessionGrade = (
    gradeData: Partial<SessionGrade> & { studentId: string; sessionId: string; sessionTitle?: string; termId?: string }
  ) => {
    const session = sessions.find((s) => s.id === gradeData.sessionId);
    const student = users.find((u) => u.id === gradeData.studentId);
    const resolvedClassId = gradeData.classId || student?.classId || session?.classId;
    const completeRecord: SessionGrade = {
      id: sanitizeFirestoreId(`${gradeData.sessionId}_${gradeData.studentId}`),
      sessionId: gradeData.sessionId,
      sessionTitle: gradeData.sessionTitle || session?.title || 'لقاء دراسة الكتاب المقدس',
      date: session?.date || new Date().toISOString().split('T')[0],
      studentId: gradeData.studentId,
      classId: resolvedClassId,
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

    const fbUid = getFbUid();
    if (fbUid) {
      void upsertGradeToFirestore(completeRecord, fbUid, resolvedClassId).catch(trackFbError);
    }

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
    const sessionId = sanitizeFirestoreId(data.sessionId || data.sessionMeta?.id || `sess-${Date.now()}`);
    const sessionMeta = {
      ...data.sessionMeta,
      id: sessionId,
    };
    const classId: ClassId = (sessionMeta.classId || currentUser?.classId || 'prep_2_3') as ClassId;
    const existingSecret = sessionQrSecrets[sessionId];
    const secretCode =
      existingSecret?.qrSecretCode ||
      sessionMeta.qrSecretCode ||
      generateQrSecretCode(sessionMeta.sessionNumber);
    const expiresAtMs = existingSecret?.expiresAtMs || Date.now() + 3 * 60 * 60 * 1000;

    const updatedSessionObj: BibleSession = {
      id: sessionId,
      title: sessionMeta.title || 'لقاء دراسة الكتاب المقدس',
      classId,
      termId: sessionMeta.termId || currentTermId,
      date: sessionMeta.date || new Date().toISOString().split('T')[0],
      biblePassage: sessionMeta.biblePassage || sessionMeta.coveredChapters || 'شواهد مختارة',
      servantName: sessionMeta.servantName || currentUser?.name || 'خادم الفصل',
      maxScorePerMetric: 10,
      qrActive: sessionMeta.qrActive !== undefined ? Boolean(sessionMeta.qrActive) : true,
      expiresAtMs,
      sessionNumber: sessionMeta.sessionNumber,
      bookId: sessionMeta.bookId,
      bookName: sessionMeta.bookName,
      testament: sessionMeta.testament,
      coveredChapters: sessionMeta.coveredChapters,
      objective: sessionMeta.objective,
      memoryVerse: sessionMeta.memoryVerse,
      memoryVerseRef: sessionMeta.memoryVerseRef,
      memoryVerses: sessionMeta.memoryVerses,
      lessonSummary: sessionMeta.lessonSummary,
      attachmentName: sessionMeta.attachmentName,
      fileData: sessionMeta.fileData,
      fileType: sessionMeta.fileType,
      fileSize: sessionMeta.fileSize,
    };

    const secretObj: SessionQrSecret = {
      sessionId,
      classId,
      qrSecretCode: secretCode,
      qrActive: updatedSessionObj.qrActive,
      expiresAtMs,
    };

    const gradeRecs: SessionGrade[] = data.grades.map((g) => ({
      id: sanitizeFirestoreId(`${sessionId}_${g.studentId}`),
      sessionId,
      sessionTitle: updatedSessionObj.title,
      date: updatedSessionObj.date,
      studentId: g.studentId,
      classId,
      termId: updatedSessionObj.termId,
      exam: clamp(Number(g.exam ?? 0), 0, 10),
      homework: clamp(Number(g.homework ?? 0), 0, 10),
      attendance: clamp(Number(g.attendance ?? 0), 0, 1),
      participation: clamp(Number(g.participation ?? 0), 0, 1),
      prayer: clamp(Number(g.prayer ?? 0), 0, 1),
      tools: clamp(Number(g.tools ?? 0), 0, 1),
      notes: g.notes || '',
      qrAttendedAt: g.qrAttendedAt,
    }));

    setSessions((prev) => {
      const idx = prev.findIndex((s) => s.id === sessionId);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedSessionObj;
        return copy;
      }
      return [updatedSessionObj, ...prev];
    });
    setSessionQrSecrets((prev) => ({ ...prev, [sessionId]: secretObj }));
    setGrades((prev) => {
      const copy = [...prev];
      for (const rec of gradeRecs) {
        const idx = copy.findIndex((ex) => ex.sessionId === sessionId && ex.studentId === rec.studentId);
        if (idx >= 0) copy[idx] = { ...copy[idx], ...rec };
        else copy.push(rec);
      }
      return copy;
    });

    const fbUid = getFbUid();
    if (fbUid) {
      try {
        await upsertSessionToFirestore(updatedSessionObj, fbUid);
        await upsertSessionQrSecretToFirestore(secretObj, fbUid);
        await upsertBatchGradesToFirestore(gradeRecs, fbUid, classId);
      } catch (err) {
        trackFbError(err);
        throw err;
      }
    }

    if (backendStatus === 'online') {
      try {
        await remote('/api/grades/batch', {
          method: 'POST',
          body: JSON.stringify({
            sessionId,
            sessionMeta: { ...updatedSessionObj, qrSecretCode: secretCode },
            grades: data.grades,
          }),
        });
      } catch (e) {
        console.error('Error saving batch grades to server:', e);
      }
    }
  };

  const recordQrAttendance = async (studentId: string, sessionId: string, secretCode?: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    const student = users.find((u) => u.id === studentId);
    const timeString = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const cleanCode = (secretCode || '').trim();

    if (!session) return { success: false, message: 'اللقاء المحدد غير موجود.' };
    if (!session.qrActive) return { success: false, message: 'كود الحضور لهذا اللقاء مغلق حالياً من قِبل الخادم.' };
    if (session.expiresAtMs && Date.now() > session.expiresAtMs) {
      return { success: false, message: 'انتهت صلاحية كود الحضور. اطلب من الخادم تجديد الكود.' };
    }
    if (student?.classId && student.classId !== session.classId) {
      return { success: false, message: 'هذا اللقاء ليس لفصلك الدراسي.' };
    }
    if (!cleanCode) {
      return { success: false, message: 'امسح الباركود أو أدخل كود الجلسة الظاهر مع الخادم.' };
    }

    const existingGrade = grades.find((g) => g.sessionId === sessionId && g.studentId === studentId);
    if (existingGrade && Number(existingGrade.attendance || 0) >= 1) {
      return { success: false, message: 'تم تسجيل حضورك في هذه الحصة مسبقاً!' };
    }

    if (backendStatus === 'online' && getApiToken() && !auth.currentUser) {
      try {
        const data = await remote('/api/attendance/qr', {
          method: 'POST',
          body: JSON.stringify({ sessionId, secretCode: cleanCode }),
        });
        return { success: true, message: (data as { message?: string }).message || 'تم تسجيل الحضور.' };
      } catch (err) {
        return { success: false, message: err instanceof ApiError ? err.message : 'تعذر تسجيل الحضور.' };
      }
    }

    const fbUid = getFbUid();
    if (!fbUid) {
      return { success: false, message: 'يلزم تسجيل الدخول بحساب جوجل للتحقق من كود الحضور.' };
    }

    try {
      await submitStudentQrAttendanceToFirestore({
        session,
        studentId: fbUid,
        classId: (student?.classId || session.classId) as ClassId,
        submittedQrCode: cleanCode,
        qrAttendedAt: timeString,
      });

      setGrades((prev) => {
        const existingIdx = prev.findIndex((g) => g.sessionId === sessionId && g.studentId === fbUid);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            attendance: 1,
            qrAttendedAt: timeString,
            submittedQrCode: cleanCode,
          };
          return updated;
        }
        return [
          ...prev,
          {
            id: sanitizeFirestoreId(`${sessionId}_${fbUid}`),
            sessionId,
            sessionTitle: session.title,
            date: session.date,
            studentId: fbUid,
            classId: session.classId,
            termId: session.termId || currentTermId,
            exam: 0,
            homework: 0,
            attendance: 1,
            participation: 0,
            prayer: 0,
            tools: 0,
            qrAttendedAt: timeString,
            submittedQrCode: cleanCode,
            notes: 'تم تسجيل الحضور عبر رمز الجلسة بنجاح',
          },
        ];
      });

      if (backendStatus === 'online' && getApiToken()) {
        void apiRequest('/api/attendance/qr', {
          method: 'POST',
          body: JSON.stringify({ sessionId, secretCode: cleanCode }),
        }).catch(() => undefined);
      }

      return {
        success: true,
        message: `تم تسجيل حضورك بنجاح في ${session.title} وحصلت على درجة الحضور (١ من ١)!`,
      };
    } catch (err: any) {
      const msg = String(err?.message || '');
      if (msg.includes('permission-denied') || msg.includes('PERMISSION_DENIED')) {
        return {
          success: false,
          message: 'كود الجلسة غير صحيح أو انتهت صلاحيته أو لست مسجلاً في هذا الفصل.',
        };
      }
      return {
        success: false,
        message: msg || 'تعذر تسجيل الحضور. تأكد من الكود الظاهر مع الخادم.',
      };
    }
  };

  const toggleSessionQr = (sessionId: string, active: boolean) => {
    const existingSession = sessions.find((s) => s.id === sessionId);
    const nextExpires = active ? Date.now() + 3 * 60 * 60 * 1000 : existingSession?.expiresAtMs;
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, qrActive: active, expiresAtMs: nextExpires } : s))
    );
    const existingSecret = sessionQrSecrets[sessionId];
    if (existingSecret) {
      setSessionQrSecrets((prev) => ({
        ...prev,
        [sessionId]: { ...existingSecret, qrActive: active, expiresAtMs: nextExpires },
      }));
    }
    const fbUid = getFbUid();
    if (fbUid && existingSession) {
      void upsertSessionToFirestore(
        { ...existingSession, qrActive: active, expiresAtMs: nextExpires },
        fbUid
      ).catch(trackFbError);
      void upsertSessionQrSecretToFirestore(
        {
          sessionId,
          classId: existingSession.classId,
          qrSecretCode: existingSecret?.qrSecretCode || generateQrSecretCode(existingSession.sessionNumber),
          qrActive: active,
          expiresAtMs: nextExpires,
        },
        fbUid
      ).catch(trackFbError);
    }
    if (backendStatus === 'online') {
      void remote(`/api/sessions/${sessionId}/qr`, { method: 'POST', body: JSON.stringify({ active }) });
    }
  };

  const rotateSessionQr = async (sessionId: string): Promise<SessionQrSecret | null> => {
    const existingSession = sessions.find((s) => s.id === sessionId);
    if (!existingSession) return null;
    const fbUid = getFbUid();
    let updatedSecret: SessionQrSecret;
    if (fbUid) {
      try {
        updatedSecret = await rotateSessionQrSecret(sessionId, existingSession.classId, fbUid, true, 3);
      } catch (err) {
        trackFbError(err);
        return null;
      }
    } else {
      updatedSecret = {
        sessionId,
        classId: existingSession.classId,
        qrSecretCode: generateQrSecretCode(existingSession.sessionNumber),
        qrActive: true,
        expiresAtMs: Date.now() + 3 * 60 * 60 * 1000,
      };
    }
    setSessionQrSecrets((prev) => ({ ...prev, [sessionId]: updatedSecret }));
    setSessions((prev) =>
      prev.map((s) =>
        s.id === sessionId ? { ...s, qrActive: true, expiresAtMs: updatedSecret.expiresAtMs } : s
      )
    );
    if (backendStatus === 'online') {
      void remote(`/api/sessions/${sessionId}/qr`, {
        method: 'POST',
        body: JSON.stringify({
          active: true,
          qrSecretCode: updatedSecret.qrSecretCode,
          expiresAtMs: updatedSecret.expiresAtMs,
        }),
      }).catch(() => undefined);
    }
    return updatedSecret;
  };

  const updateFinalExamScore = (studentId: string, score: number) => {
    const clampedScore = clamp(score, 0, 40);
    const student = users.find((u) => u.id === studentId);
    setFinalExamScores((prev) => ({ ...prev, [studentId]: clampedScore }));
    const fbUid = getFbUid();
    if (fbUid) {
      void upsertFinalExamToFirestore(studentId, clampedScore, fbUid, student?.classId).catch(trackFbError);
    }
    if (backendStatus === 'online') {
      void remote('/api/final-exam', { method: 'POST', body: JSON.stringify({ studentId, score }) });
    }
  };

  const addNewSession = (sessionData: Omit<BibleSession, 'id' | 'qrSecretCode' | 'qrActive'>) => {
    const id = `sess-${Date.now()}`;
    const expiresAtMs = Date.now() + 3 * 60 * 60 * 1000;
    const secretCode = generateQrSecretCode(sessionData.sessionNumber);
    const localSession: BibleSession = {
      ...sessionData,
      id,
      maxScorePerMetric: 10,
      qrActive: true,
      expiresAtMs,
    };
    const secretObj: SessionQrSecret = {
      sessionId: id,
      classId: sessionData.classId,
      qrSecretCode: secretCode,
      qrActive: true,
      expiresAtMs,
    };
    setSessions((prev) => [localSession, ...prev]);
    setSessionQrSecrets((prev) => ({ ...prev, [id]: secretObj }));
    const fbUid = getFbUid();
    if (fbUid) {
      void upsertSessionToFirestore(localSession, fbUid)
        .then(() => upsertSessionQrSecretToFirestore(secretObj, fbUid))
        .catch(trackFbError);
    }
    if (backendStatus === 'online') {
      void remote('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({ ...localSession, qrSecretCode: secretCode }),
      });
    }
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

    setServantSubmissions((prev) => [newSub, ...prev.filter((s) => s.servantId !== currentUser.id)]);

    const fbUid = getFbUid();
    if (fbUid) {
      void upsertServantSubmissionToFirestore(newSub, fbUid).catch(trackFbError);
    }

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
      if (fbUid) {
        void upsertLessonPostToFirestore(localPost, fbUid).catch(trackFbError);
      }
    }

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
    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'assistant';
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
      status: isAdmin ? 'approved' : 'pending_approval',
      approvedBy: isAdmin ? currentUser.name : undefined,
      approvedAt: isAdmin ? new Date().toISOString().split('T')[0] : undefined,
      targetAudience: postData.targetAudience || 'all',
      targetScope: postData.targetScope || 'specific_class',
    };
    setLessonPosts((prev) => [newPost, ...prev]);
    const fbUid = getFbUid();
    if (fbUid) {
      void upsertLessonPostToFirestore(newPost, fbUid).catch(trackFbError);
    }
    if (backendStatus === 'online') {
      void remote('/api/posts', { method: 'POST', body: JSON.stringify({ action: 'create', post: newPost, ...newPost }) });
    }
  };

  const addLibraryBook = async (bookData: Omit<LibraryBook, 'id' | 'addedAt' | 'addedBy'>) => {
    const newBook: LibraryBook = {
      ...bookData,
      id: `book-${Date.now()}`,
      addedBy: currentUser?.name || 'أمين الخدمة',
      addedAt: new Date().toISOString().split('T')[0],
    };
    setLibraryBooks((prev) => [newBook, ...prev]);
    const fbUid = getFbUid();
    if (fbUid) {
      void upsertLibraryBookToFirestore(newBook, fbUid).catch(trackFbError);
    }
    if (backendStatus === 'online') {
      void remote('/api/library', { method: 'POST', body: JSON.stringify(newBook) });
    }
    return newBook;
  };

  const deleteLibraryBook = (bookId: string) => {
    setLibraryBooks((prev) => prev.filter((b) => b.id !== bookId));
    const fbUid = getFbUid();
    if (fbUid) {
      void deleteDocFromFirestore(COLLECTIONS.LIBRARY_BOOKS, bookId).catch(trackFbError);
    }
    if (backendStatus === 'online') {
      void remote(`/api/library/${bookId}`, { method: 'DELETE' });
    }
  };

  const addAcademicTerm = async (termData: Omit<AcademicTerm, 'id'>): Promise<AcademicTerm> => {
    const newTerm: AcademicTerm = {
      id: `term_${Date.now()}`,
      ...termData,
    };
    setAcademicTerms((prev) => [...prev, newTerm]);
    const fbUid = getFbUid();
    if (fbUid && currentUser?.role === 'admin') {
      void upsertTermToFirestore(newTerm, fbUid).catch(trackFbError);
    }
    if (backendStatus === 'online' && (currentUser?.role === 'admin' || currentUser?.role === 'assistant')) {
      void remote('/api/terms', { method: 'POST', body: JSON.stringify(newTerm) });
    }
    return newTerm;
  };

  const deleteAcademicTerm = (termId: string) => {
    setAcademicTerms((prev) => prev.filter((t) => t.id !== termId));
    const fbUid = getFbUid();
    if (fbUid) {
      void deleteDocFromFirestore(COLLECTIONS.ACADEMIC_TERMS, termId).catch(trackFbError);
    }
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
    const fbUid = getFbUid();
    if (fbUid) {
      void upsertChurchEventToFirestore(newEvent, fbUid).catch(trackFbError);
    }
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
    const existingEvt = churchEvents.find((e) => e.id === id);
    setChurchEvents((prev) => prev.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    const fbUid = getFbUid();
    if (fbUid && existingEvt) {
      void upsertChurchEventToFirestore({ ...existingEvt, ...updates }, fbUid).catch(trackFbError);
    }
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
    const fbUid = getFbUid();
    if (fbUid) {
      void deleteDocFromFirestore(COLLECTIONS.CHURCH_EVENTS, id).catch(trackFbError);
    }
    if (backendStatus === 'online') {
      try {
        await remote(`/api/events/${id}`, { method: 'DELETE' });
      } catch (e) {
        console.error('Failed to delete event on server:', e);
      }
    }
  };

  const exportBackupJson = (): boolean => {
    if (currentUser?.role !== 'admin') return false;
    const backupObj = {
      version: 1,
      exportedAt: new Date().toISOString(),
      school: 'مدرسة سانت بولس لدراسة الكتاب المقدس',
      data: {
        users,
        sessions,
        sessionQrSecrets,
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
    return true;
  };

  const restoreBackupJson = async (file: File): Promise<{ success: boolean; message: string }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, message: 'هذه العملية مخصصة لمسؤول النظام فقط.' };
    }
    const fbUid = getFbUid();
    if (!fbUid && backendStatus !== 'online') {
      return {
        success: false,
        message: 'يلزم تسجيل الدخول بحساب جوجل لمسؤول النظام لإتمام دمج النسخة الاحتياطية في قاعدة البيانات.',
      };
    }

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed.data || parsed;
      if (!data || (!Array.isArray(data.users) && !Array.isArray(data.grades))) {
        return { success: false, message: 'صيغة ملف النسخة الاحتياطية غير صالحة.' };
      }

      const mergedPayload = {
        users: Array.isArray(data.users) ? data.users : users,
        academicTerms: Array.isArray(data.academicTerms) ? data.academicTerms : academicTerms,
        classAssignedBooks:
          data.classAssignedBooks && typeof data.classAssignedBooks === 'object'
            ? data.classAssignedBooks
            : classAssignedBooks,
        sessions: Array.isArray(data.sessions) ? data.sessions : sessions,
        grades: Array.isArray(data.grades) ? data.grades : grades,
        finalExamScores:
          data.finalExamScores && typeof data.finalExamScores === 'object'
            ? data.finalExamScores
            : finalExamScores,
        servantSubmissions: Array.isArray(data.servantSubmissions)
          ? data.servantSubmissions
          : servantSubmissions,
        lessonPosts: Array.isArray(data.lessonPosts) ? data.lessonPosts : lessonPosts,
        libraryBooks: Array.isArray(data.libraryBooks) ? data.libraryBooks : libraryBooks,
        churchEvents: Array.isArray(data.churchEvents) ? data.churchEvents : churchEvents,
        yearWorkApprovedClasses:
          data.yearWorkApprovedClasses && typeof data.yearWorkApprovedClasses === 'object'
            ? data.yearWorkApprovedClasses
            : yearWorkApprovedClasses,
        notifications: Array.isArray(data.notifications) ? data.notifications : notifications,
      };

      let uploadedToCloud = 0;
      if (fbUid) {
        setFirebaseSyncing(true);
        try {
          uploadedToCloud = await bootstrapExistingDataToFirestore(fbUid, mergedPayload);
          setFirebaseError(null);
          setLastSyncedAt(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
        } finally {
          setFirebaseSyncing(false);
        }
      }

      if (backendStatus === 'online') {
        await apiRequest('/api/admin/backup/restore', {
          method: 'POST',
          body: JSON.stringify({ data }),
        });
      }

      if (Array.isArray(data.users)) setUsers(data.users);
      if (Array.isArray(data.sessions)) setSessions(data.sessions);
      if (data.sessionQrSecrets && typeof data.sessionQrSecrets === 'object') {
        setSessionQrSecrets(data.sessionQrSecrets);
      }
      if (Array.isArray(data.grades)) setGrades(data.grades);
      if (data.finalExamScores && typeof data.finalExamScores === 'object') {
        setFinalExamScores(data.finalExamScores);
      }
      if (Array.isArray(data.churchEvents)) setChurchEvents(data.churchEvents);
      if (Array.isArray(data.lessonPosts)) setLessonPosts(data.lessonPosts);
      if (Array.isArray(data.libraryBooks)) setLibraryBooks(data.libraryBooks);
      if (Array.isArray(data.academicTerms)) setAcademicTerms(data.academicTerms);
      if (data.classAssignedBooks && typeof data.classAssignedBooks === 'object') {
        setClassAssignedBooks(data.classAssignedBooks);
      }
      if (Array.isArray(data.servantSubmissions)) setServantSubmissions(data.servantSubmissions);
      if (data.yearWorkApprovedClasses && typeof data.yearWorkApprovedClasses === 'object') {
        setYearWorkApprovedClasses(data.yearWorkApprovedClasses);
      }
      if (Array.isArray(data.notifications)) setNotifications(data.notifications);

      return {
        success: true,
        message: fbUid
          ? `تم التحقق ودمج النسخة الاحتياطية بأمان (${data.users?.length || 0} مستخدم، ${data.grades?.length || 0} درجات، وتم رفع ${uploadedToCloud} سجل جديد لقاعدة البيانات).`
          : `تم استعادة النسخة الاحتياطية على الخادم بنجاح (${data.users?.length || 0} مستخدم، ${data.grades?.length || 0} درجات).`,
      };
    } catch (err: any) {
      trackFbError(err);
      return { success: false, message: 'تعذر استعادة النسخة الاحتياطية: ' + (err?.message || '') };
    }
  };

  const forceSyncDatabase = async (): Promise<{ success: boolean; message: string; uploaded?: number }> => {
    if (currentUser?.role !== 'admin') {
      return { success: false, message: 'هذه العملية مخصصة لمسؤول النظام فقط.' };
    }
    const fbUid = getFbUid();
    if (!fbUid && backendStatus !== 'online') {
      return {
        success: false,
        message: 'تعذر إتمام المزامنة: يرجى تسجيل الدخول بحساب جوجل لمسؤول النظام أولاً.',
      };
    }

    let uploaded = 0;
    try {
      if (fbUid) {
        setFirebaseSyncing(true);
        uploaded = await bootstrapExistingDataToFirestore(fbUid, snapshotRef.current);
        setFirebaseConnected(true);
        setFirebaseError(null);
        setLastSyncedAt(new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }));
      }
      if (backendStatus === 'online') {
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
      }
      return {
        success: true,
        uploaded,
        message:
          fbUid
            ? uploaded > 0
              ? `تمت المزامنة السحابية بنجاح وتم رفع ${uploaded} سجل جديد بدون حذف أي بيانات.`
              : 'جميع السجلات متزامنة بالكامل مع قاعدة البيانات السحابية.'
            : 'تمت مزامنة البيانات مع الخادم بنجاح.',
      };
    } catch (err: any) {
      trackFbError(err);
      return {
        success: false,
        message: `فشلت المزامنة: ${err instanceof Error ? err.message : 'خطأ غير متوقع'}`,
      };
    } finally {
      setFirebaseSyncing(false);
    }
  };

  const approveLessonPost = (postId: string) => {
    const post = lessonPosts.find((p) => p.id === postId);
    const updatedPost: ServantLessonPost | null = post
      ? {
          ...post,
          status: 'approved',
          approvedBy: currentUser?.name || 'أمين الخدمة',
          approvedAt: new Date().toISOString().split('T')[0],
        }
      : null;
    setLessonPosts((prev) => prev.map((p) => (p.id === postId && updatedPost ? updatedPost : p)));
    if (post) {
      setNotifications((prev) =>
        prev.map((n) => (n.type === 'post_pending' && n.message.includes(post.title) ? { ...n, read: true } : n))
      );
    }
    const fbUid = getFbUid();
    if (fbUid && updatedPost) {
      void upsertLessonPostToFirestore(updatedPost, fbUid).catch(trackFbError);
    }
    if (backendStatus === 'online') {
      void remote(`/api/posts/${postId}/approve`, { method: 'POST' }).then((res: any) => {
        if (res?.notifications) setNotifications(res.notifications);
      });
    }
  };

  const rejectLessonPost = (postId: string, reason?: string) => {
    const post = lessonPosts.find((p) => p.id === postId);
    const updatedPost: ServantLessonPost | null = post
      ? { ...post, status: 'rejected', rejectionReason: reason || 'مرفوض من أمانة الخدمة' }
      : null;
    setLessonPosts((prev) => prev.map((p) => (p.id === postId && updatedPost ? updatedPost : p)));
    if (post) {
      setNotifications((prev) =>
        prev.map((n) => (n.type === 'post_pending' && n.message.includes(post.title) ? { ...n, read: true } : n))
      );
    }
    const fbUid = getFbUid();
    if (fbUid && updatedPost) {
      void upsertLessonPostToFirestore(updatedPost, fbUid).catch(trackFbError);
    }
    if (backendStatus === 'online') {
      void remote(`/api/posts/${postId}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }).then(
        (res: any) => {
          if (res?.notifications) setNotifications(res.notifications);
        }
      );
    }
  };

  const getStudentScoreSummary = (studentId: string, termId?: string): StudentScoreSummary =>
    computeStudentScoreSummary(studentId, users, sessions, grades, finalExamScores, termId || currentTermId);

  const getClassLeaderboard = (classId: ClassId, termId?: string): StudentScoreSummary[] =>
    computeClassLeaderboard(classId, users, sessions, grades, finalExamScores, termId || currentTermId);

  const getStudentSessionGrades = (studentId: string): SessionGrade[] =>
    grades.filter((g) => g.studentId === studentId);

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    const fbUid = getFbUid();
    if (fbUid) {
      void markNotificationReadInFirestore(id).catch(trackFbError);
    }
    if (backendStatus === 'online') {
      void remote(`/api/notifications/${id}/read`, { method: 'POST' });
    }
  };

  const clearNotifications = () => {
    const fbUid = getFbUid();
    if (fbUid && currentUser?.role === 'admin') {
      for (const n of notifications) {
        void deleteDocFromFirestore(COLLECTIONS.NOTIFICATIONS, n.id).catch(trackFbError);
      }
      setNotifications([]);
    } else if (fbUid) {
      for (const n of notifications) {
        if (!n.read) void markNotificationReadInFirestore(n.id).catch(trackFbError);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } else {
      setNotifications([]);
    }
    if (backendStatus === 'online') {
      void remote('/api/notifications', { method: 'DELETE' });
    }
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
        sessionQrSecrets,
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
        runSafeMigration,
        theme,
        backendStatus,
        firebaseUser,
        firebaseAuthReady,
        firebaseConnected,
        firebaseSyncing,
        firebaseError,
        adminMarkerVerified,
        lastSyncedAt,
        checkAdminSecurityStatus,
        toggleTheme,
        setCurrentUser,
        login,
        loginWithGoogle,
        loginWithEmailPassword,
        registerWithEmailPassword,
        completeGoogleRegistration,
        syncNowToFirebase,
        registerUser,
        logout,
        approveUser,
        approveUserWithDetails,
        rejectUser,
        suspendUser,
        reactivateUser,
        toggleAssistantRole,
        deleteUser,
        deleteSession,
        deleteLessonPost,
        saveSessionGrade,
        recordQrAttendance,
        toggleSessionQr,
        rotateSessionQr,
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
