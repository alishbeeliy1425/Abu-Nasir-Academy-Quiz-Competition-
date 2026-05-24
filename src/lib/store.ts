import {
  User,
  Question,
  Exam,
  ExamSession,
  Result,
  Subject,
  AttendanceRecord,
  Violation,
} from "../types";
import { supabase } from "./supabase";
import { useSyncExternalStore } from "react";

interface Settings {
  websiteName: string;
  websiteDescription: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  defaultExamDuration: number;
  autoSubmit: boolean;
  passMark: number;
  darkMode: boolean;
  websiteLogo?: string;
  favicon?: string;
  dashboardLogo?: string;
  loginBackground?: string;
  antiCheatingEnabled?: boolean;
  gradingStyle?: "waec" | "jamb" | "custom";
  customGrades?: { id: string; label: string; min: number; max: number }[];
}

interface DBState {
  users: User[];
  subjects: Subject[];
  questions: Question[];
  exams: Exam[];
  sessions: ExamSession[];
  results: Result[];
  attendance: AttendanceRecord[];
  violations: Violation[];
  documents: any[];
  settings?: Settings;
}

const defaultSettings: Settings = {
  websiteName: "Abu Nasir Academy CBT",
  websiteDescription: "Official CBT Platform",
  contactEmail: "admin@abunasir.edu",
  contactPhone: "+1234567890",
  address: "123 Academy Way",
  defaultExamDuration: 60,
  autoSubmit: true,
  passMark: 50,
  darkMode: false,
  antiCheatingEnabled: true,
  gradingStyle: "waec",
  customGrades: [],
};

const getTodayDate = () => new Date().toISOString().split("T")[0];

const defaultDB: DBState = {
  users: [
    {
      id: "staff_1",
      role: "staff",
      name: "Mr. John (Staff)",
      email: "staff@abunasir.edu",
    },
    {
      id: "student_1",
      role: "candidate",
      name: "Test Student",
      email: "student@example.com",
    },
    {
      id: "admin_1",
      role: "admin",
      name: "System Admin",
      email: "admin@abunasir.edu",
    },
  ],
  subjects: [],
  questions: [],
  exams: [],
  sessions: [],
  results: [],
  attendance: [],
  violations: [],
  documents: [],
  settings: defaultSettings,
};

let localState: DBState = { ...defaultDB };

// Simple observable pattern for UI updates
type Listener = () => void;
const listeners = new Set<Listener>();

const notify = () => {
  localState = {
    ...localState,
    users: localState.users ? [...localState.users] : [],
    subjects: localState.subjects ? [...localState.subjects] : [],
    questions: localState.questions ? [...localState.questions] : [],
    exams: localState.exams ? [...localState.exams] : [],
    sessions: localState.sessions ? [...localState.sessions] : [],
    results: localState.results ? [...localState.results] : [],
    attendance: localState.attendance ? [...localState.attendance] : [],
    violations: localState.violations ? [...localState.violations] : [],
    documents: localState.documents ? [...localState.documents] : [],
    settings: localState.settings ? { ...localState.settings } : undefined,
  };
  listeners.forEach((l) => l());
};

let isSynced = false;
let hasSubscribed = false;

let syncPromise: Promise<void> | null = null;

