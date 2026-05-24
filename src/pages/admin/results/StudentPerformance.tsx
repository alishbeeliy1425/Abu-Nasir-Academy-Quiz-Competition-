import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Search, Printer, Download, Eye, ArrowLeft, ArrowUpRight, ArrowDownRight, Award } from 'lucide-react';
import { db, useStore } from '../../../lib/store';
import { User, Result } from '../../../types';

export default function StudentPerformance() {
  const allUsers = useStore(state => state.users || []);
  const users = useMemo(() => allUsers.filter(u => u.role === 'candidate'), [allUsers]);
  const results = useStore(state => state.results || []);
  const [search, setSearch] = useState('');

  const getStudentAnalytics = (userId: string) => {
    const studentResults = results.filter(r => r.candidateId === userId);
    const examsTaken = studentResults.length;
    const scores = studentResults.map(r => r.percentage || 0);
    const avgScore = examsTaken > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / examsTaken) : 0;
    return { examsTaken, avgScore, isTop: avgScore >= 75, isRisk: avgScore < 50 };
  };

  const studentStats = users.map(u => ({ ...u, ...getStudentAnalytics(u.id) })).filter(s => s.examsTaken > 0);
  
  const sortedStudents = [...studentStats].sort((a, b) => b.avgScore - a.avgScore);
  const filteredStudents = sortedStudents.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase()) || 
    (s.serialNumber && s.serialNumber.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Student Performance Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">Track top performers, at-risk candidates, and rankings.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white">
            <Download className="w-4 h-4 mr-2" /> Export Analytics
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <Card className="lg:col-span-2 border-0 shadow-sm ring-1 ring-slate-200 bg-white">
           <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex flex-row items-center justify-between">
             <h3 className="font-bold text-slate-800">Candidate Leaderboard (Ranked)</h3>
             <div className="relative w-48">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
               <input 
                 type="text" 
                 placeholder="Search name..." 
                 value={search}
                 onChange={e => setSearch(e.target.value)}
                 className="w-full pl-9 pr-4 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
               />
             </div>
           </CardHeader>
           <CardContent className="p-0">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b border-slate-100 bg-slate-50/50">
                     <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Rank</th>
                     <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Candidate</th>
                     <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase text-center">Exams</th>
                     <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase text-right">Avg Score</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {filteredStudents.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-slate-500">No students with results found.</td></tr>
                   ) : (
                     filteredStudents.map((student, idx) => (
                       <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                         <td className="p-4">
                           {idx < 3 ? (
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shadow-sm ${idx === 0 ? 'bg-amber-500' : idx === 1 ? 'bg-slate-400' : 'bg-orange-400'}`}>
                               {idx + 1}
                             </div>
                           ) : (
                             <span className="font-bold text-slate-400 w-8 inline-block text-center">{idx + 1}</span>
                           )}
                         </td>
                         <td className="p-4">
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden shadow-sm shrink-0">
                                <img src={student.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${student.name}`} alt="Avatar" className="w-full h-full object-cover" />
                             </div>
                             <div>
                               <p className="font-bold text-slate-800 leading-tight">{student.name}</p>
                               <p className="text-xs text-slate-500 font-mono tracking-wide">{student.serialNumber || student.id.split('_')[1]}</p>
                             </div>
                           </div>
                         </td>
                         <td className="p-4 text-center text-slate-600 font-medium">{student.examsTaken}</td>
                         <td className="p-4 text-right">
                           <span className={`font-mono font-bold text-lg ${student.isTop ? 'text-green-600' : student.isRisk ? 'text-red-600' : 'text-blue-600'}`}>
                             {student.avgScore}%
                           </span>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
           </CardContent>
         </Card>

         <div className="space-y-6">
           <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden">
             <div className="p-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm"><ArrowUpRight className="w-6 h-6 text-white" /></div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">Top Performers</h3>
                  <p className="text-green-50 text-xs">Averaging 75% or higher</p>
                </div>
             </div>
             <CardContent className="p-0">
               <div className="divide-y divide-slate-100">
                 {sortedStudents.filter(s => s.isTop).slice(0, 5).map(s => (
                   <div key={s.id} className="p-4 flex items-center justify-between">
                     <p className="font-semibold text-slate-700 text-sm">{s.name}</p>
                     <span className="font-bold text-green-600 text-sm font-mono">{s.avgScore}%</span>
                   </div>
                 ))}
                 {sortedStudents.filter(s => s.isTop).length === 0 && (
                   <div className="p-4 text-sm text-slate-500 text-center">No top performers yet.</div>
                 )}
               </div>
             </CardContent>
           </Card>

           <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white overflow-hidden">
             <div className="p-5 bg-gradient-to-r from-red-500 to-rose-600 text-white flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm"><ArrowDownRight className="w-6 h-6 text-white" /></div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">At-Risk Candidates</h3>
                  <p className="text-red-50 text-xs">Averaging below 50%</p>
                </div>
             </div>
             <CardContent className="p-0">
               <div className="divide-y divide-slate-100">
                 {sortedStudents.filter(s => s.isRisk).slice(0, 5).map(s => (
                   <div key={s.id} className="p-4 flex items-center justify-between">
                     <p className="font-semibold text-slate-700 text-sm">{s.name}</p>
                     <span className="font-bold text-red-600 text-sm font-mono">{s.avgScore}%</span>
                   </div>
                 ))}
                 {sortedStudents.filter(s => s.isRisk).length === 0 && (
                   <div className="p-4 text-sm text-slate-500 text-center">No at-risk candidates.</div>
                 )}
               </div>
             </CardContent>
           </Card>
         </div>
      </div>
    </div>
  );
}
