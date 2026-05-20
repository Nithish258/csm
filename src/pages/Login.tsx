import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Snowflake, 
  ArrowRight, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ShieldCheck,
  CheckCircle2,
  Clock,
  Warehouse,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Checkbox } from '../components/ui/checkbox';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }
      toast.success(t('auth.loginSuccess'));
      navigate('/');
    } catch (error: any) {
      toast.error(t('auth.credentialsError'));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email first to recover access key.');
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Access recovery code dispatched to your inbox.');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  const toggleLanguage = () => {
    const langs = ['en', 'te', 'hi'];
    const nextIndex = (langs.indexOf(i18n.language) + 1) % langs.length;
    i18n.changeLanguage(langs[nextIndex]);
  };

  // Generate 25 floating particle dots with random parameters
  const particles = Array.from({ length: 20 }).map((_, i) => ({
    id: i,
    size: Math.random() * 6 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * -20,
  }));

  return (
    <div className="min-h-screen w-full flex bg-[#020617] font-sans selection:bg-emerald-500/30 overflow-hidden relative">
      {/* Cinematic Tech Mesh Background Grid */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Glowing slow ambient meshes */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, -30, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/4 -left-1/4 w-[80%] h-[80%] bg-gradient-radial from-emerald-500/10 via-transparent to-transparent rounded-full blur-[140px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [180, 270, 180],
            x: [0, -50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/4 -right-1/4 w-[80%] h-[80%] bg-gradient-radial from-blue-500/8 via-transparent to-transparent rounded-full blur-[140px]" 
        />
        
        {/* Animated perspective mesh grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />

        {/* Floating particles */}
        {particles.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-emerald-400/20 blur-[1px]"
            style={{
              width: p.size,
              height: p.size,
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
            animate={{
              y: [0, -100, 0],
              x: [0, Math.random() * 40 - 20, 0],
              opacity: [0.2, 0.8, 0.2]
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "easeInOut"
            }}
          />
        ))}
      </div>

      {/* Language Switcher in absolute header corner */}
      <div className="absolute top-6 right-8 z-50 flex items-center gap-4">
        <button 
          onClick={toggleLanguage}
          className="flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-900/60 border border-white/10 hover:border-emerald-500/50 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg backdrop-blur-md active:scale-95"
        >
          <Globe size={14} className="text-emerald-400" />
          {i18n.language.toUpperCase()}
        </button>
      </div>

      {/* Left Column: Visual Brand Experience */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden items-center justify-center z-10">
        <div className="p-20 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
               <div className="h-16 w-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[1.25rem] flex items-center justify-center shadow-2xl shadow-emerald-500/30">
                  <Snowflake className="h-10 w-10 text-white animate-spin-slow" />
               </div>
               <h1 className="text-3xl font-black text-white tracking-tighter uppercase italic">
                  ColdChain <span className="text-emerald-400">OS</span>
               </h1>
            </div>
            
            <h2 className="text-6xl font-black text-white tracking-tight leading-[1.05] uppercase italic">
              Digital <br/>
              Infrastructure for <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-400">Modern Cold Storage.</span>
            </h2>
            
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-lg">
              The next-generation operating system for enterprise-grade warehouse management, real-time telemetry, and physical register logistics automation.
            </p>

            <div className="grid grid-cols-2 gap-8 pt-4">
               <div className="space-y-2 border-l-2 border-emerald-500/40 pl-4">
                  <div className="flex items-center gap-2 text-emerald-400 font-black uppercase tracking-widest text-[10px]">
                     <CheckCircle2 size={14} /> Global Standard
                  </div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">ISO-9001 SECURITY COMPLIANT</p>
               </div>
               <div className="space-y-2 border-l-2 border-blue-500/40 pl-4">
                  <div className="flex items-center gap-2 text-blue-400 font-black uppercase tracking-widest text-[10px]">
                     <Clock size={14} /> Real-time Nodes
                  </div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">MILLISECOND SYNC LATENCY</p>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Floating Telemetry Active Node - Aligned elegantly at the bottom left */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="absolute bottom-16 left-20 w-80 bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-6 shadow-2xl space-y-4 hover:border-emerald-500/30 transition-all group"
        >
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                 <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                 </span>
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Node Telemetry</span>
              </div>
              <Warehouse size={16} className="text-emerald-500" />
           </div>
           <div className="space-y-2">
              <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                 <span>Active Occupancy</span>
                 <span className="text-emerald-400">82%</span>
              </div>
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full w-[82%] bg-emerald-500 rounded-full" />
              </div>
           </div>
        </motion.div>
      </div>

      {/* Right Column: Authentication Form with Glassmorphic Card */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8 lg:p-20 z-10 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[480px] bg-slate-950/65 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-10 lg:p-12 shadow-2xl space-y-8 hover:border-emerald-500/20 transition-all relative"
        >
          {/* Subtle Parallax Card Light Reflection */}
          <div className="absolute inset-0 rounded-[2.5rem] bg-gradient-to-tr from-white/0 via-white/5 to-white/0 pointer-events-none" />

          <div className="space-y-2">
            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">
              {t('auth.login')} <span className="text-emerald-500">Access</span>
            </h3>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">
              {t('auth.backToLogin')}
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                  {t('auth.emailLabel')}
                </Label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors z-20" />
                  <Input 
                    type="email" 
                    placeholder={t('auth.emailPlaceholder')} 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-14 bg-white/[0.03] border-white/10 rounded-2xl pl-14 pr-4 text-white text-xs font-bold focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t('auth.passwordLabel')}
                  </Label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    {resetLoading ? 'Transmitting...' : t('auth.forgot')}
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors z-20" />
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder={t('auth.passwordPlaceholder')} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-14 bg-white/[0.03] border-white/10 rounded-2xl pl-14 pr-14 text-white text-xs font-bold focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors z-20 p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 px-1">
               <Checkbox 
                 id="remember" 
                 checked={rememberMe}
                 onCheckedChange={(checked) => setRememberMe(checked === true)}
                 className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 rounded"
               />
               <label htmlFor="remember" className="text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-pointer select-none">
                 {t('auth.remember')}
               </label>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-emerald-500/10 transition-all active:scale-[0.98] relative overflow-hidden"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="flex items-center justify-center gap-3">
                  {t('auth.login')} <ArrowRight size={16} />
                </span>
              )}
            </Button>
          </form>

          <div className="pt-6 border-t border-white/5 flex flex-col items-center gap-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {t('auth.newAccount')}?{' '}
              <Link to="/signup" className="ml-2 text-emerald-400 hover:text-emerald-300 transition-colors hover:underline">
                {t('auth.register')}
              </Link>
            </p>
            <div className="flex items-center gap-2 text-[8px] font-black text-slate-700 uppercase tracking-widest">
              <ShieldCheck size={12} className="text-emerald-900" /> {t('auth.encryptedEndpoint')}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
