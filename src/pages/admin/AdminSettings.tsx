import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Settings, Save, RotateCcw, Download, Upload, Shield, Monitor, FileSpreadsheet, Lock, Trash2, Plus } from 'lucide-react';
import { db } from '../../lib/store';

export default function AdminSettings({ defaultTab = 'general' }: { defaultTab?: string }) {
  const [settings, setSettings] = useState<any>({
    websiteName: '',
    websiteDescription: '',
    contactEmail: '',
    contactPhone: '',
    address: '',
    defaultExamDuration: 60,
    autoSubmit: true,
    antiCheatingEnabled: true,
    passMark: 50,
    darkMode: false,
    gradingStyle: 'waec',
    customGrades: []
  });

  const [activeTab, setActiveTab] = useState(defaultTab);

  useEffect(() => {
    setSettings(db.getSettings());
  }, []);

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    db.saveSettings(settings);
    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 500);
  };

  const handleReset = () => {
    if (confirm('Reset to defaults?')) {
      db.resetSettings();
      setSettings(db.getSettings());
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'websiteLogo' | 'favicon' | 'dashboardLogo' | 'loginBackground') => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const resultUrl = event.target?.result as string;
        
        // For SVGs, we can save them directly if they are small enough
        if (file.type === 'image/svg+xml') {
           setSettings(prev => ({ ...prev, [field]: resultUrl }));
           if (field === 'favicon') {
             let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
             if (!link) {
               link = document.createElement('link');
               link.rel = 'icon';
               document.head.appendChild(link);
             }
             link.href = resultUrl;
           }
           return;
        }

        // Compress and resize raster images
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let MAX_WIDTH = 1200;
          let MAX_HEIGHT = 800;
          let mimeType = 'image/jpeg';
          let quality = 0.8;

          if (field === 'favicon') {
            MAX_WIDTH = 128;
            MAX_HEIGHT = 128;
            mimeType = 'image/png';
          } else if (field === 'websiteLogo' || field === 'dashboardLogo') {
            MAX_WIDTH = 400;
            MAX_HEIGHT = 400;
            mimeType = 'image/png';
          }

          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          // Only draw white bg for JPEGs
          if (mimeType === 'image/jpeg') {
              ctx!.fillStyle = '#FFFFFF';
              ctx!.fillRect(0, 0, width, height);
          }
          
          ctx?.drawImage(img, 0, 0, width, height);
          
          const dataUrl = canvas.toDataURL(mimeType, quality);
          setSettings(prev => ({ ...prev, [field]: dataUrl }));

          if (field === 'favicon') {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            link.href = dataUrl;
          }
        };
        img.src = resultUrl;
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'branding', label: 'Branding', icon: Monitor },
    { id: 'exam', label: 'Exam Rules', icon: Shield },
    { id: 'results', label: 'Results', icon: FileSpreadsheet },
    { id: 'security', label: 'Security', icon: Lock },
  ];

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
          <p className="text-sm text-slate-500 mt-1">Configure and customize your CBT platform.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-slate-700 bg-white" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" /> Reset
          </Button>
          <Button variant="outline" className="text-slate-700 bg-white">
            <Download className="w-4 h-4 mr-2" /> Backup
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={isSaving}>
            <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Settings'}
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-64 shrink-0">
          <Card className="border-0 shadow-sm ring-1 ring-slate-200 bg-white sticky top-6">
            <div className="p-2 flex flex-col gap-1">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === t.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <t.icon className={`w-5 h-5 ${activeTab === t.id ? 'text-blue-600' : 'text-slate-400'}`} />
                  {t.label}
                </button>
              ))}
            </div>
          </Card>
        </div>

        <div className="flex-1 space-y-6">
          {activeTab === 'general' && (
            <Card className="border-0 shadow-sm ring-1 ring-slate-200">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800">General Settings</h3>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Website Name</label>
                    <input 
                      type="text" 
                      value={settings.websiteName}
                      onChange={e => setSettings({...settings, websiteName: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Contact Email</label>
                    <input 
                      type="email" 
                      value={settings.contactEmail}
                      onChange={e => setSettings({...settings, contactEmail: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-medium text-slate-700">Website Description</label>
                    <textarea 
                      value={settings.websiteDescription}
                      onChange={e => setSettings({...settings, websiteDescription: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm min-h-[100px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Contact Phone</label>
                    <input 
                      type="text" 
                      value={settings.contactPhone}
                      onChange={e => setSettings({...settings, contactPhone: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Organization Address</label>
                    <input 
                      type="text" 
                      value={settings.address}
                      onChange={e => setSettings({...settings, address: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all shadow-sm"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'branding' && (
            <div className="space-y-6">
              <Card className="border-0 shadow-sm ring-1 ring-slate-200">
                <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800">Visuals & Branding</h3>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Website Logo</label>
                      <label className="block border-2 border-dashed border-slate-200 p-6 rounded-xl text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group relative overflow-hidden">
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'websiteLogo')} />
                        {settings.websiteLogo ? (
                          <img src={settings.websiteLogo} alt="Website" className="max-h-20 mx-auto object-contain" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-sm font-semibold text-slate-700">Upload Website Logo</p>
                          </>
                        )}
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Favicon / Icon</label>
                      <label className="block border-2 border-dashed border-slate-200 p-6 rounded-xl text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group relative overflow-hidden">
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'favicon')} />
                        {settings.favicon ? (
                          <img src={settings.favicon} alt="Favicon" className="max-h-20 mx-auto object-contain" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-indigo-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-sm font-semibold text-slate-700">Upload Favicon</p>
                          </>
                        )}
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Dashboard Logo</label>
                      <label className="block border-2 border-dashed border-slate-200 p-6 rounded-xl text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group relative overflow-hidden">
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'dashboardLogo')} />
                        {settings.dashboardLogo ? (
                          <img src={settings.dashboardLogo} alt="Dashboard Logo" className="max-h-20 mx-auto object-contain" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-emerald-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-sm font-semibold text-slate-700">Upload Dashboard Logo</p>
                          </>
                        )}
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Login Background</label>
                      <label className="block border-2 border-dashed border-slate-200 p-6 rounded-xl text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group relative overflow-hidden">
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'loginBackground')} />
                        {settings.loginBackground ? (
                          <img src={settings.loginBackground} alt="Background" className="max-h-20 w-full mx-auto object-cover rounded" />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-sm font-semibold text-slate-700">Upload Login Background</p>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-slate-800">Appearance Mode</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Toggle default interface theme</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">Light</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={settings.darkMode} onChange={e => setSettings({...settings, darkMode: e.target.checked})} />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-800"></div>
                      </label>
                      <span className="text-xs font-semibold text-slate-800">Dark</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'exam' && (
            <Card className="border-0 shadow-sm ring-1 ring-slate-200">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Exam Rules</h3>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Default Exam Duration (Mins)</label>
                    <input 
                      type="number" 
                      value={settings.defaultExamDuration}
                      onChange={e => setSettings({...settings, defaultExamDuration: e.target.value as any})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Pass Mark (%)</label>
                    <input 
                      type="number" 
                      value={settings.passMark}
                      onChange={e => setSettings({...settings, passMark: e.target.value as any})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                  </div>
                  <div className="md:col-span-2 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Stealth AI Anti-Cheat Engine</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Silently track candidates switching tabs, minimizing browser, or changing windows during exams.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.antiCheatingEnabled} onChange={e => setSettings({...settings, antiCheatingEnabled: e.target.checked})} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  <div className="md:col-span-2 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Auto-Submit Exams</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Automatically force submit exams when timer elapses if candidate is still active.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" checked={settings.autoSubmit} onChange={e => setSettings({...settings, autoSubmit: e.target.checked})} />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'results' && (
            <Card className="border-0 shadow-sm ring-1 ring-slate-200">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Result Settings</h3>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-1 max-w-sm mb-6">
                  <label className="text-sm font-medium text-slate-700">System Pass Mark (%)</label>
                  <input 
                    type="number" 
                    value={settings.passMark}
                    onChange={e => setSettings({...settings, passMark: e.target.value as any})}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                  />
                  <p className="text-xs text-slate-500 mt-1">Scores below this percentage will be marked as failed.</p>
                </div>

                <div className="pt-4 border-t border-slate-100 mb-8">
                  <h4 className="text-sm font-bold text-slate-800 mb-4">Grading System Configuration</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <button 
                      onClick={() => setSettings({...settings, gradingStyle: 'waec'})}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${settings.gradingStyle === 'waec' ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                    >
                      <h4 className="font-bold text-sm text-slate-800 mb-1">WAEC Style</h4>
                      <p className="text-xs text-slate-500">Standard 9-point grading (A1, B2... F9).</p>
                    </button>
                    <button 
                      onClick={() => setSettings({...settings, gradingStyle: 'jamb'})}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${settings.gradingStyle === 'jamb' ? 'border-blue-600 bg-blue-50 ring-4 ring-blue-50' : 'border-slate-200 hover:border-blue-300'}`}
                    >
                      <h4 className="font-bold text-sm text-slate-800 mb-1">JAMB Style</h4>
                      <p className="text-xs text-slate-500">400-point aggregate scoring system.</p>
                    </button>
                    <button 
                      onClick={() => setSettings({...settings, gradingStyle: 'custom'})}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${settings.gradingStyle === 'custom' ? 'border-orange-500 bg-orange-50 ring-4 ring-orange-50' : 'border-slate-200 hover:border-orange-300'}`}
                    >
                      <h4 className="font-bold text-sm text-slate-800 mb-1">Custom Grading</h4>
                      <p className="text-xs text-slate-500">Configure unique label and score ranges.</p>
                    </button>
                  </div>

                  {settings.gradingStyle === 'custom' && (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-bold text-slate-700 text-sm">Custom Grade Ranges</h4>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 text-xs bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                          onClick={() => {
                            const newRanges = [...(settings.customGrades || [])];
                            newRanges.push({ id: Math.random().toString(), label: 'New', min: 0, max: 100 });
                            setSettings({...settings, customGrades: newRanges});
                          }}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Add Grade Range
                        </Button>
                      </div>
                      
                      {(!settings.customGrades || settings.customGrades.length === 0) ? (
                         <div className="text-center p-4 text-xs text-slate-500 bg-white rounded border border-slate-200 border-dashed">
                           No custom grades configured yet. Click "Add Grade Range".
                         </div>
                      ) : (
                         <div className="space-y-3">
                           {settings.customGrades.map((g: any, i: number) => (
                             <div key={g.id} className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
                               <div className="flex-1 w-full">
                                  <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block font-bold">Grade Label</label>
                                  <input type="text" value={g.label} onChange={(e) => {
                                      const arr = [...settings.customGrades];
                                      arr[i].label = e.target.value;
                                      setSettings({...settings, customGrades: arr});
                                  }} className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-indigo-500" placeholder="e.g. Excellent, A+" />
                               </div>
                               <div className="w-full sm:w-24">
                                  <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block font-bold">Min %</label>
                                  <input type="number" value={g.min} onChange={(e) => {
                                      const arr = [...settings.customGrades];
                                      arr[i].min = Number(e.target.value);
                                      setSettings({...settings, customGrades: arr});
                                  }} className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-indigo-500" />
                               </div>
                               <div className="w-full sm:w-24">
                                  <label className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 block font-bold">Max %</label>
                                  <input type="number" value={g.max} onChange={(e) => {
                                      const arr = [...settings.customGrades];
                                      arr[i].max = Number(e.target.value);
                                      setSettings({...settings, customGrades: arr});
                                  }} className="w-full text-sm border border-slate-300 rounded px-2 py-1.5 focus:ring-1 focus:ring-indigo-500" />
                               </div>
                               <div className="w-full sm:w-10 sm:pt-5 pt-0">
                                  <button onClick={() => {
                                      const arr = [...settings.customGrades];
                                      arr.splice(i, 1);
                                      setSettings({...settings, customGrades: arr});
                                  }} className="w-full h-8 flex items-center justify-center text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 rounded transition-colors">
                                     <Trash2 className="w-4 h-4" />
                                  </button>
                               </div>
                             </div>
                           ))}
                         </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Enable Candidate Result Download</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Allow candidates to download and print their results from the dashboard.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="mt-8 flex justify-end">
                   <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSave} disabled={isSaving}>
                     <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : saveSuccess ? 'Settings Saved!' : 'Save Settings'}
                   </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="border-0 shadow-sm ring-1 ring-slate-200 border-l-4 border-l-amber-500">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <h3 className="font-bold text-slate-800">Security & Access</h3>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4 max-w-md">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Change Admin Password</label>
                    <input type="password" placeholder="Current password" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm" />
                  </div>
                  <div className="space-y-1">
                    <input type="password" placeholder="New password" className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm" />
                  </div>
                  <Button className="w-full bg-slate-800 hover:bg-slate-900">Update Password</Button>
                </div>

                <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Session Timeout</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Automatically log out inactive admins after 30 minutes.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
