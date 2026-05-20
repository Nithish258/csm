import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Building2, User, Mail, Phone, Lock, Snowflake, ArrowRight, ShieldCheck } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

export default function Signup() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    orgName: '', ownerName: '', email: '', password: '', phone: '',
  });

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

  const inputClass = "w-full h-11 bg-white/[0.04] border border-white/[0.08] rounded-xl pl-11 pr-4 text-sm text-white font-medium placeholder:text-slate-700 outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/10 transition-all";

  return (
    <div className="h-screen w-screen flex bg-[#020617] overflow-hidden font-sans selection:bg-emerald-500/30">
      {/* Left Brand Panel */}
      <div className="hidden lg:flex lg:w-5/12 relative items-center justify-center border-r border-white/5 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b12_1px,transparent_1px),linear-gradient(to_bottom,#1e293b12_1px,transparent_1px)] bg-[size:3rem_3rem]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] h-[100%] bg-gradient-radial from-emerald-500/[0.06] via-transparent to-transparent rounded-full blur-[100px]" />
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6 }}
          className="relative z-10 px-12 space-y-8 max-w-lg"
        >
          <div className="flex items-center gap-3">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
              className="h-12 w-12 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/20"
            >
              <Snowflake className="h-7 w-7 text-white" />
            </motion.div>
            <h1 className="text-xl font-black text-white tracking-tighter uppercase italic">ColdChain <span className="text-emerald-400">OS</span></h1>
          </div>

          <h2 className="text-4xl font-black text-white tracking-tight leading-[1] uppercase italic">
            {t('auth.brandSetup', 'Set up your')}<br/>
            <span className="text-emerald-400">{t('auth.brandWorkspace', 'warehouse workspace.')}</span>
          </h2>

          <p className="text-slate-500 text-xs font-medium leading-relaxed">
            {t('auth.brandSetupDesc', 'Create your cold storage workspace, register merchants, and start managing inventory in minutes.')}
          </p>

          {/* Animated bars */}
          <div className="flex gap-2 pt-2">
            {[...Array(6)].map((_, i) => (
              <motion.div key={i}
                animate={{ height: [16 + i * 5, 32 + i * 4, 16 + i * 5] }}
                transition={{ duration: 2.5 + i * 0.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
                className="w-6 rounded-t bg-gradient-to-t from-emerald-500/20 to-emerald-500/5 border border-emerald-500/10"
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full lg:w-7/12 flex items-center justify-center px-6 md:px-12 lg:px-16 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-emerald-500/[0.03] rounded-full blur-[100px] pointer-events-none" />

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }} className="w-full max-w-[520px] z-10 space-y-5"
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

          {/* Form card */}
          <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 lg:p-7 shadow-2xl">
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">{t('auth.orgLabel')}</label>
                  <div className="relative">
                    <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input placeholder="Skyline Cold Storage" className={inputClass}
                      value={formData.orgName} onChange={(e) => setFormData({ ...formData, orgName: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">{t('auth.ownerLabel')}</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input placeholder="Nithish Reddy" className={inputClass}
                      value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">{t('auth.emailLabel')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input type="email" placeholder="admin@skyline.os" className={inputClass}
                      value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">{t('auth.phoneLabel')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                    <input type="tel" placeholder="+91 99999 99999" className={inputClass}
                      value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-slate-500 ml-1">{t('auth.passwordLabel')}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-600" />
                  <input type="password" placeholder={t('auth.passwordPlaceholder')} className={inputClass}
                    value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required />
                </div>
              </div>

              <Button type="submit" disabled={loading}
                className="w-full h-11 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all"
              >
                {loading ? t('common.loading') : (
                  <span className="flex items-center gap-2">{t('auth.createWorkspace')} <ArrowRight className="h-4 w-4" /></span>
                )}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <div className="flex flex-col items-center gap-2">
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
