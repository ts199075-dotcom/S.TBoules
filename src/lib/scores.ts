import { ClassId, SessionGrade, StudentScoreSummary, UserProfile, BibleSession } from '../types';

export const SESSION_MAX = 24;
export const YEAR_WORK_MAX = 60;
export const FINAL_EXAM_MAX = 40;

export function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function sessionTotal(grade: Pick<SessionGrade, 'exam' | 'homework' | 'attendance' | 'participation' | 'prayer' | 'tools'>): number {
  return (
    Number(grade.exam || 0) +
    Number(grade.homework || 0) +
    Number(grade.attendance || 0) +
    Number(grade.participation || 0) +
    Number(grade.prayer || 0) +
    Number(grade.tools || 0)
  );
}

export function computeStudentScoreSummary(
  studentId: string,
  users: UserProfile[],
  sessions: BibleSession[],
  grades: SessionGrade[],
  finalExamScores: Record<string, number>
): StudentScoreSummary {
  const student = users.find((u) => u.id === studentId);
  const classId: ClassId = student?.classId || 'prep_2_3';
  const classSessions = sessions.filter((s) => s.classId === classId);
  const studentGrades = grades.filter((g) => g.studentId === studentId);
  const totalSessionsCount = classSessions.length;

  // Cumulative sum of points earned across all graded sessions so far
  const cumulativeEarnedSum = studentGrades.reduce((acc, g) => acc + sessionTotal(g), 0);
  const attendedSessionsCount = studentGrades.filter((g) => Number(g.attendance || 0) >= 1).length;
  const gradedSessionsCount = studentGrades.length;
  const isCalculated = gradedSessionsCount >= 8;

  let yearWorkScore = 0;
  if (isCalculated) {
    // When 8 or more sessions are completed: compute scaled average out of 60
    yearWorkScore = Math.min(
      YEAR_WORK_MAX,
      Math.round((cumulativeEarnedSum / (gradedSessionsCount * SESSION_MAX)) * YEAR_WORK_MAX * 10) / 10
    );
  } else {
    // Before 8 sessions: raw cumulative sum of earned points (e.g. 24 + 24 = 48)
    yearWorkScore = Math.round(cumulativeEarnedSum * 10) / 10;
  }

  const finalExamScore = clamp(finalExamScores[studentId] ?? 0, 0, FINAL_EXAM_MAX);
  const totalScore = Math.round((yearWorkScore + finalExamScore) * 10) / 10;

  return {
    studentId,
    studentName: student?.name || 'مخدوم',
    classId,
    totalSessionsCount,
    attendedSessionsCount,
    gradedSessionsCount,
    isCalculated,
    yearWorkScore,
    finalExamScore,
    totalScore,
  };
}

export function computeClassLeaderboard(
  classId: ClassId,
  users: UserProfile[],
  sessions: BibleSession[],
  grades: SessionGrade[],
  finalExamScores: Record<string, number>
): StudentScoreSummary[] {
  const classStudents = users.filter(
    (u) => u.role === 'student' && u.classId === classId && u.status === 'active'
  );
  const summaries = classStudents.map((st) =>
    computeStudentScoreSummary(st.id, users, sessions, grades, finalExamScores)
  );
  summaries.sort((a, b) => b.totalScore - a.totalScore);
  return summaries.map((s, index) => ({
    ...s,
    rank: index + 1,
    isTopStudent: index < 3,
  }));
}

export function nextFridayIso(from = new Date()): string {
  const d = new Date(from);
  const day = d.getDay();
  const add = (5 - day + 7) % 7 || 7;
  d.setDate(d.getDate() + add);
  return d.toISOString().split('T')[0];
}

export function publicUser<T extends UserProfile>(user: T): Omit<T, 'password'> {
  const { password: _pw, ...rest } = user;
  return rest;
}
