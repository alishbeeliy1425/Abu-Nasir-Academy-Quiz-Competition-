import React, { useEffect, useState, useMemo } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { Home, PlayCircle, FileText, Trophy, BarChart2, BookOpen } from "lucide-react";
import { DashboardLayout } from "../../components/layout/DashboardLayout";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { db, useStore } from "../../lib/store";
import { Exam } from "../../types";
import { useAuth } from "../../components/AuthProvider";
import { useSettings } from "../../components/SettingsProvider";

const CandidateExams = () => {
  const allExams = useStore((state) => state.exams || []);
  const allSessions = useStore((state) => state.sessions || []);
  const allResults = useStore((state) => state.results || []);
  const exams = useMemo(() => allExams.slice().reverse(), [allExams]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { userResultsMap, userSessionsMap } = useMemo(() => {
    const resultsMap = new Map();
    const sessionsMap = new Map();
    if (user) {
      allResults.forEach(r => {
        if (r.candidateId === user.id) resultsMap.set(r.examId, r);
      });
      allSessions.forEach(s => {
        if (s.candidateId === user.id) sessionsMap.set(s.examId, s);
      });
    }
    return { userResultsMap: resultsMap, userSessionsMap: sessionsMap };
  }, [allResults, allSessions, user]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Upcoming & Available Exams</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exams.map((exam) => {
          const hasTaken = userResultsMap.has(exam.id);
          const session = userSessionsMap.get(exam.id);
          const isCompleted = hasTaken || (session && session.status === "completed");
          
          let isExpired = false;
          let isInProgress = false;
          if (session && session.status === 'in_progress' && session.startTime) {
            isInProgress = true;
            const elapsed = Date.now() - new Date(session.startTime).getTime();
            if (elapsed > (exam.durationMinutes * 60 * 1000) + 60000) {
              isExpired = true;
            }
          }

          let isScheduled = false;
          let timeToStart = 0;
          let isAutoActivated = false;

          if (exam.startDate && exam.status !== "active") {
            const startTimestamp = new Date(exam.startDate).getTime();
            if (startTimestamp > now) {
              isScheduled = true;
              timeToStart = startTimestamp - now;
            } else {
              isAutoActivated = true; // Auto-activates once time hits 0
            }
          }

          let state = "available";
          if (isCompleted) state = "completed";
          else if (isScheduled) state = "scheduled";
          else if (!isAutoActivated && exam.status === "inactive")
            state = "inactive";

          if (state === "inactive") return null; // Hide from candidates

          // Formatting scheduled date
          let formattedDate = "";
          let formattedTime = "";
          if (exam.startDate) {
            const sd = new Date(exam.startDate);
            formattedDate = sd.toLocaleDateString(undefined, {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            formattedTime = sd.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            });
          }

          if (state === "scheduled") {
            const days = Math.floor(timeToStart / (1000 * 60 * 60 * 24));
            const hours = Math.floor(
              (timeToStart % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
            );
            const minutes = Math.floor(
              (timeToStart % (1000 * 60 * 60)) / (1000 * 60),
            );
            const seconds = Math.floor((timeToStart % (1000 * 60)) / 1000);

            return (
              <Card
                key={exam.id}
                className="relative overflow-hidden group shadow-lg border-0 bg-white ring-1 ring-slate-200"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 z-0 pointer-events-none" />
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />

                <CardHeader className="relative z-10 pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-xl text-slate-900 leading-tight pr-2">
                      {exam.title}
                    </h3>
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2.5 py-1 uppercase rounded-full tracking-wider shrink-0 shadow-sm border border-indigo-200">
                      Upcoming
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 font-medium">
                    Begins on:
                  </p>
                  <p className="text-slate-800 font-semibold">
                    {formattedDate} — {formattedTime}
                  </p>
                </CardHeader>

                <CardContent className="relative z-10 pt-2">
                  <div className="grid grid-cols-4 gap-2 mb-6 text-center">
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/60 shadow-sm">
                      <span className="block text-xl font-bold font-mono text-indigo-600">
                        {days}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Days
                      </span>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/60 shadow-sm">
                      <span className="block text-xl font-bold font-mono text-indigo-600">
                        {hours.toString().padStart(2, "0")}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Hrs
                      </span>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/60 shadow-sm">
                      <span className="block text-xl font-bold font-mono text-indigo-600">
                        {minutes.toString().padStart(2, "0")}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Min
                      </span>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2 border border-slate-200/60 shadow-sm">
                      <span className="block text-xl font-bold font-mono text-indigo-600">
                        {seconds.toString().padStart(2, "0")}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                        Sec
                      </span>
                    </div>
                  </div>

                  <Button
                    disabled
                    className="w-full bg-slate-100 text-slate-500 border border-slate-200 opacity-80 cursor-not-allowed"
                  >
                    Starts Automatically
                  </Button>
                </CardContent>
              </Card>
            );
          }

          return (
            <Card
              key={exam.id}
              className={`hover:shadow-lg transition-all transform hover:-translate-y-1 duration-200 border-0 ring-1 ${state === "completed" ? "ring-green-400/50 bg-green-50/10" : "ring-blue-400/50 bg-white"}`}
            >
              <div
                className={`absolute top-0 left-0 w-full h-1 ${state === "completed" ? "bg-green-500" : "bg-blue-600"}`}
              />
              <CardHeader>
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-xl text-slate-900 leading-tight pr-4">
                    {exam.title}
                  </h3>
                  {state === "completed" && (
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 uppercase rounded tracking-wider shrink-0">
                      Completed
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500">
                  {exam.subjects.join(", ")}
                </p>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-sm text-slate-600 mb-6">
                  <span className="flex items-center gap-1.5">
                    <PlayCircle className="w-4 h-4 text-slate-400" />{" "}
                    {exam.durationMinutes} mins
                  </span>
                  <span className="font-medium bg-slate-100 px-2 py-1 rounded text-xs border border-slate-200">
                    {exam.questionsPerCandidate || 40} Questions
                  </span>
                </div>

                {state === "completed" ? (
                  <Button
                    variant="outline"
                    onClick={() => navigate("/candidate/results")}
                    className="w-full bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                  >
                    View Result
                  </Button>
                ) : (
                  <Button
                    onClick={() => navigate(`/candidate/take-exam/${exam.id}`)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-medium tracking-wide"
                  >
                    {isExpired ? 'FINALIZE SUBMISSION' : isInProgress ? 'RESUME EXAM' : 'START EXAM'}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
        {exams.length === 0 && (
          <div className="col-span-full p-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
            <h3 className="text-xl font-bold text-slate-700 mb-2">
              No Exams Found
            </h3>
            <p className="text-slate-500">
              There are currently no upcoming or available exams.
            </p>
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
            <h2 className="text-3xl font-bold mb-2">
              Ready to test your knowledge?
            </h2>
            <p className="text-blue-100 mb-6">
              Access official mock examinations and practice tests tailored for
              JAMB standards.
            </p>
            <Button
              variant="secondary"
              onClick={() => navigate("/candidate/exams")}
            >
              View Available Exams
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const CandidateResults = () => {
  const allResults = useStore((state) => state.results || []);
  const allExams = useStore((state) => state.exams || []);
  const { user } = useAuth();
  const settings = useSettings();

  const results = useMemo(() => {
    if (!user?.id) return [];
    const allRes = allResults.filter((r) => r.candidateId === user.id);
    return allRes.map((r) => ({
      ...r,
      examTitle:
        allExams.find((e) => e.id === r.examId)?.title || "Unknown Exam",
      candidatePhoto: user.photoUrl,
    }));
  }, [user, allResults, allExams]);

  const handlePrint = (res: any) => {
    const printWindow = window.open("", "_blank");
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
            ${settings.websiteLogo ? `<img class="logo" src="${settings.websiteLogo}" alt="Logo" />` : ""}
            <h1>${settings.websiteName || "Abu Nasir Academy"}</h1>
            <p class="title">Official Candidate Result Slip</p>
          </div>
          
          <div class="profile-section">
            <img class="profile-img" src="${res.candidatePhoto || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}" alt="Candidate Photo" />
            <div class="cand-info">
              <h2>${user?.name}</h2>
              <p><strong>Serial No:</strong> ${user?.serialNumber || user?.id.split("_")[1]}</p>
              <p><strong>Exam Date:</strong> ${new Date(res.date).toLocaleDateString()}</p>
              <p><strong>School:</strong> ${user?.schoolName || "Abu Nasir Academy"}</p>
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
            <p>Generated dynamically by ${settings.websiteName || "Abu Nasir Academy"} CBT Platform on ${new Date().toLocaleString()}</p>
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
          {results.map((res) => (
            <Card
              key={res.id}
              className="border-t-4 border-blue-600 flex flex-col hover:shadow-lg transition-shadow"
            >
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    {res.examTitle}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(res.date).toLocaleDateString()}
                  </p>
                </div>
                {res.candidatePhoto && (
                  <img
                    src={res.candidatePhoto}
                    alt="Candidate Profile"
                    className="w-12 h-12 rounded-full border-2 border-white shadow-sm object-cover"
                  />
                )}
              </CardHeader>
              <CardContent className="flex flex-col flex-1 pb-6">
                <div className="flex items-end justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">
                      JAMB Score Equivalent
                    </p>
                    <p className="text-3xl font-bold text-slate-900">
                      {res.score}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 font-medium">
                      Percentage
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {res.grade}
                    </p>
                  </div>
                </div>

                {res.remarks && (
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 mb-6 flex-1">
                    <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider mb-1">
                      Observation
                    </p>
                    <p className="text-sm text-slate-600 italic">
                      "{res.remarks}"
                    </p>
                  </div>
                )}

                <div className="mt-auto">
                  <Button
                    variant="outline"
                    className="w-full font-medium shadow-sm hover:bg-slate-50 text-blue-700 hover:text-blue-800 border-blue-200"
                    onClick={() => handlePrint(res)}
                  >
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
  const allResults = useStore((state) => state.results || []);
  const allUsers = useStore((state) => state.users || []);
  const exams = useStore((state) => state.exams || []);
  const sessions = useStore((state) => state.sessions || []);
  const { user } = useAuth();
  
  // Exams the candidate has taken
  const takenExamIds = useMemo(() => Array.from(new Set(allResults.filter(r => r.candidateId === user?.id).map(r => r.examId))), [allResults, user?.id]);
  const defaultExamId = takenExamIds.length > 0 ? takenExamIds[takenExamIds.length - 1] : '';
  const [selectedExamId, setSelectedExamId] = useState<string>(defaultExamId);

  // Sync default exam on first pass if missing
  React.useEffect(() => {
    if (!selectedExamId && defaultExamId) {
      setSelectedExamId(defaultExamId);
    }
  }, [defaultExamId, selectedExamId]);

  const candidates = useMemo(() => allUsers.filter(u => u.role === 'candidate'), [allUsers]);

  const examLeaderboard = useMemo(() => {
    if (!selectedExamId) return [];

    const examResults = allResults.filter(r => r.examId === selectedExamId);
    
    const enrichedResults = examResults.map(res => {
      const candidate = candidates.find(c => c.id === res.candidateId);
      const session = sessions.find(s => s.id === res.sessionId || (s.examId === selectedExamId && s.candidateId === res.candidateId && s.status === 'completed'));
      
      let durationMs = 0;
      if (session && session.startTime && session.endTime) {
         durationMs = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
      }

      return {
        ...res,
        candidateName: candidate?.name || 'Unknown Student',
        serialNumber: candidate?.serialNumber || candidate?.id.split('_')[1] || 'N/A',
        photoUrl: candidate?.photoUrl,
        durationMs
      };
    });

    return enrichedResults.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const bPct = b.percentage || 0;
      const aPct = a.percentage || 0;
      if (bPct !== aPct) return bPct - aPct;
      if (a.durationMs > 0 && b.durationMs > 0) return a.durationMs - b.durationMs;
      return 0; // fallback
    });
  }, [allResults, sessions, selectedExamId, candidates]);

  const myPositionObj = useMemo(() => {
    if (!user?.id) return null;
    const index = examLeaderboard.findIndex(r => r.candidateId === user.id);
    if (index === -1) return null;
    return {
      rank: index + 1,
      total: examLeaderboard.length,
      data: examLeaderboard[index]
    };
  }, [examLeaderboard, user?.id]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <Trophy className="h-8 w-8 text-blue-600" />
            Exam Leaderboards
          </h2>
          <p className="text-sm text-slate-500 mt-1">View standalone rankings and your position for each exam.</p>
        </div>
        <div className="w-full sm:w-64">
           <select 
             className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700"
             value={selectedExamId}
             onChange={(e) => setSelectedExamId(e.target.value)}
           >
             <option value="">-- Select an Exam --</option>
             {exams.map(exam => (
               <option key={exam.id} value={exam.id}>{exam.title}</option>
             ))}
           </select>
        </div>
      </div>

      {!selectedExamId ? (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
          <CardContent className="p-12 text-center text-slate-500">
            <Trophy className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-700">No Exam Selected</p>
            <p className="text-sm">Select an exam to view its leaderboard and your ranking.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {myPositionObj && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white border-0 shadow-md">
                 <CardContent className="p-6">
                    <p className="text-blue-100 font-medium text-sm uppercase tracking-wider mb-2">My Position</p>
                    <div className="flex items-end gap-2">
                       <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-blue-200">{myPositionObj.rank}</span>
                       <span className="text-blue-200 font-medium mb-1">/ {myPositionObj.total}</span>
                    </div>
                    <p className="text-xs text-blue-200 mt-2">Ranked by score, percentage, and completion time.</p>
                 </CardContent>
               </Card>
               <Card className="bg-white border border-slate-200 shadow-sm">
                 <CardContent className="p-6">
                    <p className="text-slate-500 font-medium text-sm uppercase tracking-wider mb-2">My Score</p>
                    <div className="flex items-end gap-2">
                       <span className="text-4xl font-bold text-slate-800">{myPositionObj.data.score}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2 font-mono">{myPositionObj.data.percentage}% • Grade: {myPositionObj.data.grade}</p>
                 </CardContent>
               </Card>
               <Card className="bg-emerald-50 border border-emerald-100 shadow-sm">
                 <CardContent className="p-6">
                    <p className="text-emerald-700 font-medium text-sm uppercase tracking-wider mb-2">Completion Time</p>
                    <div className="flex items-end gap-2 text-emerald-800">
                       <span className="text-4xl font-bold">
                         {myPositionObj.data.durationMs > 0 ? (myPositionObj.data.durationMs / 60000).toFixed(1) : '—'}
                       </span>
                       <span className="font-medium mb-1 shrink-0">min</span>
                    </div>
                    <p className="text-xs text-emerald-600 mt-2 font-mono">Date taken: {new Date(myPositionObj.data.date).toLocaleDateString()}</p>
                 </CardContent>
               </Card>
            </div>
          )}

          <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
               <h3 className="font-bold text-slate-800 text-lg">Top Performers / Leaderboard</h3>
               <p className="text-sm text-slate-500">Only showing candidates for {exams.find(e => e.id === selectedExamId)?.title}</p>
            </CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Rank</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Candidate</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">Score</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-center">Grade</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Time Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {examLeaderboard.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-500">
                        No candidates have completed this exam yet.
                      </td>
                    </tr>
                  )}
                  {examLeaderboard.slice(0, 50).map((student, idx) => {
                    const isMe = user?.id === student.candidateId;
                    return (
                      <tr
                        key={student.id}
                        className={`transition-colors ${isMe ? 'bg-blue-50/50 ring-1 ring-inset ring-blue-100' : 'hover:bg-slate-50/50'}`}
                      >
                        <td className="px-6 py-4">
                          {idx === 0 ? (
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 font-bold">1</div>
                          ) : idx === 1 ? (
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-600 font-bold">2</div>
                          ) : idx === 2 ? (
                            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold">3</div>
                          ) : (
                            <div className={`flex items-center justify-center w-8 h-8 font-bold ${isMe ? 'text-blue-700' : 'text-slate-500'}`}>
                              {idx + 1}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={
                                student.photoUrl ||
                                `https://api.dicebear.com/7.x/initials/svg?seed=${student.candidateName}`
                              }
                              alt={student.candidateName}
                              className="w-10 h-10 rounded-full border border-slate-200 shadow-sm object-cover shrink-0"
                            />
                            <div>
                              <p className={`font-bold leading-tight ${isMe ? 'text-blue-800' : 'text-slate-800'}`}>
                                {student.candidateName} {isMe && <span className="text-[10px] ml-1 bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">You</span>}
                              </p>
                              <p className="text-xs text-slate-500 font-mono tracking-wide">{student.serialNumber}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-center">
                          <div className={`font-bold text-lg ${isMe ? 'text-blue-700' : 'text-slate-800'}`}>{student.score}</div>
                          <div className="text-xs font-mono text-slate-500">{student.percentage}%</div>
                        </td>
                        <td className="px-6 py-3 text-center">
                           <div className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${student.percentage >= 50 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                              {student.grade}
                           </div>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <span className={`text-sm font-mono ${isMe ? 'text-blue-600' : 'text-slate-500'}`}>
                            {student.durationMs > 0 ? (student.durationMs / 60000).toFixed(1) + ' min' : '—'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

const CandidateReports = () => {
  const { user } = useAuth();
  const allResults = useStore((state) => state.results || []);
  const exams = useStore((state) => state.exams || []);
  const myResults = allResults.filter(r => r.candidateId === user?.id);

  const availableQuizzes = exams.filter(e => e.status === 'active').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold">Candidate Reports</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-0 ring-1 ring-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Registration & Payment</h3>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100 text-sm">
            <div className="p-4 flex justify-between">
              <span className="font-medium text-slate-500">Registration Status</span>
              <span className="font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase">Complete</span>
            </div>
            <div className="p-4 flex justify-between">
              <span className="font-medium text-slate-500">Payment Status</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">
                {user?.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
              </span>
            </div>
            <div className="p-4 flex justify-between">
              <span className="font-medium text-slate-500">Amount</span>
              <span className="font-bold text-slate-800">₦{user?.amountPaid || 1000}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-0 ring-1 ring-slate-200">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Quiz Statistics</h3>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100 text-sm">
            <div className="p-4 flex justify-between">
              <span className="font-medium text-slate-500">Active Quizzes Available</span>
              <span className="font-bold text-slate-800">{availableQuizzes}</span>
            </div>
            <div className="p-4 flex justify-between">
              <span className="font-medium text-slate-500">Quizzes Completed</span>
              <span className="font-bold text-slate-800">{myResults.length}</span>
            </div>
            <div className="p-4 flex justify-between">
              <span className="font-medium text-slate-500">Total Cumulative Score</span>
              <span className="font-bold text-blue-600">{myResults.reduce((a, c) => a + c.score, 0)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const CandidateProfile = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-500">
      <h2 className="text-2xl font-bold">My Profile</h2>
      <Card className="shadow-sm border-0 ring-1 ring-slate-200 bg-white">
        <CardContent className="p-8">
           <div className="flex flex-col md:flex-row gap-8 items-start">
              <img src={user?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`} className="w-32 h-32 rounded-full border-4 border-slate-100 object-cover shadow-sm bg-white" alt="Profile" />
              <div className="flex-1 space-y-4 w-full">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Full Name</p>
                      <p className="font-medium text-slate-900">{user?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Candidate ID</p>
                      <p className="font-mono text-blue-700 font-bold">{user?.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Email</p>
                      <p className="font-medium text-slate-900">{user?.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Phone</p>
                      <p className="font-medium text-slate-900">{user?.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500">School Name</p>
                      <p className="font-medium text-slate-900">{user?.schoolName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Competition Category</p>
                      <p className="font-bold text-slate-900 uppercase">{user?.competitionCategory || 'General'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-500">Payment Status</p>
                      <p className={`font-bold capitalize ${user?.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}`}>
                        {user?.paymentStatus || 'Pending'}
                      </p>
                    </div>
                 </div>
              </div>
           </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default function CandidateDashboard() {
  const navigation = [
    { name: "Dashboard", href: "/candidate", icon: Home },
    { name: "My Profile", href: "/candidate/profile", icon: BookOpen },
    { name: "Reports", href: "/candidate/reports", icon: BarChart2 },
    { name: "Available Quizzes", href: "/candidate/exams", icon: PlayCircle },
    { name: "Results", href: "/candidate/results", icon: FileText },
    { name: "Leaderboard", href: "/candidate/leaderboard", icon: Trophy },
  ];

  return (
    <DashboardLayout navigation={navigation}>
      <Routes>
        <Route path="/" element={<CandidateHome />} />
        <Route path="/profile" element={<CandidateProfile />} />
        <Route path="/exams" element={<CandidateExams />} />
        <Route path="/results" element={<CandidateResults />} />
        <Route path="/leaderboard" element={<CandidateLeaderboard />} />
        <Route path="/reports" element={<CandidateReports />} />
        <Route path="*" element={<Navigate to="/candidate" replace />} />
      </Routes>
    </DashboardLayout>
  );
}
