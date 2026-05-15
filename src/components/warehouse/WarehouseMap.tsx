import * as React from 'react';
import { useState, useEffect } from 'react';
import { dbService } from '../../services/db.service';
import { useAuthStore } from '../../store/authStore';
import { 
  Warehouse, 
  Layers, 
  Box, 
  Info, 
  AlertTriangle, 
  CheckCircle2, 
  Zap,
  Activity,
  ArrowRight,
  Filter,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { toast } from 'sonner';

export default function WarehouseMap() {
  const { tenant } = useAuthStore();
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [view, setView] = useState<'3D' | 'LIST'>('3D');

  useEffect(() => {
    const unsub = dbService.sync('locations', setLocations);
    return () => unsub();
  }, []);

  // Grouping logic for hierarchy: Chamber -> Floor -> Block
  const chambers = Array.from(new Set(locations.map(l => l.chamber || 'UNASSIGNED')));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EMPTY': return 'bg-emerald-500';
      case 'PARTIAL': return 'bg-amber-500';
      case 'FULL': return 'bg-rose-500';
      case 'RESERVED': return 'bg-blue-500';
      case 'MAINTENANCE': return 'bg-slate-500';
      default: return 'bg-slate-200';
    }
  };

  return (
    <div className="space-y-12">
      {/* Cinematic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
         <div className="space-y-4">
            <div className="flex items-center gap-3">
               <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <Layers className="h-5 w-5 text-white" />
               </div>
               <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Warehouse <span className="text-emerald-500">Topology</span></h2>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Real-time Occupancy Telemetry for {tenant?.name}</p>
         </div>

         <div className="flex items-center bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-100 dark:border-white/5 shadow-premium">
            <button 
              onClick={() => setView('3D')}
              className={cn("px-6 h-10 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all", view === '3D' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-slate-600")}
            >
               Heatmap
            </button>
            <button 
              onClick={() => setView('LIST')}
              className={cn("px-6 h-10 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all", view === 'LIST' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "text-slate-400 hover:text-slate-600")}
            >
               Registry
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
         {/* Main Map View */}
         <div className="lg:col-span-8 space-y-10">
            {chambers.map((chamber, cIndex) => (
               <div key={chamber} className="space-y-6">
                  <div className="flex items-center gap-4">
                     <Badge className="bg-slate-950 text-white border-none px-6 py-2 rounded-xl font-black uppercase tracking-[0.3em] text-[9px]">
                        {chamber} Node
                     </Badge>
                     <div className="h-px flex-1 bg-slate-100 dark:bg-white/5" />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                     {locations.filter(l => l.chamber === chamber).map((loc, lIndex) => (
                        <motion.button
                          key={loc.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: (cIndex * 0.1) + (lIndex * 0.02) }}
                          onClick={() => setSelectedLocation(loc)}
                          className={cn(
                            "group relative aspect-square rounded-[1.5rem] border-2 transition-all p-4 flex flex-col justify-between overflow-hidden",
                            selectedLocation?.id === loc.id 
                              ? "border-emerald-500 shadow-2xl shadow-emerald-500/20 bg-emerald-500/5" 
                              : "border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-white/10"
                          )}
                        >
                           <div className="flex justify-between items-start w-full">
                              <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400 group-hover:text-slate-600 transition-colors">
                                 {loc.id.split('-').pop()}
                              </span>
                              <div className={cn("h-3 w-3 rounded-full shadow-lg", getStatusColor(loc.status))} />
                           </div>
                           
                           <div className="w-full space-y-2">
                              <div className="h-1 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                                 <motion.div 
                                   initial={{ width: 0 }}
                                   animate={{ width: `${loc.utilization || 0}%` }}
                                   className={cn("h-full", getStatusColor(loc.status))} 
                                 />
                              </div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                                 {Math.round(loc.utilization || 0)}%
                              </p>
                           </div>
                        </motion.button>
                     ))}
                  </div>
               </div>
            ))}

            {locations.length === 0 && (
               <div className="h-80 flex flex-col items-center justify-center bg-slate-50 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/10">
                  <Activity className="h-12 w-12 text-slate-300 mb-4 animate-pulse" />
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Initializing Grid Telemetry...</p>
               </div>
            )}
         </div>

         {/* Detailed Inspection Panel */}
         <div className="lg:col-span-4 space-y-8">
            <AnimatePresence mode="wait">
               {selectedLocation ? (
                  <motion.div
                    key="inspector"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group"
                  >
                     <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-3xl -mr-16 -mt-16" />
                     
                     <div className="relative z-10 space-y-10">
                        <div>
                           <Badge className="bg-emerald-500 text-white border-none font-black text-[9px] px-4 py-1 uppercase tracking-widest mb-4">
                              {selectedLocation.status}
                           </Badge>
                           <h3 className="text-4xl font-black italic tracking-tighter uppercase leading-none">
                              {selectedLocation.name || selectedLocation.id}
                           </h3>
                           <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">Node Intelligence Data</p>
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/10">
                           <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Occupied</p>
                              <p className="text-2xl font-black italic tracking-tighter text-emerald-400">{selectedLocation.occupied || 0} <span className="text-[10px] text-white/40 not-italic">BAGS</span></p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Capacity</p>
                              <p className="text-2xl font-black italic tracking-tighter text-white">{selectedLocation.capacity || 1000} <span className="text-[10px] text-white/40 not-italic">BAGS</span></p>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest">
                              <span>Load Factor</span>
                              <span>{Math.round(selectedLocation.utilization || 0)}%</span>
                           </div>
                           <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: `${selectedLocation.utilization || 0}%` }}
                                className="h-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" 
                              />
                           </div>
                        </div>

                        <div className="space-y-4 pt-8">
                           <Button className="w-full bg-white text-slate-900 hover:bg-slate-100 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                              Inspect Storage Log
                           </Button>
                           <Button variant="ghost" className="w-full text-white hover:bg-white/10 h-14 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                              Rebalance Node
                           </Button>
                        </div>
                     </div>
                  </motion.div>
               ) : (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full min-h-[400px] bg-white dark:bg-slate-900 rounded-[3rem] p-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 dark:border-white/5 text-center"
                  >
                     <div className="h-20 w-20 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                        <Zap className="h-10 w-10 text-slate-200" />
                     </div>
                     <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Select a storage node <br />to interface with telemetry</h4>
                  </motion.div>
               )}
            </AnimatePresence>
         </div>
      </div>
   </div>
  );
}
