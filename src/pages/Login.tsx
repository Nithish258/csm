import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { useTranslation } from 'react-i18next';
import {
  Snowflake, ArrowRight, Mail, Lock, Eye, EyeOff,
  ShieldCheck, Globe, Thermometer, Box, Layers
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

  // Parallax mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springCfg = { damping: 25, stiffness: 100 };
  const parallaxX = useSpring(useTransform(mouseX, [0, 1], [-15, 15]), springCfg);
  const parallaxY = useSpring(useTransform(mouseY, [0, 1], [-10, 10]), springCfg);
  const tiltX = useSpring(useTransform(mouseY, [0, 1], [3, -3]), springCfg);
  const tiltY = useSpring(useTransform(mouseX, [0, 1], [-3, 3]), springCfg);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    mouseX.set(clientX / window.innerWidth);
    mouseY.set(clientY / window.innerHeight);
  };

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
    if (!email) { toast.error(t('auth.enterEmailFirst')); return; }
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success(t('auth.resetSent'));
    } catch (error: any) { toast.error(error.message); }
    finally { setResetLoading(false); }
  };

  const toggleLanguage = () => {
    const langs = ['en', 'te', 'hi'];
    i18n.changeLanguage(langs[(langs.indexOf(i18n.language) + 1) % langs.length]);
  };

  // Generate particle system
  const particles = React.useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i, size: Math.random() * 3 + 1.5, x: Math.random() * 100, y: Math.random() * 100,
    duration: Math.random() * 20 + 12, delay: Math.random() * -15,
    dx: (Math.random() - 0.5) * 60,
  })), []);

  // Warehouse structure lines
  const structureLines = React.useMemo(() => Array.from({ length: 8 }).map((_, i) => ({
    id: i, width: 40 + Math.random() * 120, left: 10 + Math.random() * 80,
    top: 15 + i * 10, opacity: 0.04 + Math.random() * 0.06,
  })), []);

  return (
    <div className="h-screen w-screen flex bg-[#020617] overflow-hidden relative font-sans selection:bg-emerald-500/30" onMouseMove={handleMouseMove}>
      {/* === LAYER 1: Deep Background Grid === */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,#000_30%,transparent_100%)] opacity-60" />
      </div>

      {/* === LAYER 2: Moving Gradient Orbs === */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.4, 1], x: ['0%', '8%', '0%'], y: ['0%', '-6%', '0%'], rotate: [0, 45, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] rounded-full blur-[180px] bg-emerald-500/[0.08]"
        />
        <motion.div
          animate={{ scale: [1.3, 1, 1.3], x: ['0%', '-6%', '0%'], y: ['0%', '8%', '0%'] }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-[15%] -right-[5%] w-[50%] h-[50%] rounded-full blur-[180px] bg-blue-500/[0.06]"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
          className="absolute top-[40%] left-[30%] w-[30%] h-[30%] rounded-full blur-[200px] bg-teal-400/[0.04]"
        />
        <motion.div
          animate={{ scale: [1.1, 0.9, 1.1], x: ['0%', '5%', '0%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-[10%] right-[20%] w-[25%] h-[25%] rounded-full blur-[150px] bg-cyan-400/[0.03]"
        />
      </div>

      {/* === LAYER 3: Floating Particles === */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <motion.div key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%`,
              background: `radial-gradient(circle, rgba(52,211,153,0.6) 0%, rgba(52,211,153,0) 70%)`
            }}
            animate={{ y: [0, -120, 0], x: [0, p.dx, 0], opacity: [0.1, 0.7, 0.1], scale: [1, 1.5, 1] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
          />
        ))}
      </div>

      {/* === LAYER 4: Warehouse Structure Silhouettes === */}
      <motion.div className="absolute inset-0 pointer-events-none" style={{ x: parallaxX, y: parallaxY }}>
        {structureLines.map((line) => (
          <motion.div key={line.id}
            className="absolute h-px bg-gradient-to-r from-transparent via-emerald-400 to-transparent"
            style={{ width: line.width, left: `${line.left}%`, top: `${line.top}%`, opacity: line.opacity }}
            animate={{ opacity: [line.opacity * 0.5, line.opacity, line.opacity * 0.5], scaleX: [0.8, 1, 0.8] }}
            transition={{ duration: 6 + line.id * 0.8, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
        {/* Warehouse blocks silhouette */}
        <div className="absolute bottom-[8%] left-[5%] flex gap-3 items-end opacity-[0.04]">
          {[60, 90, 75, 100, 55, 85, 70].map((h, i) => (
            <motion.div key={i}
              animate={{ height: [h, h + 15, h] }}
              transition={{ duration: 4 + i * 0.6, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
              className="w-10 bg-emerald-400 rounded-t-sm border border-emerald-400/30"
              style={{ height: h }}
            />
          ))}
        </div>
        {/* Cold pipes */}
        <div className="absolute top-[20%] left-[8%] flex flex-col gap-6 opacity-[0.03]">
          {[180, 140, 200].map((w, i) => (
            <motion.div key={i}
              className="h-0.5 bg-gradient-to-r from-cyan-400 via-emerald-400 to-transparent rounded-full"
              style={{ width: w }}
              animate={{ opacity: [0.3, 0.8, 0.3], width: [w * 0.9, w, w * 0.9] }}
              transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
            />
          ))}
        </div>
      </motion.div>

      {/* Language Switcher */}
      <button onClick={toggleLanguage}
        className="absolute top-5 right-6 z-50 flex items-center gap-2 h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/40 text-white/70 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all backdrop-blur-sm"
      >
        <Globe size={12} className="text-emerald-400" /> {i18n.language.toUpperCase()}
      </button>

      {/* === LEFT PANEL: Immersive Brand Experience === */}
      <div className="hidden lg:flex lg:w-[55%] relative items-center justify-center z-10">
        <motion.div
          initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ x: parallaxX, y: parallaxY }}
          className="max-w-2xl px-16 space-y-10"
        >
          {/* Logo */}
          <div className="flex items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
              className="h-16 w-16 bg-gradient-to-br from-emerald-400 via-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-emerald-500/30"
            >
              <Snowflake className="h-9 w-9 text-white" />
            </motion.div>
            <div>
              <h1 className="text-2xl font-black text-white tracking-tighter uppercase italic">
                ColdChain <span className="text-emerald-400">OS</span>
              </h1>
              <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600">Enterprise Platform v4.2</p>
            </div>
          </div>

          {/* Main heading */}
          <h2 className="text-[3.2rem] font-black text-white tracking-tight leading-[1] uppercase italic">
            {t('auth.brandTitle', 'Enterprise')}<br/>
            {t('auth.brandSubtitle', 'Cold Storage')}<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              {t('auth.brandHighlight', 'Operating System.')}
            </span>
          </h2>

          <p className="text-slate-500 text-sm font-medium leading-relaxed max-w-lg">
            {t('auth.brandDesc', 'Digital infrastructure for warehouse management, logistics automation, and real-time register operations.')}
          </p>

          {/* Live Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Thermometer, label: t('auth.statTemp', 'Temp Control'), value: '-18°C', color: 'text-cyan-400' },
              { icon: Box, label: t('auth.statStorage', 'Active Lots'), value: '2,847', color: 'text-emerald-400' },
              { icon: Layers, label: t('auth.statChambers', 'Chambers'), value: '12', color: 'text-blue-400' },
            ].map((stat, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.15 }}
                className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-4 space-y-2 hover:border-emerald-500/20 transition-all"
              >
                <stat.icon size={18} className={stat.color} />
                <p className="text-lg font-black text-white italic tracking-tighter">{stat.value}</p>
                <p className="text-[7px] font-black uppercase tracking-[0.2em] text-slate-600">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Animated warehouse bar chart */}
          <div className="flex items-end gap-2 pt-2">
            {[28, 45, 35, 55, 40, 60, 32, 50, 38, 48, 42, 56].map((h, i) => (
              <motion.div key={i}
                animate={{ height: [h * 0.7, h, h * 0.7] }}
                transition={{ duration: 3 + i * 0.3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.15 }}
                className="w-4 rounded-t-sm bg-gradient-to-t from-emerald-500/25 to-emerald-500/5 border border-emerald-500/10"
                style={{ height: h }}
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* === RIGHT PANEL: Login Form with Glass + Tilt === */}
      <div className="w-full lg:w-[45%] flex items-center justify-center px-6 sm:px-10 lg:px-14 z-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1200 }}
          className="w-full max-w-[420px]"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-3 lg:hidden mb-6">
            <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Snowflake className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-black text-white italic uppercase tracking-tighter">ColdChain <span className="text-emerald-400">OS</span></span>
          </div>

          {/* Glass card with light reflection */}
          <div className="relative bg-white/[0.025] backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 lg:p-10 shadow-2xl shadow-black/20 space-y-7">
            {/* Glass reflection */}
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none" />
            {/* Glow edge */}
            <div className="absolute -inset-px rounded-3xl bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none opacity-50" />

            <div className="relative">
              <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">
                {t('auth.login')}
              </h3>
              <p className="text-slate-600 font-bold uppercase tracking-widest text-[9px] mt-1">
                {t('auth.encryptedEndpoint')}
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5 relative">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">
                  {t('auth.emailLabel')}
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors z-10" />
                  <input
                    type="email" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('auth.emailPlaceholder')}
                    className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-4 text-sm text-white font-medium placeholder:text-slate-700 outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-500/10 transition-all"
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
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors z-10" />
                  <input
                    type={showPassword ? 'text' : 'password'} required value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    className="w-full h-12 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-12 text-sm text-white font-medium placeholder:text-slate-700 outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-500/10 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-emerald-400 transition-colors z-10"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none px-1">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-white/20 bg-white/[0.04] accent-emerald-500 focus:ring-emerald-500/20"
                />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {t('auth.remember')}
                </span>
              </label>

              {/* Submit */}
              <Button type="submit" disabled={loading}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
              >
                {loading ? (
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">{t('auth.login')} <ArrowRight size={14} /></span>
                )}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center gap-3 pt-6">
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
