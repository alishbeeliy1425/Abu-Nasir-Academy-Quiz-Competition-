import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowLeft, Upload, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { db } from '../../lib/store';
import { useSettings } from '../../components/SettingsProvider';

export default function Register() {
  const navigate = useNavigate();
  const settings = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    schoolName: '',
    address: '',
    state: '',
    country: ''
  });
  const [photoUrl, setPhotoUrl] = useState<string>('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('Please upload a valid JPG or PNG image');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 250;
        const MAX_HEIGHT = 250;
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
        ctx?.drawImage(img, 0, 0, width, height);
        
        // Compress to JPEG with 0.7 quality to save space
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setPhotoUrl(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setIsLoading(false);
      return;
    }

    if (!photoUrl) {
      setError('Please upload a profile photo to continue.');
      setIsLoading(false);
      return;
    }

    const state = db.get();
    if (state.users.some(u => u.email === formData.email)) {
      setError('Email already exists in system');
      setIsLoading(false);
      return;
    }

    const currentYear = new Date().getFullYear();
    const candidateCount = state.users.filter(u => u.role === 'candidate').length + 1;
    const serialNumber = `ANA${currentYear}${candidateCount.toString().padStart(3, '0')}`;

    // Create user
    db.addUser({
      id: `std_${Date.now()}_${Math.random().toString(36).substring(2,9)}`,
      role: 'candidate',
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password, // Simple non-hashed storage for local demo
      serialNumber: serialNumber,
      schoolName: formData.schoolName,
      address: formData.address,
      state: formData.state,
      country: formData.country,
      photoUrl: photoUrl
    });

    setSuccess(true);
    
    // Auto navigate to login after a short delay
    setTimeout(() => {
      navigate('/login?role=candidate');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 relative" style={{
      backgroundImage: settings.loginBackground ? `url('${settings.loginBackground}')` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {settings.loginBackground && <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-0"></div>}

      <div className="w-full max-w-xl relative z-10">
        <Button variant="ghost" className={`mb-6 hover:bg-slate-200 ${settings.loginBackground ? 'text-white hover:text-white hover:bg-white/20' : ''}`} onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Button>
        
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3 }}>
          <Card className="shadow-2xl border-slate-200">
            <CardHeader className="text-center pt-8 pb-4 border-b border-slate-100 bg-white rounded-t-xl">
              {settings.websiteLogo ? (
                <div className="mx-auto mb-4 pb-2">
                  <img src={settings.websiteLogo} alt="Logo" className="mx-auto h-20 object-contain drop-shadow-sm" />
                </div>
              ) : (
                <div className="mx-auto bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <GraduationCap className="h-8 w-8 text-blue-600" />
                </div>
              )}
              <h2 className="text-3xl font-bold text-slate-800">{settings.websiteName || 'Candidate Registration'}</h2>
              <p className="text-sm text-slate-500 mt-2">Create your professional account to access exams and quizzes</p>
            </CardHeader>
            <CardContent className="bg-slate-50 pt-6">
              {success ? (
                 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-12">
                   <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex flex-col items-center justify-center mb-6">
                     <GraduationCap className="w-10 h-10" />
                   </div>
                   <h3 className="text-2xl font-bold text-slate-800">Registration Successful!</h3>
                   <p className="text-slate-500 mt-2">Redirecting you to login...</p>
                 </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200 flex items-start">
                      <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                  
                  {/* Photo Upload Section */}
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <label className="block text-sm font-semibold text-slate-700 mb-4">Profile Photo (Required)</label>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                        {photoUrl ? (
                          <img src={photoUrl} alt="Profile Preview" className="w-full h-full object-cover" />
                        ) : (
                          <Upload className="w-8 h-8 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 space-y-3 w-full text-center sm:text-left">
                        <input
                          type="file"
                          accept="image/jpeg, image/png"
                          className="hidden"
                          ref={fileInputRef}
                          onChange={handlePhotoUpload}
                        />
                        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => fileInputRef.current?.click()}>
                          Choose Image (JPG, PNG)
                        </Button>
                        <div className="flex items-start bg-red-50 p-2.5 rounded-md border border-red-100">
                           <AlertCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 shrink-0" />
                           <p className="text-xs font-bold text-red-600 leading-tight">
                             NIQOBIT ARE RESTRICTED FROM UPLOADING
                           </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Full Name</label>
                      <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe" required className="bg-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Email Address</label>
                      <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="Enter your email" required className="bg-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Phone Number</label>
                      <Input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Your phone number" required className="bg-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase">School Name</label>
                      <Input value={formData.schoolName} onChange={(e) => setFormData({...formData, schoolName: e.target.value})} placeholder="Current school" required className="bg-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1 md:col-span-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Country</label>
                      <Input value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} placeholder="e.g. Nigeria" required className="bg-white" />
                    </div>
                    <div className="space-y-1 md:col-span-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase">State/Province</label>
                      <Input value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} placeholder="e.g. Lagos" required className="bg-white" />
                    </div>
                    <div className="space-y-1 md:col-span-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Address</label>
                      <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Street address" required className="bg-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Password</label>
                      <Input type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} placeholder="Create a strong password" required className="bg-white" />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase">Confirm Password</label>
                      <Input type="password" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})} placeholder="Confirm your password" required className="bg-white" />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-200">
                    <Button type="submit" className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700 shadow-md" disabled={isLoading}>
                      {isLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</> : 'Complete Registration'}
                    </Button>
                  </div>

                  <p className="text-center text-sm text-slate-600 mt-6 pb-2">
                    Already have an account?{' '}
                    <button type="button" onClick={() => navigate('/login?role=candidate')} className="text-blue-600 font-bold hover:underline">
                      Sign In Now
                    </button>
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
