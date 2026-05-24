import React, { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Search, Calendar as CalendarIcon, CheckCircle2, XCircle, AlertCircle, Edit, Trash2, Filter } from 'lucide-react';
import { db, useStore } from '../../../lib/store';
import { User, AttendanceRecord, Exam } from '../../../types';

export default function AdminViewAttendance() {
  const users = useStore(state => state.users || []);
  const exams = useStore(state => state.exams || []);
  const attendance = useStore(state => state.attendance || []);
  
  const [dateFilter, setDateFilter] = useState('');
  const [contextFilter, setContextFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this attendance record?')) {
      db.deleteAttendance(id);
    }
  };

  const handleEditStatus = (record: AttendanceRecord) => {
    const newStatus = prompt(`Enter new status for ${record.candidateId} (present/absent/late):`, record.status);
    if (newStatus === 'present' || newStatus === 'absent' || newStatus === 'late') {
        record.status = newStatus;
        db.saveAttendance(record);
    } else if (newStatus !== null) {
        alert('Invalid status. Please enter present, absent, or late.');
    }
  };

  const filteredAttendance = attendance
    .filter(a => (dateFilter ? a.date === dateFilter : true))
    .filter(a => (contextFilter ? a.subjectOrExamId === contextFilter : true))
    .filter(a => (statusFilter ? a.status === statusFilter : true))
    .filter(a => {
      if (!search) return true;
      const user = users.find(u => u.id === a.candidateId);
      if (!user) return false;
      return user.name.toLowerCase().includes(search.toLowerCase()) || user.id.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Attendance Log</h2>
          <p className="text-sm text-slate-500 mt-1">View, search, and manage candidate attendance records.</p>
        </div>
      </div>

      <Card className="shadow-sm border-0 ring-1 ring-slate-200 bg-white">
        <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search candidate name or ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <CalendarIcon className="w-4 h-4 text-slate-400" />
             <input 
               type="date"
               className="flex-1 sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               value={dateFilter}
               onChange={e => setDateFilter(e.target.value)}
             />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <Filter className="w-4 h-4 text-slate-400" />
             <select 
               className="flex-1 sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               value={contextFilter}
               onChange={e => setContextFilter(e.target.value)}
             >
               <option value="">All Contexts</option>
               <option value="general">Daily General</option>
               {exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}
             </select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
             <Filter className="w-4 h-4 text-slate-400" />
             <select 
               className="flex-1 sm:w-auto px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
               value={statusFilter}
               onChange={e => setStatusFilter(e.target.value)}
             >
               <option value="">All Statuses</option>
               <option value="present">Present</option>
               <option value="absent">Absent</option>
               <option value="late">Late</option>
             </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100">
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Timestamp & Date</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Candidate</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Context</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Status</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">No attendance records match your filter criteria.</td>
                </tr>
              ) : (
                filteredAttendance.map(record => {
                  const user = users.find(u => u.id === record.candidateId);
                  const exam = exams.find(e => e.id === record.subjectOrExamId);
                  
                  return (
                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <p className="text-sm font-semibold text-slate-800">{record.date}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{new Date(record.timestamp).toLocaleTimeString()}</p>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-800">{user?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{record.candidateId}</p>
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {record.subjectOrExamId === 'general' ? 'Daily Attendance' : (exam?.title || record.subjectOrExamId)}
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          record.status === 'present' ? 'bg-green-100 text-green-700' :
                          record.status === 'absent' ? 'bg-red-100 text-red-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {record.status === 'present' && <CheckCircle2 className="w-3 h-3" />}
                          {record.status === 'absent' && <XCircle className="w-3 h-3" />}
                          {record.status === 'late' && <AlertCircle className="w-3 h-3" />}
                          {record.status}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                         <div className="flex items-center justify-end gap-2">
                           <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" onClick={() => handleEditStatus(record)}>
                             <Edit className="w-4 h-4" />
                           </button>
                           <button className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" onClick={() => handleDelete(record.id)}>
                             <Trash2 className="w-4 h-4" />
                           </button>
                         </div>
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
