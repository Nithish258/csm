import * as React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { dbService } from '../services/db.service';
import { 
  Warehouse, 
  Search, 
  Filter, 
  Package, 
  MapPin, 
  ArrowDownCircle,
  ArrowUpCircle,
  Activity,
  Box
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';

export default function Stock() {
  const { t } = useTranslation();
  const { tenant } = useAuthStore();
  const [locations, setLocations] = useState<any[]>([]);
  const [incomingShipments, setIncomingShipments] = useState<any[]>([]);
  const [outgoingShipments, setOutgoingShipments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [auditLocation, setAuditLocation] = useState<any>(null);

  useEffect(() => {
    const unsub1 = dbService.sync('locations', setLocations);
    const unsub2 = dbService.sync('incoming_shipments', setIncomingShipments);
    const unsub3 = dbService.sync('outgoing_shipments', setOutgoingShipments);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  // Build stock view from locations
  const stockItems = locations.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.chamber?.toLowerCase().includes(search.toLowerCase()) ||
    l.floor?.toLowerCase().includes(search.toLowerCase())
  );

  const totalBags = locations.reduce((sum, l) => sum + (l.occupied || 0), 0);
  const totalCapacity = locations.reduce((sum, l) => sum + (l.capacity || 0), 0);

  // Get audit log for a specific location
  const getAuditLog = (locationId: string) => {
    const incoming = incomingShipments.filter(s => s.locationId === locationId);
    const outgoing = outgoingShipments.filter(s => s.locationId === locationId);
    
    const combined = [
      ...incoming.map(s => ({ ...s, type: 'IN' as const, timestamp: s.createdAt })),
      ...outgoing.map(s => ({ ...s, type: 'OUT' as const, timestamp: s.createdAt })),
    ].sort((a, b) => {
      const aTime = a.timestamp?.seconds || 0;
      const bTime = b.timestamp?.seconds || 0;
      return bTime - aTime; // newest first
    });
    
    return combined;
  };

  return (
    <Layout>
      <div className="space-y-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Box className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{t('common.stock', 'Stock')}</h2>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Live stock overview by storage location with audit trail.</p>
          </div>

          <div className="flex items-center gap-6 text-right">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Stock</p>
              <p className="text-3xl font-black text-emerald-500 italic tracking-tighter">{totalBags.toLocaleString()} <span className="text-[10px] text-slate-400 not-italic uppercase tracking-widest">Bags</span></p>
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Capacity</p>
              <p className="text-3xl font-black text-slate-300 italic tracking-tighter">{totalCapacity.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-premium">
           <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="SEARCH BY CHAMBER, FLOOR, OR BLOCK..."
                className="w-full h-12 bg-slate-50 dark:bg-slate-950 border-none rounded-xl pl-12 text-[10px] font-black uppercase tracking-widest outline-none placeholder:text-slate-500" 
              />
           </div>
        </div>

        {/* Stock Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
           <AnimatePresence>
              {stockItems.map((item, i) => {
                const utilization = item.capacity > 0 ? Math.round(((item.occupied || 0) / item.capacity) * 100) : 0;
                return (
                 <motion.div
                   key={item.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                   className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-premium border border-slate-100 dark:border-white/5 group hover:border-emerald-500/50 transition-all relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all" />
                    
                    <div className="flex justify-between items-start mb-6">
                       <div className="space-y-1">
                          <div className="flex gap-1.5 mb-2">
                            <Badge className="bg-blue-500/10 text-blue-500 border-none font-black text-[8px] px-2 py-0.5 uppercase tracking-widest">{item.chamber}</Badge>
                            <Badge className="bg-slate-500/10 text-slate-500 border-none font-black text-[8px] px-2 py-0.5 uppercase tracking-widest">{item.floor}</Badge>
                          </div>
                          <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{item.name}</h3>
                       </div>
                       <div className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black text-lg border ${
                         item.status === 'FULL' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-500 border-rose-100 dark:border-rose-800' : 
                         item.status === 'PARTIAL' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-500 border-amber-100 dark:border-amber-800' : 
                         'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 border-emerald-100 dark:border-emerald-800'
                       }`}>
                          {item.occupied || 0}
                       </div>
                    </div>

                    {/* Progress bar */}
                    <div className="mb-6">
                      <div className="flex justify-between mb-1.5">
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{item.occupied || 0} / {item.capacity} bags</span>
                        <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">{utilization}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-500 ${
                          item.status === 'FULL' ? 'bg-rose-500' : item.status === 'PARTIAL' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} style={{ width: `${Math.min(100, utilization)}%` }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-white/5">
                       <Badge className={`border-none font-black text-[8px] px-3 py-1 uppercase tracking-widest ${
                         item.status === 'FULL' ? 'bg-rose-500/10 text-rose-500' : 
                         item.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-500' : 
                         'bg-emerald-500/10 text-emerald-500'
                       }`}>{item.status}</Badge>
                       <Button onClick={() => setAuditLocation(item)} variant="ghost" className="h-10 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-emerald-500 hover:text-white transition-all font-black uppercase text-[9px] tracking-widest px-4 gap-2">
                          <Activity size={12} /> Audit Log
                       </Button>
                    </div>
                 </motion.div>
                );
              })}
           </AnimatePresence>
        </div>

        {/* Audit Log Dialog */}
        <Dialog open={!!auditLocation} onOpenChange={(open) => !open && setAuditLocation(null)}>
          <DialogContent className="max-w-lg rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl max-h-[80vh] overflow-y-auto">
            {auditLocation && (() => {
              const log = getAuditLog(auditLocation.id);
              return (
                <div className="space-y-8">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-black uppercase tracking-tighter italic">{auditLocation.name} — Audit Log</DialogTitle>
                  </DialogHeader>
                  <div className="flex gap-2 mb-4">
                    <Badge className="bg-blue-500/10 text-blue-500 border-none font-black text-[8px] px-2 py-0.5 uppercase">{auditLocation.chamber}</Badge>
                    <Badge className="bg-slate-500/10 text-slate-500 border-none font-black text-[8px] px-2 py-0.5 uppercase">{auditLocation.floor}</Badge>
                  </div>
                  
                  {log.length > 0 ? (
                    <div className="space-y-3">
                      {log.map((entry: any, i: number) => (
                        <div key={i} className={`flex items-center justify-between p-4 rounded-xl ${
                          entry.type === 'IN' ? 'bg-emerald-50 dark:bg-emerald-900/10' : 'bg-rose-50 dark:bg-rose-900/10'
                        }`}>
                          <div className="flex items-center gap-3">
                            {entry.type === 'IN' ? 
                              <ArrowDownCircle size={16} className="text-emerald-500" /> : 
                              <ArrowUpCircle size={16} className="text-rose-500" />
                            }
                            <div>
                              <p className={`text-sm font-black ${entry.type === 'IN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                {entry.type === 'IN' ? '+' : '-'}{entry.quantity} bags
                              </p>
                              <p className="text-[9px] font-bold text-slate-500">{entry.clientId} • {entry.productId}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-400">{entry.vehicleNumber}</p>
                            <p className="text-[8px] font-bold text-slate-300">
                              {entry.timestamp?.seconds ? new Date(entry.timestamp.seconds * 1000).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic text-center py-8">No activity recorded for this location yet.</p>
                  )}
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
