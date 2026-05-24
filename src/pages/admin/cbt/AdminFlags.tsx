import React, { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { ShieldAlert, AlertTriangle, Video, Search } from 'lucide-react';
import { db, useStore } from '../../../lib/store';
import { Violation, User, Exam } from '../../../types';

export default function AdminFlags() {
  const violations = useStore(state => state.violations || []);
  const users = useStore(state => state.users || []);
  const exams = useStore(state => state.exams || []);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredViolations = violations.filter(v => {
    const user = users.find(u => u.id === v.candidateId);
    const searchableUser = user ? user.name.toLowerCase() : '';
    const searchableDesc = v.description ? v.description.toLowerCase() : '';
    const term = searchTerm.toLowerCase();
    
    return searchableUser.includes(term) || searchableDesc.includes(term) || v.type.toLowerCase().includes(term);
  }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldAlert className="text-red-500 w-7 h-7" /> Flagged Activities Center
          </h2>
          <p className="text-sm text-slate-500 mt-1">Live forensics and forensic traces of suppressed anti-cheating events.</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
           <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text" 
                placeholder="Search candidates or offenses..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
              />
           </div>
        </div>
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Candidate</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Exam Session</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Offense Detail</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Time Detect</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase text-right">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredViolations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-slate-500">
                    <ShieldAlert className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                    <p className="font-medium text-slate-600">No suspicious activity on record.</p>
                  </td>
                </tr>
              ) : (
                filteredViolations.map((v, idx) => {
                  const user = users.find(u => u.id === v.candidateId);
                  const exam = exams.find(e => e.id === v.examId);
                  
                  // Extract simple device string realistically
                  let device = "Desktop Browser";
                  if (v.type === 'blur') device = "Browser Tab Switch";
                  else if (v.type === 'visibility_hidden') device = "Background / Minimize";

                  return (
                    <tr key={v.id} className="hover:bg-red-50/20 transition-all animate-in fade-in slide-in-from-top-2">
                       <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded shadow-sm border border-slate-200 overflow-hidden shrink-0">
                              <img src={user?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'U'}&backgroundColor=f8fafc`} className="w-full h-full object-cover" alt="User" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 leading-tight">{user?.name || 'Unknown User'}</p>
                              <div className="flex items-center gap-1 mt-0.5">
                                <span className="text-[10px] text-slate-500 font-mono tracking-wide">{user?.email || 'N/A'}</span>
                                <span className="text-[10px] text-slate-300">•</span>
                                <span className="text-[10px] text-slate-500 font-mono tracking-wide">{user?.phone || 'N/A'}</span>
                              </div>
                            </div>
                          </div>
                       </td>
                       <td className="p-4">
                          <p className="text-sm text-slate-800 font-medium">{exam?.title || v.examId}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{device}</p>
                       </td>
                       <td className="p-4">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                            <div>
                               <p className="text-sm font-semibold text-slate-800">{v.type}</p>
                               <p className="text-xs text-slate-600 mt-0.5">{v.description}</p>
                            </div>
                          </div>
                       </td>
                       <td className="p-4">
                          <p className="text-sm font-mono text-slate-700">{new Date(v.timestamp).toLocaleTimeString()}</p>
                          <p className="text-[10px] text-slate-400">{new Date(v.timestamp).toLocaleDateString()}</p>
                       </td>
                       <td className="p-4 text-right">
                          <Button size="sm" variant="outline" className="text-xs text-slate-600 hover:text-indigo-600 h-8">
                             Log Only
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
