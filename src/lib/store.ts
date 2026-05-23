import { User, Question, Exam, ExamSession, Result, Subject, AttendanceRecord } from '../types';
import { supabase } from './supabase';

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
    },
    {
      id: 'admin_1',
      role: 'admin',
      name: 'System Admin',
      email: 'admin@abunasir.edu',
    }
  ],
  subjects: [],
  questions: [],
  exams: [],
  sessions: [],
  results: [],
  attendance: [],
  settings: defaultSettings
};

let localState: DBState = defaultDB;

// Load from local storage initially for instant load
const raw = localStorage.getItem(DB_KEY);
if (raw) {
  try {
     const parsed = JSON.parse(raw);
     localState = { ...defaultDB, ...parsed };
  } catch(e) {}
}

// Simple observable pattern for UI updates
type Listener = () => void;
const listeners = new Set<Listener>();

const notify = () => {
    localStorage.setItem(DB_KEY, JSON.stringify(localState));
    listeners.forEach(l => l());
};

let isSynced = false;

// Sync from supabase!
const syncFromSupabase = async () => {
   if (isSynced) return;
   isSynced = true;
   try {
     const [usersRes, subjectsRes, questionsRes, examsRes, sessionsRes, resultsRes, attRes, settingsRes] = await Promise.all([
       supabase.from('users').select('*'),
       supabase.from('subjects').select('*'),
       supabase.from('questions').select('*'),
       supabase.from('exams').select('*'),
       supabase.from('exam_sessions').select('*'),
       supabase.from('results').select('*'),
       supabase.from('attendance').select('*'),
       supabase.from('settings').select('*').eq('id', 1).single()
     ]);

     if (usersRes.data) localState.users = usersRes.data;
     if (subjectsRes.data) localState.subjects = subjectsRes.data;
     if (questionsRes.data) localState.questions = questionsRes.data;
     if (examsRes.data) localState.exams = examsRes.data;
     if (sessionsRes.data) localState.sessions = sessionsRes.data;
     if (resultsRes.data) localState.results = resultsRes.data;
     if (attRes.data) localState.attendance = attRes.data;
     if (settingsRes.data) localState.settings = { ...defaultSettings, ...settingsRes.data };

     notify();

     // Subscribe to real-time changes
     const channel = supabase.channel('public-db-changes');
     
     const handleRt = (table: string, payload: any) => {
         const listKey = table === 'exam_sessions' ? 'sessions' : table as keyof DBState;
         if (table === 'settings') {
             if (payload.new) {
                 localState.settings = { ...defaultSettings, ...payload.new };
                 notify();
             }
             return;
         }
         if (!localState[listKey]) (localState as any)[listKey] = [];
         const list = localState[listKey] as any[];
         if (payload.eventType === 'INSERT') {
             if (!list.find((i: any) => i.id === payload.new.id)) list.push(payload.new);
         } else if (payload.eventType === 'UPDATE') {
             const idx = list.findIndex((i: any) => i.id === payload.new.id);
             if (idx >= 0) list[idx] = payload.new;
             else list.push(payload.new);
         } else if (payload.eventType === 'DELETE') {
             (localState as any)[listKey] = list.filter((i: any) => i.id !== payload.old.id);
         }
         notify();
     };

     ['users', 'subjects', 'questions', 'exams', 'exam_sessions', 'results', 'attendance', 'settings'].forEach(table => {
         channel.on('postgres_changes', { event: '*', schema: 'public', table }, (p) => handleRt(table, p));
     });
     channel.subscribe();

   } catch(e) {
      console.error("Supabase sync error:", e);
   }
}

syncFromSupabase();

