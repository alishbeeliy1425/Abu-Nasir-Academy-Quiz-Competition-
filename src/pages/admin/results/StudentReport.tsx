import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Search, FileText, Download, Printer, User as UserIcon, X, CheckCircle, XCircle } from 'lucide-react';
import { db, useStore } from '../../../lib/store';
import { Result, User, Exam } from '../../../types';

export default function StudentReport() {
  const allUsers = useStore(state => state.users || []);
  const users = useMemo(() => allUsers.filter(u => u.role === 'candidate'), [allUsers]);
  const results = useStore(state => state.results || []);
  const exams = useStore(state => state.exams || []);
  const [search, setSearch] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [viewingSlipId, setViewingSlipId] = useState<string | null>(null);
  const selectedUser = selectedUserId ? users.find(u => u.id === selectedUserId) || null : null;
  const viewingSlip = viewingSlipId ? results.find(r => r.id === viewingSlipId) || null : null;

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    (u.serialNumber && u.serialNumber.toLowerCase().includes(search.toLowerCase())) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrintReport = () => {
    const printContent = document.getElementById('printable-student');
    if (printContent) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      const pri = iframe.contentWindow;
      if (pri) {
        pri.document.open();
        pri.document.write('<html><head><title>Student Report</title>');
        // Try to stringify all styles
        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach(s => pri.document.write(s.outerHTML));
        pri.document.write('</head><body style="padding: 24px;">');
        pri.document.write(printContent.innerHTML);
        pri.document.write('</body></html>');
        pri.document.close();
        setTimeout(() => {
          pri.focus();
          pri.print();
          document.body.removeChild(iframe);
        }, 500);
      }
    } else {
      window.print();
    }
  };

  const handlePrintSlip = () => {
    const printContent = document.getElementById('printable-slip');
    if (printContent) {
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      document.body.appendChild(iframe);
      const pri = iframe.contentWindow;
      if (pri) {
        pri.document.open();
        pri.document.write('<html><head><title>Result Slip</title>');
        const styles = document.querySelectorAll('style, link[rel="stylesheet"]');
        styles.forEach(s => pri.document.write(s.outerHTML));
        pri.document.write('</head><body style="padding: 24px;">');
        pri.document.write(printContent.innerHTML);
        pri.document.write('</body></html>');
        pri.document.close();
        setTimeout(() => {
          pri.focus();
          pri.print();
          document.body.removeChild(iframe);
        }, 500);
      }
    } else {
      window.print();
    }
  };

  if (selectedUser) {
    const userResults = results.filter(r => r.candidateId === selectedUser.id).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate ranking based on average of latest exams
    const studentAverages = users.map(u => {
      const uRes = results.filter(r => r.candidateId === u.id);
      const avg = uRes.length > 0 ? uRes.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / uRes.length : 0;
      return { id: u.id, avg };
    }).sort((a, b) => b.avg - a.avg);
    
    const rankIndex = studentAverages.findIndex(s => s.id === selectedUser.id);
    const ranking = rankIndex !== -1 && studentAverages[rankIndex].avg > 0 ? `${rankIndex + 1} of ${users.length}` : 'N/A';

    return (
      <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
        <div className="flex justify-between items-center no-print">
          <Button variant="outline" onClick={() => setSelectedUserId(null)}>Back to Search</Button>
          <div className="flex gap-2">
            <Button variant="outline" className="text-blue-600 bg-white" onClick={handlePrintReport}><Printer className="w-4 h-4 mr-2"/> Print Full Report</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handlePrintReport}><Download className="w-4 h-4 mr-2"/> Export PDF</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="printable-student">
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-sm ring-1 ring-slate-200 sticky top-6">
               <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 print:bg-blue-600"></div>
               <CardContent className="px-6 pb-6 relative">
                 <div className="w-24 h-24 rounded-xl border-4 border-white bg-slate-100 shadow-md overflow-hidden absolute -top-12">
                   <img src={selectedUser.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.name}`} alt="Student" className="w-full h-full object-cover" />
                 </div>
                 <div className="pt-16">
                   <h2 className="text-2xl font-bold text-slate-800 leading-tight">{selectedUser.name}</h2>
                   <p className="text-blue-600 font-mono font-semibold tracking-wide text-sm mt-1">{selectedUser.serialNumber || 'Serial No: N/A'}</p>
                   
                   <div className="mt-6 space-y-3">
                     <div className="flex flex-col">
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email</span>
                       <span className="text-sm font-medium text-slate-700">{selectedUser.email}</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location / State</span>
                       <span className="text-sm font-medium text-slate-700">{selectedUser.state || 'N/A'}, {selectedUser.country || 'N/A'}</span>
                     </div>
                     <div className="flex flex-col">
                       <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Ranking</span>
                       <span className="text-sm font-bold text-amber-600">{ranking}</span>
                     </div>
                   </div>
                 </div>
               </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card className="border-0 shadow-sm ring-1 ring-slate-200 overflow-hidden bg-white">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center print:bg-white text-slate-800">
                 <h3 className="font-bold text-lg">Academic History & Results</h3>
              </div>
              <div className="p-0">
                {userResults.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                    <FileText className="w-8 h-8 text-slate-300 mb-2" />
                    <p>No examination records found for this candidate.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {userResults.map(res => {
                      const exam = exams.find(e => e.id === res.examId);
                      const isPass = (res.percentage || 0) >= 50;
                      return (
                        <div key={res.id} className="p-5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:bg-slate-50 transition-colors border-b last:border-0 border-slate-100">
                          <div>
                            <h4 className="font-bold text-slate-800 text-lg leading-tight">{exam?.title || res.examId}</h4>
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                               <span>{exam?.subjects?.join(', ') || 'N/A'}</span>
                               <span>•</span>
                               <span>{new Date(res.date).toLocaleDateString()}</span>
                            </p>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <p className={`font-mono font-bold text-2xl leading-none ${isPass ? 'text-green-600' : 'text-red-500'}`}>
                                {res.percentage}%
                              </p>
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                                Grade: {res.grade}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" className="bg-white no-print" onClick={() => setViewingSlipId(res.id)}>View Slip</Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>

        {/* View Slip Modal */}
        {viewingSlip && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm no-print">
            <Card className="w-full max-w-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Result Slip</h3>
                <Button variant="ghost" size="sm" onClick={() => setViewingSlipId(null)} className="h-9 w-9 p-0">
                  <X className="w-5 h-5 text-slate-500" />
                </Button>
              </div>
              <div className="p-6 overflow-y-auto max-h-[80vh]" id="printable-slip">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="text-center pb-6 border-b border-slate-100">
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Abu Nasir Academy</h2>
                    <p className="text-slate-500 font-medium">Candidate Result Slip</p>
                  </div>
                  
                  {/* Candidate Details */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Candidate Name</p>
                      <p className="font-bold text-slate-800">{selectedUser.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Serial Number</p>
                      <p className="font-mono font-bold text-slate-800">{selectedUser.serialNumber || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Examination</p>
                      <p className="font-bold text-slate-800">{exams.find(e => e.id === viewingSlip.examId)?.title}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Date Taken</p>
                      <p className="font-bold text-slate-800">{new Date(viewingSlip.date).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Score Board */}
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="w-32 h-32 rounded-full flex items-center justify-center border-8 border-slate-50 bg-white shadow-sm mb-4">
                       <span className={`text-4xl font-black font-mono ${viewingSlip.percentage >= 50 ? 'text-green-600' : 'text-red-500'}`}>
                         {viewingSlip.percentage}%
                       </span>
                    </div>
                    <div className="flex items-center gap-2">
                       {viewingSlip.percentage >= 50 ? (
                         <CheckCircle className="w-5 h-5 text-green-600" />
                       ) : (
                         <XCircle className="w-5 h-5 text-red-500" />
                       )}
                       <span className="font-bold text-slate-800 text-lg">
                         Grade: {viewingSlip.grade}
                       </span>
                    </div>
                    <p className="text-slate-500 text-sm mt-2 text-center max-w-md">
                      {viewingSlip.remarks}
                    </p>
                  </div>
                  
                  {/* Footer Stats */}
                  <div className="flex justify-between items-center pt-6 border-t border-slate-100 text-sm text-slate-500">
                    <span>Score: {viewingSlip.score} / {viewingSlip.total}</span>
                    <span>System Generated Result</span>
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
                <Button variant="outline" onClick={() => setViewingSlipId(null)}>Close</Button>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handlePrintSlip}>
                  <Printer className="w-4 h-4 mr-2" /> Print PDF
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Student Report Module</h2>
          <p className="text-sm text-slate-500 mt-1">Search and view comprehensive individual academic profiles.</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
           <div className="relative max-w-xl mx-auto">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search candidate by name, serial no, or email..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-lg"
            />
          </div>
        </div>
        
        <div className="p-0">
          <ul className="divide-y divide-slate-100">
            {filteredUsers.length === 0 ? (
              <li className="p-12 text-center text-slate-500">
                <UserIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>No candidates found matching your criteria.</p>
              </li>
            ) : (
              filteredUsers.slice(0, 50).map(u => (
                <li key={u.id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors" onClick={() => setSelectedUserId(u.id)}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-sm">
                      <img src={u.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}`} alt="Candidate" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{u.name}</p>
                      <p className="text-sm font-mono text-blue-600 mt-0.5">{u.serialNumber || u.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 font-semibold h-9 px-4">
                     View Complete Report
                  </Button>
                </li>
              ))
            )}
          </ul>
        </div>
      </Card>
    </div>
  );
}

