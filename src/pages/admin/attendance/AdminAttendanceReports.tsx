import React, { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { BarChart2, CheckCircle2, XCircle, AlertCircle, TrendingUp, Download } from 'lucide-react';
import { db, useStore } from '../../../lib/store';
import { AttendanceRecord, Exam } from '../../../types';
import { Button } from '../../../components/ui/button';

export default function AdminAttendanceReports() {
  const attendance = useStore(state => state.attendance || []);
  const [today, setToday] = useState(new Date().toISOString().split('T')[0]);

  const todayRecords = attendance.filter(a => a.date === today);
  const presentCount = todayRecords.filter(a => a.status === 'present').length;
  const absentCount = todayRecords.filter(a => a.status === 'absent').length;
  const lateCount = todayRecords.filter(a => a.status === 'late').length;
  const totalMarked = todayRecords.length;
  
  const attendanceRate = totalMarked > 0 ? Math.round(((presentCount + lateCount) / totalMarked) * 100) : 0;

  // Derive simple recent days for a chart stub
  const recentDays = [0, 1, 2, 3, 4].map(daysAgo => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  }).reverse();

  const handleClearDemoData = () => {
    if (confirm('Are you sure you want to completely wipe all attendance records? (This cannot be undone)')) {
      db.clearAllAttendance();
    }
  };

  const handleResetDemoData = () => {
    if (confirm('Are you sure you want to populate with demo attendance data?')) {
      // Just inject some demo data for today and past days
      const state = db.get();
      db.clearAllAttendance();
      
      const testCandidate = state.users.find(u => u.role === 'candidate') || { id: 'student_1' };
      const todayDate = new Date().toISOString().split('T')[0];
      
      db.saveAttendance({
        id: 'att_demo_1',
        candidateId: testCandidate.id,
        date: todayDate,
        status: 'present',
        subjectOrExamId: 'general',
        timestamp: new Date().toISOString()
      });
      db.saveAttendance({
        id: 'att_demo_2',
        candidateId: testCandidate.id,
        date: todayDate,
        status: 'late',
        subjectOrExamId: 'mock_1',
        timestamp: new Date().toISOString()
      });

      alert('Demo data restored.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Attendance Reports</h2>
          <p className="text-sm text-slate-500 mt-1">Daily analytics and attendance rates.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="date" 
            value={today}
            onChange={e => setToday(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Button variant="outline"><Download className="w-4 h-4 mr-2" /> Export CSV</Button>
          <Button variant="outline" className="text-slate-600 bg-white" onClick={handleResetDemoData}>Reset Demo Data</Button>
          <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleClearDemoData}>Clear Attendance Logs</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Present</p>
                  <p className="text-3xl font-bold text-slate-800">{presentCount}</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
               </div>
            </div>
            <p className="text-xs text-green-600 font-medium tracking-tight mt-4 flex items-center">
              Today's records
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Absent</p>
                  <p className="text-3xl font-bold text-slate-800">{absentCount}</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                  <XCircle className="w-5 h-5" />
               </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">Needs attention</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Late Arrivals</p>
                  <p className="text-3xl font-bold text-slate-800">{lateCount}</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                  <AlertCircle className="w-5 h-5" />
               </div>
            </div>
            <p className="text-xs text-slate-500 mt-4">Tardiness tracked</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
               <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Attendance Rate</p>
                  <p className="text-3xl font-bold text-slate-800">{attendanceRate}%</p>
               </div>
               <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <TrendingUp className="w-5 h-5" />
               </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-4">
              <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${attendanceRate}%` }}></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-0 ring-1 ring-slate-200 bg-white p-6">
        <h3 className="font-bold text-slate-800 mb-6 flex items-center"><BarChart2 className="w-5 h-5 mr-2 text-slate-400" /> Recent Attendance Trends</h3>
        
        <div className="h-64 flex items-end gap-2 sm:gap-4 justify-between w-full">
           {recentDays.map(d => {
             const dayRecords = attendance.filter(a => a.date === d);
             const dayTotal = dayRecords.length;
             const pCount = dayRecords.filter(a => a.status === 'present' || a.status === 'late').length;
             const pct = dayTotal > 0 ? (pCount / dayTotal) * 100 : 0;
             const height = Math.max(pct, 5); // min height
             
             return (
               <div key={d} className="flex flex-col items-center flex-1">
                 <p className="text-xs font-bold text-slate-500 mb-2">{Math.round(pct)}%</p>
                 <div className="w-full max-w-[40px] sm:max-w-[80px] bg-blue-100 rounded-t-sm relative flex items-end h-[180px]">
                   <div className="bg-blue-600 w-full rounded-t-sm transition-all duration-500" style={{ height: `${height}%` }}></div>
                 </div>
                 <p className="text-[10px] text-slate-500 font-mono mt-2">{d.substring(5)}</p>
               </div>
             )
           })}
        </div>
      </Card>
    </div>
  );
}
