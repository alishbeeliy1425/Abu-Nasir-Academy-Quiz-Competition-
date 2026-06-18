import React, { createContext, useContext, useEffect } from 'react';
import { db, useStore } from '../lib/store';

const SettingsContext = createContext<ReturnType<typeof db.getSettings>>(db.getSettings());

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const currentSettings = useStore(state => state.settings);
  const settings = currentSettings || db.getSettings() || {
    websiteName: 'Abu Nasir Academy CBT',
    websiteDescription: 'Official CBT Platform',
    contactEmail: 'admin@abunasir.edu',
    contactPhone: '+1234567890',
    address: '123 Academy Way',
    defaultExamDuration: 60,
    autoSubmit: true,
    passMark: 50,
    darkMode: false,
    antiCheatingEnabled: true,
    gradingStyle: 'waec',
    customGrades: [],
    websiteLogo: "https://i.ibb.co/d4cb3x7L/7588cd41-3c15-4541-82b2-54ec771af0dc-removebg-preview.png",
    dashboardLogo: "https://i.ibb.co/d4cb3x7L/7588cd41-3c15-4541-82b2-54ec771af0dc-removebg-preview.png",
    favicon: "https://i.ibb.co/d4cb3x7L/7588cd41-3c15-4541-82b2-54ec771af0dc-removebg-preview.png",
  };

  useEffect(() => {
    // Apply website name
    document.title = settings.websiteName || 'CBT Platform';
    
    // Apply favicon
    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    if (settings.favicon) {
      link.href = settings.favicon;
    } else {
      link.href = '/vite.svg'; // Default
    }
    
    // Apply Dark Mode
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings]);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
