import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useStore, db } from '../../lib/store';
import { CreditCard, CheckCircle2, Search, Download, Clock, XCircle } from 'lucide-react';
import { Input } from '../../components/ui/input';
import { toast } from 'sonner';

export default function AdminPayments() {
  const users = useStore(state => state.users || []);
  const candidates = users.filter(u => u.role === 'candidate');
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCandidates = candidates.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.serialNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPayments = candidates.filter(c => c.paymentStatus === 'paid').length * 1000;
  const pendingVerifications = candidates.filter(c => c.paymentStatus === 'pending_verification');

  const handleVerifyManually = (candidate: any) => {
    if (confirm(`Approve manual payment for ${candidate.name}? This will activate their account.`)) {
      let serialNumber = candidate.serialNumber;
      if (!serialNumber) {
         const users = db.getUsers();
         const candidateCount = users.filter((u: any) => u.role === 'candidate' && u.serialNumber).length + 1;
         serialNumber = `ABN${candidateCount.toString().padStart(6, '0')}`;
      }

      const updatedUser = {
        ...candidate,
        serialNumber,
        paymentStatus: 'paid' as const,
        paymentDate: new Date().toISOString(),
        amountPaid: 1000,
        paymentReference: `MANUAL_${Date.now()}`
      };
      db.addUser(updatedUser);
      toast.success("Payment verified and account activated.");
    }
  };

  const handleRejectManual = (candidate: any) => {
    if (confirm(`Reject manual payment for ${candidate.name}? They will be asked to pay again.`)) {
      const updatedUser = {
        ...candidate,
        paymentStatus: 'pending' as const,
      };
      db.addUser(updatedUser);
      toast.error("Payment rejected.");
    }
  };

  const handleExport = () => {
     // A simple CSV export for payments
     const headers = "Name,Candidate_ID,Email,Payment_Status,Amount,Reference,Date\n";
     const rows = candidates.map(c => 
       `"${c.name}","${c.serialNumber}","${c.email}","${c.paymentStatus || 'pending'}",${c.amountPaid || 0},"${c.paymentReference || ''}","${c.paymentDate ? new Date(c.paymentDate).toLocaleDateString() : ''}"`
     ).join("\n");
     const blob = new Blob([headers + rows], { type: 'text/csv' });
     const url = window.URL.createObjectURL(blob);
     const a = document.createElement('a');
     a.href = url;
     a.download = `payments_${new Date().toISOString().split('T')[0]}.csv`;
     a.click();
     window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
            <CreditCard className="w-6 h-6 text-blue-600" />
            Payment Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">Verify manual payments and track registration revenue.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
             <Download className="w-4 h-4 mr-2" /> Export Records
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
         <Card className="border-0 shadow-sm ring-1 ring-slate-100 bg-white">
            <CardContent className="p-6">
               <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-2">Total Candidates</p>
               <p className="text-3xl font-bold text-slate-800">{candidates.length}</p>
            </CardContent>
         </Card>
         <Card className="border-0 shadow-sm ring-1 ring-slate-100 bg-white">
            <CardContent className="p-6">
               <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-2">Paid Candidates</p>
               <p className="text-3xl font-bold text-green-600">{candidates.filter(c => c.paymentStatus === 'paid').length}</p>
            </CardContent>
         </Card>
         <Card className="border-0 shadow-sm ring-1 ring-amber-200 bg-amber-50">
            <CardContent className="p-6">
               <p className="text-sm text-amber-700 font-semibold uppercase tracking-wider mb-2">Awaiting Verification</p>
               <p className="text-3xl font-bold text-amber-600">{pendingVerifications.length}</p>
            </CardContent>
         </Card>
         <Card className="border-0 shadow-sm ring-1 ring-slate-100 bg-white">
            <CardContent className="p-6">
               <p className="text-sm text-slate-500 font-semibold uppercase tracking-wider mb-2">Total Revenue</p>
               <p className="text-3xl font-bold text-blue-600">₦{totalPayments.toLocaleString()}</p>
            </CardContent>
         </Card>
      </div>

      <Card className="border-0 ring-1 ring-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
           <div className="relative w-full sm:w-96">
             <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
             <Input 
               placeholder="Search candidates by name, email or ID..." 
               className="pl-9 bg-white"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>
        <div className="overflow-x-auto">
           <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/50 border-b border-slate-100">
                 <tr>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Candidate</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Status</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs">Reference</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs whitespace-nowrap">Date Paid</th>
                    <th className="px-6 py-4 font-bold text-slate-500 uppercase tracking-wider text-xs text-right">Actions</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                 {filteredCandidates.map(candidate => (
                   <tr key={candidate.id} className={`transition-colors ${candidate.paymentStatus === 'pending_verification' ? 'bg-amber-50/50' : 'hover:bg-slate-50/50'}`}>
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                           <img src={candidate.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${candidate.name}`} alt="" className="w-full h-full object-cover" />
                         </div>
                         <div>
                           <p className="font-bold text-slate-800 leading-tight">{candidate.name}</p>
                           <p className="text-xs text-slate-500 font-mono mt-0.5">{candidate.serialNumber}</p>
                         </div>
                       </div>
                     </td>
                     <td className="px-6 py-4">
                        {candidate.paymentStatus === 'paid' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider rounded">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                          </span>
                        ) : candidate.paymentStatus === 'pending_verification' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider rounded">
                            <Clock className="w-3.5 h-3.5" /> Awaiting Verification
                          </span>
                        ) : (
                          <span className="inline-flex px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider rounded">
                            Pending
                          </span>
                        )}
                     </td>
                     <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {candidate.paymentReference || '—'}
                     </td>
                     <td className="px-6 py-4 text-slate-600">
                        {candidate.paymentDate ? new Date(candidate.paymentDate).toLocaleDateString() : '—'}
                     </td>
                     <td className="px-6 py-4 text-right">
                        {candidate.paymentStatus === 'pending_verification' ? (
                           <div className="flex items-center justify-end gap-2">
                             <Button size="sm" variant="outline" className="h-8 text-xs font-semibold text-green-700 border-green-200 bg-green-50 hover:bg-green-100" onClick={() => handleVerifyManually(candidate)}>
                                <CheckCircle2 className="w-3 h-3 mr-1" /> Approve
                             </Button>
                             <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 border-red-200 bg-red-50 hover:bg-red-100" title="Reject Payment" onClick={() => handleRejectManual(candidate)}>
                                <XCircle className="w-4 h-4" />
                             </Button>
                           </div>
                        ) : candidate.paymentStatus === 'pending' ? (
                          <Button size="sm" variant="outline" className="h-8 text-xs font-semibold" onClick={() => handleVerifyManually(candidate)}>
                             Mark as Paid
                          </Button>
                        ) : null}
                     </td>
                   </tr>
                 ))}
                 {filteredCandidates.length === 0 && (
                   <tr>
                     <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                       No candidates found matching your search.
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
