import * as React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { 
  Snowflake, ArrowRight, Mail, Lock, Eye, EyeOff, 
  ShieldCheck, Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';

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
    if (savedEmail) { setEmail(savedEmail); setRememberMe(true); }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (rememberMe) localStorage.setItem('rememberedEmail', email);
      else localStorage.removeItem('rememberedEmail');
      toast.success(t('auth.loginSuccess'));
      navigate('/');
    } catch (error: any) {
      toast.error(t('auth.credentialsError'));
    } finally { setLoading(false); }
  };

  const handleForgotPassword = async () => {
    if (!email) { toast.error(t('auth.enterEmailFirst', 'Enter your email first')); return; }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(t('auth.resetSent', 'Recovery email sent'));
    } catch (error: any) { toast.error(error.message); }
    finally { setResetLoading(false); }
  };

  const toggleLanguage = () => {
    const langs = ['en', 'te', 'hi'];
    i18n.changeLanguage(langs[(langs.indexOf(i18n.language) + 1) % langs.length]);
  };

  // Particle system
  const particles = React.useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    id: i, size: Math.random() * 4 + 1, x: Math.random() * 100, y: Math.random() * 100,
    duration: Math.random() * 25 + 15, delay: Math.random() * -20,
  })), []);

  return (
    <div className="h-screen w-screen flex bg-[#020617] overflow-hidden relative font-sans selection:bg-emerald-500/30">
      {/* === Cinematic Background === */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Moving gradient orbs */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], x: [0, 60, 0], y: [0, -40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[30%] -left-[20%] w-[70%] h-[70%] rounded-full blur-[160px] bg-emerald-600/[0.07]"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2], x: [0, -40, 0], y: [0, 50, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-[25%] -right-[15%] w-[60%] h-[60%] rounded-full blur-[160px] bg-blue-600/[0.05]"
        />
        <motion.div
          animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 35, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50%] h-[50%] rounded-full blur-[200px] bg-teal-500/[0.04]"
        />

        {/* Animated grid mesh */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_50%,#000_40%,transparent_100%)]" />

        {/* Floating particles */}
        {particles.map((p) => (
          <motion.div key={p.id}
            className="absolute rounded-full bg-emerald-400/30"
            style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
            animate={{ y: [0, -80, 0], opacity: [0.15, 0.6, 0.15] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* Language switch */}
      <button onClick={toggleLanguage}
        className="absolute top-5 right-6 z-50 flex items-center gap-2 h-9 px-4 rounded-lg bg-white/[0.04] border border-white/10 hover:border-emerald-500/40 text-white/70 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all backdrop-blur-sm"
      >
        <Globe size={12} className="text-emerald-400" /> {i18n.language.toUpperCase()}
      </button>

      {/* === Left Panel: Brand === */}
      <div className="hidden lg:flex lg:w-[52%] relative items-center justify-center z-10">
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }} className="max-w-xl px-16 space-y-8"
        >
          <div className="flex items-center gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              className="h-14 w-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/25"
            >
              <Snowflake className="h-8 w-8 text-white" />
            </motion.div>
            <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
              ColdChain <span className="text-emerald-400">OS</span>
            </h1>
          </div>

          <h2 className="text-5xl font-black text-white tracking-tight leading-[1.05] uppercase italic">
            {t('auth.brandTitle', 'Enterprise')}<br/>
            {t('auth.brandSubtitle', 'Cold Storage')}<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              {t('auth.brandHighlight', 'Operating System.')}
            </span>
          </h2>

          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-md">
            {t('auth.brandDesc', 'Digital infrastructure for warehouse management, logistics automation, and real-time register operations.')}
          </p>

          {/* Subtle animated warehouse silhouette elements */}
          <div className="flex gap-3 pt-4">
            {[...Array(5)].map((_, i) => (
              <motion.div key={i}
                animate={{ height: [20 + i * 8, 40 + i * 6, 20 + i * 8] }}
                transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
                className="w-8 rounded-t-md bg-gradient-to-t from-emerald-500/20 to-emerald-500/5 border border-emerald-500/10"
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* === Right Panel: Login Form === */}
      <div className="w-full lg:w-[48%] flex items-center justify-center px-6 sm:px-10 lg:px-16 z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="w-full max-w-[420px] space-y-7"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden mb-4">
            <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Snowflake className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black text-white italic uppercase tracking-tighter">ColdChain <span className="text-emerald-400">OS</span></span>
          </div>

          {/* Glass card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 lg:p-10 space-y-7 shadow-2xl">
            <div>
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                {t('auth.login')}
              </h3>
              <p className="text-slate-600 font-bold uppercase tracking-widest text-[9px] mt-1">
                {t('auth.encryptedEndpoint')}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  {t('auth.emailLabel')}
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 z-10" />
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-4 text-sm text-white font-medium placeholder:text-slate-700 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    {t('auth.passwordLabel')}
                  </label>
                  <button type="button" onClick={handleForgotPassword} disabled={resetLoading}
                    className="text-[9px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors">
                    {resetLoading ? '...' : t('auth.forgot')}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 z-10" />
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-12 text-sm text-white font-medium placeholder:text-slate-700 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-emerald-400 transition-colors z-10"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none px-1">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/[0.04] text-emerald-500 focus:ring-emerald-500/20 accent-emerald-500"
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {t('auth.remember')}
                </span>
              </label>

              {/* Submit */}
              <Button type="submit" disabled={loading}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/15 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">{t('auth.login')} <ArrowRight size={14} /></span>
                )}
              </Button>
            </form>
          </div>

          {/* Footer links */}
          <div className="flex flex-col items-center gap-3 pt-2">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              {t('auth.newAccount')}{' '}
              <Link to="/signup" className="text-emerald-400 hover:text-emerald-300 transition-colors underline underline-offset-4">
                {t('auth.register')}
              </Link>
            </p>
            <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-800 uppercase tracking-widest">
              <ShieldCheck size={10} className="text-emerald-900" /> {t('auth.encryptedEndpoint')}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
