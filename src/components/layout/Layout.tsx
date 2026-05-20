import * as React from 'react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  MapPin, 
  Package, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Users2, 
  Warehouse, 
  Receipt, 
  Wallet, 
  CreditCard, 
  BarChart3,
  Settings as SettingsIcon,
  History,
  LogOut,
  Menu,
  X,
  Snowflake,
  Sun,
  Moon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Truck,
  Cpu,
  FileCheck,
  CalendarDays,
  Search,
  Bell,
  Globe,
  Plus,
  CloudSun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '../ui/badge';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../ThemeProvider';
import { cn } from '../../lib/utils';
import { auth } from '../../lib/firebase';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { CommandMenu } from '../common/CommandMenu';

export default function Layout({ children }: { children: React.ReactNode }) {
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { profile, tenant, logout } = useAuthStore();

  const navigation = [
    { name: t('common.dashboard'), href: '/', icon: LayoutDashboard },
    { name: t('common.locations'), href: '/locations', icon: MapPin },
    { name: t('common.products'), href: '/products', icon: Package },
    { name: t('common.clients'), href: '/clients', icon: Users2 },
    { name: t('common.stock'), href: '/stock', icon: Warehouse },
    { name: t('common.incoming'), href: '/incoming', icon: ArrowDownCircle },
    { name: t('common.outgoing'), href: '/outgoing', icon: ArrowUpCircle },
    { name: t('common.vehicleLogs'), href: '/vehicle-logs', icon: Truck },
    { name: t('common.invoices'), href: '/invoices', icon: Receipt },
    { name: t('common.payments'), href: '/payments', icon: CreditCard },
    { name: t('common.expenses'), href: '/expenses', icon: Wallet },
    { name: t('common.reports'), href: '/reports', icon: BarChart3 },
    { name: t('common.settings'), href: '/settings', icon: SettingsIcon },
  ];

  const handleLogout = async () => {
    await auth.signOut();
    logout();
    navigate('/login');
  };

  const toggleLanguage = () => {
    const langs = ['en', 'te', 'hi'];
    const nextIndex = (langs.indexOf(i18n.language) + 1) % langs.length;
    i18n.changeLanguage(langs[nextIndex]);
  };

  return (
    <div className="flex h-screen bg-[#F8FAFC] dark:bg-[#020617] overflow-hidden transition-colors duration-500">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 100 : 320 }}
        className="relative flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-white/5 z-40 transition-colors duration-500 shadow-xl dark:shadow-none"
      >
        {/* Sidebar Header */}
        <div className="p-8 flex items-center justify-between">
          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center gap-3"
              >
                <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Snowflake className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-xl font-black tracking-tighter italic uppercase text-slate-900 dark:text-white">
                  Cold<span className="text-emerald-500">Chain</span>
                </h1>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-all border border-slate-100 dark:border-white/5 shadow-sm dark:shadow-none"
          >
            {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-4 px-4 h-14 rounded-2xl transition-all group relative overflow-hidden",
                  isActive
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                <item.icon size={22} className={cn("shrink-0 relative z-10", isActive ? "text-white" : "group-hover:text-emerald-500 transition-colors")} />
                {!isCollapsed && (
                  <span className="text-[11px] font-black uppercase tracking-widest relative z-10 whitespace-nowrap">
                    {item.name}
                  </span>
                )}
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 bg-emerald-500 z-0"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-transparent">
          <div className={cn(
            "flex items-center gap-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none transition-all",
            isCollapsed && "justify-center"
          )}>
            <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-xs shrink-0 shadow-lg shadow-emerald-500/20">
              {profile?.name?.charAt(0) || 'U'}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase truncate">{profile?.name || 'Operator'}</p>
                <p className="text-[9px] font-bold text-slate-500 uppercase truncate">{profile?.role || 'Guest'}</p>
              </div>
            )}
            {!isCollapsed && (
              <button onClick={handleLogout} className="text-slate-400 hover:text-rose-500 transition-colors">
                <LogOut size={16} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 px-10 flex items-center justify-between z-30 transition-colors duration-500">
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center bg-slate-100 dark:bg-white/5 rounded-2xl px-4 h-11 border border-slate-200 dark:border-white/5 focus-within:border-emerald-500/50 transition-all w-80 shadow-inner dark:shadow-none">
              <Search size={16} className="text-slate-400" />
              <input 
                type="text" 
                placeholder={t('common.search', 'Type to search...')} 
                className="bg-transparent border-none focus:ring-0 text-xs font-bold uppercase tracking-widest text-slate-900 dark:text-white placeholder:text-slate-500 w-full ml-2" 
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Quick Actions */}
             <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/5 shadow-inner dark:shadow-none">
               <button 
                 onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                 className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-all shadow-sm dark:shadow-none"
               >
                 {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
               </button>
               <button 
                 onClick={toggleLanguage}
                 className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-white dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-all font-black text-[10px] shadow-sm dark:shadow-none"
               >
                 {i18n.language.toUpperCase()}
               </button>
             </div>
             
             <div className="h-9 w-px bg-slate-200 dark:bg-white/10 mx-1" />
             
             <button className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-all border border-slate-200 dark:border-white/5 relative group shadow-sm dark:shadow-none">
               <Bell size={18} />
               <span className="absolute top-2 right-2 h-2 w-2 bg-rose-500 rounded-full border-2 border-white dark:border-[#020617]" />
             </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-10 lg:p-16 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-transparent">
           {children}
        </div>
        <CommandMenu />
      </main>
    </div>
  );
}
