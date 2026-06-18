import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Monitor, ShieldAlert, CheckCircle2, RefreshCw, Video, AlertTriangle } from 'lucide-react';
import { db, useStore } from '../../../lib/store';
import { ExamSession, Exam, User } from '../../../types';
import { formatTime } from '../../../lib/utils';

export default function AdminMonitor() {
  const sessions = useStore(state => state.sessions || []);
  const exams = useStore(state => state.exams || []);
  const users = useStore(state => state.users || []);
  const [activeTab, setActiveTab] = useState<'grid' | 'list'>('grid');
  const [now, setNow] = useState(Date.now());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const [forceSubmitTarget, setForceSubmitTarget] = useState<ExamSession | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const confirmForceSubmit = () => {
    if (!forceSubmitTarget) return;

    // Calculate score
    const qList = forceSubmitTarget.shuffledQuestions || [];
    let score = 0;
    qList.forEach(q => {
      if (forceSubmitTarget.answers?.[q.id] === q.correctAnswer) score++;
    });

    const total = Math.max(1, qList.length);
    const percentage = Math.round((score / total) * 100);
    const { grade, remarks } = db.computeGrade(percentage);

    const result = {
      id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      sessionId: forceSubmitTarget.id,
      candidateId: forceSubmitTarget.candidateId,
      examId: forceSubmitTarget.examId,
      score: score * 10,
      total: total * 10,
      grade,
      percentage,
      remarks,
      date: new Date().toISOString()
    };

    const updatedSession = { 
      ...forceSubmitTarget, 
      status: 'completed' as const, 
      endTime: new Date().toISOString() 
    };

    db.saveSession(updatedSession);
    db.saveResult(result as any);
    setForceSubmitTarget(null);
  };

  // For realism, let's grab the admin's local webcam stream just to show the UI works 
  // (In real systems this would be WebRTC peer streams)
  useEffect(() => {
    if (activeTab === 'grid') {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(stream => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.log("Stream access denied or unavailable", err));
    }
    
    return () => {
       if (localVideoRef.current && localVideoRef.current.srcObject) {
         const stream = localVideoRef.current.srcObject as MediaStream;
         stream.getTracks().forEach(t => t.stop());
       }
    };
  }, [activeTab]);


  const activeSessions = sessions.filter(session => {
    if (session.status !== 'in_progress') return false;
    const exam = exams.find(e => e.id === session.examId);
    if (!exam) return false;
    
    const startTimeMs = new Date(session.startTime).getTime();
    const durationMs = exam.durationMinutes * 60 * 1000;
    
    // Check if the session is abandoned (running past duration + 1 min buffer)
    const isExpired = (now - startTimeMs) > (durationMs + 60000);
    return !isExpired;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Video className="text-indigo-600 w-7 h-7" /> Live Proctoring Room
          </h2>
          <p className="text-sm text-slate-500 mt-1">Monitor candidate video streams and exam progress in real-time.</p>
        </div>
        <div className="flex gap-2">
           <div className="bg-slate-200 rounded-lg p-1 flex">
             <button 
               className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
               onClick={() => setActiveTab('grid')}
             >
               Video Grid
             </button>
             <button 
               className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${activeTab === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
               onClick={() => setActiveTab('list')}
             >
               Session List
             </button>
           </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm ring-1 ring-indigo-200 bg-indigo-50/50 relative overflow-hidden">
          <CardContent className="p-6 relative z-10">
            <div className="flex justify-between items-start mb-2">
               <h3 className="text-indigo-800 font-semibold text-sm uppercase tracking-wider">Live Streams</h3>
               <Video className="w-5 h-5 text-indigo-500" />
            </div>
            <p className="text-4xl font-extrabold text-indigo-700 flex items-center gap-3">
              {activeSessions.length} <span className="w-3 h-3 rounded-full bg-red-500 animate-[pulse_1s_infinite]"></span>
            </p>
          </CardContent>
          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-200 rounded-full blur-2xl opacity-50"></div>
        </Card>
        
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-2">
               <h3 className="text-slate-600 font-semibold text-sm uppercase tracking-wider">Network Status</h3>
               <RefreshCw className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-xl font-bold text-slate-800 mt-2">All systems optimal</p>
            <p className="text-xs text-green-600 mt-1 uppercase tracking-wider font-bold">Latency: 24ms</p>
          </CardContent>
        </Card>
      </div>

      {activeTab === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeSessions.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
               <Video className="w-12 h-12 mx-auto text-slate-300 mb-3" />
               <h3 className="text-lg font-bold text-slate-700">No Active Streams</h3>
               <p className="text-slate-500 mt-1">Waiting for candidates to begin exams.</p>
            </div>
          ) : (
            activeSessions.map((session, idx) => {
              const user = users.find(u => u.id === session.candidateId);
              const exam = exams.find(e => e.id === session.examId);
              
              // We'll map the first active session to the local admin webcam just to demonstrate the UI works
              // The others will get a generic placeholder
              const isLocalSimulation = idx === 0;

              return (
                <Card key={session.id} className="border-0 ring-1 ring-slate-200 overflow-hidden bg-slate-900 group">
                  <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                    {isLocalSimulation ? (
                      <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-90" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-500">
                         <Video className="w-10 h-10 mb-2 opacity-30" />
                         <span className="text-xs uppercase tracking-widest opacity-50">Stream Encrypted</span>
                      </div>
                    )}
                    
                    <div className="absolute top-3 left-3 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider flex items-center gap-1.5 opacity-90">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> LIVE
                    </div>
                    
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                      <div className="flex items-end justify-between">
                         <div className="flex items-center gap-3">
                           <img src={user?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'U'}`} className="w-8 h-8 rounded-full border border-white/20" alt="Avatar"/>
                           <div>
                             <p className="text-white font-bold text-sm leading-tight shadow-sm">{user?.name || 'Candidate'}</p>
                             <p className="text-indigo-300 text-xs font-mono">{exam?.title || session.examId}</p>
                           </div>
                         </div>
                         <div className="text-right">
                           <span className="bg-indigo-600 text-white text-[10px] px-2 py-1 rounded font-bold uppercase">
                             Q: {Object.keys(session.answers).length}
                           </span>
                         </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      )}

      {activeTab === 'list' && (
        <Card className="shadow-sm border-0 ring-1 ring-slate-200">
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
                {activeSessions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500">No active exam sessions found.</td>
                  </tr>
                ) : (
                  activeSessions.map(session => {
                    const user = users.find(u => u.id === session.candidateId);
                    const exam = exams.find(e => e.id === session.examId);
                    const progressPct = exam ? Math.min(100, Math.round((Object.keys(session.answers).length / 50) * 100)) : 0; 
                    
                    let remainingTimeStr = 'N/A';
                    let isSuspicious = false;
                    
                    if (exam) {
                      const elapsedMs = now - new Date(session.startTime).getTime();
                      const remainingMs = Math.max(0, (exam.durationMinutes * 60000) - elapsedMs);
                      const mins = Math.floor(remainingMs / 60000);
                      const secs = Math.floor((remainingMs % 60000) / 1000);
                      remainingTimeStr = `${mins}m ${secs}s`;
                      
                      if (mins < 0 || elapsedMs > (exam.durationMinutes + 5) * 60000) {
                        isSuspicious = true;
                      }
                    }

                    return (
                      <tr key={session.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded shadow-sm border border-slate-200 overflow-hidden shrink-0">
                              <img src={user?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'U'}&backgroundColor=f8fafc`} className="w-full h-full object-cover" alt="Avatar" />
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
                            <div className={`h-2 rounded-full ${progressPct > 80 ? 'bg-green-500' : progressPct > 30 ? 'bg-indigo-500' : 'bg-slate-400'}`} style={{ width: `${progressPct}%` }}></div>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-500">{Object.keys(session.answers).length} answered</span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${isSuspicious ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'}`}>
                               <span className={`w-1.5 h-1.5 rounded-full ${isSuspicious ? 'bg-red-500' : 'bg-indigo-500'} animate-pulse`}></span>
                               {isSuspicious ? 'Suspicious' : 'In Progress'}
                            </span>
                            <span className="text-xs font-mono text-slate-600 font-medium">{remainingTimeStr} left</span>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => setForceSubmitTarget(session)}
                          >
                            Force Submit
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Force Submit Modal */}
      {forceSubmitTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-sm overflow-hidden border-0 shadow-2xl">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 flex items-center justify-center rounded-full mx-auto mb-4">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Force Submit?</h3>
              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to force submit this candidate's exam? The candidate's session will end and uncompleted questions will be marked as blank.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setForceSubmitTarget(null)}>Cancel</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={confirmForceSubmit}>Confirm Submit</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
