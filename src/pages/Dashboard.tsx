import * as React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { dbService } from '../services/db.service';
import {
  Activity, TrendingUp, Package, Users2, Warehouse,
  ArrowDownCircle, ArrowUpCircle, Calendar, DollarSign,
  Wallet, TrendingDown, AlertTriangle, MapPin, Layers
} from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { t } = useTranslation();
  const { tenant } = useAuthStore();
  const [incomingShipments, setIncomingShipments] = useState<any[]>([]);
  const [outgoingShipments, setOutgoingShipments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const unsubs = [
      dbService.sync('incoming_shipments', setIncomingShipments),
      dbService.sync('outgoing_shipments', setOutgoingShipments),
      dbService.sync('locations', setLocations),
      dbService.sync('clients', setClients),
      dbService.sync('invoices', setInvoices),
      dbService.sync('expenses', setExpenses),
    ];
    setLoading(false);
    return () => unsubs.forEach(u => u());
  }, []);

  // === REAL CALCULATIONS FROM FIRESTORE DATA ===

  // Stock: total inward bags minus total outward bags
  const totalInwardBags = incomingShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const totalOutwardBags = outgoingShipments.reduce((sum, s) => sum + (s.quantity || 0), 0);
  const currentStockBags = totalInwardBags - totalOutwardBags;

  // Active shipments still in storage
  const activeInStorageLots = incomingShipments.filter(s => {
    const remaining = s.remainingBags !== undefined ? s.remainingBags : s.quantity;
    return remaining > 0;
  }).length;

  // Location occupancy
  const totalCapacity = locations.reduce((sum, l) => sum + (l.capacity || 0), 0);
  const totalOccupied = locations.reduce((sum, l) => sum + (l.occupied || 0), 0);
  const occupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  // Financial: Monthly
  const getDateFromRecord = (item: any): Date | null => {
    if (item.inwardDate) return new Date(item.inwardDate);
    if (item.outwardDate) return new Date(item.outwardDate);
    if (item.date) return new Date(item.date);
    if (item.createdAt?.seconds) return new Date(item.createdAt.seconds * 1000);
    return null;
  };

  const filteredInvoices = invoices.filter(inv => {
    const d = getDateFromRecord(inv);
    return d && (d.getMonth() + 1 === selectedMonth) && (d.getFullYear() === selectedYear);
  });
  const filteredExpenses = expenses.filter(exp => {
    const d = getDateFromRecord(exp);
    return d && (d.getMonth() + 1 === selectedMonth) && (d.getFullYear() === selectedYear);
  });

  const monthlyIncome = filteredInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const monthlyExpense = filteredExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const yearlyIncome = invoices
    .filter(inv => { const d = getDateFromRecord(inv); return d && d.getFullYear() === selectedYear; })
    .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const yearlyExpense = expenses
    .filter(exp => { const d = getDateFromRecord(exp); return d && d.getFullYear() === selectedYear; })
    .reduce((sum, exp) => sum + (exp.amount || 0), 0);

  // Pending payments from outgoing dispatches
  const pendingPayments = outgoingShipments
    .filter(d => d.paymentStatus !== 'PAID')
    .reduce((sum, d) => sum + ((d.totalAmount || 0) - (d.paidAmount || 0)), 0);

  const pendingCount = outgoingShipments.filter(d => d.paymentStatus !== 'PAID').length;

  // Recent activity from both collections
  const recentInward = [...incomingShipments]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 5);

  const recentOutward = [...outgoingShipments]
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
    .slice(0, 5);

  // Chart data: monthly breakdown
  const monthlyChartData = Array.from({ length: 12 }).map((_, i) => {
    const month = i + 1;
    const mIncome = invoices
      .filter(inv => { const d = getDateFromRecord(inv); return d && d.getMonth() + 1 === month && d.getFullYear() === selectedYear; })
      .reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
    const mExpense = expenses
      .filter(exp => { const d = getDateFromRecord(exp); return d && d.getMonth() + 1 === month && d.getFullYear() === selectedYear; })
      .reduce((sum, exp) => sum + (exp.amount || 0), 0);
    return { name: new Date(0, i).toLocaleString('en', { month: 'short' }), income: mIncome, expense: mExpense };
  });

  // Chamber occupancy for bar chart
  const chamberData = locations.reduce((acc: any[], loc) => {
    const existing = acc.find(c => c.name === loc.chamber);
    if (existing) {
      existing.occupied += loc.occupied || 0;
      existing.capacity += loc.capacity || 0;
    } else {
      acc.push({ name: loc.chamber || 'Unknown', occupied: loc.occupied || 0, capacity: loc.capacity || 0 });
    }
    return acc;
  }, []);

  return (
    <Layout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{t('dashboard.controlCenter')}</h2>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">{tenant?.name} • {t('dashboard.telemetryActive')}</p>
          </div>

          <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-2 px-3 h-9 bg-slate-50 dark:bg-white/5 rounded-xl">
              <Calendar className="h-3.5 w-3.5 text-emerald-500" />
              <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="bg-transparent border-none text-[10px] font-black uppercase outline-none text-slate-900 dark:text-white">
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(0, i).toLocaleString('en', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 h-9 bg-slate-50 dark:bg-white/5 rounded-xl">
              <select value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-transparent border-none text-[10px] font-black uppercase outline-none text-slate-900 dark:text-white">
                {[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Primary KPI Grid — 6 real metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: t('dashboard.monthlyIncome'), value: `₹${monthlyIncome.toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
            { label: t('dashboard.monthlyExpense'), value: `₹${monthlyExpense.toLocaleString()}`, icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-500/10' },
            { label: t('dashboard.yearlyIncome'), value: `₹${yearlyIncome.toLocaleString()}`, icon: DollarSign, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: t('dashboard.currentStock'), value: `${currentStockBags.toLocaleString()}`, icon: Package, color: 'text-amber-500', bg: 'bg-amber-500/10' },
            { label: t('dashboard.pendingPayments'), value: `₹${pendingPayments.toLocaleString()}`, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { label: t('dashboard.storageUtil'), value: `${occupancyPercent}%`, icon: Warehouse, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          ].map((kpi, i) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5 relative overflow-hidden"
            >
              <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center mb-3", kpi.bg)}>
                <kpi.icon size={16} className={kpi.color} />
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
              <h3 className="text-xl font-black italic tracking-tighter text-slate-900 dark:text-white leading-none">{kpi.value}</h3>
            </motion.div>
          ))}
        </div>

        {/* Secondary KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('dashboard.totalClients')}</p>
            <p className="text-2xl font-black italic text-slate-900 dark:text-white">{clients.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('dashboard.activeLots')}</p>
            <p className="text-2xl font-black italic text-emerald-500">{activeInStorageLots}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('dashboard.totalInward')}</p>
            <p className="text-2xl font-black italic text-slate-900 dark:text-white">{incomingShipments.length}</p>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('dashboard.pendingCount')}</p>
            <p className="text-2xl font-black italic text-orange-500">{pendingCount}</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Financial Chart */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black uppercase italic tracking-tighter">{t('dashboard.telemetry')}</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('dashboard.financialThroughput')}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 bg-emerald-500 rounded-full" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{t('dashboard.income')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 bg-rose-500 rounded-full" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{t('dashboard.expense')}</span>
                </div>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyChartData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-white/5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fontWeight: 900, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#0f172a', color: '#fff', fontSize: '10px', fontWeight: 'bold' }} />
                  <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                  <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chamber Occupancy */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">
            <h3 className="text-sm font-black uppercase italic tracking-tighter mb-1">{t('dashboard.chamberOccupancy')}</h3>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4">{t('dashboard.storageUtil')}: {occupancyPercent}%</p>
            {chamberData.length > 0 ? (
              <div className="space-y-3">
                {chamberData.map((chamber, i) => {
                  const pct = chamber.capacity > 0 ? Math.round((chamber.occupied / chamber.capacity) * 100) : 0;
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest">
                        <span className="text-slate-500">{chamber.name}</span>
                        <span className={pct > 80 ? 'text-rose-500' : pct > 50 ? 'text-amber-500' : 'text-emerald-500'}>{pct}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className={cn("h-full rounded-full", pct > 80 ? 'bg-rose-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500')}
                        />
                      </div>
                      <p className="text-[8px] font-bold text-slate-400">{chamber.occupied}/{chamber.capacity} {t('dashboard.bags')}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic">{t('dashboard.noChambers')}</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Inward */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ArrowDownCircle size={16} className="text-emerald-500" />
              <h3 className="text-xs font-black uppercase tracking-widest">{t('dashboard.recentInward')}</h3>
            </div>
            <div className="space-y-2">
              {recentInward.length > 0 ? recentInward.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/5">
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase truncate max-w-[180px]">{s.clientName}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{s.commodityName} • {s.farmerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-500">+{s.quantity}</p>
                    <p className="text-[8px] font-bold text-slate-400">{s.inwardDate || 'N/A'}</p>
                  </div>
                </div>
              )) : <p className="text-[10px] text-slate-400 italic py-4 text-center">{t('dashboard.noRecentInward')}</p>}
            </div>
          </div>

          {/* Recent Outward */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <ArrowUpCircle size={16} className="text-rose-500" />
              <h3 className="text-xs font-black uppercase tracking-widest">{t('dashboard.recentOutward')}</h3>
            </div>
            <div className="space-y-2">
              {recentOutward.length > 0 ? recentOutward.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/[0.02] rounded-xl border border-slate-100 dark:border-white/5">
                  <div>
                    <p className="text-xs font-black text-slate-800 dark:text-white uppercase truncate max-w-[180px]">{s.clientName}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{s.commodityName} • {s.orderId}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-rose-500">-{s.quantity}</p>
                    <Badge className={cn("text-[7px] font-black uppercase px-2 py-0.5 border-none rounded",
                      s.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' :
                        s.paymentStatus === 'PARTIAL' ? 'bg-amber-500/10 text-amber-500' : 'bg-rose-500/10 text-rose-500'
                    )}>{s.paymentStatus || 'UNPAID'}</Badge>
                  </div>
                </div>
              )) : <p className="text-[10px] text-slate-400 italic py-4 text-center">{t('dashboard.noRecentOutward')}</p>}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
