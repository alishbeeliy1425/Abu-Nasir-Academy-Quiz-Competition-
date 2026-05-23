import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ShieldCheck, ArrowRight, Lock, X } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { useSettings } from '../components/SettingsProvider';

export default function Welcome() {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const settings = useSettings();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');

  const handleAdminAccess = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    if (loginAdmin(adminPassword)) {
      setShowAdminModal(false);
      navigate('/admin');
    } else {
      setAdminError('Incorrect Admin Access Password');
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden bg-gray-950">
      
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ 
          backgroundImage: `url('${settings.loginBackground || 'https://i.ibb.co/1G3H8ZyD/6237f9d3e304e20d8385e764b0473964-3.jpg'}')`,
        }}
      >
        <div className="absolute inset-0 bg-gray-950/80 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-transparent"></div>
      </div>

      {/* Header / Nav */}
      <nav className="h-16 px-4 md:px-8 border-b border-white/10 flex items-center justify-between shrink-0 z-10 relative">
        <div className="flex items-center gap-2">
          {settings.websiteLogo ? (
            <img src={settings.websiteLogo} alt="Logo" className="w-8 h-8 object-contain" />
          ) : (
            <BookOpen className="w-5 h-5 text-blue-500" />
          )}
          <span className="font-bold text-white tracking-tight">
            {settings.websiteName}
          </span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
          <button 
            onClick={() => { setAdminError(''); setAdminPassword(''); setShowAdminModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-medium border border-white/10 transition-colors"
            title="Admin Dashboard Access"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">Admin</span>
          </button>
          <button 
            onClick={() => navigate('/login?role=candidate')}
            className="px-3 sm:px-4 py-1.5 text-sm font-medium text-white hover:text-gray-300 transition-colors"
          >
            Log In
          </button>
          <button 
            onClick={() => navigate('/register')}
            className="px-3 sm:px-4 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            Register
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl"
        >
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tight mb-1">
            {settings.websiteName}
          </h1>
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight">
            <span className="text-[#3b82f6]">Quiz</span> <span className="text-[#eab308]">Competition</span>
          </h2>
          
          <p className="text-gray-300 text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed px-4">
            {settings.websiteDescription || "Elevate your academic journey. Test your knowledge, speed, and accuracy in our premium online CBT scholarship competition."}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => navigate('/register')}
              className="flex items-center justify-center gap-2 px-8 py-3 bg-[#3b82f6] hover:bg-blue-600 text-white font-medium rounded-full transition-colors w-full sm:w-auto"
            >
              Register Now
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            
            <button 
              onClick={() => navigate('/login?role=candidate')}
              className="flex items-center justify-center px-8 py-3 bg-white/5 border border-white/20 hover:bg-white/10 text-gray-200 font-medium rounded-full transition-colors w-full sm:w-auto"
            >
              Candidate Login
            </button>
          </div>
        </motion.div>
      </main>
      
      {/* Admin Access Modal */}
      <AnimatePresence>
        {showAdminModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden relative"
            >
              <div className="p-6">
                <button 
                  onClick={() => setShowAdminModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-5 border border-blue-100">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">Secure Admin Access</h3>
                <p className="text-sm text-gray-500 mb-6">
                  Please enter the administrative access password to continue to the dashboard.
                </p>
                
                <form onSubmit={handleAdminAccess} className="space-y-4">
                  {adminError && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                      {adminError}
                    </div>
                  )}
                  
                  <div>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter Admin Access Password"
                      className="w-full h-11 px-4 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
                      autoFocus
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="w-full h-11 bg-blue-900 hover:bg-blue-800 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 shadow-lg shadow-blue-900/20"
                  >
                    Authenticate Access
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
