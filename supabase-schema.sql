-- Supabase Database Schema
-- Run this in the Supabase SQL Editor to initialize your tables.

-- Enable Row Level Security functionality
create extension if not exists "uuid-ossp";

-- USERS TABLE
create table if not exists users (
  id text primary key,
  role text not null check (role in ('candidate', 'staff', 'admin')),
  name text not null,
  email text not null unique,
  phone text,
  password text,
  "serialNumber" text,
  "schoolName" text,
  address text,
  state text,
  country text,
  "photoUrl" text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SUBJECTS TABLE
create table if not exists subjects (
  id text primary key,
  name text not null,
  code text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- EXAMS TABLE
create table if not exists exams (
  id text primary key,
  title text not null,
  "durationMinutes" numeric not null,
  subjects text[] not null,
  status text not null check (status in ('active', 'inactive')),
  "gradingSystem" text not null check ("gradingSystem" in ('JAMB', 'WAEC', 'CUSTOM')),
  "academicSession" text,
  "startDate" timestamp with time zone,
  "endDate" timestamp with time zone,
  department text,
  "shuffleQuestions" boolean default true,
  "shuffleOptions" boolean default true,
  "questionsPerCandidate" numeric,
  instructions text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- QUESTIONS TABLE
create table if not exists questions (
  id text primary key,
  "examId" text references exams(id) on delete set null,
  subject text not null,
  topic text not null,
  text text not null,
  options jsonb not null, -- Expected structure: [{"label": "A", "text": "Option 1"}, ...]
  "correctAnswer" text not null,
  explanation text,
  difficulty text check (difficulty in ('easy', 'medium', 'hard')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- EXAM SESSIONS TABLE
create table if not exists exam_sessions (
  id text primary key,
  "examId" text references exams(id) on delete cascade,
  "candidateId" text references users(id) on delete cascade,
  "startTime" timestamp with time zone not null,
  "endTime" timestamp with time zone,
  answers jsonb default '{}'::jsonb not null,
  status text not null check (status in ('in_progress', 'completed')),
  "shuffledQuestions" jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RESULTS TABLE
create table if not exists results (
  id text primary key,
  "sessionId" text references exam_sessions(id) on delete cascade,
  "candidateId" text references users(id) on delete cascade,
  "examId" text references exams(id) on delete cascade,
  score numeric not null,
  total numeric not null,
  grade text not null,
  percentage numeric,
  remarks text,
  date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ATTENDANCE TABLE
create table if not exists attendance (
  id text primary key,
  "candidateId" text references users(id) on delete cascade,
  date text not null,
  status text not null check (status in ('present', 'absent', 'late')),
  "subjectOrExamId" text,
  timestamp timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- VIOLATIONS TABLE
create table if not exists violations (
  id text primary key,
  "candidateId" text not null,
  "examId" text not null,
  type text not null,
  description text,
  timestamp timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SETTINGS TABLE
create table if not exists settings (
  id integer primary key default 1,
  "websiteName" text not null,
  "websiteDescription" text not null,
  "contactEmail" text not null,
  "contactPhone" text not null,
  address text not null,
  "defaultExamDuration" numeric not null,
  "autoSubmit" boolean not null,
  "antiCheatingSensitivity" text not null,
  "passMark" numeric not null,
  "darkMode" boolean not null,
  "websiteLogo" text,
  favicon text,
  "dashboardLogo" text,
  "loginBackground" text,
  
  -- Ensure only one settings row exists
  constraint single_row check (id = 1)
);

-- SETUP ROW LEVEL SECURITY
-- For quick access without complex configuration initially
alter table users enable row level security;
create policy "Allow public access to users" on users for all using (true);

alter table subjects enable row level security;
create policy "Allow public access to subjects" on subjects for all using (true);

alter table exams enable row level security;
create policy "Allow public access to exams" on exams for all using (true);

alter table questions enable row level security;
create policy "Allow public access to questions" on questions for all using (true);

alter table exam_sessions enable row level security;
create policy "Allow public access to exam_sessions" on exam_sessions for all using (true);

alter table results enable row level security;
create policy "Allow public access to results" on results for all using (true);

alter table attendance enable row level security;
create policy "Allow public access to attendance" on attendance for all using (true);

alter table violations enable row level security;
create policy "Allow public access to violations" on violations for all using (true);

alter table settings enable row level security;
create policy "Allow public access to settings" on settings for all using (true);

-- INITIAL SEED DATA
insert into settings (
  id, "websiteName", "websiteDescription", "contactEmail", "contactPhone", 
  address, "defaultExamDuration", "autoSubmit", "antiCheatingSensitivity", 
  "passMark", "darkMode"
) values (
  1, 'Abu Nasir Academy CBT', 'Official CBT Platform', 'admin@abunasir.edu', 
  '+1234567890', '123 Academy Way', 60, true, 'medium', 50, false
) on conflict(id) do nothing;

insert into users (id, role, name, email) values
('staff_1', 'staff', 'Mr. John (Staff)', 'staff@abunasir.edu'),
('student_1', 'candidate', 'Test Student', 'student@example.com'),
('admin_1', 'admin', 'System Admin', 'admin@abunasir.edu')
on conflict(id) do nothing;
