import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Printer, Download, Filter, Search, FileText } from 'lucide-react';
import { db } from '../../lib/store';
import { Result, User, Exam } from '../../types';

export default function AdminResults() {
  const [results, setResults] = useState<Result[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');

  useEffect(() => {
    const loadData = () => {
      setResults(db.getResults());
      setUsers(db.get().users);
      setExams(db.getExams());
    };
    loadData();
    return db.subscribe(loadData);
  }, []);

  const handlePrint = (res: Result, user: User, examTitle: string) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>CBT Result Slip - ${user?.name}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; background: white; line-height: 1.5; }
            .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
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
            <button onclick="window.print()" style="padding: 12px 24px; background: #2563eb; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 14px;">Print Result Slip</button>
          </div>
          
          <div class="header">
            <h1>Abu Nasir Academy</h1>
            <p class="title">Official Candidate Result Slip</p>
          </div>
          
          <div class="profile-section">
            <img class="profile-img" src="${user?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`}" alt="Candidate Photo" />
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
                  <td>${examTitle}</td>
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
             <p>Generated dynamically by Abu Nasir Academy CBT Platform on ${new Date().toLocaleString()}</p>
             <p>This is a computer generated document and does not require a physical signature.</p>
          </div>
        </body>
      </html>
    `;
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const getFilteredResults = () => {
    return results.filter(res => {
      const user = users.find(u => u.id === res.candidateId);
      const exam = exams.find(e => e.id === res.examId);
      const matchesSearch = user && (
        user.name.toLowerCase().includes(search.toLowerCase()) || 
        (user.serialNumber && user.serialNumber.toLowerCase().includes(search.toLowerCase()))
      );
      const matchesSubject = subjectFilter === '' || (exam && exam.subjects.includes(subjectFilter));
      
      return matchesSearch && matchesSubject;
    }).sort((a, b) => b.score - a.score);
  };

  const filteredResults = getFilteredResults();
  
  // Analytics
  const totalSubmissions = filteredResults.length;
  const passedCount = filteredResults.filter(r => r.percentage >= 50).length;
  const passRate = totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0;
  const highestScore = filteredResults.length > 0 ? filteredResults[0].score : 0;
  
  // Get all unique subjects for filter dropdown
  const allSubjects = Array.from(new Set(exams.flatMap(e => e.subjects)));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Result Ranking Dashboard</h2>
          <p className="text-sm text-slate-500 mt-1">Global leaderboard and performance analytics.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white"><Download className="w-4 h-4 mr-2"/> Export CSV Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white border-0 shadow-lg">
          <CardContent className="p-6">
            <h3 className="text-indigo-200 font-semibold mb-2">Total Participants</h3>
            <p className="text-4xl font-black">{totalSubmissions}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-sm ring-1 ring-slate-200">
          <CardContent className="p-6">
            <h3 className="text-slate-500 font-semibold mb-2">Overall Pass Rate</h3>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-black text-slate-800">{passRate}%</p>
              <p className="text-sm text-green-600 font-medium mb-1">{passedCount} Passed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-0 shadow-sm ring-1 ring-slate-200">
          <CardContent className="p-6">
            <h3 className="text-slate-500 font-semibold mb-2">Highest Score</h3>
            <p className="text-4xl font-black text-blue-600">{highestScore}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center bg-slate-50/50">
           <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by candidate name..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>
          <div className="w-full sm:w-48">
            <select 
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            >
              <option value="">All Subjects</option>
              {allSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase text-center">Rank</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Candidate</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Exam & Subject</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Score</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Grade %</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Status</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-slate-500">No results found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredResults.map((res, index) => {
                  const user = users.find(u => u.id === res.candidateId);
                  const exam = exams.find(e => e.id === res.examId);
                  const examTitle = exam?.title || res.examId;
                  const isWinner = index === 0 && search === '' && subjectFilter === '';
                  const status = (res.percentage || 0) >= 50 ? 'Pass' : 'Fail';
                  
                  return (
                    <tr key={res.id} className={`${isWinner ? 'bg-yellow-50/30' : 'hover:bg-slate-50/50'} transition-colors`}>
                      <td className="p-4 text-center font-bold text-slate-400">
                        {isWinner ? (
                          <div className="w-8 h-8 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center mx-auto ring-2 ring-yellow-200">
                            1
                          </div>
                        ) : (
                          `${index + 1}`
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border overflow-hidden shadow-sm ${isWinner ? 'border-yellow-400 ring-2 ring-yellow-100' : 'bg-blue-100 border-slate-200'}`}>
                            <img src={user?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'Unknown'}&backgroundColor=eff6ff`} alt="Avatar" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 leading-tight">
                              {user?.name || 'Unknown Candidate'}
                              {isWinner && <span className="ml-2 text-[10px] bg-yellow-100 text-yellow-800 uppercase px-1.5 py-0.5 rounded font-bold tracking-widest border border-yellow-200">Top</span>}
                            </p>
                            <p className="text-xs text-blue-600 font-mono font-medium tracking-wide">{user?.serialNumber || 'N/A'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-800 font-medium">{examTitle}</p>
                        <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[150px]">{exam?.subjects.join(', ')}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-mono font-bold text-blue-600 text-lg leading-tight">{res.score}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-700">{res.percentage}%</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{res.grade}</p>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-bold uppercase tracking-wider rounded ${status === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                           {status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 bg-white border-slate-200 hover:bg-slate-50 text-slate-700" 
                          onClick={() => {
                            if (user) handlePrint(res, user, examTitle);
                          }}
                        >
                          <Printer className="w-4 h-4 mr-1.5" /> Print
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
    </div>
  );
}

