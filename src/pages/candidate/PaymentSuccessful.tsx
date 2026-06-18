import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/store';
import { useAuth } from '../../components/AuthProvider';
import { CheckCircle2, Medal, PlayCircle, BarChart2, BookOpen } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { DashboardLayout } from '../../components/layout/DashboardLayout';

export default function PaymentSuccessful() {
  const [searchParams] = useSearchParams();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const reference = searchParams.get('reference');
    if (!user) return;

    if (reference && user.paymentStatus !== 'paid') {
      const updatedUser = {
        ...user,
        paymentStatus: 'paid' as const,
        paymentReference: reference,
        amountPaid: 1000,
        paymentDate: new Date().toISOString()
      };
      
      db.addUser(updatedUser);
      login(updatedUser.email); // Refresh context
      setVerified(true);
      window.history.replaceState({}, '', '/paymentsuccessful');
    } else if (user.paymentStatus === 'paid') {
      setVerified(true);
    } else {
      // Unpaid user with no reference, redirect back to payment
      navigate('/candidate');
    }
  }, [user, searchParams, login, navigate]);

  if (!verified) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 animate-pulse">Verifying payment status...</p>
      </div>
    );
  }

  // Once verified, we display the Candidate Dashboard Features
  const navigation = [
    { name: "Dashboard", href: "/candidate", icon: BarChart2 },
    { name: "Available Quizzes", href: "/candidate/exams", icon: PlayCircle },
    { name: "My Profile", href: "/candidate/profile", icon: BookOpen },
    { name: "Leaderboard", href: "/candidate/leaderboard", icon: Medal }
  ];

  return (
    <DashboardLayout navigation={navigation}>
      <div className="space-y-6 max-w-5xl mx-auto pb-10">
        <Card className="bg-green-600 text-white shadow-lg border-0 overflow-hidden relative">
          <div className="absolute right-0 top-0 opacity-10">
            <CheckCircle2 className="w-64 h-64 -mt-10 -mr-10" />
          </div>
          <CardContent className="p-8 relative z-10">
             <div className="flex items-center gap-4 mb-4">
               <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                 <CheckCircle2 className="w-8 h-8 text-white" />
               </div>
               <div>
                 <h2 className="text-2xl font-bold">Payment Successful!</h2>
                 <p className="text-green-100 mt-1 pb-1 border-b border-green-500/50 inline-block">Ref: {user?.paymentReference}</p>
               </div>
             </div>
             <p className="text-lg text-green-50 mt-4 leading-relaxed max-w-2xl">
               Welcome to the National Quiz Competition Portal, <span className="font-bold">{user?.name}</span>. 
               Your registration is now fully complete and active. You can now access available quizzes and view your reports.
             </p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="md:col-span-2 shadow-sm border-0 ring-1 ring-slate-200 bg-white">
             <CardHeader className="border-b border-slate-100 bg-slate-50/50 pt-5 pb-4">
               <h3 className="font-bold text-slate-800 text-lg">Candidate Profile Data</h3>
             </CardHeader>
             <CardContent className="p-0">
                <div className="divide-y divide-slate-100">
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="text-sm font-semibold text-slate-500">Candidate ID</div>
                    <div className="col-span-2 font-mono font-bold text-blue-700">{user?.serialNumber}</div>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="text-sm font-semibold text-slate-500">Full Name</div>
                    <div className="col-span-2 font-medium text-slate-900">{user?.name}</div>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="text-sm font-semibold text-slate-500">Email Address</div>
                    <div className="col-span-2 font-medium text-slate-900">{user?.email}</div>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="text-sm font-semibold text-slate-500">Phone Number</div>
                    <div className="col-span-2 font-medium text-slate-900">{user?.phone}</div>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="text-sm font-semibold text-slate-500">State & Country</div>
                    <div className="col-span-2 font-medium text-slate-900">{user?.state}, {user?.country}</div>
                  </div>
                  <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-2 pb-5">
                    <div className="text-sm font-semibold text-slate-500">School Name</div>
                    <div className="col-span-2 font-medium text-slate-900">{user?.schoolName || 'N/A'}</div>
                  </div>
                </div>
             </CardContent>
           </Card>

           <div className="space-y-6">
             <Card className="shadow-sm border-0 ring-1 ring-slate-200 bg-white overflow-hidden text-center">
               <div className="h-24 bg-gradient-to-br from-blue-600 to-indigo-700 relative"></div>
               <div className="relative -mt-12 px-6 pb-6">
                 <img src={user?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name}`} className="w-24 h-24 mx-auto rounded-full border-4 border-white shadow-md bg-white object-cover" alt="Profile" />
                 <h3 className="font-bold text-slate-800 text-lg mt-3">{user?.name}</h3>
                 <p className="inline-block mt-2 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full uppercase tracking-wider">
                    Paid Candidate
                 </p>
                 <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-1 text-sm text-left">
                   <div className="flex justify-between">
                     <span className="text-slate-500">Date:</span>
                     <span className="font-medium">{user?.paymentDate ? new Date(user.paymentDate).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                   </div>
                   <div className="flex justify-between">
                     <span className="text-slate-500">Amount:</span>
                     <span className="font-bold text-slate-800">₦{user?.amountPaid || 1000}</span>
                   </div>
                 </div>
               </div>
             </Card>

             <Card className="shadow-lg border-0 bg-gradient-to-br from-indigo-700 to-purple-800 text-white">
                <CardContent className="p-6 text-center">
                   <PlayCircle className="w-12 h-12 text-indigo-300 mx-auto mb-4" />
                   <h3 className="font-bold text-xl mb-2">Ready for Quizzes?</h3>
                   <p className="text-indigo-200 text-sm mb-6">Check the available tests assigned to your category and start practicing.</p>
                   <Button onClick={() => navigate('/candidate/exams')} className="w-full bg-white text-indigo-700 hover:bg-slate-100 font-bold">
                      View Available Quizzes
                   </Button>
                </CardContent>
             </Card>
           </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
