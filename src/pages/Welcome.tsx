import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ShieldCheck, ArrowRight, Lock, X } from 'lucide-react';
import { useAuth } from '../components/AuthProvider';
import { useSettings } from '../components/SettingsProvider';

export default function Welcome() {
  const navigate = useNavigate();
  const settings = useSettings();

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
            <img src={settings.websiteLogo} alt="Logo" className="w-8 h-8 object-contain" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }} />
          ) : (
            <BookOpen className="w-5 h-5 text-blue-500" />
          )}
          <span className="font-bold text-white tracking-tight">
            {settings.websiteName}
          </span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3">
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
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 text-transparent bg-clip-text">Quiz</span>{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-yellow-500 text-transparent bg-clip-text">Competition</span>
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
    </div>
  );
}
