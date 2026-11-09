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

// Educational Academic Term / Semester System (نظام التيرمات والفصول الدراسية)
export interface AcademicTerm {
  id: string;               // e.g., 'term_1', 'term_2', 'term_3'
  title: string;            // 'الترم الأول', 'الترم الثاني'
  bookSubject: string;      // 'سفر التكوين', 'سفر الخروج', 'سفر اللاويين والعدد'
  description?: string;     // نبذة عن محتوى ومحاور الترم
  sessionsCount: number;    // عدد الحصص (٨ حصص لكل تيرم)
  isCurrent: boolean;       // هل هو الترم الجاري دراسته حالياً
  startDate?: string;
  endDate?: string;
}

export interface SessionGrade {
  id: string;
  sessionId: string;
  sessionTitle: string;
  date: string;
  studentId: string;
  termId?: string;       // معرّف الترم التابع له (افتراضياً: term_1)
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
  termId?: string;              // التيرم المحسوب له التقرير
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
  prepAttachmentType?: 'document' | 'pdf' | 'notes' | 'image';
  prepAttachmentData?: string; // Real uploaded base64 file data
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
  fileData?: string;           // Real uploaded base64 file data
  fileType?: string;           // MIME type (application/pdf, image/png, etc.)
  createdAt: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  rejectionReason?: string;
  approvedBy?: string;
  approvedAt?: string;
  targetAudience?: 'all' | 'servants_only' | 'students';
  targetScope?: 'all_classes' | 'specific_class';
}

// Church Library & References for servants and lesson preparation
export interface LibraryBook {
  id: string;
  title: string;
  author: string;
  category: 'old_testament' | 'new_testament' | 'patristic' | 'theology_creed' | 'servant_prep' | 'church_ritual';
  description: string;
  targetClassId?: ClassId | 'all_classes';
  downloadUrl?: string;
  fileName?: string;
  fileData?: string;           // Real uploaded base64 data for immediate download
  fileType?: string;           // e.g. application/pdf, image/jpeg
  fileSize?: string;
  pageCount?: number;
  addedBy: string;
  addedAt: string;
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

export interface ClassAssignedBook {
  classId: ClassId;
  bookId: string;
  bookName: string;
  testament: 'old' | 'new';
  termId: string;
  assignedByServantName?: string;
  assignedAt?: string;
  targetSessionsCount?: number; // e.g. 2, 3, 4, 8
  notes?: string;
  customOverview?: string; // تخصيص الخادم لنبذة ومعلومات السفر لطلابه
}

export interface MemoryVerseItem {
  id: string;
  verse: string;
  reference: string;
}

export interface ChurchEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  location?: string;
  description: string;
  type: 'celebration' | 'graduation' | 'spiritual_day' | 'trip' | 'meeting' | 'competition' | 'general';
  targetAudience: 'all' | 'students' | 'servants';
  targetClassId?: ClassId | 'all_classes';
  status: 'upcoming' | 'ongoing' | 'completed';
  createdBy?: string;
  createdAt: string;
}

export interface BibleSession {
  id: string;
  title: string;
  classId: ClassId;
  termId?: string;           // معرف الترم (term_1, term_2, إلخ)
  date: string;
  biblePassage: string;
  servantName: string;
  maxScorePerMetric: number; // 10
  qrSecretCode: string;      // The unique code embedded in the session QR
  qrActive: boolean;         // Is the QR code currently active for scanning

  // Flexible curriculum fields
  sessionNumber?: number;    // رقم الحصة في الترم (1 إلى 8)
  bookId?: string;           // كود السفر المختار
  bookName?: string;         // اسم السفر المختار
  testament?: 'old' | 'new'; // العهد القديم أو الجديد
  coveredChapters?: string;  // الأصحاحات المغطاة (مثال: "٣ أصحاحات (١ - ٣)")
  objective?: string;        // هدف الحصة الروحي والتربوي
  memoryVerse?: string;      // آية الدرس الأسبوعية الحافظة
  memoryVerseRef?: string;   // شاهد الآية الحافظة
  memoryVerses?: MemoryVerseItem[]; // آيات حافظة متعددة للحصة
  lessonSummary?: string;    // شرح الدرس وملاحظات الخدمة
  attachmentName?: string;   // اسم ملف المذكرة المرفقة مع الحصة
  fileData?: string;         // الملف المرفوع Base64 للتحميل المباشر
  fileType?: string;         // نوع الملف (PDF / Word)
  fileSize?: string;         // حجم الملف المرفوع
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
