import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { useAuth } from '../../components/AuthProvider';
import { useSettings } from '../../components/SettingsProvider';

export default function Login() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get('role') || 'candidate';
  const roleTitle = role.charAt(0).toUpperCase() + role.slice(1);
  const settings = useSettings();
  
  const [email, setEmail] = useState(`student@example.com`);
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Set default based on role
  React.useEffect(() => {
    if (role === 'staff') setEmail('staff@abunasir.edu');
    else setEmail('student@example.com');
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    // Simple validation
    if (!email || !password) {
      setError('Please fill in all fields');
      setIsLoading(false);
      return;
    }

    const foundUser = db.login(email);
    if (foundUser?.accountStatus === 'suspended') {
      setError('Your account has been suspended. Please contact support.');
      setIsLoading(false);
      return;
    }

    const success = await login(email);
    
    // Check account status after successful login attempt logic to prevent suspended users
    if (success) {
      if (role === 'staff') navigate('/staff');
      else navigate('/candidate');
    } else {
      setError('Invalid credentials for this role');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative" style={{
      backgroundImage: settings.loginBackground ? `url('${settings.loginBackground}')` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      {settings.loginBackground && <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-0"></div>}
      
      <div className="w-full max-w-md relative z-10">
        <Button variant="ghost" className={`mb-6 ${settings.loginBackground ? 'text-white hover:text-white hover:bg-white/20' : ''}`} onClick={() => navigate('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Home
        </Button>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="shadow-2xl border-0 overflow-hidden backdrop-blur-md bg-white/95">
            <CardHeader className="text-center pt-8 pb-4">
              <div className="mx-auto flex flex-col items-center justify-center mb-2">
                {settings.websiteLogo ? (
                  <img src={settings.websiteLogo} alt="Logo" className="h-16 object-contain mb-4" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.style.display = 'none'; }} />
                ) : (
                  <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                    <GraduationCap className={`h-8 w-8 ${role === 'candidate' ? 'text-blue-600' : role === 'staff' ? 'text-orange-600' : 'text-purple-600'}`} />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{settings.websiteName || 'CBT Platform'}</h2>
              <p className="text-sm text-gray-500 mt-2">{roleTitle} Login - Sign in to access your dashboard</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4 pb-4">
                {error && (
                  <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                    {error}
                  </div>
                )}
                
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
                
                <div className="space-y-1">
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                  />
                  <div className="flex justify-end">
                    <button type="button" className="text-xs text-blue-600 hover:underline">
                      Forgot Password?
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </div>

                {role === 'candidate' && (
                  <p className="text-center text-sm text-gray-600 mt-6">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => navigate('/register')} className="text-blue-600 font-medium hover:underline">
                      Create one
                    </button>
                  </p>
                )}
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
