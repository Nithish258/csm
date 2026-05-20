import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Building2, User, Mail, Phone, Lock, Snowflake, ArrowRight, ShieldCheck, Eye, EyeOff, Globe, Box, Layers, Thermometer } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function Signup() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    orgName: '', ownerName: '', email: '', password: '', phone: '',
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springCfg = { damping: 25, stiffness: 100 };
  const parallaxX = useSpring(useTransform(mouseX, [0, 1], [-12, 12]), springCfg);
  const parallaxY = useSpring(useTransform(mouseY, [0, 1], [-8, 8]), springCfg);
  const tiltX = useSpring(useTransform(mouseY, [0, 1], [2, -2]), springCfg);
  const tiltY = useSpring(useTransform(mouseX, [0, 1], [-2, 2]), springCfg);

  const handleMouseMove = (e: React.MouseEvent) => {
    mouseX.set(e.clientX / window.innerWidth);
    mouseY.set(e.clientY / window.innerHeight);
  };

  const toggleLanguage = () => {
    const langs = ['en', 'te', 'hi'];
    const nextLang = langs[(langs.indexOf(i18n.language) + 1) % langs.length];
    i18n.changeLanguage(nextLang);
    localStorage.setItem('i18nextLng', nextLang);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      const tenantId = `tenant_${Date.now()}`;
      const tenantSlug = formData.orgName.toLowerCase().replace(/[^a-z0-9]/g, '-');

      try {
        await setDoc(doc(db, 'tenants', tenantId), {
          id: tenantId, name: formData.orgName, slug: tenantSlug,
          ownerId: user.uid, email: formData.email, phone: formData.phone,
          createdAt: serverTimestamp(),
        });
      } catch (tenantError) {
        handleFirestoreError(tenantError, OperationType.WRITE, `tenants/${tenantId}`);
      }

      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid, name: formData.ownerName, email: formData.email,
          role: 'ADMIN', tenantId, tenantSlug, phone: formData.phone,
          active: true, createdAt: serverTimestamp(),
        });
      } catch (userError) {
        handleFirestoreError(userError, OperationType.WRITE, `users/${user.uid}`);
      }

      toast.success(t('auth.loginSuccess'));
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Onboarding failed');
    } finally { setLoading(false); }
  };

  const particles = React.useMemo(() => Array.from({ length: 30 }).map((_, i) => ({
    id: i, size: Math.random() * 3 + 1, x: Math.random() * 100, y: Math.random() * 100,
    duration: Math.random() * 20 + 12, delay: Math.random() * -15,
  })), []);

  const inputClass = "w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-4 text-sm text-white font-medium placeholder:text-slate-700 outline-none focus:border-emerald-500/50 focus:bg-white/[0.06] focus:ring-2 focus:ring-emerald-500/10 transition-all";

  return (
    <div className="h-screen w-screen flex bg-[#020617] overflow-hidden font-sans selection:bg-emerald-500/30" onMouseMove={handleMouseMove}>
      {/* Background layers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_80%_70%_at_50%_50%,#000_30%,transparent_100%)] opacity-50" />
        <motion.div animate={{ scale: [1, 1.3, 1], x: ['0%', '6%', '0%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[20%] -left-[10%] w-[55%] h-[55%] rounded-full blur-[180px] bg-emerald-500/[0.07]" />
        <motion.div animate={{ scale: [1.2, 1, 1.2], y: ['0%', '6%', '0%'] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-[15%] -right-[5%] w-[45%] h-[45%] rounded-full blur-[180px] bg-blue-500/[0.05]" />
        {particles.map((p) => (
          <motion.div key={p.id} className="absolute rounded-full bg-emerald-400/30"
            style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
            animate={{ y: [0, -80, 0], opacity: [0.1, 0.5, 0.1] }}
            transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }} />
        ))}
      </div>

      {/* Language Switcher */}
      <button onClick={toggleLanguage}
        className="absolute top-5 right-6 z-50 flex items-center gap-2 h-9 px-4 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-emerald-500/40 text-white/70 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all backdrop-blur-sm"
      >
        <Globe size={12} className="text-emerald-400" /> {i18n.language.toUpperCase()}
      </button>

      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-[48%] relative items-center justify-center z-10 border-r border-white/[0.04]">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
          style={{ x: parallaxX, y: parallaxY }}
          className="relative z-10 px-14 space-y-8 max-w-lg"
        >
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
              className="h-14 w-14 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20"
            >
              <Snowflake className="h-8 w-8 text-white" />
            </motion.div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">ColdChain <span className="text-emerald-400">OS</span></h1>
              <p className="text-[7px] font-black uppercase tracking-[0.3em] text-slate-600">{t('auth.platformVersion')}</p>
            </div>
          </div>

          <h2 className="text-4xl font-black text-white tracking-tight leading-[1] uppercase italic">
            {t('auth.brandSetup', 'Set up your')}<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400">
              {t('auth.brandWorkspace', 'warehouse workspace.')}
            </span>
          </h2>

          <p className="text-slate-500 text-sm font-medium leading-relaxed">
            {t('auth.brandSetupDesc', 'Create your cold storage workspace, register merchants, and start managing inventory in minutes.')}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Thermometer, val: '-18°C', label: t('auth.statTemp', 'Temp Control'), color: 'text-cyan-400' },
              { icon: Box, val: '2,847', label: t('auth.statStorage', 'Active Lots'), color: 'text-emerald-400' },
              { icon: Layers, val: '12', label: t('auth.statChambers', 'Chambers'), color: 'text-blue-400' },
            ].map((s, i) => (
              <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-3 space-y-1.5">
                <s.icon size={16} className={s.color} />
                <p className="text-base font-black text-white italic tracking-tighter">{s.val}</p>
                <p className="text-[7px] font-black uppercase tracking-[0.15em] text-slate-600">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Bar chart */}
          <div className="flex items-end gap-1.5">
            {[24, 38, 30, 48, 35, 52, 28, 44, 32, 46].map((h, i) => (
              <motion.div key={i}
                animate={{ height: [h * 0.7, h, h * 0.7] }}
                transition={{ duration: 3 + i * 0.25, repeat: Infinity, ease: 'easeInOut', delay: i * 0.12 }}
                className="w-3 rounded-t-sm bg-gradient-to-t from-emerald-500/25 to-emerald-500/5 border border-emerald-500/10"
                style={{ height: h }} />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-[52%] flex items-center justify-center px-6 md:px-10 lg:px-14 z-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ rotateX: tiltX, rotateY: tiltY, transformPerspective: 1200 }}
          className="w-full max-w-[480px] space-y-5"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <Snowflake className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-black text-white italic uppercase tracking-tighter">ColdChain <span className="text-emerald-400">OS</span></span>
          </div>

          <div>
            <h2 className="text-2xl font-black text-white tracking-tighter italic uppercase">{t('auth.register')}</h2>
            <p className="text-slate-600 font-bold text-[10px] uppercase tracking-widest mt-0.5">{t('auth.createWorkspace')}</p>
          </div>

          {/* Glass form card */}
          <div className="relative bg-white/[0.025] backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-6 lg:p-7 shadow-2xl shadow-black/20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent pointer-events-none opacity-40" />

            <form onSubmit={handleSignup} className="space-y-4 relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">{t('auth.orgLabel')}</label>
                  <div className="relative group">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors" />
                    <input placeholder={t('auth.orgPlaceholder')} className={inputClass}
                      value={formData.orgName} onChange={(e) => setFormData({ ...formData, orgName: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">{t('auth.ownerLabel')}</label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors" />
                    <input placeholder={t('auth.ownerPlaceholder')} className={inputClass}
                      value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">{t('auth.emailLabel')}</label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors" />
                    <input type="email" placeholder={t('auth.emailPlaceholder')} className={inputClass}
                      value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">{t('auth.phoneLabel')}</label>
                  <div className="relative group">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors" />
                    <input type="tel" placeholder={t('auth.phonePlaceholder')} className={inputClass}
                      value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">{t('auth.passwordLabel')}</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600 group-focus-within:text-emerald-400 transition-colors" />
                  <input type={showPassword ? 'text' : 'password'} placeholder={t('auth.passwordPlaceholder')} className={`${inputClass} !pr-12`}
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-emerald-400 transition-colors z-10">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button type="submit" disabled={loading}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/15 active:scale-[0.98] transition-all"
              >
                {loading ? t('common.loading') : (
                  <span className="flex items-center gap-2">{t('auth.createWorkspace')} <ArrowRight className="h-4 w-4" /></span>
                )}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center gap-2 pt-1">
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
              {t('auth.backToLogin')}{' '}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4 transition-colors">
                {t('auth.login')}
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
