import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { motion } from 'motion/react';
import { 
  Home, Users, BookOpen, Settings, BarChart2, CalendarCheck, 
  Monitor, FileSpreadsheet, Folder, PieChart, Shield, Download,
  UserPlus
} from 'lucide-react';
import { DashboardLayout, NavItem } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { db } from '../../lib/store';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

import AdminUsers from './AdminUsers';
import AdminMarkAttendance from './attendance/AdminMarkAttendance';
import AdminViewAttendance from './attendance/AdminViewAttendance';
import AdminAttendanceReports from './attendance/AdminAttendanceReports';

import AdminResults from './AdminResults';
import AdminDocuments from './AdminDocuments';

import AdminExams from './cbt/AdminExams';
import AdminQuestions from './cbt/AdminQuestions';
import AdminMonitor from './cbt/AdminMonitor';
import AdminSubjects from './cbt/AdminSubjects';

import AdminSettings from './AdminSettings';

import SessionReport from './results/SessionReport';
import StudentPerformance from './results/StudentPerformance';
import PublishResults from './results/PublishResults';
import StudentReport from './results/StudentReport';

// --- STUB PAGES FOR NEW NAV MODULES ---
const ComingSoon = ({ title }: { title: string }) => (
  <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
    <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4">
      <Shield className="w-8 h-8" />
    </div>
    <h3 className="text-xl font-bold text-gray-800">{title}</h3>
    <p className="text-gray-500 mt-2">This module is being provisioned.</p>
  </div>
);


// --- CBT MANAGEMENT --- removed as it is now in /cbt/AdminExams.tsx, etc.

