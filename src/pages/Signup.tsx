import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Card, CardContent } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { Building2, User, Mail, Phone, Lock, Snowflake, ArrowRight, ShieldCheck } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function Signup() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    orgName: '',
    ownerName: '',
    email: '',
    password: '',
    phone: '',
  });

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 120 };
  const shadowX = useSpring(useTransform(mouseX, [-500, 500], [10, -10]), springConfig);
  const shadowY = useSpring(useTransform(mouseY, [-500, 500], [10, -10]), springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const tenantId = `tenant_${Date.now()}`;
      const tenantSlug = formData.orgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
      
      const tenantPath = `tenants/${tenantId}`;
      try {
        await setDoc(doc(db, 'tenants', tenantId), {
          id: tenantId,
          name: formData.orgName,
          slug: tenantSlug,
          ownerId: user.uid,
          email: formData.email,
          phone: formData.phone,
          createdAt: serverTimestamp(),
        });
      } catch (tenantError) {
        handleFirestoreError(tenantError, OperationType.WRITE, tenantPath);
      }

      const userPath = `users/${user.uid}`;
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name: formData.ownerName,
          email: formData.email,
          role: 'ADMIN',
          tenantId: tenantId,
          tenantSlug: tenantSlug,
          phone: formData.phone,
          active: true,
          createdAt: serverTimestamp(),
        });
      } catch (userError) {
        handleFirestoreError(userError, OperationType.WRITE, userPath);
      }

      toast.success(t('auth.onboardingSuccess'));
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || "Onboarding failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#020617] overflow-hidden selection:bg-emerald-500/30 font-sans" onMouseMove={handleMouseMove}>
      {/* Left side - Operational Context (Visual brand side) */}
      <div className="hidden lg:flex lg:w-5/12 bg-emerald-950/40 relative items-end p-12 overflow-hidden border-r border-white/5">
        {/* Dynamic mesh background grid */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-gradient-radial from-emerald-500/10 via-transparent to-transparent rounded-full blur-[100px]" />
        </div>

        {/* Floating parallax structure */}
        <motion.div 
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-16 z-10"
          style={{ x: shadowX, y: shadowY }}
        >
          <div className="relative">
            <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full opacity-30" />
            <div className="relative bg-slate-900/60 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 shadow-2xl space-y-6">
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Snowflake className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-white tracking-tighter leading-none italic uppercase">Runtime</h1>
                  <p className="text-emerald-400 text-[8px] font-black uppercase tracking-[0.3em] mt-1">Active Cluster v4.2</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    <span>Node Telemetry Readiness</span>
                    <span className="text-emerald-400">98%</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: '98%' }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full bg-emerald-500 rounded-full" 
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/[0.02] p-3.5 rounded-xl border border-white/5">
                    <p className="text-lg font-black text-white">1.8ms</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">GATE LATENCY</p>
                  </div>
                  <div className="bg-white/[0.02] p-3.5 rounded-xl border border-white/5">
                    <p className="text-lg font-black text-white">100%</p>
                    <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">UPTIME PROTOCOL</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="relative z-20 space-y-3">
          <h2 className="text-4xl font-black text-white tracking-tighter leading-[0.95] uppercase italic">
            Scale your <br/>
            <span className="text-emerald-400">warehouse workspace.</span>
          </h2>
          <p className="text-slate-400 font-bold text-sm leading-relaxed max-w-sm uppercase tracking-wider text-xs">
            Onboard your merchant registers and go live with ColdChain OS instantly.
          </p>
        </div>
      </div>

      {/* Right side - Space-Optimized Registration Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 md:p-12 lg:p-16 bg-[#020617] relative">
        {/* Glowing visual effect behind the card */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-[560px] space-y-6 z-10"
        >
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2 lg:hidden">
              <div className="h-8 w-8 bg-emerald-500 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Snowflake className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-lg font-black tracking-tighter text-white italic uppercase">ColdChain <span className="text-emerald-500">OS</span></h1>
            </div>
            <h2 className="text-3xl font-black text-white tracking-tighter italic uppercase">{t('auth.register')}</h2>
            <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{t('auth.createWorkspace')}</p>
          </div>

          <Card className="border-none bg-slate-900/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl">
            <CardContent className="p-8">
              <form onSubmit={handleSignup} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="orgName" className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('auth.orgLabel')}</Label>
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                      <Input
                        id="orgName"
                        placeholder="Skyline Cold Storage"
                        className="pl-12 h-12 rounded-xl bg-white/[0.03] border-white/10 text-white text-xs font-bold focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-slate-700"
                        value={formData.orgName}
                        onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="ownerName" className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('auth.ownerLabel')}</Label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                      <Input
                        id="ownerName"
                        placeholder="Nithish Reddy"
                        className="pl-12 h-12 rounded-xl bg-white/[0.03] border-white/10 text-white text-xs font-bold focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-slate-700"
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('auth.workEmail')}</Label>
                    <div className="relative group">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@skyline.os"
                        className="pl-12 h-12 rounded-xl bg-white/[0.03] border-white/10 text-white text-xs font-bold focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-slate-700"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('auth.phoneLabel')}</Label>
                    <div className="relative group">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 99999 99999"
                        className="pl-12 h-12 rounded-xl bg-white/[0.03] border-white/10 text-white text-xs font-bold focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-slate-700"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('auth.systemCode')}</Label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Access Code (min. 6 characters)"
                      className="pl-12 h-12 rounded-xl bg-white/[0.03] border-white/10 text-white text-xs font-bold focus:ring-emerald-500/20 focus:border-emerald-500/50 transition-all placeholder:text-slate-700"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2" disabled={loading}>
                  {loading ? "INITIALIZING ENVIRONMENT..." : (
                    <>
                      {t('auth.createWorkspace')} <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="flex flex-col items-center gap-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
              {t('auth.authorizedAccessOnly')}.{' '}
              <Link to="/login" className="text-emerald-400 hover:text-emerald-300 underline decoration-2 underline-offset-4 transition-colors">
                {t('auth.login')}
              </Link>
            </p>
            <div className="flex items-center gap-2 text-[8px] font-black text-slate-700 uppercase tracking-widest">
              <ShieldCheck size={12} className="text-emerald-950" /> {t('auth.encryptedEndpoint')}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
