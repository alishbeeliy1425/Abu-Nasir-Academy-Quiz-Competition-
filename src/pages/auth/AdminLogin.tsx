import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock } from 'lucide-react';
import { useAuth } from '../../components/AuthProvider';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleAdminAccess = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    if (loginAdmin(adminPassword)) {
      navigate('/admin');
    } else {
      setAdminError('Incorrect Admin Access Password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-6">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Secure Admin Access</h3>
          <p className="text-sm text-gray-500 mb-8">
            Please enter the administrative access password to continue to the dashboard.
          </p>
          
          <form onSubmit={handleAdminAccess} className="space-y-6">
            {adminError && (
              <div className="p-4 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 font-medium">
                {adminError}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Administrator Password</label>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter Admin Access Password"
                className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all shadow-sm"
                autoFocus
              />
            </div>
            
            <button 
              type="submit"
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              Access Dashboard
            </button>
          </form>
          <div className="mt-6 text-center">
             <button type="button" onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-slate-800 hover:underline">
               Return to Homepage
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}
