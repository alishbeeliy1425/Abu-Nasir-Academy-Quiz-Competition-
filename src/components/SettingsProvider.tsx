import React, { createContext, useContext, useEffect } from 'react';
import { db, useStore } from '../lib/store';

const SettingsContext = createContext<ReturnType<typeof db.getSettings>>(db.getSettings());

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const settings = useStore(state => state.settings);

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
