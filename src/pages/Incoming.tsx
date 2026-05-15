import * as React from 'react';
import { useState, useEffect } from 'react';
import { shipmentService } from '../services/shipment.service';
import { dbService } from '../services/db.service';
import { useAuthStore } from '../store/authStore';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { 
  Plus, 
  Search, 
  Truck, 
  ArrowDownCircle, 
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { draftQueue } from '../services/draft.service';
import { useTranslation } from 'react-i18next';

export default function Incoming() {
  const { t } = useTranslation();
  const { tenant } = useAuthStore();
  const [shipments, setShipments] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    productId: '',
    locationId: '',
    quantity: 0,
    vehicleNumber: '',
    gatePass: '',
  });

  useEffect(() => {
    const unsub = dbService.sync('incoming_shipments', setShipments);
    dbService.sync('clients', setClients);
    dbService.sync('products', setProducts);
    dbService.sync('locations', setLocations);
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    setLoading(true);
    try {
      await shipmentService.createInward({
        ...formData,
        tenantId: tenant.id
      });
      
      toast.success(t('incoming.success', 'Inward Record Created'));
      setIsDialogOpen(false);
      setFormData({ clientId: '', productId: '', locationId: '', quantity: 0, vehicleNumber: '', gatePass: '' });
    } catch (error: any) {
      await draftQueue.saveDraft('INCOMING', formData);
      toast.error(error.message || 'Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  const selectedLoc = locations.find(l => l.id === formData.locationId);

  // Sort locations: EMPTY first, PARTIAL second, FULL last
  const sortedLocations = [...locations].sort((a, b) => {
    const order: Record<string, number> = { EMPTY: 0, PARTIAL: 1, FULL: 2 };
    return (order[a.status] || 0) - (order[b.status] || 0);
  });

  return (
    <Layout>
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <ArrowDownCircle className="h-5 w-5 text-white" />
                 </div>
                 <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{t('incoming.title', 'Incoming')} <span className="text-emerald-500">{t('incoming.logistics', 'Shipments')}</span></h2>
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">{t('incoming.subtitle', 'Register inward stock entries and assign to storage locations.')}</p>
           </div>

           <Button onClick={() => setIsDialogOpen(true)} className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-[10px] shadow-xl transition-all active:scale-95">
              <Plus className="h-5 w-5 mr-3" /> {t('incoming.addNew', 'New Incoming Entry')}
           </Button>
        </div>

        {/* Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogContent className="max-w-2xl rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
              <DialogHeader className="mb-8">
                 <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">{t('incoming.createTitle', 'Create Incoming Entry')}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-8">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client</Label>
                       <select 
                         required
                         value={formData.clientId}
                         onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                         className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none"
                       >
                          <option value="">Select Client</option>
                          {clients.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                       </select>
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Product</Label>
                       <select 
                         required
                         value={formData.productId}
                         onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
                         className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none"
                       >
                          <option value="">Select Product</option>
                          {products.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Quantity (Bags)</Label>
                       <Input 
                         type="number" 
                         required 
                         value={formData.quantity}
                         onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                         className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl font-black text-lg px-6 italic" 
                       />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Assign to Location</Label>
                       <select 
                         required
                         value={formData.locationId}
                         onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                         className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none"
                       >
                          <option value="">Select Block / Slot</option>
                          {sortedLocations.map(l => (
                            <option key={l.id} value={l.id} disabled={l.status === 'FULL'}>
                              {l.status === 'EMPTY' ? '🟢' : l.status === 'PARTIAL' ? '🟡' : '🔴'} {l.chamber} › {l.floor} › {l.name} — {l.occupied || 0}/{l.capacity} bags ({l.status})
                            </option>
                          ))}
                       </select>
                    </div>
                 </div>

                 {/* Location Status Indicator */}
                 <AnimatePresence>
                    {selectedLoc && (
                       <motion.div 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 flex items-center justify-between"
                       >
                          <div className="flex items-center gap-4">
                             <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                               selectedLoc.status === 'EMPTY' ? 'bg-emerald-500/10 text-emerald-500' : 
                               selectedLoc.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-500' : 
                               'bg-rose-500/10 text-rose-500'
                             }`}>
                                <Info size={18} />
                             </div>
                             <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Target Block</p>
                                <p className="text-xs font-black uppercase italic tracking-tighter">{selectedLoc.chamber} › {selectedLoc.floor} › {selectedLoc.name}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Available</p>
                             <p className="text-xs font-black italic tracking-tighter">{(selectedLoc.capacity || 0) - (selectedLoc.occupied || 0)} bags free</p>
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vehicle Number</Label>
                       <Input 
                         required 
                         placeholder="TS 09 EQ 1234"
                         value={formData.vehicleNumber}
                         onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                         className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl font-black text-sm px-6 uppercase tracking-widest" 
                       />
                    </div>
                    <div className="space-y-3">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Gate Pass</Label>
                       <Input 
                         required 
                         value={formData.gatePass}
                         onChange={(e) => setFormData({ ...formData, gatePass: e.target.value })}
                         className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl font-black text-sm px-6 uppercase tracking-widest" 
                       />
                    </div>
                 </div>

                 <Button type="submit" disabled={loading} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/20">
                    {loading ? 'Processing...' : 'Commit Incoming Entry'}
                 </Button>
              </form>
           </DialogContent>
        </Dialog>

        {/* Shipment Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
           {shipments.map((s, i) => (
              <motion.div 
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-premium border border-slate-100 dark:border-white/5 group hover:border-emerald-500/50 transition-all"
              >
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center font-black text-emerald-500 border border-slate-100 dark:border-white/5">
                          {s.quantity}
                       </div>
                       <div>
                          <h4 className="text-sm font-black uppercase tracking-tighter italic">{s.productId}</h4>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{s.vehicleNumber}</p>
                       </div>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[8px] px-3 py-1 uppercase">{s.status}</Badge>
                 </div>

                 <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-50 dark:border-white/5">
                    <div className="space-y-1">
                       <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Client</p>
                       <p className="text-[10px] font-black uppercase truncate">{s.clientId}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Location</p>
                       <p className="text-[10px] font-black uppercase truncate">{s.locationId}</p>
                    </div>
                    <div className="space-y-1">
                       <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Time</p>
                       <p className="text-[10px] font-black uppercase truncate">{s.createdAt?.seconds ? new Date(s.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'N/A'}</p>
                    </div>
                 </div>
              </motion.div>
           ))}
        </div>
      </div>
    </Layout>
  );
}
