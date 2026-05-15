import * as React from 'react';
import { useState } from 'react';
import Layout from '../components/layout/Layout';
import { useAuthStore } from '../store/authStore';
import { dbService } from '../services/db.service';
import { 
  Settings as SettingsIcon, 
  User, 
  Building2, 
  Palette, 
  Shield, 
  Bell,
  Save,
  Loader2,
  Globe,
  Monitor,
  Moon,
  Sun
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../components/ThemeProvider';
import { cn } from '../lib/utils';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { profile, tenant, setProfile, setTenant } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('profile');

  // Form States
  const [profileData, setProfileData] = useState({
    name: profile?.name || '',
    email: profile?.email || '',
    phone: profile?.phone || '',
    role: profile?.role || '',
  });

  const [warehouseData, setWarehouseData] = useState({
    name: tenant?.name || '',
    address: tenant?.address || '',
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setLoading(true);
    try {
      await dbService.update('users', profile.uid, profileData);
      setProfile({ ...profile, ...profileData });
      toast.success('Operator Profile Synchronized');
    } catch (error: any) {
      toast.error(error.message || 'Update Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setLoading(true);
    try {
      await dbService.update('tenants', tenant.id, warehouseData);
      setTenant({ ...tenant, ...warehouseData });
      toast.success('Warehouse Node Configuration Updated');
    } catch (error: any) {
      toast.error(error.message || 'Update Failed');
    } finally {
      setLoading(false);
    }
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    toast.success(`Language switched to ${lng === 'en' ? 'English' : lng === 'te' ? 'Telugu' : 'Hindi'}`);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-12 pb-20">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <SettingsIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{t('common.settings')}</h2>
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Configure system parameters, user identity, and regional localization.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Navigation */}
          <div className="lg:col-span-4 space-y-4">
             <div className="bg-white dark:bg-slate-900 p-4 rounded-[2.5rem] border border-slate-200 dark:border-white/5 shadow-premium space-y-2">
                {[
                  { id: 'profile', icon: User, label: 'Operator Profile' },
                  { id: 'warehouse', icon: Building2, label: 'Warehouse Node' },
                  { id: 'localization', icon: Globe, label: 'Localization (Language)' },
                  { id: 'appearance', icon: Palette, label: 'Visual Engine (Theme)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-4 px-6 h-14 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-left",
                      activeSection === item.id 
                        ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                        : "text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-emerald-500"
                    )}
                  >
                    <item.icon size={18} />
                    {item.label}
                  </button>
                ))}
             </div>
          </div>

          {/* Right: Dynamic Sections */}
          <div className="lg:col-span-8">
             <AnimatePresence mode="wait">
                {activeSection === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-white/5 shadow-premium space-y-10"
                  >
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                              <User size={24} />
                           </div>
                           <div>
                              <h3 className="text-xl font-black uppercase italic tracking-tighter">Operator Identity</h3>
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Personal credentials and role authorization</p>
                           </div>
                        </div>
                        <Badge className="bg-slate-900 text-white border-none font-black text-[8px] uppercase px-3">{profile?.role}</Badge>
                     </div>

                     <form onSubmit={handleUpdateProfile} className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Full Legal Name</Label>
                              <Input 
                                value={profileData.name}
                                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                              />
                           </div>
                           <div className="space-y-2">
                              <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mobile Number</Label>
                              <Input 
                                value={profileData.phone}
                                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                              />
                           </div>
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">System Identifier (Email)</Label>
                           <Input 
                             value={profileData.email}
                             readOnly
                             className="opacity-60"
                           />
                        </div>
                        <Button type="submit" disabled={loading} className="h-14 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20">
                           {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                           Commit Identity Update
                        </Button>
                     </form>
                  </motion.div>
                )}

                {activeSection === 'warehouse' && (
                  <motion.div
                    key="warehouse"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-white/5 shadow-premium space-y-10"
                  >
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                           <Building2 size={24} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black uppercase italic tracking-tighter">Node Configuration</h3>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Organizational metrics and site identifier</p>
                        </div>
                     </div>

                     <form onSubmit={handleUpdateWarehouse} className="space-y-6">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Warehouse / Hub Name</Label>
                           <Input 
                             value={warehouseData.name}
                             onChange={(e) => setWarehouseData({ ...warehouseData, name: e.target.value })}
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Operational Address</Label>
                           <Input 
                             value={warehouseData.address}
                             onChange={(e) => setWarehouseData({ ...warehouseData, address: e.target.value })}
                           />
                        </div>
                        <Button type="submit" disabled={loading} className="h-14 px-8 bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg">
                           {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : <Save className="mr-2" size={16} />}
                           Save Node Parameters
                        </Button>
                     </form>
                  </motion.div>
                )}

                {activeSection === 'localization' && (
                  <motion.div
                    key="localization"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-white/5 shadow-premium space-y-10"
                  >
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
                           <Globe size={24} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black uppercase italic tracking-tighter">Regional Localization</h3>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Select system language and regional formats</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                          { id: 'en', label: 'English', sub: 'Default (System)' },
                          { id: 'te', label: 'తెలుగు', sub: 'Telugu (Regional)' },
                          { id: 'hi', label: 'हिन्दी', sub: 'Hindi (National)' },
                        ].map((lng) => (
                          <button
                            key={lng.id}
                            onClick={() => changeLanguage(lng.id)}
                            className={cn(
                              "p-8 rounded-[2rem] border-2 transition-all text-left group",
                              i18n.language === lng.id 
                                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/5" 
                                : "border-slate-100 dark:border-white/5 hover:border-emerald-500/50"
                            )}
                          >
                             <div className={cn(
                               "h-10 w-10 rounded-xl flex items-center justify-center mb-4 transition-colors",
                               i18n.language === lng.id ? "bg-emerald-500 text-white" : "bg-slate-50 dark:bg-white/5 text-slate-400 group-hover:text-emerald-500"
                             )}>
                                <span className="text-[12px] font-bold uppercase">{lng.id}</span>
                             </div>
                             <h4 className="text-lg font-black uppercase tracking-tight">{lng.label}</h4>
                             <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">{lng.sub}</p>
                          </button>
                        ))}
                     </div>
                  </motion.div>
                )}

                {activeSection === 'appearance' && (
                  <motion.div
                    key="appearance"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] border border-slate-200 dark:border-white/5 shadow-premium space-y-10"
                  >
                     <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
                           <Palette size={24} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black uppercase italic tracking-tighter">Visual Engine</h3>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Interface themes and hardware acceleration</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-8">
                        <button
                          onClick={() => setTheme('light')}
                          className={cn(
                            "p-10 rounded-[2.5rem] border-2 transition-all flex flex-col items-center group",
                            theme === 'light' ? "border-emerald-500 bg-emerald-50" : "border-slate-100 hover:border-emerald-500/50"
                          )}
                        >
                           <div className={cn(
                             "h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-colors",
                             theme === 'light' ? "bg-emerald-500 text-white" : "bg-slate-50 text-slate-400 group-hover:text-emerald-500"
                           )}>
                              <Sun size={32} />
                           </div>
                           <h4 className="text-xl font-black uppercase italic tracking-tighter">High Contrast</h4>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Light Interface</p>
                        </button>

                        <button
                          onClick={() => setTheme('dark')}
                          className={cn(
                            "p-10 rounded-[2.5rem] border-2 transition-all flex flex-col items-center group",
                            theme === 'dark' ? "border-emerald-500 bg-slate-800" : "border-white/5 hover:border-emerald-500/50"
                          )}
                        >
                           <div className={cn(
                             "h-16 w-16 rounded-2xl flex items-center justify-center mb-6 transition-colors",
                             theme === 'dark' ? "bg-emerald-500 text-white" : "bg-white/5 text-slate-400 group-hover:text-emerald-500"
                           )}>
                              <Moon size={32} />
                           </div>
                           <h4 className="text-xl font-black uppercase italic tracking-tighter text-white">OLED Black</h4>
                           <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-2">Dark Interface</p>
                        </button>
                     </div>
                  </motion.div>
                )}
             </AnimatePresence>
          </div>
        </div>
      </div>
    </Layout>
  );
}