// Sync from supabase!
export const syncFromSupabase = async (force = false) => {
  if (isSynced && !force) return syncPromise;
  isSynced = true;

  syncPromise = (async () => {
    try {
      const [
        usersRes,
        subjectsRes,
        questionsRes,
        examsRes,
        sessionsRes,
        resultsRes,
        attRes,
        settingsRes,
        violationsRes,
        documentsRes,
      ] = await Promise.all([
        supabase.from("users").select("*"),
        supabase.from("subjects").select("*"),
        supabase.from("questions").select("*"),
        supabase.from("exams").select("*"),
        supabase.from("exam_sessions").select("*"),
        supabase.from("results").select("*"),
        supabase.from("attendance").select("*"),
        supabase.from("settings").select("*").eq("id", 1).single(),
        supabase.from("violations").select("*"),
        supabase.from("documents").select("*"),
      ]);

      if (usersRes.error) console.error("fetch users error:", usersRes.error);
      if (usersRes.data && usersRes.data.length > 0)
        localState.users = usersRes.data;

      if (subjectsRes.error)
        console.error("fetch subjects error:", subjectsRes.error);
      if (subjectsRes.data) localState.subjects = subjectsRes.data;

      if (questionsRes.error)
        console.error("fetch questions error:", questionsRes.error);
      if (questionsRes.data) localState.questions = questionsRes.data;

      if (examsRes.error) console.error("fetch exams error:", examsRes.error);
      if (examsRes.data) localState.exams = examsRes.data;

      if (sessionsRes.error)
        console.error("fetch sessions error:", sessionsRes.error);
      if (sessionsRes.data) localState.sessions = sessionsRes.data;

      if (resultsRes.error)
        console.error("fetch results error:", resultsRes.error);
      if (resultsRes.data) localState.results = resultsRes.data;

      if (attRes.error) console.error("fetch attendance error:", attRes.error);
      if (attRes.data) localState.attendance = attRes.data;

      if (violationsRes.error)
        console.error("fetch violations error:", violationsRes.error);
      if (violationsRes.data) localState.violations = violationsRes.data;

      if (documentsRes.error)
        console.error("fetch documents error:", documentsRes.error);
      if (documentsRes.data) localState.documents = documentsRes.data;

      if (settingsRes.error)
        console.error("fetch settings error:", settingsRes.error);
      if (settingsRes.data)
        localState.settings = { ...defaultSettings, ...settingsRes.data };

      notify();

      if (!hasSubscribed) {
        hasSubscribed = true;
        // Subscribe to real-time changes
        const channel = supabase.channel("public-db-changes");

        const handleRt = (table: string, payload: any) => {
          const listKey =
            table === "exam_sessions" ? "sessions" : (table as keyof DBState);
          if (table === "settings") {
            if (payload.new) {
              localState.settings = { ...defaultSettings, ...payload.new };
              notify();
            }
            return;
          }
          if (!localState[listKey]) (localState as any)[listKey] = [];
          const list = localState[listKey] as any[];

          let item = payload.new;

          if (payload.eventType === "INSERT") {
            if (!list.find((i: any) => i.id === item.id)) list.push(item);
          } else if (payload.eventType === "UPDATE") {
            const idx = list.findIndex((i: any) => i.id === item.id);
            if (idx >= 0) list[idx] = item;
            else list.push(item);
          } else if (payload.eventType === "DELETE") {
            (localState as any)[listKey] = list.filter(
              (i: any) => i.id !== payload.old.id,
            );
          }
          notify();
          notify();
        };

        [
          "users",
          "subjects",
          "questions",
          "exams",
          "exam_sessions",
          "results",
          "attendance",
          "settings",
          "violations",
          "documents",
        ].forEach((table) => {
          channel.on(
            "postgres_changes",
            { event: "*", schema: "public", table },
            (p) => handleRt(table, p),
          );
        });
        channel.subscribe();
      }
    } catch (e) {
      console.error("Supabase sync error:", e);
    }
  })();
  return syncPromise;
};

syncFromSupabase();

export function useStore<T>(selector: (state: DBState) => T): T {
  return useSyncExternalStore(db.subscribe, () => selector(localState));
}

