import { User, Question, Exam, ExamSession, Result, Subject, AttendanceRecord } from '../types';

const DB_KEY = 'abu_nasir_db';

interface Settings {
  websiteName: string;
  websiteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  defaultExamDuration: number;
  autoSubmit: boolean;
  antiCheatingSensitivity: string;
  passMark: number;
  darkMode: boolean;
  websiteLogo?: string;
  favicon?: string;
  dashboardLogo?: string;
  loginBackground?: string;
}

interface DBState {
  users: User[];
  subjects: Subject[];
  questions: Question[];
  exams: Exam[];
  sessions: ExamSession[];
  results: Result[];
  attendance: AttendanceRecord[];
  settings?: Settings;
}

const defaultSettings: Settings = {
  websiteName: 'Abu Nasir Academy CBT',
  websiteDescription: 'Official CBT Platform',
  contactEmail: 'admin@abunasir.edu',
  contactPhone: '+1234567890',
  address: '123 Academy Way',
  defaultExamDuration: 60,
  autoSubmit: true,
  antiCheatingSensitivity: 'medium',
  passMark: 50,
  darkMode: false
};

const getTodayDate = () => new Date().toISOString().split('T')[0];

const defaultDB: DBState = {
  users: [
    {
      id: 'staff_1',
      role: 'staff',
      name: 'Mr. John (Staff)',
      email: 'staff@abunasir.edu',
    },
    {
      id: 'student_1',
      role: 'candidate',
      name: 'Test Student',
      email: 'student@example.com',
    }
  ],
  subjects: [
    { id: 'sub_eng', name: 'English', code: 'ENG' },
    { id: 'sub_mth', name: 'Mathematics', code: 'MTH' },
    { id: 'sub_chm', name: 'Chemistry', code: 'CHM' },
    { id: 'sub_phy', name: 'Physics', code: 'PHY' },
    { id: 'sub_bio', name: 'Biology', code: 'BIO' }
  ],
  questions: [
    {
      id: 'q1',
      subject: 'English',
      topic: 'Comprehension',
      text: 'Select the option that best completes the sentence: The principal _____ to the staff room before the bell rang.',
      options: [
        { label: 'A', text: 'has gone' },
        { label: 'B', text: 'had gone' },
        { label: 'C', text: 'went' },
        { label: 'D', text: 'is going' }
      ],
      correctAnswer: 'B',
      explanation: 'The past perfect tense "had gone" is used because the action was completed before another past action ("the bell rang").',
      difficulty: 'medium'
    },
    {
      id: 'q2',
      subject: 'Mathematics',
      topic: 'Algebra',
      text: 'Solve for x: 2x + 5 = 15',
      options: [
        { label: 'A', text: '5' },
        { label: 'B', text: '10' },
        { label: 'C', text: '4' },
        { label: 'D', text: '6' }
      ],
      correctAnswer: 'A',
      explanation: 'Subtract 5 from both sides: 2x = 10. Divide by 2: x = 5.',
      difficulty: 'easy'
    }
  ],
  exams: [
    {
      id: 'mock_1',
      title: 'UTME Mock Examination 2026',
      durationMinutes: 120,
      subjects: ['English', 'Mathematics'],
      status: 'active',
      gradingSystem: 'JAMB'
    }
  ],
  sessions: [],
  results: [],
  attendance: [
    {
      id: 'att_1',
      candidateId: 'student_1',
      date: getTodayDate(),
      status: 'present',
      subjectOrExamId: 'mock_1',
      timestamp: new Date().toISOString()
    }
  ],
  settings: defaultSettings
};

// Simple observable pattern for UI updates
type Listener = () => void;
const listeners = new Set<Listener>();

