import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, ChevronDown, ChevronRight, User as UserIcon } from 'lucide-react';
import { useAuth } from '../AuthProvider';
import { useSettings } from '../SettingsProvider';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export interface NavItem {
  name: string;
  href?: string;
  icon: any;
  children?: { name: string; href: string }[];
}

export function DashboardLayout({ children, navigation }: { children: React.ReactNode, navigation: NavItem[] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const settings = useSettings();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const toggleMenu = (name: string) => {
    // Only one menu open at a time for cleaner sidebar Navigation
    setOpenMenus(prev => {
      if (prev[name]) return { [name]: false };
      return { [name]: true };
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Auto-open menus that contain the active child
  React.useEffect(() => {
    navigation.forEach(item => {
      if (item.children?.some(child => location.pathname === child.href)) {
        setOpenMenus(prev => ({ ...prev, [item.name]: true }));
      }
    });
  }, [location.pathname, navigation]);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-gray-900/50 z-40 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-[260px] bg-[#1a233a] border-r border-white/5 text-slate-300 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:flex-shrink-0 flex flex-col shadow-xl",
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="h-16 flex items-center justify-between px-5 border-b border-white/10 shrink-0 bg-[#161d31]">
          <span className="text-xl font-bold tracking-tight text-white flex items-center gap-3">
            {settings.dashboardLogo ? (
              <img src={settings.dashboardLogo} alt="Logo" className="h-10 object-contain" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }} />
            ) : settings.websiteLogo ? (
              <img src={settings.websiteLogo} alt="Logo" className="h-10 object-contain" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }} />
            ) : (
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-sm shadow-inner overflow-hidden border border-blue-500">
                 <span className="text-white font-extrabold font-serif">{settings.websiteName ? settings.websiteName.charAt(0) : 'A'}</span>
              </div>
            )}
            {!settings.dashboardLogo && (settings.websiteName || 'CBT Platform')}
          </span>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-5 border-b border-white/5 flex items-center gap-3 shrink-0 bg-[#1a233a]">
          <div className="w-10 h-10 rounded-full bg-blue-900/50 border border-blue-500/30 flex items-center justify-center overflow-hidden shrink-0">
             <img src={user?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'Admin'}&backgroundColor=1d4ed8`} alt="User" className="w-full h-full object-cover" />
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold text-white truncate text-sm">{user?.name || 'Admin User'}</p>
            <p className="text-xs text-blue-400 font-medium capitalize truncate">{user?.role || 'Administrator'} Portal</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
          {navigation.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            // A parent item with a href is active if the path matches exactly.
            let isActive = false;
            if (item.href && !hasChildren) {
              isActive = location.pathname === item.href || (location.pathname.startsWith(item.href + '/') && item.href !== '/admin');
              // Special case for exact match to dashboard root
              if (item.href === '/admin' && location.pathname !== '/admin') isActive = false;
            }
            const isMenuOpen = openMenus[item.name];

            return (
              <div key={item.name} className="mb-1">
                {hasChildren ? (
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                      isMenuOpen ? "bg-white/5 text-white shadow-sm" : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-colors", isMenuOpen ? "text-blue-400" : "text-slate-500")} />
                      {item.name}
                    </div>
                    {isMenuOpen ? <ChevronDown className="h-4 w-4 opacity-70" /> : <ChevronRight className="h-4 w-4 opacity-70" />}
                  </button>
                ) : (
                  <a
                    href={item.href}
                    onClick={(e) => { e.preventDefault(); if(item.href) navigate(item.href); setSidebarOpen(false); }}
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-lg transition-all text-sm font-medium",
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 mr-3 flex-shrink-0 transition-colors", isActive ? "text-white" : "text-slate-500")} />
                    {item.name}
                  </a>
                )}

                {/* Submenu */}
                <AnimatePresence>
                  {hasChildren && isMenuOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden ml-9 mt-1 space-y-1"
                    >
                      {item.children!.map(child => {
                        const isChildActive = location.pathname === child.href;
                        return (
                          <a
                            key={child.name}
                            href={child.href}
                            onClick={(e) => { e.preventDefault(); navigate(child.href); setSidebarOpen(false); }}
                            className={cn(
                              "block px-3 py-2 rounded-lg text-sm transition-all",
                              isChildActive 
                                ? "bg-blue-500/10 text-blue-400 font-semibold" 
                                : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                            )}
                          >
                            {child.name}
                          </a>
                        )
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 shrink-0 bg-[#161d31]">
          <button onClick={handleLogout} className="flex items-center px-3 py-2.5 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 rounded-lg w-full transition-colors font-medium text-sm">
            <LogOut className="h-5 w-5 mr-3 opacity-70" />
            Sign Out Session
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F4F7FB]">
        <header className="h-16 bg-white border-b border-gray-200/80 flex items-center px-6 justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors">
              <Menu className="h-6 w-6" />
            </button>
            <div className="hidden sm:flex flex-col">
              <span className="text-sm font-bold text-slate-800">{settings.websiteName ? `${settings.websiteName} Portal` : 'Abu Nasir Academy Portal'}</span>
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">Session 2025/2026</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-sm border-r border-gray-200 pr-5 hidden sm:block">
              <span className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full font-medium border border-green-100">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse block"></span> 
                System Online
              </span>
            </div>
            <button className="h-10 w-10 rounded-full bg-blue-100 border-2 border-white ring-2 ring-blue-100 flex items-center justify-center text-blue-700 font-bold overflow-hidden shadow-sm transition-transform hover:scale-105">
              <img src={user?.photoUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${user?.name || 'Admin'}&backgroundColor=2563eb`} alt="User" className="w-full h-full object-cover" />
            </button>
          </div>
        </header>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none scroll-smooth">
          <div className="p-4 md:p-8 max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
