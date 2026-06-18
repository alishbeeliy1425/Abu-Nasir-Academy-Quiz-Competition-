export type Role = 'candidate' | 'staff' | 'admin';

export interface User {
  id: string;
  role: Role;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  serialNumber?: string;
  schoolName?: string;
  address?: string;
  state?: string;
  country?: string;
  photoUrl?: string;
  paymentStatus?: 'pending' | 'pending_verification' | 'paid';
  paymentReference?: string;
  amountPaid?: number;
  paymentDate?: string;
  competitionCategory?: string;
  accountStatus?: 'active' | 'suspended';
}

export interface Subject {
  id: string;
  name: string;
  code: string;
}

export interface Question {
  id: string;
  examId?: string;
  subject: string;
  topic: string;
  text: string;
  options: { label: string; text: string }[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface Exam {
  id: string;
  title: string;
  durationMinutes: number;
  subjects: string[];
  status: 'active' | 'inactive';
  gradingSystem: 'JAMB' | 'WAEC' | 'CUSTOM';
  academicSession?: string;
  startDate?: string;
  endDate?: string;
  department?: string;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  questionsPerCandidate?: number;
  instructions?: string;
}

export interface ExamSession {
  id: string;
  examId: string;
  candidateId: string;
  startTime: string;
  endTime?: string;
  answers: Record<string, string>; // questionId -> optionLabel
  status: 'in_progress' | 'completed';
  shuffledQuestions?: Question[]; // Contains the candidate-specific randomized question set
}

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRecord {
  id: string;
  candidateId: string;
  date: string;
  status: AttendanceStatus;
  subjectOrExamId?: string;
  timestamp: string;
}

export interface Result {
  id: string;
  sessionId: string;
  candidateId: string;
  examId: string;
  score: number;
  total: number;
  grade: string;
  percentage?: number;
  remarks?: string;
  submittedAt?: string;
  date: string;
}

export interface Violation {
  id: string;
  candidateId: string;
  examId: string;
  timestamp: string;
  type: string;
  description: string;
}

