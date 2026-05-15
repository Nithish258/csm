import * as React from 'react';
import { useState, useEffect } from 'react';
import { crud } from '../lib/db';
import { useAuthStore } from '../store/authStore';
import Layout from '../components/layout/Layout';
import { Badge } from '../components/ui/badge';
import { 
  History, 
  User, 
  Activity, 
  Terminal, 
  Search, 
  Filter, 
  Download,
  Calendar,
  Clock,
  ChevronDown,
  ArrowRight,
  Database,
  ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

export default function AuditLogs() {
  const { profile } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!profile?.tenantId) return;
    setLoading(true);
    const unsubscribe = crud.sync('auditLogs', profile.tenantId, (data) => {
      setLogs(data.sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [profile?.tenantId]);

  const filteredLogs = logs.filter(log => 
    log.action?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-12 pb-24">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
           <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="flex items-center gap-3 mb-4">
                 <Badge className="bg-rose-500/10 text-rose-600 border-none px-4 py-1.5 font-black uppercase tracking-widest text-[9px]">
                    System Integrity Log
                 </Badge>
              </div>
              <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic uppercase leading-none">
                 Audit <span className="text-emerald-500">Trail</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium border-l-4 border-emerald-500 pl-6 mt-6 max-w-2xl">
                 Immutable historical record of all administrative and operational transactions across the network.
              </p>
           </motion.div>

           <div className="flex items-center gap-4">
              <Button size="lg" className="rounded-[2.5rem] bg-slate-950 dark:bg-emerald-600 text-white shadow-2xl font-black h-16 px-10 active:scale-95 transition-all">
                 <Download className="h-5 w-5 mr-3" /> Export Audit Base
              </Button>
           </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4">
           <div className="relative group flex-1">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
              <Input 
                placeholder="Search by action, user, or payload hash..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-16 pl-16 rounded-3xl bg-white dark:bg-slate-900 border-none shadow-premium font-bold text-sm"
              />
           </div>
           <Button variant="outline" className="h-16 px-10 rounded-3xl bg-white dark:bg-slate-900 border-none shadow-premium font-black text-[10px] uppercase tracking-widest">
              <Filter className="h-4 w-4 mr-3" /> Advanced Filters
           </Button>
        </div>

        {/* Timeline View */}
        <div className="relative space-y-12">
           {/* Timeline Line */}
           <div className="absolute left-10 top-0 bottom-0 w-px bg-slate-200 dark:bg-white/5 hidden md:block" />

           <AnimatePresence mode="popLayout">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                   <div className="h-12 w-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verifying Ledger Blocks...</p>
                </div>
              ) : filteredLogs.length === 0 ? (
                <div className="text-center py-24 text-slate-400 font-bold italic uppercase tracking-widest opacity-40">
                   No audit records matching current parameters.
                </div>
              ) : filteredLogs.map((log, i) => (
                <motion.div 
                  key={log.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="relative pl-0 md:pl-24"
                >
                   {/* Node Marker */}
                   <div className="absolute left-7 top-6 h-6 w-6 rounded-full bg-white dark:bg-slate-900 border-4 border-emerald-500 shadow-lg shadow-emerald-500/20 z-10 hidden md:block" />

                   <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-premium group hover:bg-slate-50 dark:hover:bg-white/2 transition-all">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                         <div className="flex items-center gap-6">
                            <div className="h-14 w-14 rounded-2xl bg-slate-950 flex items-center justify-center font-black text-emerald-500 text-xs shadow-xl border border-white/5">
                               {log.userName?.substring(0, 2).toUpperCase() || 'SYS'}
                            </div>
                            <div>
                               <div className="flex items-center gap-3">
                                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">{log.userName || 'System Engine'}</h3>
                                  <Badge className={cn(
                                     "px-3 py-1 font-black text-[8px] uppercase tracking-widest",
                                     log.action?.includes('ERROR') ? 'bg-rose-500' : 'bg-slate-950'
                                  )}>
                                     {log.action || 'TRANSACTION'}
                                  </Badge>
                               </div>
                               <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                     <Clock className="h-3 w-3" />
                                     {log.createdAt?.toDate ? log.createdAt.toDate().toLocaleString() : 'Just Now'}
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px] font-bold text-emerald-500/60">
                                     <Terminal className="h-3 w-3" />
                                     NODE_AUTH_{log.id.slice(-6)}
                                  </div>
                               </div>
                            </div>
                         </div>
                         <div className="flex items-center gap-3">
                            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-slate-200 dark:border-white/10 text-slate-400">
                               {log.resourceType || 'MODULE'}
                            </Badge>
                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl hover:bg-white dark:hover:bg-white/5">
                               <ArrowRight className="h-4 w-4 text-slate-400" />
                            </Button>
                         </div>
                      </div>

                      <div className="p-8 bg-slate-50 dark:bg-white/2 rounded-[2rem] border border-slate-100 dark:border-white/5 relative overflow-hidden group/payload">
                         <div className="absolute top-0 right-0 p-4 opacity-5 group-hover/payload:opacity-10 transition-opacity">
                            <Database className="h-20 w-20" />
                         </div>
                         <p className="text-sm font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic max-w-4xl">
                            "{log.details}"
                         </p>
                         
                         {/* Payload Details (Mock/Expandable feel) */}
                         <div className="mt-6 flex flex-wrap gap-3">
                            <span className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 dark:border-white/5">
                               Status: 200 OK
                            </span>
                            <span className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 dark:border-white/5">
                               Sync: Verified
                            </span>
                            <span className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-400 border border-slate-100 dark:border-white/5">
                               ID: {log.id}
                            </span>
                         </div>
                      </div>
                   </div>
                </motion.div>
              ))}
           </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