export const db = {
  get(): DBState {
    return localState;
  },
  
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Auth Helpers
  login(email: string): User | null {
    return localState.users.find(u => u.email === email) || null;
  },

  addUser(u: User) {
    localState.users.push(u);
    notify();
    supabase.from('users').insert(u).then(r => { if(r.error) console.error("User insert err:", r.error) });
  },

  deleteUser(id: string) {
    localState.users = localState.users.filter(u => u.id !== id);
    notify();
    supabase.from('users').delete().eq('id', id).then();
  },

  getSubjects() { return localState.subjects || []; },
  saveSubject(s: Subject) {
    const idx = (localState.subjects||[]).findIndex(x => x.id === s.id);
    if (idx >= 0) localState.subjects[idx] = s;
    else localState.subjects.push(s);
    notify();
    supabase.from('subjects').upsert(s).then();
  },
  deleteSubject(id: string) {
    localState.subjects = localState.subjects.filter(s => s.id !== id);
    notify();
    supabase.from('subjects').delete().eq('id', id).then();
  },

  getQuestions() { return localState.questions || []; },
  addQuestion(q: Question) {
    localState.questions.push(q);
    notify();
    supabase.from('questions').upsert(q).then();
  },
  deleteQuestion(id: string) {
    localState.questions = localState.questions.filter(q => q.id !== id);
    notify();
    supabase.from('questions').delete().eq('id', id).then();
  },
  
  getExams() { return localState.exams || []; },
  addExam(e: Exam) {
    const idx = (localState.exams||[]).findIndex(x => x.id === e.id);
    if(idx >= 0) localState.exams[idx] = e; else localState.exams.push(e);
    notify();
    supabase.from('exams').upsert(e).then();
  },
  deleteExam(id: string) {
    localState.exams = localState.exams.filter(exam => exam.id !== id);
    notify();
    supabase.from('exams').delete().eq('id', id).then();
  },

  // Exam Randomization Engine
  generateShuffledQuestions(examId: string): Question[] {
    const exam = localState.exams.find(e => e.id === examId);
    if (!exam) return [];

    let pool = localState.questions.filter(q => {
      if (q.examId === examId) return true;
      if (q.examId && q.examId !== examId) return false;
      if (!exam.subjects || exam.subjects.length === 0) return false;
      const qSubj = q.subject.toLowerCase();
      return exam.subjects.some(subj => 
        qSubj.includes(subj.toLowerCase()) || subj.toLowerCase().includes(qSubj)
      );
    });

    const shuffleArray = <T>(array: T[]): T[] => {
      const newArr = [...array];
      for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
    };

    if (exam.shuffleQuestions) {
      const easy = pool.filter(q => q.difficulty === 'easy');
      const medium = pool.filter(q => q.difficulty === 'medium');
      const hard = pool.filter(q => q.difficulty === 'hard');
      const untagged = pool.filter(q => !q.difficulty);

      if (easy.length > 0 || medium.length > 0 || hard.length > 0) {
        const shuffledEasy = shuffleArray(easy);
        const shuffledMedium = shuffleArray(medium);
        const shuffledHard = shuffleArray(hard);
        const shuffledUntagged = shuffleArray(untagged);
        
        let allShuffled: Question[] = [];
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
          correctAnswer: newCorrectAnswer || 'A'
        };
      });
    }

    return pool;
  },

  getSessions() { return localState.sessions || []; },
  saveSession(session: ExamSession) {
    if(!localState.sessions) localState.sessions = [];
    const idx = localState.sessions.findIndex(s => s.id === session.id);
    if (idx >= 0) localState.sessions[idx] = session;
    else localState.sessions.push(session);
    notify();
    supabase.from('exam_sessions').upsert(session).then();
  },

  getResults() { return localState.results || []; },
  saveResult(r: Result) {
    if(!localState.results) localState.results = [];
    const idx = localState.results.findIndex(x => x.id === r.id);
    if (idx >= 0) localState.results[idx] = r;
    else localState.results.push(r);
    notify();
    supabase.from('results').upsert(r).then();
  },
  
  resetDemoData() {
    console.log("Resetting demo data is disabled in production.");
  },
  clearDemoData() {
    console.log("Clearing demo data is disabled in production.");
  },

  getAttendance() { return localState.attendance || []; },
  saveAttendance(record: AttendanceRecord) {
    if(!localState.attendance) localState.attendance = [];
    const idx = localState.attendance.findIndex(a => a.id === record.id);
    if (idx >= 0) localState.attendance[idx] = record;
    else localState.attendance.push(record);
    notify();
    supabase.from('attendance').upsert(record).then();
  },
  deleteAttendance(id: string) {
    if(!localState.attendance) return;
    localState.attendance = localState.attendance.filter(a => a.id !== id);
    notify();
    supabase.from('attendance').delete().eq('id', id).then();
  },
  clearAllAttendance() {
    console.log("Mass clearing is disabled in production.");
  },
  
  getSettings() {
    return localState.settings || defaultSettings;
  },
  saveSettings(settings: typeof defaultSettings) {
    localState.settings = settings;
    notify();
    const dbObj = { ...settings, id: 1 };
    supabase.from('settings').upsert(dbObj).then();
  },
  resetSettings() {
    localState.settings = defaultSettings;
    notify();
    const dbObj = { ...defaultSettings, id: 1 };
    supabase.from('settings').upsert(dbObj).then();
  }
};
