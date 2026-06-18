import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Download, UserPlus, Search, Edit, Trash2, MoreVertical, Eye, ArrowLeft, Printer, ShieldAlert, ShieldCheck, BarChart3, Clock, BookOpen, GraduationCap } from 'lucide-react';
import { db, useStore } from '../../lib/store';
import { User } from '../../types';
import { toast } from 'sonner';

export default function AdminUsers() {
  const [activeTab, setActiveTab] = useState('candidate');
  const users = useStore(state => state.users || []);
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const getFilteredUsers = (role: string) => {
    return users.filter(u => 
      u.role === role && 
      (u.name.toLowerCase().includes(search.toLowerCase()) || 
       u.email.toLowerCase().includes(search.toLowerCase()) ||
       (u.serialNumber && u.serialNumber.toLowerCase().includes(search.toLowerCase())))
    );
  };

  const getUserAnalytics = (userId: string) => {
    const results = db.getResults().filter(r => r.candidateId === userId);
    const examsTaken = results.length;
    const scores = results.map(r => r.percentage || 0);
    const bestScore = examsTaken > 0 ? Math.max(...scores) : 0;
    const avgScore = examsTaken > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / examsTaken) : 0;
    const passed = results.filter(r => (r.percentage || 0) >= 50).length;
    const failed = examsTaken - passed;
    return { examsTaken, bestScore, avgScore, passed, failed, results };
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !selectedUser) return;
    
    // Attempt to gather data
    const analytics = getUserAnalytics(selectedUser.id);
    const userResults = db.getResults().filter(r => r.candidateId === selectedUser.id);
    const exams = db.getExams();

    printWindow.document.write(`
      <html>
        <head>
          <title>Candidate Report - ${selectedUser.name}</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h1 { color: #1e3a8a; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; }
            .section { margin-bottom: 20px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
            .info-item { background: #f8fafc; padding: 10px; border-radius: 5px; }
            .label { font-weight: bold; color: #64748b; font-size: 12px; text-transform: uppercase; }
            .value { font-weight: bold; color: #0f172a; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e2e8f0; }
            th { background: #f1f5f9; }
          </style>
        </head>
        <body>
          <h1>Candidate Report: ${selectedUser.name}</h1>
          <div class="section">
            <h2>Registration Information</h2>
            <div class="info-grid">
              <div class="info-item"><div class="label">Candidate ID</div><div class="value">${selectedUser.serialNumber || 'N/A'}</div></div>
              <div class="info-item"><div class="label">Email</div><div class="value">${selectedUser.email}</div></div>
              <div class="info-item"><div class="label">Phone Number</div><div class="value">${selectedUser.phone || 'N/A'}</div></div>
              <div class="info-item"><div class="label">State</div><div class="value">${selectedUser.state || 'N/A'}</div></div>
              <div class="info-item"><div class="label">School</div><div class="value">${selectedUser.schoolName || 'N/A'}</div></div>
              <div class="info-item"><div class="label">Registration Date</div><div class="value">${new Date(parseInt(selectedUser.id.split('_')[1] || Date.now().toString())).toLocaleDateString()}</div></div>
              <div class="info-item"><div class="label">Payment Status</div><div class="value">${(selectedUser.paymentStatus || 'unknown').replace('_', ' ').toUpperCase()}</div></div>
              <div class="info-item"><div class="label">Account Status</div><div class="value">${(selectedUser.accountStatus || 'active').toUpperCase()}</div></div>
            </div>
          </div>
          <div class="section">
            <h2>Quiz Status & Scores</h2>
            <table>
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${userResults.length > 0 ? userResults.map(res => {
                  const exam = exams.find(e => e.id === res.examId);
                  const isPass = (res.percentage || 0) >= 50;
                  return `
                    <tr>
                      <td>${exam?.title || res.examId}</td>
                      <td>${res.score}</td>
                      <td>${res.percentage}%</td>
                      <td>${isPass ? 'Pass' : 'Fail'}</td>
                      <td>${new Date(res.submittedAt || Date.now()).toLocaleDateString()}</td>
                    </tr>
                  `;
                }).join('') : '<tr><td colspan="5">No quiz attempts yet.</td></tr>'}
              </tbody>
            </table>
          </div>
          <div class="section" style="margin-top: 40px; text-align: center;">
             <button onclick="window.print()" style="padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Print / Save as PDF</button>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSuspend = () => {
     if (!selectedUser) return;
     const isSuspended = selectedUser.accountStatus === 'suspended';
     const action = isSuspended ? 'reactivate' : 'suspend';
     if (window.confirm(`Are you sure you want to ${action} this candidate?`)) {
        const updatedUser = { ...selectedUser, accountStatus: isSuspended ? 'active' : 'suspended' } as User;
        db.addUser(updatedUser);
        setSelectedUser(updatedUser);
        toast.success(`Candidate successfully ${isSuspended ? 'reactivated' : 'suspended'}.`);
     }
  };

  const handleDelete = () => {
    if (!selectedUser) return;
    if (window.confirm('This action cannot be undone. Delete candidate?')) {
      db.deleteUser(selectedUser.id);
      toast.success('Candidate deleted successfully.');
      setSelectedUser(null);
    }
  };

  const tabs = [
    { id: 'candidate', label: 'Candidates' },
    { id: 'admin', label: 'Admins' },
  ];

  const exportAsCSV = () => {
    const dataToExport = getFilteredUsers(activeTab).map(u => ({
       'Serial No': u.serialNumber || '',
       'Name': u.name,
       'Email': u.email,
       'Phone': u.phone || '',
       'School': u.schoolName || '',
       'State': u.state || '',
       'Payment Status': u.paymentStatus || '',
       'Account Status': u.accountStatus || 'active'
    }));
    
    if (dataToExport.length === 0) {
       toast.error("No candidates to export.");
       return;
    }
    
    const headers = Object.keys(dataToExport[0]).join(',');
    const csvContent = [
      headers,
      ...dataToExport.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeTab}_candidates_export.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (selectedUser) {
    const analytics = getUserAnalytics(selectedUser.id);
    
    return (
      <div className="space-y-6 animate-in slide-in-from-right-8 duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
          <Button variant="ghost" onClick={() => setSelectedUser(null)} className="hover:bg-slate-200">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Users
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-2" /> Print Report
            </Button>
            <Button variant="outline" className={selectedUser.accountStatus === 'suspended' ? "text-green-600 border-green-200 hover:bg-green-50" : "text-amber-600 border-amber-200 hover:bg-amber-50"} onClick={handleSuspend}>
              {selectedUser.accountStatus === 'suspended' ? <><ShieldCheck className="w-4 h-4 mr-2" /> Reactivate</> : <><ShieldAlert className="w-4 h-4 mr-2" /> Suspend</>}
            </Button>
            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => {
              const newName = window.prompt("Enter new name:", selectedUser.name);
              if (newName !== null && newName.trim() !== "") {
                 const updatedUser = { ...selectedUser, name: newName.trim() } as User;
                 db.addUser(updatedUser);
                 setSelectedUser(updatedUser);
                 toast.success("Profile updated successfully.");
              }
            }}>
              <Edit className="w-4 h-4 mr-2" /> Edit Profile
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6" id="printable-profile">
            <Card className="overflow-hidden border-0 shadow-lg ring-1 ring-slate-200">
              <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-700 relative">
                 <div className="absolute -bottom-12 left-6">
                   <div className="w-24 h-24 rounded-full bg-white p-1 shadow-xl">
                      <img src={selectedUser.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${selectedUser.name}`} alt="Avatar" className="w-full h-full rounded-full object-cover border-2 border-slate-100" />
                   </div>
                 </div>
              </div>
              <CardContent className="pt-16 pb-6 px-6">
                 <h2 className="text-2xl font-bold text-slate-800">{selectedUser.name}</h2>
                 <p className="text-blue-600 font-mono font-semibold tracking-wide text-sm mt-1">{selectedUser.serialNumber || 'No Serial'}</p>
                 <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mt-4 border ${selectedUser.accountStatus === 'suspended' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${selectedUser.accountStatus === 'suspended' ? 'bg-red-500' : 'bg-green-500'}`}></span> {selectedUser.accountStatus === 'suspended' ? 'Suspended Candidate' : 'Active Candidate'}
                 </span>
                 
                 <div className="mt-8 space-y-4">
                   <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Registration Date</p>
                     <p className="text-slate-700 font-medium">{new Date(parseInt(selectedUser.id.split('_')[1] || Date.now().toString())).toLocaleDateString()}</p>
                   </div>
                   <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Payment Status</p>
                     <p className="text-slate-700 uppercase font-bold text-sm">{(selectedUser.paymentStatus || 'unknown').replace('_', ' ')}</p>
                   </div>
                   <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                     <p className="text-slate-700">{selectedUser.email}</p>
                   </div>
                   <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                     <p className="text-slate-700">{selectedUser.phone || 'N/A'}</p>
                   </div>
                   <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">School</p>
                     <p className="text-slate-700 font-medium">{selectedUser.schoolName || 'N/A'}</p>
                   </div>
                   <div>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Location</p>
                     <p className="text-slate-700">{[selectedUser.address, selectedUser.state, selectedUser.country].filter(Boolean).join(', ') || 'N/A'}</p>
                   </div>
                 </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{analytics.examsTaken}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Exams Taken</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
                    <GraduationCap className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{analytics.bestScore}%</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Best Score</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center mb-2">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{analytics.avgScore}%</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Avg Score</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white">
                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-2">
                    <Clock className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold text-slate-800">{analytics.passed}/{analytics.examsTaken}</p>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-1">Pass Ratio</p>
                </CardContent>
              </Card>
            </div>

            <Card className="border-0 shadow-sm ring-1 ring-slate-200">
              <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                <h3 className="font-bold text-slate-800">Recent Exam Attempts</h3>
              </CardHeader>
              <CardContent className="p-0">
                {analytics.results.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    No examination records found for this candidate.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {analytics.results.slice().reverse().map(res => {
                      const examTitle = db.getExams().find(e => e.id === res.examId)?.title || res.examId;
                      return (
                        <div key={res.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition-colors">
                          <div>
                            <p className="font-bold text-slate-800">{examTitle}</p>
                            <p className="text-xs text-slate-500 mt-1">{new Date(res.date).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold text-blue-600 text-lg">{res.percentage}%</p>
                            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{res.grade}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Candidate Management</h2>
          <p className="text-sm text-slate-500 mt-1">Manage registrants, view full details, and monitor records.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="bg-white" onClick={exportAsCSV}><Download className="w-4 h-4 mr-2"/> Export CSV</Button>
        </div>
      </div>
      
      <Card className="shadow-sm border-0 ring-1 ring-slate-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border-b border-slate-100 gap-4">
          <div className="flex gap-1 overflow-x-auto w-full sm:w-auto overflow-y-hidden pb-1 sm:pb-0" style={{ scrollbarWidth: 'none' }}>
            {tabs.map(t => (
              <button 
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${activeTab === t.id ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
              >
                {t.label} 
                <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-xs text-slate-500">
                  {users.filter(u => u.role === t.id).length}
                </span>
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search serial no, name..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Serial No. / Candidate</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">Contact Info</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase">School / Location</th>
                <th className="p-4 text-xs font-semibold tracking-wider text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {getFilteredUsers(activeTab).length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <Search className="w-5 h-5 text-slate-400" />
                      </div>
                      <p>No candidates found matching your criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                getFilteredUsers(activeTab).map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0 border-2 border-blue-200 overflow-hidden shadow-sm">
                          <img src={u.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${u.name}&backgroundColor=eff6ff`} alt="Avatar" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-blue-600 font-mono text-sm tracking-wide">{u.serialNumber || 'Pending'}</p>
                          <p className="font-bold text-slate-800 leading-tight">{u.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-700 font-medium">{u.email}</p>
                      <p className="text-xs text-slate-500 mt-1">{u.phone || 'No phone'}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-700 font-medium">{u.schoolName || 'Unknown School'}</p>
                      <p className="text-xs text-slate-500 mt-1 truncate max-w-[150px]">{[u.state, u.country].filter(Boolean).join(', ') || 'Unknown Location'}</p>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="h-8 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800 border-blue-200 font-semibold" onClick={() => setSelectedUser(u)}>
                          <Eye className="w-4 h-4 mr-1.5" /> Full Details
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
