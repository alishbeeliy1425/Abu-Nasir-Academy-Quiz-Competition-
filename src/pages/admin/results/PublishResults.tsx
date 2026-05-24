import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Search, FileText, CheckCircle, XCircle, Share2, Download } from 'lucide-react';
import { db, useStore } from '../../../lib/store';
import { Result, User, Exam } from '../../../types';

export default function PublishResults() {
  const results = useStore(state => state.results || []);
  const users = useStore(state => state.users || []);
  const exams = useStore(state => state.exams || []);
  const [search, setSearch] = useState('');

  const [publishingId, setPublishingId] = useState<string | null>(null);

  const togglePublishResult = (resultId: string, currentStatus: boolean) => {
    setPublishingId(resultId);
    setTimeout(() => {
      const state = db.get();
      const res = state.results.find(r => r.id === resultId);
      if (res) {
        // Technically, our Result type might not have `isPublished`, but admin tools 
        // implies we can control it. Let's add it ad-hoc if not present.
        (res as any).isPublished = !currentStatus;
        db.saveResult(res);
      }
      setPublishingId(null);
    }, 400);
  };

  const publishAll = () => {
    const results = db.getResults();
    results.forEach(r => {
      (r as any).isPublished = true;
      db.saveResult(r);
    });
    setResults(db.getResults());
    alert('All results published.');
  };

  const unpublishAll = () => {
    const results = db.getResults();
    results.forEach(r => {
      (r as any).isPublished = false;
      db.saveResult(r);
    });
    setResults(db.getResults());
    alert('All results unpublished.');
  };

  const filteredResults = results.filter(res => {
    const user = users.find(u => u.id === res.candidateId);
    const exam = exams.find(e => e.id === res.examId);
    return user && (
      user.name.toLowerCase().includes(search.toLowerCase()) || 
      (user.serialNumber && user.serialNumber.toLowerCase().includes(search.toLowerCase())) ||
      (exam && exam.title.toLowerCase().includes(search.toLowerCase()))
    );
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Publishers Results Engine</h2>
          <p className="text-sm text-slate-500 mt-1">Control visibility of generated results for candidates.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={unpublishAll} className="bg-white border-amber-200 text-amber-700 hover:bg-amber-50">
             Hide All Results
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={publishAll}>
            <Share2 className="w-4 h-4 mr-2" /> Publish All Results
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
        <div className="p-4 border-b border-slate-100 flex items-center bg-slate-50/50">
           <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by candidate, serial number or exam..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm max-w-md"
            />
          </div>
        </div>
        
        <div className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Candidate</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Exam & Score</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Status</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase text-right">Visibility Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <FileText className="w-5 h-5 text-slate-400" />
                      </div>
                      <p className="text-slate-500">No results to publish</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredResults.map(res => {
                  const user = users.find(u => u.id === res.candidateId);
                  const exam = exams.find(e => e.id === res.examId);
                  const isPublished = (res as any).isPublished === true;
                  
                  return (
                    <tr key={res.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full shrink-0 border border-slate-200 overflow-hidden shadow-sm">
                            <img src={user?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`} alt="Avatar" className="w-full h-full object-cover" />
                         </div>
                         <div>
                            <p className="font-bold text-slate-800 leading-tight">{user?.name || 'Unknown Candidate'}</p>
                            <p className="text-xs text-slate-500">{user?.serialNumber || 'N/A'}</p>
                         </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm font-medium text-slate-800">{exam?.title || res.examId}</p>
                        <p className="text-xs font-mono font-bold text-blue-600 mt-1">{res.score} ({res.percentage}%)</p>
                      </td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isPublished ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                           {isPublished ? (
                             <><CheckCircle className="w-3.5 h-3.5" /> Published</>
                           ) : (
                             <><XCircle className="w-3.5 h-3.5" /> Hidden</>
                           )}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                          variant={isPublished ? "outline" : "primary"} 
                          size="sm" 
                          className={`h-8 font-semibold w-32 ${!isPublished ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50 border-slate-200'}`}
                          onClick={() => togglePublishResult(res.id, isPublished)}
                          disabled={publishingId === res.id}
                        >
                          {publishingId === res.id ? 'Updating...' : isPublished ? 'Unpublish' : 'Publish Result'}
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
