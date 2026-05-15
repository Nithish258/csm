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
import { Building2, User, Mail, Phone, Lock, Snowflake, ArrowRight } from 'lucide-react';
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

  const springConfig = { damping: 25, stiffness: 150 };
  const shadowX = useSpring(useTransform(mouseX, [-500, 500], [15, -15]), springConfig);
  const shadowY = useSpring(useTransform(mouseY, [-500, 500], [15, -15]), springConfig);

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

      toast.success("Organization onboarded successfully!");
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || "Onboarding failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950 overflow-hidden" onMouseMove={handleMouseMove}>
      {/* Left side - Operational Context */}
      <div className="hidden lg:flex lg:w-5/12 bg-emerald-600 relative items-end p-16 overflow-hidden">
        {/* Dynamic mesh background */}
        <div className="absolute inset-0 opacity-10">
           <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M0,0 L100,0 L100,100 L0,100 Z" fill="url(#grid)" />
              <defs>
                 <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="white" strokeWidth="0.5"/>
                 </pattern>
              </defs>
           </svg>
        </div>

        {/* Floating parallax structure */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full px-20 z-10"
          style={{ x: shadowX, y: shadowY }}
        >
           <div className="relative">
              <div className="absolute -inset-4 bg-emerald-500/20 blur-3xl rounded-full" />
              <div className="relative bg-white/10 backdrop-blur-3xl p-12 rounded-[3rem] border border-white/20 shadow-2xl">
                 <div className="flex gap-4 mb-12">
                    <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                       <Snowflake className="h-8 w-8 text-emerald-600" />
                    </div>
                    <div>
                       <h1 className="text-3xl font-black text-white tracking-tighter leading-none italic uppercase">Runtime</h1>
                       <p className="text-emerald-100/60 text-xs font-black uppercase tracking-[0.3em] mt-1">Version 2.4.0</p>
                    </div>
                 </div>
                 
                 <div className="space-y-6">
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black text-white uppercase tracking-widest opacity-60">
                          <span>System Readiness</span>
                          <span>94%</span>
                       </div>
                       <div className="h-1.5 w-full bg-emerald-700/50 rounded-full overflow-hidden">
                          <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: '94%' }}
                             transition={{ duration: 1, delay: 0.5 }}
                             className="h-full bg-white" 
                          />
                       </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                       {[
                          { val: '2.4ms', label: 'Latency' },
                          { val: '64TB', label: 'Bandwidth' }
                       ].map((stat, i) => (
                          <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10">
                             <p className="text-xl font-black text-white">{stat.val}</p>
                             <p className="text-[10px] font-bold text-emerald-100/40 uppercase">{stat.label}</p>
                          </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </motion.div>

        <div className="relative z-20">
           <h2 className="text-5xl font-black text-white tracking-tighter leading-[0.9] mb-4">
             Scale your<br/>
             <span className="opacity-50">operations.</span>
           </h2>
           <p className="text-emerald-100 font-bold text-lg leading-relaxed max-w-sm">
             Onboard your warehouse in under 60 seconds and go live with ColdChain OS.
           </p>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-8 lg:p-24 bg-slate-50 dark:bg-slate-950 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xl space-y-10"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-8 lg:hidden">
               <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                  <Snowflake className="h-6 w-6 text-white" />
               </div>
               <h1 className="text-2xl font-black tracking-tighter italic uppercase underline decoration-emerald-500/30">ColdChain <span className="text-emerald-600">OS</span></h1>
            </div>
            <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase">Get Started</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">Initialize your warehouse environment.</p>
          </div>

          <Card className="border-none shadow-premium rounded-[2.5rem] overflow-hidden bg-white dark:bg-card">
            <CardContent className="p-10">
              <form onSubmit={handleSignup} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <Label htmlFor="orgName" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Warehouse Name</Label>
                    <div className="relative">
                      <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      <Input
                        id="orgName"
                        placeholder="e.g. Skyline Logistics"
                        className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border-none focus-visible:ring-emerald-500 font-bold"
                        value={formData.orgName}
                        onChange={(e) => setFormData({ ...formData, orgName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ownerName" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Owner Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      <Input
                        id="ownerName"
                        placeholder="Operator Identity"
                        className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border-none focus-visible:ring-emerald-500 font-bold"
                        value={formData.ownerName}
                        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Work Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="id@coldchain.os"
                        className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border-none focus-visible:ring-emerald-500 font-bold"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Mobile Network</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+91 00000 00000"
                        className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border-none focus-visible:ring-emerald-500 font-bold"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">System Code (Password)</Label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border-none focus-visible:ring-emerald-500 font-bold"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full h-16 rounded-[1.5rem] bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white font-black text-lg shadow-2xl active:scale-[0.98] transition-all flex items-center justify-center gap-3" disabled={loading}>
                  {loading ? "INITIALIZING ENVIRONMENT..." : (
                    <>
                      CREATE WORKSPACE <ArrowRight className="h-6 w-6" />
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          <p className="text-center text-sm font-bold text-slate-400 uppercase tracking-widest">
            Authorized access only.{' '}
            <Link to="/login" className="text-emerald-600 hover:text-emerald-700 underline decoration-2 underline-offset-4 decoration-emerald-500/30">
              Sign In to Runtime
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