export const db = {
  get() {
    return localState;
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  computeGrade(percentage: number) {
    const settings = localState.settings;
    let remarks =
      "More practice and revision are recommended for better performance.";
    if (percentage >= 75) {
      remarks =
        "Excellent performance. Keep maintaining this outstanding result.";
    } else if (percentage >= 50) {
      remarks =
        "Good effort. More focus on weaker subjects can improve overall performance.";
    }

    let grade = `${percentage}%`;

    if (settings.gradingStyle === "waec") {
      if (percentage >= 75) grade = "A1";
      else if (percentage >= 70) grade = "B2";
      else if (percentage >= 65) grade = "B3";
      else if (percentage >= 60) grade = "C4";
      else if (percentage >= 55) grade = "C5";
      else if (percentage >= 50) grade = "C6";
      else if (percentage >= 45) grade = "D7";
      else if (percentage >= 40) grade = "E8";
      else grade = "F9";
    } else if (settings.gradingStyle === "jamb") {
      // Scale out of 400 total logic
      grade = `${Math.round((percentage / 100) * 100)} Points`;
    } else if (settings.gradingStyle === "custom" && settings.customGrades) {
      const customMatch = settings.customGrades.find(
        (g) => percentage >= g.min && percentage <= g.max,
      );
      if (customMatch) grade = customMatch.label;
    }

    return { grade, remarks };
  },
  getUsers() {
    return localState.users || [];
  },
  getSubjects() {
    return localState.subjects || [];
  },
  getQuestions() {
    return localState.questions || [];
  },
  getExams() {
    return localState.exams || [];
  },
  getSessions() {
    return localState.sessions || [];
  },
  getResults() {
    return localState.results || [];
  },
  getSettings() {
    return localState.settings;
  },
  getAttendance() {
    return localState.attendance || [];
  },
  getViolations() {
    return localState.violations || [];
  },
  getDocuments() {
    return localState.documents || [];
  },

  // Auth Helpers
  login(email: string): User | null {
    return localState.users.find((u) => u.email === email) || null;
  },

  addUser(u: User) {
    const nextUsers = [...(localState.users || [])];
    const idx = nextUsers.findIndex((x) => x.id === u.id);
    if (idx >= 0) nextUsers[idx] = u;
    else nextUsers.push(u);
    localState.users = nextUsers;
    notify();
    supabase
      .from("users")
      .upsert(u)
      .then((r: any) => {
        if (r.error) console.error("User insert err:", r.error);
      });
  },

  deleteUser(id: string) {
    localState.users = localState.users.filter((u) => u.id !== id);
    notify();
    supabase.from("users").delete().eq("id", id).then();
  },

  saveSubject(s: Subject) {
    const nextSubjects = [...(localState.subjects || [])];
    const idx = nextSubjects.findIndex((x) => x.id === s.id);
    if (idx >= 0) nextSubjects[idx] = s;
    else nextSubjects.push(s);
    localState.subjects = nextSubjects;
    notify();
    supabase.from("subjects").upsert(s).then();
  },
  deleteSubject(id: string) {
    localState.subjects = localState.subjects.filter((s) => s.id !== id);
    notify();
    supabase.from("subjects").delete().eq("id", id).then();
  },

  addQuestion(q: Question) {
    const nextQuestions = [...(localState.questions || [])];
    const idx = nextQuestions.findIndex((x) => x.id === q.id);
    if (idx >= 0) nextQuestions[idx] = q;
    else nextQuestions.push(q);
    localState.questions = nextQuestions;
    notify();
    supabase
      .from("questions")
      .upsert(q)
      .then((r: any) => {
        if (r.error) console.error("Question Insert Error:", r.error);
      });
  },
  
  async addQuestions(qs: Question[]) {
    if (!qs.length) return;
    
    const nextQuestions = [...(localState.questions || [])];
    qs.forEach((q) => {
      const idx = nextQuestions.findIndex((x) => x.id === q.id);
      if (idx >= 0) nextQuestions[idx] = q;
      else nextQuestions.push(q);
    });
    localState.questions = nextQuestions;
    notify();
    
    // Batch upsert to Supabase
    const { error } = await supabase.from("questions").upsert(qs);
    if (error) {
      console.error("Batch Questions Insert Error:", error);
      throw new Error("Failed to sync to database: " + error.message);
    }
  },
  deleteQuestion(id: string) {
    localState.questions = localState.questions.filter((q) => q.id !== id);
    notify();
    supabase.from("questions").delete().eq("id", id).then();
  },

  addExam(e: Exam) {
    const nextExams = [...(localState.exams || [])];
    const idx = nextExams.findIndex((x) => x.id === e.id);
    if (idx >= 0) nextExams[idx] = e;
    else nextExams.push(e);
    localState.exams = nextExams;
    notify();

    const dbExam = {
      id: e.id,
      title: e.title,
      durationMinutes: e.durationMinutes,
      subjects: e.subjects || [],
      status: e.status,
      gradingSystem: e.gradingSystem || "WAEC",
      academicSession: e.academicSession || null,
      startDate: e.startDate || null,
      endDate: e.endDate || null,
      department: e.department || null,
      shuffleQuestions: e.shuffleQuestions ?? true,
      shuffleOptions: e.shuffleOptions ?? true,
      questionsPerCandidate: e.questionsPerCandidate || null,
      instructions: e.instructions || null,
    };

    supabase
      .from("exams")
      .upsert(dbExam)
      .then((r) => {
        if (r.error) {
          console.error("Exam upsert error:", r.error);
          alert("Failed to save exam to database: " + r.error.message);
        }
      });
  },
  deleteExam(id: string) {
    localState.exams = localState.exams.filter((exam) => exam.id !== id);
    notify();
    supabase.from("exams").delete().eq("id", id).then();
  },

  // Exam Randomization Engine
  generateShuffledQuestions(examId: string): Question[] {
    const exam = localState.exams.find((e) => e.id === examId);
    if (!exam) return [];

    let pool = localState.questions.filter((q) => {
      if (q.examId === examId) return true;
      if (q.examId && q.examId !== examId) return false;
      if (!exam.subjects || exam.subjects.length === 0) return false;
      const qSubj = q.subject.toLowerCase();
      return exam.subjects.some(
        (subj) =>
          qSubj.includes(subj.toLowerCase()) ||
          subj.toLowerCase().includes(qSubj),
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
      const easy = pool.filter((q) => q.difficulty === "easy");
      const medium = pool.filter((q) => q.difficulty === "medium");
      const hard = pool.filter((q) => q.difficulty === "hard");
      const untagged = pool.filter((q) => !q.difficulty);

      if (easy.length > 0 || medium.length > 0 || hard.length > 0) {
        const shuffledEasy = shuffleArray(easy);
        const shuffledMedium = shuffleArray(medium);
        const shuffledHard = shuffleArray(hard);
        const shuffledUntagged = shuffleArray(untagged);

        let allShuffled: Question[] = [];
        const maxLen = Math.max(
          shuffledEasy.length,
          shuffledMedium.length,
          shuffledHard.length,
          shuffledUntagged.length,
        );
        for (let i = 0; i < maxLen; i++) {
          if (i < shuffledEasy.length) allShuffled.push(shuffledEasy[i]);
          if (i < shuffledMedium.length) allShuffled.push(shuffledMedium[i]);
          if (i < shuffledHard.length) allShuffled.push(shuffledHard[i]);
          if (i < shuffledUntagged.length)
            allShuffled.push(shuffledUntagged[i]);
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
      pool = pool.map((q) => {
        const correctText = q.options.find(
          (o) => o.label === q.correctAnswer,
        )?.text;

        let newOptions = shuffleArray([...q.options]);
        newOptions = newOptions.map((o, idx) => ({
          label: ["A", "B", "C", "D"][idx],
          text: o.text,
        }));
        const newCorrectAnswer = newOptions.find((o) => o.text === correctText)
          ?.label as "A" | "B" | "C" | "D";

        return {
          ...q,
          options: newOptions,
          correctAnswer: newCorrectAnswer || "A",
        };
      });
    }

    return pool;
  },

  saveSession(session: ExamSession) {
    const nextSessions = [...(localState.sessions || [])];
    const idx = nextSessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) nextSessions[idx] = session;
    else nextSessions.push(session);
    localState.sessions = nextSessions;
    notify();
    supabase.from("exam_sessions").upsert(session).then();
  },

  saveResult(r: Result) {
    const nextResults = [...(localState.results || [])];
    const idx = nextResults.findIndex((x) => x.id === r.id);
    if (idx >= 0) nextResults[idx] = r;
    else nextResults.push(r);
    localState.results = nextResults;
    notify();
    supabase.from("results").upsert(r).then();
  },

  resetDemoData() {
    window.location.reload();
  },
  clearDemoData() {
    localState = {
      users: [],
      exams: [],
      questions: [],
      subjects: [],
      sessions: [],
      results: [],
      attendance: [],
      documents: [],
      settings: defaultSettings,
      violations: [],
    };
    notify();
  },

  saveAttendance(record: AttendanceRecord) {
    const nextAttendance = [...(localState.attendance || [])];
    const idx = nextAttendance.findIndex((a) => a.id === record.id);
    if (idx >= 0) nextAttendance[idx] = record;
    else nextAttendance.push(record);
    localState.attendance = nextAttendance;
    notify();
    supabase.from("attendance").upsert(record).then();
  },
  deleteAttendance(id: string) {
    if (!localState.attendance) return;
    localState.attendance = localState.attendance.filter((a) => a.id !== id);
    notify();
    supabase.from("attendance").delete().eq("id", id).then();
  },
  clearAllAttendance() {
    console.log("Mass clearing is disabled in production.");
  },

  saveViolation(v: Violation) {
    if (!localState.violations) localState.violations = [];
    localState.violations.unshift(v);
    notify();
    supabase.from("violations").insert(v).then();
  },

  saveSettings(settings: typeof defaultSettings) {
    localState.settings = settings;
    notify();
    const dbObj = { ...settings, id: 1 };
    supabase.from("settings").upsert(dbObj).then();
  },
  resetSettings() {
    localState.settings = defaultSettings;
    notify();
    const dbObj = { ...defaultSettings, id: 1 };
    supabase.from("settings").upsert(dbObj).then();
  },

  addDocument(doc: any) {
    const nextDocuments = [...(localState.documents || [])];
    nextDocuments.push(doc);
    localState.documents = nextDocuments;
    notify();
    supabase
      .from("documents")
      .insert(doc)
      .then((r) => {
        if (r.error) console.error("Doc insert err:", r.error);
      });
  },
  deleteDocument(id: string) {
    if (!localState.documents) return;
    localState.documents = localState.documents.filter((d) => d.id !== id);
    notify();
    supabase.from("documents").delete().eq("id", id).then();
  },
};
