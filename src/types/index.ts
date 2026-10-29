export type UserRole = 'admin' | 'assistant' | 'servant' | 'student';

export type UserStatus = 'active' | 'pending' | 'rejected';

// The 7 specific classes requested:
// 1. فصل لوحده رابعة
// 2. فصل خامسة
// 3. فصل سادسة
// 4. فصل أولى إعدادي
// 5. فصل ثانية وثالثة
// 6. فصل ثانوي
// 7. فصل للكبار
export type ClassId = 
  | 'primary_4'     // فصل سنة رابعة ابتدائي
  | 'primary_5'     // فصل سنة خامسة ابتدائي
  | 'primary_6'     // فصل سنة سادسة ابتدائي
  | 'prep_1'         // فصل أولى إعدادي
  | 'prep_2_3'       // فصل ثانية وثالثة إعدادي
  | 'secondary'      // فصل مرحلة ثانوي
  | 'adults';        // فصل مرحلة الكبار والخريجين

export interface ClassInfo {
  id: ClassId;
  name: string;
  stageName: string;
  description: string;
  ageRange: string;
  iconName: string;
}

export interface SessionGrade {
  id: string;
  sessionId: string;
  sessionTitle: string;
  date: string;
  studentId: string;
  exam: number;          // من 10 (درجة الامتحان)
  homework: number;      // من 10 (الواجب)
  attendance: number;    // من 1 (درجة الحضور)
  participation: number; // من 1 (درجة المشاركة)
  prayer: number;        // من 1 (درجة حضور الصلاة)
  tools: number;         // من 1 (درجة الأدوات: الكتاب المقدس والنوتة)
  notes?: string;        // ملاحظات الخادم أو تشجيع
  qrAttendedAt?: string; // وقت تسجيل الحضور عبر QR code
}

export interface StudentScoreSummary {
  studentId: string;
  studentName: string;
  classId: ClassId;
  totalSessionsCount: number;   // إجمالي حصص الكورس (٨ حصص)
  gradedSessionsCount: number;  // عدد الحصص المرصودة حتى الآن (من ٨)
  attendedSessionsCount: number;
  yearWorkScore: number;        // من 60 (متوسط الـ ٨ حصص)
  finalExamScore: number;       // من 40
  totalScore: number;           // من 100
  isCalculated: boolean;        // هل تم اعتماد واحتساب المتوسط بأمر الأدمن؟
  rank?: number;                // الترتيب في الفصل
  isTopStudent?: boolean;       // من الأوائل
}

export interface ServantAttendanceSubmission {
  id: string;
  servantId: string;
  servantName: string;
  servantPhone: string;
  meetingDate: string;
  meetingTitle: string;
  status: 'attending' | 'absent';
  absenceReason?: string;
  prepTitle?: string;
  prepBibleVerse?: string;
  prepAttachmentName?: string;
  prepAttachmentType?: 'document' | 'pdf' | 'notes';
  prepNotes?: string;
  classId?: ClassId;
  submittedAt: string;
  viewedByAdmin?: boolean;
}

// Educational post / lesson handout created by servants (requires admin approval)
export interface ServantLessonPost {
  id: string;
  servantId: string;
  servantName: string;
  classId: ClassId;
  title: string;
  category: 'lesson_handout' | 'bible_study' | 'quiz' | 'announcement';
  bibleVerse: string;
  content: string;
  attachmentName?: string;
  attachmentUrl?: string;
  createdAt: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  password?: string;
  phone: string;
  age: number;
  role: UserRole;
  status: UserStatus;
  classId?: ClassId;         // For students and class servants
  guardianPhone?: string;    // For students
  confessionFather?: string; // أب الاعتراف
  address?: string;
  avatar?: string;
  registeredAt: string;
  notes?: string;
}

export interface BibleSession {
  id: string;
  title: string;
  classId: ClassId;
  date: string;
  biblePassage: string;
  servantName: string;
  maxScorePerMetric: number; // 10
  qrSecretCode: string;      // The unique code embedded in the session QR
  qrActive: boolean;         // Is the QR code currently active for scanning
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: 'prep_upload' | 'absence' | 'new_student' | 'grade_updated' | 'role_assigned' | 'qr_attendance' | 'post_pending' | 'post_approved';
  read: boolean;
  actionUrl?: string;
  audienceUserId?: string;
  audienceRoles?: UserRole[];
}
