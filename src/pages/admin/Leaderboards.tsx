import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Download, Printer, Search, Award, Medal, CheckCircle2 } from 'lucide-react';
import { useStore } from '../../lib/store';
import { formatTime } from '../../lib/utils';

export default function AdminLeaderboards() {
  const exams = useStore(state => state.exams || []);
  const allUsers = useStore(state => state.users || []);
  const results = useStore(state => state.results || []);
  const sessions = useStore(state => state.sessions || []);

  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'top10' | 'top20' | 'full'>('full');
  const [search, setSearch] = useState('');

  const candidates = useMemo(() => allUsers.filter(u => u.role === 'candidate'), [allUsers]);

  const examLeaderboard = useMemo(() => {
    if (!selectedExamId) return [];

    // Only get results for the selected exam
    const examResults = results.filter(r => r.examId === selectedExamId);
    
    const enrichedResults = examResults.map(res => {
      const candidate = candidates.find(c => c.id === res.candidateId);
      const session = sessions.find(s => s.id === res.sessionId || (s.examId === selectedExamId && s.candidateId === res.candidateId && s.status === 'completed'));
      
      let durationMs = 0;
      if (session && session.startTime && session.endTime) {
         durationMs = new Date(session.endTime).getTime() - new Date(session.startTime).getTime();
      }

      return {
        ...res,
        candidateName: candidate?.name || 'Unknown',
        serialNumber: candidate?.serialNumber || candidate?.id.split('_')[1] || 'N/A',
        photoUrl: candidate?.photoUrl,
        durationMs
      };
    });

    // 1. Highest Score
    // 2. Highest Percentage
    // 3. Fastest Completion Time (if scores are equal)
    return enrichedResults.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const bPct = b.percentage || 0;
      const aPct = a.percentage || 0;
      if (bPct !== aPct) return bPct - aPct;
      if (a.durationMs > 0 && b.durationMs > 0) return a.durationMs - b.durationMs;
      return 0; // fallback
    });
  }, [results, sessions, selectedExamId, candidates]);

  const filteredLeaderboard = useMemo(() => {
    let temp = examLeaderboard;
    if (search) {
      temp = temp.filter(r => 
        r.candidateName.toLowerCase().includes(search.toLowerCase()) || 
        r.serialNumber.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (activeTab === 'top10') return temp.slice(0, 10);
    if (activeTab === 'top20') return temp.slice(0, 20);
    return temp;
  }, [examLeaderboard, search, activeTab]);

  // Analytics
  const analytics = useMemo(() => {
    if (examLeaderboard.length === 0) return null;
    const scores = examLeaderboard.map(r => r.score);
    const percentages = examLeaderboard.map(r => r.percentage || 0);
    return {
      totalCandidates: examLeaderboard.length,
      highestScore: Math.max(...scores),
      lowestScore: Math.min(...scores),
      averageScore: Math.round(percentages.reduce((a, b) => a + b, 0) / examLeaderboard.length),
      passRate: Math.round((examLeaderboard.filter(r => (r.percentage || 0) >= 50).length / examLeaderboard.length) * 100)
    };
  }, [examLeaderboard]);

  const handlePrint = () => {
    window.print();
  };

  const handleExport = () => {
    if (examLeaderboard.length === 0) return;
    
    let csvContent = "Rank,Candidate Name,Serial Number,Score,Percentage,Grade,Date Taken\n";
    examLeaderboard.forEach((r, idx) => {
       csvContent += `${idx + 1},"${r.candidateName}","${r.serialNumber}",${r.score},${r.percentage}%,${r.grade},${new Date(r.date).toLocaleDateString()}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const examName = exams.find(e => e.id === selectedExamId)?.title || 'leaderboard';
    link.setAttribute('download', `${examName.replace(/\\s+/g, '_')}_leaderboard.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Award className="w-6 h-6 text-blue-600" /> Leaderboards Management</h2>
          <p className="text-sm text-slate-500 mt-1">View independent, real-time rankings separated by exam.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white" onClick={handleExport} disabled={examLeaderboard.length === 0}>
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handlePrint} disabled={examLeaderboard.length === 0}>
            <Printer className="w-4 h-4 mr-2" /> Print Leaderboard
          </Button>
        </div>
      </div>

      <div className="w-full sm:w-80 no-print">
        <label className="block text-sm font-medium text-slate-700 mb-1">Filter by Exam</label>
        <select 
          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={selectedExamId}
          onChange={(e) => setSelectedExamId(e.target.value)}
        >
          <option value="">-- Select an Exam --</option>
          {exams.map(exam => (
            <option key={exam.id} value={exam.id}>{exam.title}</option>
          ))}
        </select>
      </div>

      {selectedExamId && analytics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
             <CardContent className="p-4 text-center">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-1">Total Candidates</p>
                <p className="text-2xl font-bold text-slate-800">{analytics.totalCandidates}</p>
             </CardContent>
          </Card>
          <Card className="border-0 shadow-sm ring-1 ring-emerald-200 bg-emerald-50">
             <CardContent className="p-4 text-center">
                <p className="text-xs text-emerald-600 font-medium uppercase tracking-wider mb-1">Highest Score</p>
                <p className="text-2xl font-bold text-emerald-700">{analytics.highestScore}</p>
             </CardContent>
          </Card>
          <Card className="border-0 shadow-sm ring-1 ring-rose-200 bg-rose-50">
             <CardContent className="p-4 text-center">
                <p className="text-xs text-rose-600 font-medium uppercase tracking-wider mb-1">Lowest Score</p>
                <p className="text-2xl font-bold text-rose-700">{analytics.lowestScore}</p>
             </CardContent>
          </Card>
          <Card className="border-0 shadow-sm ring-1 ring-blue-200 bg-blue-50">
             <CardContent className="p-4 text-center">
                <p className="text-xs text-blue-600 font-medium uppercase tracking-wider mb-1">Average Passing</p>
                <p className="text-2xl font-bold text-blue-700">{analytics.averageScore}%</p>
             </CardContent>
          </Card>
          <Card className="border-0 shadow-sm ring-1 ring-indigo-200 bg-indigo-50">
             <CardContent className="p-4 text-center">
                <p className="text-xs text-indigo-600 font-medium uppercase tracking-wider mb-1">Pass Rate</p>
                <p className="text-2xl font-bold text-indigo-700">{analytics.passRate}%</p>
             </CardContent>
          </Card>
        </div>
      )}

      {!selectedExamId ? (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white no-print">
          <CardContent className="p-12 text-center text-slate-500">
            <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-lg font-medium text-slate-700">No Exam Selected</p>
            <p className="text-sm">Please select an exam from the dropdown menu to view its standalone leaderboard.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white leaderboard-print-section">
          <div className="hidden print:block text-center pt-8 pb-4 border-b border-slate-200 mb-6 px-4">
             <h1 className="text-2xl font-bold text-slate-800 uppercase tracking-widest">{exams.find(e => e.id === selectedExamId)?.title}</h1>
             <p className="text-slate-500 mt-2 font-medium">OFFICIAL CANDIDATE LEADERBOARD</p>
             <p className="text-xs text-slate-400 mt-1">Generated: {new Date().toLocaleString()}</p>
          </div>

          <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 no-print">
            <div className="flex bg-slate-200 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('top10')} 
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'top10' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Top 10
              </button>
              <button 
                onClick={() => setActiveTab('top20')} 
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'top20' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Top 20
              </button>
              <button 
                onClick={() => setActiveTab('full')} 
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${activeTab === 'full' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}
              >
                Full Ranking List
              </button>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search leaderboard..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50 print:bg-slate-100">
                    <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Rank</th>
                    <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Candidate</th>
                    <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase text-center">Score</th>
                    <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase text-center">Grade</th>
                    <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase text-center hidden md:table-cell">Time</th>
                    <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase text-right hidden lg:table-cell">Date Taken</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLeaderboard.length === 0 ? (
                    <tr>
                       <td colSpan={6} className="p-8 text-center text-slate-500">
                          {search ? "No candidates found matching your search." : "No results recorded for this exam yet."}
                       </td>
                    </tr>
                  ) : (
                    filteredLeaderboard.map((res: any, idx) => {
                      // Correct original ranking ignoring search filter index to maintain objective rank
                      const absoluteRank = examLeaderboard.findIndex(r => r.id === res.id) + 1;
                      return (
                        <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                             {absoluteRank === 1 ? (
                               <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-600 print:bg-transparent print:text-black font-bold">
                                 1<Medal className="w-4 h-4 ml-0.5 print:hidden" />
                               </div>
                             ) : absoluteRank === 2 ? (
                               <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-200 text-slate-600 print:bg-transparent print:text-black font-bold">
                                 2
                               </div>
                             ) : absoluteRank === 3 ? (
                               <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-700 print:bg-transparent print:text-black font-bold">
                                 3
                               </div>
                             ) : (
                               <div className="flex items-center justify-center w-8 h-8 text-slate-500 font-bold">
                                 {absoluteRank}
                               </div>
                             )}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden shadow-sm shrink-0">
                                 <img src={res.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${res.candidateName}`} alt={res.candidateName} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-800 leading-tight">{res.candidateName}</p>
                                <p className="text-xs text-slate-500 font-mono tracking-wide">{res.serialNumber}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-center">
                             <div className="font-bold text-slate-800 text-lg">{res.score}</div>
                             <div className="text-xs text-slate-500 font-mono">{res.percentage}%</div>
                          </td>
                          <td className="p-4 text-center">
                             <div className={`inline-flex px-2 py-1 rounded-full text-xs font-bold border print:border-0 ${res.percentage >= 50 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                {res.grade}
                             </div>
                          </td>
                          <td className="p-4 text-center hidden md:table-cell text-slate-600 font-mono text-sm">
                             {res.durationMs > 0 ? (res.durationMs / 60000).toFixed(1) + ' min' : 'N/A'}
                          </td>
                          <td className="p-4 text-right hidden lg:table-cell text-slate-500 text-sm">
                             {new Date(res.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global Print Styles specifically for the leaderboard component */}
      <style>{`
        @media print {
          body { visibility: hidden; }
          .leaderboard-print-section, .leaderboard-print-section * { visibility: visible; }
          .leaderboard-print-section { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}
