import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Monitor, AlertTriangle, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { db } from '../../../lib/store';
import { ExamSession, Exam, User } from '../../../types';

export default function AdminMonitor() {
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const loadState = () => {
      setSessions(db.getSessions());
      setExams(db.getExams());
      setUsers(db.get().users);
    };
    loadState();
    return db.subscribe(loadState);
  }, []);

  useEffect(() => {
    if (activeTab === 'active') {
      const interval = setInterval(() => setNow(Date.now()), 1000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const activeSessions = sessions.filter(s => s.status === 'in_progress');
  const completedSessions = sessions.filter(s => s.status === 'completed');
  const displayedSessions = activeTab === 'active' ? activeSessions : completedSessions;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Live Exam Monitor</h2>
          <p className="text-sm text-slate-500 mt-1">Track active candidates, check progress, and monitor suspicious activities in real-time.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white"><RefreshCw className="w-4 h-4 mr-2" /> Refresh Data</Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white"><ShieldAlert className="w-4 h-4 mr-2" /> Lockdown All</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm ring-1 ring-blue-200 bg-blue-50/50 relative overflow-hidden cursor-pointer" onClick={() => setActiveTab('active')}>
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-2">
               <h3 className="text-blue-800 font-semibold text-sm uppercase tracking-wider">Active Candidates</h3>
               <Monitor className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-4xl font-extrabold text-blue-700 flex items-center gap-3">
              {activeSessions.length} <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></span>
            </p>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-200 rounded-full blur-2xl opacity-50"></div>
        </Card>
        
        <Card className="border-0 shadow-sm ring-1 ring-green-200 bg-green-50/50 cursor-pointer" onClick={() => setActiveTab('completed')}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
               <h3 className="text-green-800 font-semibold text-sm uppercase tracking-wider">Completed Today</h3>
               <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-4xl font-extrabold text-green-700">{completedSessions.length}</p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm ring-1 ring-red-200 bg-red-50/50 hidden sm:block">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
               <h3 className="text-red-800 font-semibold text-sm uppercase tracking-wider">Suspicious Flags</h3>
               <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-4xl font-extrabold text-red-700">0</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-0 ring-1 ring-slate-200">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-bold text-slate-800">Real-Time Session Feed</h3>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Candidate</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Exam</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Progress</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Status</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedSessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No {activeTab} exam sessions found.</td>
                </tr>
              ) : (
                displayedSessions.map(session => {
                  const user = users.find(u => u.id === session.candidateId);
                  const exam = exams.find(e => e.id === session.examId);
                  const progressPct = exam ? Math.min(100, Math.round((Object.keys(session.answers).length / 50) * 100)) : 0; // estimate 50 q
                  
                  let remainingTimeStr = 'N/A';
                  let isSuspicious = false;
                  
                  if (session.status === 'in_progress' && exam) {
                    const elapsedMs = now - new Date(session.startTime).getTime();
                    const remainingMs = Math.max(0, (exam.durationMins * 60000) - elapsedMs);
                    const mins = Math.floor(remainingMs / 60000);
                    const secs = Math.floor((remainingMs % 60000) / 1000);
                    remainingTimeStr = `${mins}m ${secs}s`;
                    
                    if (mins < 0 || elapsedMs > (exam.durationMins + 5) * 60000) {
                      isSuspicious = true; // Overtime suspicion
                    }
                  } else if (session.status === 'completed') {
                    remainingTimeStr = 'Completed';
                  }

                  return (
                    <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0 shadow-sm">
                            <img src={user?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'Unknown'}&backgroundColor=f8fafc`} className="w-full h-full object-cover" alt={user?.name || 'Candidate'} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">{user?.name || 'Unknown Candidate'}</p>
                            <p className="text-xs text-blue-600 font-mono font-medium tracking-wide">{user?.serialNumber || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-800 font-medium">{exam?.title || session.examId}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[150px]">{exam?.subjects?.join(', ')}</p>
                      </td>
                      <td className="p-4">
                        <div className="w-full max-w-[150px] bg-slate-100 rounded-full h-2 mb-1">
                          <div className={`h-2 rounded-full ${progressPct > 80 ? 'bg-green-500' : progressPct > 30 ? 'bg-blue-500' : 'bg-slate-400'}`} style={{ width: `${progressPct}%` }}></div>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500">{Object.keys(session.answers).length} answered</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isSuspicious ? 'bg-red-100 text-red-700 border border-red-200' : session.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                             {session.status === 'in_progress' && !isSuspicious && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>}
                             {isSuspicious && <AlertTriangle className="w-3 h-3" />}
                             {isSuspicious ? 'Suspicious' : session.status.replace('_', ' ')}
                          </span>
                          {session.status === 'in_progress' && (
                            <span className="text-xs font-mono text-slate-600 font-medium">{remainingTimeStr} left</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <Button variant="outline" size="sm" className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50">Force Submit</Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
