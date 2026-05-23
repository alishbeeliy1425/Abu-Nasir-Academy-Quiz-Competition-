import React, { createContext, useContext, useEffect, useState } from 'react';
import { db } from '../lib/store';

const defaultSettings = db.getSettings();
const SettingsContext = createContext<typeof defaultSettings>(defaultSettings);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    const loadSettings = () => {
      const currentSettings = db.getSettings();
      setSettings(currentSettings);
      
      // Apply website name
      document.title = currentSettings.websiteName || 'CBT Platform';
      
      // Apply favicon
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      if (currentSettings.favicon) {
        link.href = currentSettings.favicon;
      } else {
        link.href = '/vite.svg'; // Default
      }
      
      // Apply Dark Mode
      if (currentSettings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    
    loadSettings();
    return db.subscribe(loadSettings);
  }, []);

  return (
    <SettingsContext.Provider value={settings}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
