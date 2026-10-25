import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
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
} from '../data/mockData';

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
  
  // Theme
  toggleTheme: () => void;

  // Auth & Switcher
  setCurrentUser: (user: UserProfile | null) => void;
  switchUserById: (userId: string) => void;
  registerUser: (data: Omit<UserProfile, 'id' | 'status' | 'registeredAt'>) => UserProfile;
  logout: () => void;

  // Admin & Assistant actions
  approveUser: (userId: string) => void;
  rejectUser: (userId: string) => void;
  toggleAssistantRole: (userId: string) => void;
  deleteUser: (userId: string) => void;

  // Grading & Sessions & QR
  saveSessionGrade: (gradeData: Partial<SessionGrade> & { studentId: string; sessionId: string }) => void;
  recordQrAttendance: (studentId: string, sessionId: string) => { success: boolean; message: string };
  toggleSessionQr: (sessionId: string, active: boolean) => void;
  updateFinalExamScore: (studentId: string, score: number) => void;
  addNewSession: (session: Omit<BibleSession, 'id' | 'qrSecretCode' | 'qrActive'>) => BibleSession;

  // Servant prep & attendance
  submitServantCheckIn: (data: {
    status: 'attending' | 'absent';
    absenceReason?: string;
    prepTitle?: string;
    prepBibleVerse?: string;
    prepAttachmentName?: string;
    prepAttachmentType?: 'document' | 'pdf' | 'notes';
    prepNotes?: string;
  }) => void;

  // Servant Posts & Content Approval Workflow
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

  // Calculation helpers
  getStudentScoreSummary: (studentId: string) => StudentScoreSummary;
  getClassLeaderboard: (classId: ClassId) => StudentScoreSummary[];
  getStudentSessionGrades: (studentId: string) => SessionGrade[];

  // Notifications
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'st_paul_users_v2',
  CURRENT_USER_ID: 'st_paul_current_uid_v2',
  SESSIONS: 'st_paul_sessions_v2',
  GRADES: 'st_paul_grades_v2',
  FINAL_SCORES: 'st_paul_final_scores_v2',
  SERVANT_SUBS: 'st_paul_servant_subs_v2',
  NOTIFS: 'st_paul_notifs_v2',
  POSTS: 'st_paul_posts_v2',
  THEME: 'st_paul_theme_v2',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved as 'light' | 'dark') || 'light';
  });

  const [users, setUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return saved || 'admin-1';
  });

  const [sessions, setSessions] = useState<BibleSession[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSIONS);
    return saved ? JSON.parse(saved) : INITIAL_SESSIONS;
  });

  const [grades, setGrades] = useState<SessionGrade[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.GRADES);
    return saved ? JSON.parse(saved) : INITIAL_SESSION_GRADES;
  });

  const [finalExamScores, setFinalExamScores] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.FINAL_SCORES);
    return saved ? JSON.parse(saved) : INITIAL_FINAL_EXAM_SCORES;
  });

  const [servantSubmissions, setServantSubmissions] = useState<ServantAttendanceSubmission[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SERVANT_SUBS);
    return saved ? JSON.parse(saved) : INITIAL_SERVANT_SUBMISSIONS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFS);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

  const [lessonPosts, setLessonPosts] = useState<ServantLessonPost[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.POSTS);
    return saved ? JSON.parse(saved) : INITIAL_LESSON_POSTS;
  });

  // Apply dark mode to document HTML element
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GRADES, JSON.stringify(grades));
  }, [grades]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.FINAL_SCORES, JSON.stringify(finalExamScores));
  }, [finalExamScores]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SERVANT_SUBS, JSON.stringify(servantSubmissions));
  }, [servantSubmissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFS, JSON.stringify(notifications));
  }, [notifications]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(lessonPosts));
  }, [lessonPosts]);

  const currentUser = users.find((u) => u.id === currentUserId) || null;

  const setCurrentUser = (user: UserProfile | null) => {
    if (user) {
      setCurrentUserId(user.id);
    } else {
      setCurrentUserId('');
    }
  };

  const switchUserById = (userId: string) => {
    setCurrentUserId(userId);
  };

  const logout = () => {
    setCurrentUserId('');
  };

  const registerUser = (data: Omit<UserProfile, 'id' | 'status' | 'registeredAt'>) => {
    const newId = `user-${Date.now()}`;
    const newUser: UserProfile = {
      ...data,
      id: newId,
      status: 'pending', // Requires admin approval!
      registeredAt: new Date().toISOString().split('T')[0],
    };

    setUsers((prev) => [newUser, ...prev]);

    // Dispatch notification to admin
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: data.role === 'servant' ? 'طلب انضمام خادم جديد' : 'طلب التحاق مخدوم جديد',
      message: `سجل ${newUser.name} (${data.role === 'servant' ? 'كخادم' : 'كمخدوم'}) وينتظر الموافقة للدخول للفصل.`,
      timestamp: 'الآن',
      type: 'new_student',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return newUser;
  };

  const approveUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'active' } : u))
    );
    const target = users.find((u) => u.id === userId);
    if (target) {
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'تم اعتماد الحساب بنجاح',
        message: `تم قبول انضمام ${target.name} وتفعيل حسابه في مدرسة سانت بولس.`,
        timestamp: 'الآن',
        type: 'new_student',
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  const rejectUser = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: 'rejected' } : u))
    );
  };

  const toggleAssistantRole = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const newRole = u.role === 'assistant' ? 'servant' : 'assistant';
          return { ...u, role: newRole };
        }
        return u;
      })
    );
    const target = users.find((u) => u.id === userId);
    if (target) {
      const isNowAssistant = target.role !== 'assistant';
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: isNowAssistant ? 'تعيين مساعد أمين الخدمة' : 'تحديث صلاحية',
        message: isNowAssistant
          ? `تم منح ${target.name} صلاحيات مساعد إدارة لمدرسة سانت بولس.`
          : `تم إعادة ضبط صلاحيات ${target.name} كخادم.`,
        timestamp: 'الآن',
        type: 'role_assigned',
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  const deleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  const saveSessionGrade = (
    gradeData: Partial<SessionGrade> & { studentId: string; sessionId: string }
  ) => {
    const session = sessions.find((s) => s.id === gradeData.sessionId);
    const student = users.find((u) => u.id === gradeData.studentId);

    setGrades((prev) => {
      const existingIdx = prev.findIndex(
        (g) => g.sessionId === gradeData.sessionId && g.studentId === gradeData.studentId
      );

      const completeRecord: SessionGrade = {
        id: existingIdx >= 0 ? prev[existingIdx].id : `grd-${Date.now()}`,
        sessionId: gradeData.sessionId,
        sessionTitle: session?.title || 'لقاء دراسة الكتاب المقدس',
        date: session?.date || new Date().toISOString().split('T')[0],
        studentId: gradeData.studentId,
        exam: Number(gradeData.exam ?? (existingIdx >= 0 ? prev[existingIdx].exam : 0)),
        homework: Number(gradeData.homework ?? (existingIdx >= 0 ? prev[existingIdx].homework : 0)),
        attendance: Number(gradeData.attendance ?? (existingIdx >= 0 ? prev[existingIdx].attendance : 0)),
        participation: Number(gradeData.participation ?? (existingIdx >= 0 ? prev[existingIdx].participation : 0)),
        prayer: Number(gradeData.prayer ?? (existingIdx >= 0 ? prev[existingIdx].prayer : 0)),
        tools: Number(gradeData.tools ?? (existingIdx >= 0 ? prev[existingIdx].tools : 0)),
        notes: gradeData.notes ?? (existingIdx >= 0 ? prev[existingIdx].notes : ''),
        qrAttendedAt: gradeData.qrAttendedAt ?? (existingIdx >= 0 ? prev[existingIdx].qrAttendedAt : undefined),
      };

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = completeRecord;
        return updated;
      } else {
        return [...prev, completeRecord];
      }
    });

    if (student) {
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'تحديث درجات الطالب',
        message: `تم تحديث درجات الطالب "${student.name}" في ${session?.title || 'اللقاء'}.`,
        timestamp: 'الآن',
        type: 'grade_updated',
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  // QR Code Attendance: when student scans the servant's QR code
  const recordQrAttendance = (studentId: string, sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    const student = users.find((u) => u.id === studentId);

    if (!session) {
      return { success: false, message: 'اللقاء المحدد غير موجود' };
    }
    if (!session.qrActive) {
      return { success: false, message: 'كود الحضور لهذا اللقاء مغلق حالياً من قِبل الخادم' };
    }

    const timeString = new Date().toLocaleTimeString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
    });

    setGrades((prev) => {
      const existingIdx = prev.findIndex(
        (g) => g.sessionId === sessionId && g.studentId === studentId
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          attendance: 1, // 1 mark for attendance
          qrAttendedAt: timeString,
        };
        return updated;
      } else {
        const newRecord: SessionGrade = {
          id: `grd-${Date.now()}`,
          sessionId,
          sessionTitle: session.title,
          date: session.date,
          studentId,
          exam: 0,
          homework: 0,
          attendance: 1, // 1 mark for attendance
          participation: 0,
          prayer: 0,
          tools: 0,
          qrAttendedAt: timeString,
          notes: 'تم تسجيل الحضور عبر مسح QR Code بنجاح',
        };
        return [...prev, newRecord];
      }
    });

    // Send notifications
    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'تسجيل حضور عبر الباركود ✅',
      message: `قام الطالب "${student?.name || 'مخدوم'}" بتسجيل حضوره بنجاح عبر QR Code في ${session.title}.`,
      timestamp: 'الآن',
      type: 'qr_attendance',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);

    return {
      success: true,
      message: `تم تسجيل حضورك بنجاح في ${session.title} وحصلت على درجة الحضور (١ من ١)!`,
    };
  };

  const toggleSessionQr = (sessionId: string, active: boolean) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, qrActive: active } : s))
    );
  };

  const updateFinalExamScore = (studentId: string, score: number) => {
    setFinalExamScores((prev) => ({
      ...prev,
      [studentId]: Math.min(40, Math.max(0, score)),
    }));
  };

  const addNewSession = (sessionData: Omit<BibleSession, 'id' | 'qrSecretCode' | 'qrActive'>) => {
    const newSession: BibleSession = {
      ...sessionData,
      id: `sess-${Date.now()}`,
      maxScorePerMetric: 10,
      qrSecretCode: `STPAUL-${Date.now().toString(36).toUpperCase()}`,
      qrActive: true,
    };
    setSessions((prev) => [newSession, ...prev]);
    return newSession;
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

    const newSub: ServantAttendanceSubmission = {
      id: `sub-${Date.now()}`,
      servantId: currentUser.id,
      servantName: currentUser.name,
      servantPhone: currentUser.phone,
      meetingDate: '2026-10-31',
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

    setServantSubmissions((prev) => {
      const filtered = prev.filter((s) => s.servantId !== currentUser.id);
      return [newSub, ...filtered];
    });

    const notifTitle =
      data.status === 'attending'
        ? `رفع تحضير درس: ${currentUser.name}`
        : `اعتذار خادم: ${currentUser.name}`;
    const notifMsg =
      data.status === 'attending'
        ? `قام الخادم ${currentUser.name} برفع تحضير درس (${data.prepTitle || 'مذكرة الأسبوع'}) كـ مرفق رسمي.`
        : `قدم الخادم ${currentUser.name} اعتذاراً عن الحضور بسبب: ${data.absenceReason || 'ظرف طارئ'}.`;

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: notifTitle,
      message: notifMsg,
      timestamp: 'الآن',
      type: data.status === 'attending' ? 'prep_upload' : 'absence',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  // Servant Posts Approval Workflow
  const createLessonPost = (postData: {
    title: string;
    category: 'lesson_handout' | 'bible_study' | 'quiz' | 'announcement';
    bibleVerse: string;
    content: string;
    attachmentName?: string;
    classId: ClassId;
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
      createdAt: new Date().toISOString().split('T')[0],
      status: 'pending_approval',
    };

    setLessonPosts((prev) => [newPost, ...prev]);

    const newNotif: AppNotification = {
      id: `notif-${Date.now()}`,
      title: 'مادة تعليمية جديدة بانتظار الاعتماد',
      message: `قام الخادم "${currentUser.name}" برفع منشور/درس بعنوان: "${postData.title}". يتطلب موافقتك لنشره للطلاب.`,
      timestamp: 'الآن',
      type: 'post_pending',
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const approveLessonPost = (postId: string) => {
    setLessonPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            status: 'approved',
            approvedBy: currentUser?.name || 'أمين الخدمة',
            approvedAt: new Date().toISOString().split('T')[0],
          };
        }
        return p;
      })
    );

    const post = lessonPosts.find((p) => p.id === postId);
    if (post) {
      const newNotif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'تم اعتماد ونشر المادة التعليمية',
        message: `وافق مسؤول النظام على نشر: "${post.title}" وأصبحت متاحة للطلاب الآن.`,
        timestamp: 'الآن',
        type: 'post_approved',
        read: false,
      };
      setNotifications((prev) => [newNotif, ...prev]);
    }
  };

  const rejectLessonPost = (postId: string, reason?: string) => {
    setLessonPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, status: 'rejected', rejectionReason: reason || 'مرفوض من أمانة الخدمة' }
          : p
      )
    );
  };

  // السيشن الواحدة = 24 درجة:
  // امتحان: 10 | واجب: 10 | حضور: 1 | صلاة: 1 | أدوات: 1 | مشاركة: 1
  // أعمال السنة: متوسط السيشنات مقاساً من 60 درجة -> (متوسط الـ 24 / 24) * 60
  const getStudentScoreSummary = (studentId: string): StudentScoreSummary => {
    const student = users.find((u) => u.id === studentId);
    const studentGrades = grades.filter((g) => g.studentId === studentId);
    
    const classId = student?.classId || 'prep_2_3';
    const classSessions = sessions.filter((s) => s.classId === classId);
    const totalSessionsCount = classSessions.length || (studentGrades.length || 1);
    const attendedSessionsCount = studentGrades.length;

    let yearWorkScore = 0;
    if (studentGrades.length > 0) {
      const totalSessionScoresSum = studentGrades.reduce((acc, curr) => {
        const sessionTotal =
          Number(curr.exam || 0) +
          Number(curr.homework || 0) +
          Number(curr.attendance || 0) +
          Number(curr.participation || 0) +
          Number(curr.prayer || 0) +
          Number(curr.tools || 0);
        return acc + sessionTotal;
      }, 0);

      // Average out of 24
      const rawAverageOutOf24 = totalSessionScoresSum / studentGrades.length;
      // Scaled to 60 marks
      yearWorkScore = Math.round(((rawAverageOutOf24 / 24) * 60) * 10) / 10;
    }

    const finalExamScore = finalExamScores[studentId] ?? 0;
    const totalScore = Math.round((yearWorkScore + finalExamScore) * 10) / 10;

    return {
      studentId,
      studentName: student?.name || 'مخدوم',
      classId,
      totalSessionsCount,
      attendedSessionsCount,
      yearWorkScore,
      finalExamScore,
      totalScore,
    };
  };

  const getClassLeaderboard = (classId: ClassId): StudentScoreSummary[] => {
    const classStudents = users.filter(
      (u) => u.role === 'student' && u.classId === classId && u.status === 'active'
    );

    const summaries = classStudents.map((st) => getStudentScoreSummary(st.id));
    summaries.sort((a, b) => b.totalScore - a.totalScore);

    return summaries.map((s, index) => ({
      ...s,
      rank: index + 1,
      isTopStudent: index < 3,
    }));
  };

  const getStudentSessionGrades = (studentId: string): SessionGrade[] => {
    return grades.filter((g) => g.studentId === studentId);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  const resetDemoData = () => {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(STORAGE_KEYS.GRADES);
    localStorage.removeItem(STORAGE_KEYS.FINAL_SCORES);
    localStorage.removeItem(STORAGE_KEYS.SERVANT_SUBS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFS);
    localStorage.removeItem(STORAGE_KEYS.POSTS);

    setUsers(INITIAL_USERS);
    setCurrentUserId('admin-1');
    setSessions(INITIAL_SESSIONS);
    setGrades(INITIAL_SESSION_GRADES);
    setFinalExamScores(INITIAL_FINAL_EXAM_SCORES);
    setServantSubmissions(INITIAL_SERVANT_SUBMISSIONS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setLessonPosts(INITIAL_LESSON_POSTS);
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
        toggleTheme,
        setCurrentUser,
        switchUserById,
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
        markNotificationAsRead,
        clearNotifications,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
