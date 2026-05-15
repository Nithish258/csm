import * as React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { dbService } from '../services/db.service';
import { 
  Activity, 
  TrendingUp, 
  Package, 
  Users2, 
  Warehouse, 
  ArrowUpRight, 
  ArrowDownRight,
  Calendar,
  Search,
  Filter,
  DollarSign,
  Wallet,
  Clock,
  ChevronRight,
  Layers,
  ArrowRight,
  CloudSun,
  TrendingDown,
  Receipt
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { t } = useTranslation();
  const { tenant } = useAuthStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    dbService.sync('invoices', setInvoices);
    dbService.sync('expenses', setExpenses);
    dbService.sync('stock', setStock);
    setLoading(false);
  }, []);

  // Financial Calculations
  const filteredInvoices = invoices.filter(inv => {
    const date = new Date(inv.createdAt?.seconds * 1000 || inv.createdAt);
    return (date.getMonth() + 1 === selectedMonth) && (date.getFullYear() === selectedYear);
  });

  const filteredExpenses = expenses.filter(exp => {
    const date = new Date(exp.date);
    return (date.getMonth() + 1 === selectedMonth) && (date.getFullYear() === selectedYear);
  });

  const monthlyIncome = filteredInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const monthlyExpense = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);

  const yearlyIncome = invoices
    .filter(inv => new Date(inv.createdAt?.seconds * 1000 || inv.createdAt).getFullYear() === selectedYear)
    .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

  const yearlyExpense = expenses
    .filter(exp => new Date(exp.date).getFullYear() === selectedYear)
    .reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const totalBags = stock.reduce((sum, s) => sum + (s.quantity || 0), 0);

  return (
    <Layout>
      <div className="space-y-12">
        {/* Header with Filters */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Activity className="h-5 w-5 text-white" />
                 </div>
                 <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{t('dashboard.controlCenter')}</h2>
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">{tenant?.name} • {t('dashboard.telemetryActive')}</p>
           </div>

           <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-white/5 shadow-premium">
              <div className="flex items-center gap-2 px-4 h-10 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                 <Calendar className="h-4 w-4 text-emerald-500" />
                 <select 
                   value={selectedMonth} 
                   onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                   className="bg-transparent border-none text-[10px] font-black uppercase outline-none"
                 >
                    {Array.from({length: 12}).map((_, i) => (
                       <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('en', {month: 'long'})}</option>
                    ))}
                 </select>
              </div>
              <div className="flex items-center gap-2 px-4 h-10 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
                 <select 
                   value={selectedYear} 
                   onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                   className="bg-transparent border-none text-[10px] font-black uppercase outline-none"
                 >
                    {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                 </select>
              </div>
              <Button className="h-10 rounded-xl bg-slate-900 dark:bg-emerald-500 text-white font-black uppercase text-[10px] tracking-widest px-6">
                 {t('dashboard.searchData')}
              </Button>
           </div>
        </div>

        {/* Primary KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           {[
             { label: t('dashboard.monthlyIncome'), value: `₹${monthlyIncome.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500', trend: '+12.5%' },
             { label: t('dashboard.monthlyExpense'), value: `₹${monthlyExpense.toLocaleString()}`, icon: TrendingDown, color: 'text-rose-500', trend: '-2.4%' },
             { label: t('dashboard.yearlyIncome'), value: `₹${yearlyIncome.toLocaleString()}`, icon: DollarSign, color: 'text-blue-500', trend: '+45.0%' },
             { label: t('dashboard.inventoryLoad'), value: `${totalBags.toLocaleString()}`, icon: Package, color: 'text-amber-500', trend: 'STABLE' },
           ].map((kpi, i) => (
              <motion.div
                key={kpi.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-premium border border-slate-100 dark:border-white/5 relative overflow-hidden group"
              >
                 <div className="flex justify-between items-start mb-10">
                    <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5", kpi.color)}>
                       <kpi.icon size={20} />
                    </div>
                    <Badge className="bg-slate-50 dark:bg-white/5 text-slate-400 border-none px-3 py-1 font-black text-[8px] uppercase">{kpi.trend}</Badge>
                 </div>
                 <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                    <h3 className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-none">{kpi.value}</h3>
                 </div>
                 <div className="absolute bottom-0 right-0 w-24 h-24 bg-current opacity-[0.03] blur-3xl rounded-full translate-x-12 translate-y-12" />
              </motion.div>
           ))}
        </div>

        {/* Secondary Modules */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
           {/* Chart Section */}
           <div className="lg:col-span-8 space-y-8">
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-premium border border-slate-100 dark:border-white/5">
                 <div className="flex items-center justify-between mb-10">
                    <div>
                       <h3 className="text-xl font-black uppercase italic tracking-tighter">{t('dashboard.telemetry')}</h3>
                       <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.financialThroughput')}</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-2">
                          <div className="h-3 w-3 bg-emerald-500 rounded-full" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('dashboard.income')}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <div className="h-3 w-3 bg-rose-500 rounded-full" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('dashboard.expense')}</span>
                       </div>
                    </div>
                 </div>
                 <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={[
                          { name: 'W1', income: monthlyIncome * 0.2, expense: monthlyExpense * 0.3 },
                          { name: 'W2', income: monthlyIncome * 0.4, expense: monthlyExpense * 0.2 },
                          { name: 'W3', income: monthlyIncome * 0.1, expense: monthlyExpense * 0.4 },
                          { name: 'W4', income: monthlyIncome * 0.3, expense: monthlyExpense * 0.1 },
                       ]}>
                          <defs>
                             <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                             </linearGradient>
                             <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-white/5" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#64748b'}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#64748b'}} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '24px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontSize: '10px', fontWeight: 'bold' }}
                          />
                          <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorIncome)" />
                          <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={4} fillOpacity={1} fill="url(#colorExpense)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
              </div>
           </div>

           {/* Right Panel: Season & Info */}
           <div className="lg:col-span-4 space-y-8">
              {/* Season Card */}
              <div className="bg-slate-900 dark:bg-emerald-500 p-10 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16" />
                 <CloudSun className="h-12 w-12 mb-8 text-white/50 group-hover:scale-110 transition-transform" />
                 <h3 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-3">{t('dashboard.rabiSeason')}</h3>
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-10">{t('dashboard.activePeriod')}</p>
                 <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 rounded-2xl h-14 font-black uppercase tracking-widest text-[10px]">
                    {t('dashboard.switchSeason')}
                 </Button>
              </div>

              {/* Quick Summary */}
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium">
                 <h4 className="text-xs font-black uppercase tracking-widest mb-6">{t('dashboard.operationalLog')}</h4>
                 <div className="space-y-6">
                    {[
                      { icon: ArrowRight, text: t('dashboard.newEntry'), time: '2m ago' },
                      { icon: ArrowRight, text: t('dashboard.invoiceGen'), time: '15m ago' },
                      { icon: ArrowRight, text: t('dashboard.stockRebalance'), time: '1h ago' },
                    ].map((log, i) => (
                       <div key={i} className="flex items-center justify-between border-b border-slate-50 dark:border-white/5 pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                             <div className="h-8 w-8 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-emerald-500">
                                <log.icon size={14} />
                             </div>
                             <p className="text-[10px] font-bold uppercase text-slate-900 dark:text-white">{log.text}</p>
                          </div>
                          <span className="text-[8px] font-black text-slate-400 uppercase">{log.time}</span>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    </Layout>
  );
}