export const db = {
  get(): DBState {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) {
      localStorage.setItem(DB_KEY, JSON.stringify(defaultDB));
      return defaultDB;
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        ...defaultDB,
        ...parsed,
        users: parsed.users || defaultDB.users,
        subjects: parsed.subjects || defaultDB.subjects,
        questions: parsed.questions || defaultDB.questions,
        exams: parsed.exams || defaultDB.exams,
        sessions: parsed.sessions || defaultDB.sessions,
        results: parsed.results || defaultDB.results,
        attendance: parsed.attendance || defaultDB.attendance,
        settings: parsed.settings || defaultDB.settings,
      };
    } catch {
      return defaultDB;
    }
  },
  
  save(state: DBState) {
    localStorage.setItem(DB_KEY, JSON.stringify(state));
    listeners.forEach(l => l());
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Auth Helpers
  login(email: string): User | null {
    const state = this.get();
    return state.users.find(u => u.email === email) || null;
  },

  deleteUser(id: string) {
    const state = this.get();
    state.users = state.users.filter(u => u.id !== id);
    // Might also want to clean up results, sessions, etc., but deleting the user is primary.
    this.save(state);
  },

  getSubjects() { return this.get().subjects; },
  saveSubject(s: Subject) {
    const state = this.get();
    const idx = state.subjects.findIndex(x => x.id === s.id);
    if (idx >= 0) state.subjects[idx] = s;
    else state.subjects.push(s);
    this.save(state);
  },
  deleteSubject(id: string) {
    const state = this.get();
    state.subjects = state.subjects.filter(s => s.id !== id);
    this.save(state);
  },

  // Generic Getters/Setters
  getQuestions() { return this.get().questions; },
  addQuestion(q: Question) {
    const state = this.get();
    state.questions.push(q);
    this.save(state);
  },
  deleteQuestion(id: string) {
    const state = this.get();
    state.questions = state.questions.filter(q => q.id !== id);
    this.save(state);
  },
  
  getExams() { return this.get().exams; },
  addExam(e: Exam) {
    const state = this.get();
    state.exams.push(e);
    this.save(state);
  },
  deleteExam(id: string) {
    const state = this.get();
    state.exams = state.exams.filter(exam => exam.id !== id);
    this.save(state);
  },

  // Exam Randomization Engine
  generateShuffledQuestions(examId: string): Question[] {
    const state = this.get();
    const exam = state.exams.find(e => e.id === examId);
    if (!exam) return [];

    let pool = state.questions.filter(q => {
      // 1. Explicit exam assignment takes precedence
      if (q.examId === examId) return true;
      if (q.examId && q.examId !== examId) return false;
      
      // 2. Fallback to subject matching (case insensitive) if not explicitly assigned
      if (!exam.subjects || exam.subjects.length === 0) return false;
      const qSubj = q.subject.toLowerCase();
      return exam.subjects.some(subj => 
        qSubj.includes(subj.toLowerCase()) || subj.toLowerCase().includes(qSubj)
      );
    });

    // Fisher-Yates shuffle algorithm
    const shuffleArray = <T>(array: T[]): T[] => {
      const newArr = [...array];
      for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
    };

    if (exam.shuffleQuestions) {
      // Balance difficulty distribution if tags exist
      const easy = pool.filter(q => q.difficulty === 'easy');
      const medium = pool.filter(q => q.difficulty === 'medium');
      const hard = pool.filter(q => q.difficulty === 'hard');
      const untagged = pool.filter(q => !q.difficulty);

      if (easy.length > 0 || medium.length > 0 || hard.length > 0) {
        // Shuffle each pool separately
        const shuffledEasy = shuffleArray(easy);
        const shuffledMedium = shuffleArray(medium);
        const shuffledHard = shuffleArray(hard);
        const shuffledUntagged = shuffleArray(untagged);
        
        let allShuffled: Question[] = [];
        
        // Strategy: We want a balanced distribution if possible, or just a merged shuffled list.
        // Given we might need to take a subset (questionsPerCandidate), we interleave them to ensure
        // the top N slice has a mix of easy, medium, hard.
        const maxLen = Math.max(shuffledEasy.length, shuffledMedium.length, shuffledHard.length, shuffledUntagged.length);
        for (let i = 0; i < maxLen; i++) {
          if (i < shuffledEasy.length) allShuffled.push(shuffledEasy[i]);
          if (i < shuffledMedium.length) allShuffled.push(shuffledMedium[i]);
          if (i < shuffledHard.length) allShuffled.push(shuffledHard[i]);
          if (i < shuffledUntagged.length) allShuffled.push(shuffledUntagged[i]);
        }
        pool = allShuffled;
      } else {
        pool = shuffleArray(pool);
      }
    }

    if (exam.questionsPerCandidate && exam.questionsPerCandidate > 0) {
      pool = pool.slice(0, exam.questionsPerCandidate);
    }
    
    // Shuffle the final subset once more to hide any grouping patterns!
    if (exam.shuffleQuestions) {
      pool = shuffleArray(pool);
    }

    if (exam.shuffleOptions) {
      pool = pool.map(q => {
        const correctText = q.options.find(o => o.label === q.correctAnswer)?.text;
        
        let newOptions = shuffleArray([...q.options]);
        newOptions = newOptions.map((o, idx) => ({
          label: ['A', 'B', 'C', 'D'][idx],
          text: o.text
        }));
        const newCorrectAnswer = newOptions.find(o => o.text === correctText)?.label as 'A' | 'B' | 'C' | 'D';
        
        return {
          ...q,
          options: newOptions,
          correctAnswer: newCorrectAnswer || 'A' // fallback
        };
      });
    }

    return pool;
  },

  getSessions() { return this.get().sessions; },
  saveSession(session: ExamSession) {
    const state = this.get();
    const idx = state.sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) {
      state.sessions[idx] = session;
    } else {
      state.sessions.push(session);
    }
    this.save(state);
  },

  getResults() { return this.get().results; },
  saveResult(r: Result) {
    const state = this.get();
    state.results.push(r);
    this.save(state);
  },
  
  resetDemoData() {
    this.save(defaultDB);
  },
  clearDemoData() {
    this.save({
      users: defaultDB.users.filter(u => u.role === 'admin' || u.role === 'staff'),
      subjects: [],
      questions: [],
      exams: [],
      sessions: [],
      results: [],
      attendance: []
    });
  },

  // Attendance
  getAttendance() { return this.get().attendance || []; },
  saveAttendance(record: AttendanceRecord) {
    const state = this.get();
    if (!state.attendance) state.attendance = [];
    const idx = state.attendance.findIndex(a => a.id === record.id);
    if (idx >= 0) {
      state.attendance[idx] = record;
    } else {
      state.attendance.push(record);
    }
    this.save(state);
  },
  deleteAttendance(id: string) {
    const state = this.get();
    if (!state.attendance) return;
    state.attendance = state.attendance.filter(a => a.id !== id);
    this.save(state);
  },
  clearAllAttendance() {
    const state = this.get();
    state.attendance = [];
    this.save(state);
  },
  
  // Settings
  getSettings() {
    return this.get().settings || defaultSettings;
  },
  saveSettings(settings: typeof defaultSettings) {
    const state = this.get();
    state.settings = settings;
    this.save(state);
  }
};