// --- RESULT SETTINGS (GRADING SYSTEM) ---
const AdminResultSettings = () => {
  const [gradingStyle, setGradingStyle] = useState('waec');
  
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Result Settings & Grading</h2>
        <p className="text-sm text-slate-500 mt-1">Configure computation algorithms for student scores.</p>
      </div>
      
      <Card>
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold">Grading System Configuration</h3>
        </div>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <button 
              onClick={() => setGradingStyle('waec')}
              className={`p-6 rounded-xl border-2 text-left transition-all ${gradingStyle === 'waec' ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
            >
              <h4 className="font-bold text-lg text-slate-800 mb-2">WAEC Style</h4>
              <p className="text-sm text-slate-500">Standard 9-point grading system (A1, B2, B3, C4... F9).</p>
            </button>
            <button 
              onClick={() => setGradingStyle('jamb')}
              className={`p-6 rounded-xl border-2 text-left transition-all ${gradingStyle === 'jamb' ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
            >
              <h4 className="font-bold text-lg text-slate-800 mb-2">JAMB Style</h4>
              <p className="text-sm text-slate-500">400-point aggregate scoring system.</p>
            </button>
            <button 
              onClick={() => setGradingStyle('custom')}
              className={`p-6 rounded-xl border-2 text-left transition-all ${gradingStyle === 'custom' ? 'border-orange-500 bg-orange-50 ring-4 ring-orange-50' : 'border-slate-200 hover:border-orange-300'}`}
            >
              <h4 className="font-bold text-lg text-slate-800 mb-2">Custom School Grading</h4>
              <p className="text-sm text-slate-500">Configure unique GPA rules and score threshold ranges.</p>
            </button>
          </div>
          
          <div className="bg-slate-50 rounded-xl pt-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-slate-700">Grading Scale Preview ({gradingStyle.toUpperCase()})</h4>
            </div>
            {gradingStyle === 'waec' && (
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {[['A1', '75-100'], ['B2', '70-74'], ['B3', '65-69'], ['C4', '60-64'], ['C5', '55-59'], ['C6', '50-54'], ['D7', '45-49'], ['E8', '40-44'], ['F9', '0-39']].map(g => (
                   <div key={g[0]} className="bg-white p-3 rounded border border-slate-200 flex justify-between">
                     <span className="font-bold text-blue-800">{g[0]}</span>
                     <span className="text-slate-500 text-sm">{g[1]}%</span>
                   </div>
                 ))}
               </div>
            )}
            {gradingStyle === 'jamb' && (
               <div className="bg-white p-6 rounded border border-slate-200">
                 <p className="text-slate-700">Scaling factor applied. Base score out of 100 is dynamically scaled to maximum 400 aggregate points across all 4 chosen subjects (100 pts max per subject).</p>
               </div>
            )}
            {gradingStyle === 'custom' && (
               <div className="bg-white p-6 rounded border border-slate-200 border-dashed text-center">
                 <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50">Configure Custom Ranges</Button>
               </div>
            )}
          </div>
          <div className="mt-8 flex justify-end">
            <Button>Save Grading Settings</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


// --- DASHBOARD HOME (ANALYTICS) ---
const AdminHome = () => {
  const [stats, setStats] = useState({ users: 0, exams: 0, questions: 0, liveOnline: 0, submitted: 0 });

  useEffect(() => {
    const loadState = () => {
      const state = db.get();
      const sessions = db.getSessions();
      setStats({
        users: state.users.filter(u => u.role === 'candidate').length,
        exams: state.exams.filter(e => e.status === 'active').length,
        questions: state.questions.length,
        liveOnline: sessions.filter(s => s.status === 'in_progress').length,
        submitted: sessions.filter(s => s.status === 'completed').length,
      });
    };
    loadState();
    return db.subscribe(loadState);
  }, []);

  const handleClearDemoData = () => {
    if (confirm('Are you sure you want to clear all demo data and convert to a blank Live System?')) {
      db.clearDemoData();
      alert('System is now live. Data has been cleared.');
    }
  };

  const handleResetDemo = () => {
    if (confirm('Reset system with demo data?')) {
      db.resetDemoData();
    }
  };

  const chartData = [
    { name: 'Mon', passing: 400, failing: 100 },
    { name: 'Tue', passing: 300, failing: 80 },
    { name: 'Wed', passing: 500, failing: 120 },
    { name: 'Thu', passing: 280, failing: 90 },
    { name: 'Fri', passing: 600, failing: 150 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl shadow-sm border border-slate-100 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">System Monitor Analytics</h1>
          <p className="text-sm text-slate-500">Welcome to Abu Nasir Academy Admin Portal.</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <Button variant="outline" onClick={handleResetDemo} className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700">Reset Demo System</Button>
           <Button onClick={handleClearDemoData} className="bg-slate-800 hover:bg-slate-900 text-white">Convert to Live System</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 bg-white group hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Users className="w-6 h-6"/></div>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Registered Candidates</h3>
            <p className="text-3xl font-extrabold mt-1 text-slate-800">{stats.users}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 bg-white group hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform"><BookOpen className="w-6 h-6"/></div>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Active Exams</h3>
            <p className="text-3xl font-extrabold mt-1 text-slate-800">{stats.exams}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-slate-100 bg-white group hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform"><CalendarCheck className="w-6 h-6"/></div>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Submitted Exams</h3>
            <p className="text-3xl font-extrabold mt-1 text-slate-800">{stats.submitted}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-red-100 bg-red-50 group hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-xl animate-pulse"></div>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center"><Monitor className="w-6 h-6"/></div>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider text-red-700/70">Live Online Users</h3>
            <p className="text-3xl font-extrabold mt-1 text-red-600 flex items-center gap-2">
               {stats.liveOnline} <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm border-0 ring-1 ring-slate-100">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">Weekly Performance Trends</h3>
          </div>
          <CardContent className="p-6 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="passing" fill="#3b82f6" name="Passing Grades" radius={[4,4,0,0]} />
                <Bar dataKey="failing" fill="#f97316" name="Failing Grades" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-0 ring-1 ring-slate-100 flex flex-col">
          <div className="p-6 border-b border-slate-50">
             <h3 className="text-lg font-bold text-slate-800">AI Insights</h3>
          </div>
          <CardContent className="p-6 flex-1 bg-gradient-to-br from-indigo-50 to-white">
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm flex gap-3">
                <div className="text-indigo-500 mt-0.5">✨</div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-800">Math Performance Drop</h4>
                  <p className="text-xs text-slate-500 mt-1">SSS 2 students dropped 15% in calculus topics this week. Recommend assigning AI practice quizzes.</p>
                </div>
              </div>
              <div className="p-4 bg-white rounded-xl border border-indigo-100 shadow-sm flex gap-3">
                <div className="text-indigo-500 mt-0.5">✨</div>
                <div>
                  <h4 className="font-semibold text-sm text-slate-800">Cheating Risk Alert</h4>
                  <p className="text-xs text-slate-500 mt-1">3 candidates flagged for suspicious browser tab switching during Biology Mock.</p>
                </div>
              </div>
            </div>
            <Button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700">Generate Full AI Report</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const location = useLocation();

  // Define sidebar navigation strictly conforming to modern academy portals
  const navigation: NavItem[] = [
    { name: 'Dashboard Insights', href: '/admin', icon: PieChart },
    { 
      name: 'Attendance', 
      icon: CalendarCheck,
      children: [
        { name: 'Mark Attendance', href: '/admin/attendance/mark' },
        { name: 'View Attendance', href: '/admin/attendance/view' },
        { name: 'Daily Reports', href: '/admin/attendance/reports' },
        { name: 'Analytics', href: '/admin/attendance/analytics' },
      ]
    },
    { 
      name: 'CBT System', 
      icon: Monitor,
      children: [
        { name: 'Manage Exams', href: '/admin/cbt/exams' },
        { name: 'Question Bank', href: '/admin/cbt/questions' },
        { name: 'Live Monitor', href: '/admin/cbt/monitor' },
        { name: 'Subjects', href: '/admin/cbt/subjects' },
      ]
    },
    { 
      name: 'Result Generation', 
      icon: FileSpreadsheet,
      children: [
        { name: 'Term Report', href: '/admin/results/term' },
        { name: 'Session Report', href: '/admin/results/session' },
        { name: 'Student Report', href: '/admin/results/student' },
        { name: 'Subject Performance', href: '/admin/results/performance' },
        { name: 'Publish Results', href: '/admin/results/publish' },
        { name: 'Result Settings', href: '/admin/results/settings' },
      ]
    },
    { 
      name: 'Users Management', 
      icon: Users,
      children: [
        { name: 'Students', href: '/admin/users/students' },
        { name: 'Staff', href: '/admin/users/staff' },
        { name: 'Parents', href: '/admin/users/parents' },
        { name: 'Admins', href: '/admin/users/admins' },
      ]
    },
    { name: 'Documents', href: '/admin/documents', icon: Folder },
    { name: 'System Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <DashboardLayout navigation={navigation}>
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="w-full h-full"
        >
          <Routes location={location}>
              <Route path="/" element={<AdminHome />} />
              
              {/* Attendance Routes */}
              <Route path="attendance/mark" element={<AdminMarkAttendance />} />
              <Route path="attendance/view" element={<AdminViewAttendance />} />
              <Route path="attendance/reports" element={<AdminAttendanceReports />} />
              <Route path="attendance/*" element={<ComingSoon title="Attendance Analytics" />} />
              
              {/* CBT Routes */}
              <Route path="cbt/exams" element={<AdminExams />} />
              <Route path="cbt/questions" element={<AdminQuestions />} />
              <Route path="cbt/monitor" element={<AdminMonitor />} />
              <Route path="cbt/subjects" element={<AdminSubjects />} />
              
              {/* Result Routes */}
              <Route path="results/settings" element={<AdminResultSettings />} />
              <Route path="results/term" element={<AdminResults />} />
              <Route path="results/session" element={<SessionReport />} />
              <Route path="results/student" element={<StudentReport />} />
              <Route path="results/performance" element={<StudentPerformance />} />
              <Route path="results/publish" element={<PublishResults />} />
              <Route path="results/*" element={<ComingSoon title="Result Processing" />} />

              {/* User Routes */}
              <Route path="users/students" element={<AdminUsers />} />
              <Route path="users/*" element={<ComingSoon title="User Portals" />} />

              {/* Others */}
              <Route path="documents" element={<AdminDocuments />} />
              <Route path="settings" element={<AdminSettings />} />
              
              <Route path="*" element={<Navigate to="" replace />} />
            </Routes>
        </motion.div>
      </AnimatePresence>
    </DashboardLayout>
  );
}
