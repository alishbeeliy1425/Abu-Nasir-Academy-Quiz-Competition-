import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Download, Printer, Filter, Users, TrendingUp, BarChart3, Award } from 'lucide-react';
import { db } from '../../../lib/store';
import { Result, User, Exam } from '../../../types';

export default function SessionReport() {
  const [results, setResults] = useState<Result[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessionFilter, setSessionFilter] = useState('2025/2026');

  useEffect(() => {
    const loadData = () => {
      setResults(db.getResults());
      setUsers(db.get().users.filter(u => u.role === 'candidate'));
      setExams(db.getExams());
    };
    loadData();
    return db.subscribe(loadData);
  }, []);

  const totalCandidates = users.length;
  const examsTaken = results.length;
  const passed = results.filter(r => (r.percentage || 0) >= 50).length;
  const failed = examsTaken - passed;
  const avgScore = examsTaken > 0 ? Math.round(results.reduce((a, b) => a + (b.percentage || 0), 0) / examsTaken) : 0;
  
  const passRate = examsTaken > 0 ? Math.round((passed / examsTaken) * 100) : 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Session Report Analytics</h2>
          <p className="text-sm text-slate-500 mt-1">Overall performance statistics for the academic session.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2"/> Print Report
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </Button>
        </div>
      </div>

      <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100 no-print">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Academic Session</label>
          <select 
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="2025/2026">2025/2026</option>
            <option value="2024/2025">2024/2025</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Term</label>
          <select className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Terms</option>
            <option>First Term</option>
            <option>Second Term</option>
            <option>Third Term</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" id="printable-session">
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center"><Users className="w-6 h-6"/></div>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Candidates</h3>
            <p className="text-3xl font-extrabold mt-1 text-slate-800">{totalCandidates}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><BarChart3 className="w-6 h-6"/></div>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Total Exams Taken</h3>
            <p className="text-3xl font-extrabold mt-1 text-slate-800">{examsTaken}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center"><TrendingUp className="w-6 h-6"/></div>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Overall Pass Rate</h3>
            <p className="text-3xl font-extrabold mt-1 text-slate-800">{passRate}%</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center"><Award className="w-6 h-6"/></div>
            </div>
            <h3 className="text-slate-500 text-sm font-semibold uppercase tracking-wider">Average Score</h3>
            <p className="text-3xl font-extrabold mt-1 text-slate-800">{avgScore}%</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
           <h3 className="font-bold text-slate-800">Subject Performance Breakdown</h3>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Subject</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Total Candidates</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Pass Rate</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Average Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {exams.map(exam => {
                 const examResults = results.filter(r => r.examId === exam.id);
                 if (examResults.length === 0) return null;
                 
                 const ePassed = examResults.filter(r => (r.percentage || 0) >= 50).length;
                 const ePassRate = Math.round((ePassed / examResults.length) * 100);
                 const eAvgScore = Math.round(examResults.reduce((a, b) => a + (b.percentage || 0), 0) / examResults.length);
                 
                 return (
                   <tr key={exam.id} className="hover:bg-slate-50/50">
                     <td className="p-4 font-medium text-slate-800">{exam.title}</td>
                     <td className="p-4 text-slate-600">{examResults.length}</td>
                     <td className="p-4">
                       <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ePassRate >= 50 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                         {ePassRate}%
                       </span>
                     </td>
                     <td className="p-4 font-mono font-bold text-blue-600">{eAvgScore}%</td>
                   </tr>
                 );
               })}
               {exams.length === 0 && (
                 <tr>
                   <td colSpan={4} className="p-8 text-center text-slate-500">No exam data available.</td>
                 </tr>
               )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
