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
  Warehouse
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
  const { t } = useTranslation();

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
      toast.success(t('auth.loginSuccess', 'Access Authorized'));
      navigate('/');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email first to reset password.');
      return;
    }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-slate-950 font-sans selection:bg-emerald-500/30 overflow-hidden">
      {/* Left Column: Visual Brand Experience */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#020617] overflow-hidden items-center justify-center border-r border-white/5">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[70%] h-[70%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[70%] h-[70%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        </div>

        <div className="relative z-10 p-20 max-w-2xl">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <div className="flex items-center gap-4 mb-12">
               <div className="h-16 w-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-emerald-500/40">
                  <Snowflake className="h-10 w-10 text-white" />
               </div>
               <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">
                  ColdChain <span className="text-emerald-400">OS</span>
               </h1>
            </div>
            
            <h2 className="text-6xl font-black text-white tracking-tight leading-[1.1] mb-8">
              Digital Infrastructure for <span className="text-emerald-400">Modern Cold Storage.</span>
            </h2>
            
            <p className="text-slate-400 text-lg font-medium leading-relaxed mb-12">
              The next-generation operating system for enterprise-grade warehouse management, real-time telemetry, and logistics automation.
            </p>

            <div className="grid grid-cols-2 gap-8">
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold uppercase tracking-widest text-[10px]">
                     <CheckCircle2 size={14} /> Global Standard
                  </div>
                  <p className="text-slate-500 text-xs">Certified for ISO-9001 and high-security data protocols.</p>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-[10px]">
                     <Clock size={14} /> Real-time Nodes
                  </div>
                  <p className="text-slate-500 text-xs">Millisecond-level synchronization across all warehouse clusters.</p>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Abstract Floating UI Elements */}
        <motion.div 
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-20 right-20 w-64 h-32 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-3xl p-6 shadow-2xl"
        >
           <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Node</span>
              </div>
              <Warehouse size={16} className="text-slate-500" />
           </div>
           <div className="space-y-2">
              <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                 <div className="h-full w-[82%] bg-emerald-500" />
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-right">82% Capacity</p>
           </div>
        </motion.div>
      </div>

      {/* Right Column: Authentication Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-20 relative">
        <div className="absolute top-0 right-0 w-full h-full lg:hidden z-0">
           <div className="absolute top-0 left-0 w-full h-full bg-[#020617] opacity-95" />
           <div className="absolute top-0 -left-1/4 w-[1000px] h-[1000px] bg-emerald-500/10 rounded-full blur-[150px] animate-pulse" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[440px] relative z-10"
        >
          <div className="mb-12">
            <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-4">Initialize <span className="text-emerald-500">Access</span></h3>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Enter your operational credentials to proceed.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 ml-2">Operator Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-emerald-400 transition-colors z-20" />
                  <Input 
                    type="email" 
                    placeholder="mail@warehouse.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-16 bg-white/[0.03] border-white/[0.08] rounded-[1.5rem] pl-16 pr-8 text-white text-sm font-bold focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-slate-700"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between px-2">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Access Key</Label>
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors"
                  >
                    {resetLoading ? 'Transmitting...' : 'Forgot Access Key?'}
                  </button>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-600 group-focus-within:text-emerald-400 transition-colors z-20" />
                  <Input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-16 bg-white/[0.03] border-white/[0.08] rounded-[1.5rem] pl-16 pr-16 text-white text-sm font-bold focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 hover:text-emerald-400 transition-colors z-20 p-1"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3 px-2">
               <Checkbox 
                 id="remember" 
                 checked={rememberMe}
                 onCheckedChange={(checked) => setRememberMe(checked === true)}
                 className="border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
               />
               <label htmlFor="remember" className="text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer select-none">
                 Remember this device
               </label>
            </div>

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full h-18 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-900/20 transition-all active:scale-[0.98] relative overflow-hidden"
            >
              {loading ? (
                <div className="h-6 w-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span className="flex items-center justify-center gap-3">
                  Authorize Access <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </form>

          <div className="mt-10 pt-8 border-t border-white/[0.05] flex flex-col items-center gap-4">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              New Node operator? 
              <Link to="/signup" className="ml-2 text-emerald-400 hover:text-emerald-300 transition-colors hover:underline">
                Register Instance
              </Link>
            </p>
            <div className="flex items-center gap-2 text-[8px] font-black text-slate-700 uppercase tracking-widest">
              <ShieldCheck size={12} className="text-emerald-900" /> Encrypted Endpoint: coldchain.node.v4
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
