import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Search, Calendar as CalendarIcon, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { db } from '../../../lib/store';
import { User, AttendanceRecord, AttendanceStatus, Exam } from '../../../types';

export default function AdminMarkAttendance() {
  const [users, setUsers] = useState<User[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedExam, setSelectedExam] = useState<string>('general');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const loadState = () => {
      setUsers(db.get().users.filter(u => u.role === 'candidate'));
      setExams(db.getExams());
      setAttendance(db.getAttendance());
    };
    loadState();
    return db.subscribe(loadState);
  }, []);

  const getAttendanceStatus = (candidateId: string): AttendanceStatus | null => {
    const record = attendance.find(a => a.candidateId === candidateId && a.date === date && a.subjectOrExamId === selectedExam);
    return record ? record.status : null;
  };

  const markAttendance = (candidateId: string, status: AttendanceStatus) => {
    const existing = attendance.find(a => a.candidateId === candidateId && a.date === date && a.subjectOrExamId === selectedExam);
    
    const record: AttendanceRecord = {
      id: existing ? existing.id : `att_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      candidateId,
      date,
      status,
      subjectOrExamId: selectedExam,
      timestamp: new Date().toISOString()
    };
    
    db.saveAttendance(record);
  };

  const markAllRemaining = (status: AttendanceStatus) => {
    users.forEach(u => {
      const currentStatus = getAttendanceStatus(u.id);
      if (!currentStatus) {
        markAttendance(u.id, status);
      }
    });
  };

  const filteredUsers = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.id.toLowerCase().includes(search.toLowerCase()));

  const presentCount = attendance.filter(a => a.date === date && a.subjectOrExamId === selectedExam && a.status === 'present').length;
  const absentCount = attendance.filter(a => a.date === date && a.subjectOrExamId === selectedExam && a.status === 'absent').length;
  const lateCount = attendance.filter(a => a.date === date && a.subjectOrExamId === selectedExam && a.status === 'late').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Mark Attendance</h2>
          <p className="text-sm text-slate-500 mt-1">Record daily or exam-specific attendance for candidates.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select 
            value={selectedExam}
            onChange={(e) => setSelectedExam(e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="general">Daily General Attendance</option>
            {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
          </select>
          <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 focus-within:ring-2 focus-within:ring-blue-500">
            <CalendarIcon className="w-4 h-4 mr-2" />
            <input 
              type="date" 
              value={date} 
              onChange={e => setDate(e.target.value)}
              className="border-none focus:outline-none"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-slate-600">Present</h3>
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-slate-800">{presentCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-slate-600">Absent</h3>
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-3xl font-bold text-slate-800">{absentCount}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-slate-600">Late Arrivals</h3>
              <AlertCircle className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-3xl font-bold text-slate-800">{lateCount}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-0 ring-1 ring-slate-200 bg-white">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search students..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 text-sm w-full sm:w-auto">
            <Button variant="outline" className="h-9 flex-1 sm:flex-none border-green-200 text-green-700 hover:bg-green-50" onClick={() => markAllRemaining('present')}>
               Mark Remaining Present
            </Button>
            <Button variant="outline" className="h-9 flex-1 sm:flex-none border-red-200 text-red-700 hover:bg-red-50" onClick={() => markAllRemaining('absent')}>
               Mark Remaining Absent
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">Student</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase">ID</th>
                <th className="p-4 text-xs font-semibold text-slate-500 uppercase text-right">Action / Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((u) => {
                const status = getAttendanceStatus(u.id);
                return (
                  <tr key={u.id} className="hover:bg-slate-50/50">
                    <td className="p-4 font-medium text-slate-800">{u.name}</td>
                    <td className="p-4 text-sm text-slate-500">{u.id}</td>
                    <td className="p-4 text-right">
                      <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
                        <button 
                          onClick={() => markAttendance(u.id, 'present')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${status === 'present' ? 'bg-green-100 text-green-700 shadow-sm border-green-200 border' : 'bg-transparent text-slate-500 hover:text-green-600'}`}>
                          Present
                        </button>
                        <button 
                          onClick={() => markAttendance(u.id, 'absent')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${status === 'absent' ? 'bg-red-100 text-red-700 shadow-sm border-red-200 border' : 'bg-transparent text-slate-500 hover:text-red-600'}`}>
                          Absent
                        </button>
                        <button 
                          onClick={() => markAttendance(u.id, 'late')}
                          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${status === 'late' ? 'bg-orange-100 text-orange-700 shadow-sm border-orange-200 border' : 'bg-transparent text-slate-500 hover:text-orange-600'}`}>
                          Late
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">
                    No candidates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
