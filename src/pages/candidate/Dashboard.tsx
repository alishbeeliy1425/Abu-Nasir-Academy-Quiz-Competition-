import React, { useEffect, useState, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Home, PlayCircle, FileText, Trophy } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { db, useStore } from '../../lib/store';
import { Exam } from '../../types';
import { useAuth } from '../../components/AuthProvider';
import { useSettings } from '../../components/SettingsProvider';

const CandidateExams = () => {
  const allExams = useStore(state => state.exams || []);
  const exams = useMemo(() => allExams.slice().reverse(), [allExams]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const results = db.getResults();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Upcoming & Available Exams</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map(exam => {
          const hasTaken = user ? results.some(r => r.candidateId === user.id && r.examId === exam.id) : false;
          const session = user ? db.getSessions().find(s => s.candidateId === user.id && s.examId === exam.id) : null;
          const isCompleted = hasTaken || (session && session.status === 'completed');
          
          let isScheduled = false;
          let timeToStart = 0;
          let isAutoActivated = false;
          
          if (exam.startDate && exam.status !== 'active') {
            const startTimestamp = new Date(exam.startDate).getTime();
            if (startTimestamp > now) {
              isScheduled = true;
              timeToStart = startTimestamp - now;
            } else {
              isAutoActivated = true; // Auto-activates once time hits 0
            }
          }

          let state = 'available';
          if (isCompleted) state = 'completed';
          else if (isScheduled) state = 'scheduled';
          else if (!isAutoActivated && exam.status === 'inactive') state = 'inactive';

          // Formatting scheduled date
          let formattedDate = "";
          let formattedTime = "";
          if (exam.startDate) {
             const sd = new Date(exam.startDate);
             formattedDate = sd.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
             formattedTime = sd.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
          }

          if (state === 'scheduled') {
            const days = Math.floor(timeToStart / (1000 * 60 * 60 * 24));
            const hours = Math.floor((timeToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((timeToStart % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((timeToStart % (1000 * 60)) / 1000);

            return (
              <Card key={exam.id} className="relative overflow-hidden group shadow-lg border-0 bg-white ring-1 ring-slate-200">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 z-0 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                
                <CardHeader className="relative z-10 pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-slate-900 leading-tight pr-2">{exam.title}</h3>
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1 uppercase rounded-full tracking-wider shrink-0 shadow-sm border border-indigo-200">
                      Upcoming
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Begins on:</p>
                  <p className="text-slate-800 font-semibold">{formattedDate} — {formattedTime}</p>
                </CardHeader>
                
                <CardContent className="relative z-10 pt-2">
                  <div className="grid grid-cols-4 gap-2 mb-6 text-center">
                     <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/60 shadow-sm">
                       <span className="block text-xl font-bold font-mono text-indigo-600">{days}</span>
                       <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Days</span>
                     </div>
                     <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/60 shadow-sm">
                       <span className="block text-xl font-bold font-mono text-indigo-600">{hours.toString().padStart(2, '0')}</span>
                       <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Hrs</span>
                     </div>
                     <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/60 shadow-sm">
                       <span className="block text-xl font-bold font-mono text-indigo-600">{minutes.toString().padStart(2, '0')}</span>
                       <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Min</span>
                     </div>
                     <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/60 shadow-sm">
                       <span className="block text-xl font-bold font-mono text-indigo-600">{seconds.toString().padStart(2, '0')}</span>
                       <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sec</span>
                     </div>
                  </div>
                  
                  <Button disabled className="w-full bg-slate-100 text-slate-500 border border-slate-200 opacity-80 cursor-not-allowed">
                    Starts Automatically
                  </Button>
                </CardContent>
              </Card>
            );
          }

          if (state === 'inactive') {
             return (
              <Card key={exam.id} className="relative overflow-hidden group shadow-sm border-0 bg-slate-50 ring-1 ring-slate-200 opacity-80">
                <CardHeader className="relative z-10 pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-slate-700 leading-tight">{exam.title}</h3>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">Exam is being prepared.</p>
                  <p className="text-slate-600 text-sm">Please check back later.</p>
                </CardHeader>
                <CardContent>
                  <Button disabled className="w-full bg-white text-slate-400 border border-slate-200 shadow-sm">
                    Waiting for Admin
                  </Button>
                </CardContent>
              </Card>
             );
          }

          return (
            <Card key={exam.id} className={`hover:shadow-lg transition-all transform hover:-translate-y-1 duration-200 border-0 ring-1 ${state === 'completed' ? 'ring-green-400/50 bg-green-50/10' : 'ring-blue-400/50 bg-white'}`}>
              <div className={`absolute top-0 left-0 w-full h-1 ${state === 'completed' ? 'bg-green-500' : 'bg-blue-600'}`} />
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl text-slate-900 leading-tight pr-4">{exam.title}</h3>
                  {state === 'completed' && <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 uppercase rounded tracking-wider shrink-0">Completed</span>}
                </div>
                <p className="text-sm text-slate-500">{exam.subjects.join(', ')}</p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-slate-600 mb-6">
                  <span className="flex items-center gap-1.5"><PlayCircle className="w-4 h-4 text-slate-400"/> {exam.durationMinutes} mins</span>
                  <span className="font-medium bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">{exam.questionsPerCandidate || 40} Questions</span>
                </div>
                
                {state === 'completed' ? (
                  <Button variant="outline" onClick={() => navigate('/candidate/results')} className="w-full bg-green-50 text-green-700 border-green-200 hover:bg-green-100">
                    View Result
                  </Button>
                ) : (
                  <Button onClick={() => navigate(`/candidate/take-exam/${exam.id}`)} className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium tracking-wide">
                    START EXAM
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {exams.length === 0 && (
          <div className="col-span-full p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <h3 className="text-xl font-bold text-slate-700 mb-2">No Exams Found</h3>
            <p className="text-slate-500">There are currently no upcoming or available exams.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CandidateHome = () => {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Candidate Portal</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-blue-600 text-white border-none">
          <CardContent className="p-8">
            <h2 className="text-3xl font-bold mb-2">Ready to test your knowledge?</h2>
            <p className="text-blue-100 mb-6">Access official mock examinations and practice tests tailored for JAMB standards.</p>
            <Button variant="secondary" onClick={() => navigate('/candidate/exams')}>View Available Exams</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const CandidateResults = () => {
  const allResults = useStore(state => state.results || []);
  const allExams = useStore(state => state.exams || []);
  const { user } = useAuth();
  const settings = useSettings();
  
  const results = useMemo(() => {
    if (!user?.id) return [];
    const allRes = allResults.filter(r => r.candidateId === user.id);
    return allRes.map(r => ({
      ...r,
      examTitle: allExams.find(e => e.id === r.examId)?.title || 'Unknown Exam',
      candidatePhoto: user.photoUrl
    }));
  }, [user, allResults, allExams]);

  const handlePrint = (res: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>CBT Result Slip - ${user?.name}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; background: white; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .header img.logo { border-radius: 0; border: none; width: 80px; height: 80px; margin-bottom: 15px; object-fit: contain; }
            .header h1 { color: #1e3a8a; margin: 0 0 10px 0; font-size: 28px; text-transform: uppercase; letter-spacing: 1px; }
            .title { font-size: 16px; color: #64748b; margin: 0; font-weight: 500; text-transform: uppercase; }
            .profile-section { display: flex; align-items: start; gap: 24px; margin-bottom: 40px; background: #f8fafc; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .profile-img { width: 120px; height: 120px; border-radius: 12px; object-fit: cover; border: 3px solid white; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
            .cand-info { flex: 1; }
            .cand-info h2 { margin: 0 0 8px 0; font-size: 24px; color: #0f172a; }
            .cand-info p { margin: 4px 0; color: #475569; font-size: 15px; }
            .cand-info p strong { color: #1e293b; display: inline-block; width: 100px; }
            .table-container { margin-bottom: 40px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { padding: 14px 20px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background: #f8fafc; color: #475569; font-weight: 600; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; }
            td { font-size: 15px; color: #334155; font-weight: 500; }
            .total-row td { background: #eff6ff; font-weight: bold; color: #1e40af; border-bottom: none; }
            .remarks-section { background: #fefce8; border: 1px solid #fef08a; padding: 24px; border-radius: 12px; margin-bottom: 40px; }
            .remarks-section h3 { margin: 0 0 12px 0; font-size: 14px; color: #b45309; text-transform: uppercase; letter-spacing: 0.05em; }
            .remarks-section p { margin: 0; color: #92400e; font-size: 16px; font-style: italic; }
            .footer { text-align: center; color: #94a3b8; font-size: 13px; margin-top: 60px; border-top: 1px solid #f1f5f9; padding-top: 30px; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="margin-bottom: 30px; text-align: right;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px; box-shadow: 0 4px 6px -1px rgb(37 99 235 / 0.2);">Print Result Slip</button>
          </div>
          
          <div class="header">
            ${settings.websiteLogo ? `<img class="logo" src="${settings.websiteLogo}" alt="Logo" />` : ''}
            <h1>${settings.websiteName || 'Abu Nasir Academy'}</h1>
            <p class="title">Official Candidate Result Slip</p>
          </div>
          
          <div class="profile-section">
            <img class="profile-img" src="${res.candidatePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}" alt="Candidate Photo" />
            <div class="cand-info">
              <h2>${user?.name}</h2>
              <p><strong>Serial No:</strong> ${user?.serialNumber || user?.id.split('_')[1]}</p>
              <p><strong>Exam Date:</strong> ${new Date(res.date).toLocaleDateString()}</p>
              <p><strong>School:</strong> ${user?.schoolName || 'Abu Nasir Academy'}</p>
            </div>
          </div>
          
          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Examination Subject(s)</th>
                  <th>Maximum Score</th>
                  <th>Score Obtained</th>
                  <th>Percentage / Grade</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>${res.examTitle}</td>
                  <td>${res.total}</td>
                  <td>${res.score}</td>
                  <td>${res.grade}</td>
                </tr>
                <tr class="total-row">
                  <td>AGGREGATE RESULT</td>
                  <td>${res.total}</td>
                  <td>${res.score}</td>
                  <td>${res.grade}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="remarks-section">
            <h3>Performance Note</h3>
            <p>"${res.remarks || "Performance verified."}"</p>
          </div>

          <div class="footer">
            <p>Generated dynamically by ${settings.websiteName || 'Abu Nasir Academy'} CBT Platform on ${new Date().toLocaleString()}</p>
            <p>This is a computer generated document and does not require a physical signature.</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Results</h2>
      {results.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-gray-500">
            You haven't completed any exams yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map(res => (
            <Card key={res.id} className="border-t-4 border-blue-600 flex flex-col hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">{res.examTitle}</h3>
                  <p className="text-sm text-gray-500">{new Date(res.date).toLocaleDateString()}</p>
                </div>
                {res.candidatePhoto && (
                  <img src={res.candidatePhoto} alt="Candidate Profile" className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover" />
                )}
              </CardHeader>
              <CardContent className="flex flex-col flex-1 pb-6">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">JAMB Score Equivalent</p>
                    <p className="text-3xl font-bold text-slate-900">{res.score}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 font-medium">Percentage</p>
                    <p className="text-2xl font-bold text-blue-600">{res.grade}</p>
                  </div>
                </div>
                
                {res.remarks && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6 flex-1">
                    <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mb-1">Observation</p>
                    <p className="text-sm text-slate-600 italic">"{res.remarks}"</p>
                  </div>
                )}
                
                <div className="mt-auto">
                  <Button variant="outline" className="w-full font-medium shadow-sm hover:bg-slate-50 text-blue-700 hover:text-blue-800 border-blue-200" onClick={() => handlePrint(res)}>
                    Print Result Slip
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

const CandidateLeaderboard = () => {
  const results = useStore(state => state.results || []);
  const users = useStore(state => state.users || []);

  const leaderboard = useMemo(() => {
    const aggregated: Record<string, { totalScore: number, examsTaken: number }> = {};
    results.forEach(r => {
      if (!aggregated[r.candidateId]) aggregated[r.candidateId] = { totalScore: 0, examsTaken: 0 };
      aggregated[r.candidateId].totalScore += r.score;
      aggregated[r.candidateId].examsTaken += 1;
    });

    return Object.keys(aggregated).map(cId => {
      const user = users.find(u => u.id === cId);
      return {
        id: cId,
        name: user?.name || 'Unknown Student',
        photoUrl: user?.photoUrl,
        score: aggregated[cId].totalScore,
        exams: aggregated[cId].examsTaken
      };
    }).sort((a,b) => b.score - a.score).slice(0, 50);
  }, [results, users]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-3">
        <Trophy className="h-8 w-8 text-yellow-500" /> 
        Global Leaderboard
      </h2>
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-4 font-bold text-gray-700">Rank</th>
                <th className="px-6 py-4 font-bold text-gray-700">Candidate</th>
                <th className="px-6 py-4 font-bold text-gray-700 text-right">Cumulative Score</th>
                <th className="px-6 py-4 font-bold text-gray-700 text-right">Exams Taken</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No scores recorded yet.</td></tr>
              )}
              {leaderboard.map((student, idx) => (
                <tr key={student.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    {idx === 0 ? <Trophy className="h-5 w-5 text-yellow-500 inline-block mr-2" /> : 
                     idx === 1 ? <Trophy className="h-5 w-5 text-gray-400 inline-block mr-2" /> :
                     idx === 2 ? <Trophy className="h-5 w-5 text-amber-700 inline-block mr-2" /> : 
                     <span className="inline-block w-5 text-gray-500 font-mono pl-1">{idx+1}</span>}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-3">
                    <img src={student.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${student.name}&backgroundColor=0ea5e9`} alt={student.name} className="w-8 h-8 rounded-full border border-gray-200 object-cover" />
                    {student.name}
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-blue-600">{student.score}</td>
                  <td className="px-6 py-4 text-right text-gray-500">{student.exams}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
};

export default function CandidateDashboard() {
  const navigation = [
    { name: 'Home', href: '/candidate', icon: Home },
    { name: 'Exams', href: '/candidate/exams', icon: PlayCircle },
    { name: 'Results', href: '/candidate/results', icon: FileText },
    { name: 'Leaderboard', href: '/candidate/leaderboard', icon: Trophy },
  ];

  return (
    <DashboardLayout navigation={navigation}>
      <Routes>
        <Route path="/" element={<CandidateHome />} />
        <Route path="/exams" element={<CandidateExams />} />
        <Route path="/results" element={<CandidateResults />} />
        <Route path="/leaderboard" element={<CandidateLeaderboard />} />
        <Route path="*" element={<Navigate to="/candidate" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
