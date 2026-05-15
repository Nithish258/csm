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
  ArrowUpCircle, 
  Info,
  Package
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { draftQueue } from '../services/draft.service';
import { useTranslation } from 'react-i18next';

export default function Outgoing() {
  const { t } = useTranslation();
  const { tenant } = useAuthStore();
  const [shipments, setShipments] = useState<any[]>([]);
  const [incomingShipments, setIncomingShipments] = useState<any[]>([]);
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
    orderId: '',
  });

  useEffect(() => {
    const unsub = dbService.sync('outgoing_shipments', setShipments);
    dbService.sync('incoming_shipments', setIncomingShipments);
    dbService.sync('clients', setClients);
    dbService.sync('products', setProducts);
    dbService.sync('locations', setLocations);
    return () => unsub();
  }, []);

  // Calculate client's remaining bags
  const getClientBagSummary = (clientName: string) => {
    const totalIn = incomingShipments.filter(s => s.clientId === clientName).reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalOut = shipments.filter(s => s.clientId === clientName).reduce((sum, s) => sum + (s.quantity || 0), 0);
    return { totalIn, totalOut, remaining: totalIn - totalOut };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    // Validate: client must have enough remaining bags
    const summary = getClientBagSummary(formData.clientId);
    if (formData.quantity > summary.remaining) {
      toast.error(`Client only has ${summary.remaining} bags remaining. Cannot dispatch ${formData.quantity}.`);
      return;
    }

    setLoading(true);
    try {
      await shipmentService.createOutward({
        ...formData,
        tenantId: tenant.id
      });
      
      toast.success(t('outgoing.success', 'Dispatch Completed'));
      setIsDialogOpen(false);
      setFormData({ clientId: '', productId: '', locationId: '', quantity: 0, vehicleNumber: '', orderId: '' });
    } catch (error: any) {
      if (error.message?.includes('Insufficient') || error.message?.includes('Negative')) {
        toast.error(error.message);
      } else {
        await draftQueue.saveDraft('OUTGOING', formData);
        toast.error(error.message || 'Dispatch failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const selectedClientSummary = formData.clientId ? getClientBagSummary(formData.clientId) : null;

  return (
    <Layout>
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                     <ArrowUpCircle className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{t('outgoing.title', 'Outgoing')} <span className="text-blue-500">{t('outgoing.orders', 'Dispatch')}</span></h2>
               </div>
               <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">{t('outgoing.subtitle', 'Process outward dispatch with stock validation.')}</p>
            </div>

           <Button onClick={() => setIsDialogOpen(true)} className="bg-slate-900 hover:bg-slate-800 text-white rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-[10px] shadow-xl transition-all">
              <Plus className="h-5 w-5 mr-3" /> {t('outgoing.addNew', 'New Dispatch')}
           </Button>
        </div>

        {/* Create Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogContent className="max-w-2xl rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
              <DialogHeader className="mb-8">
                 <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">{t('outgoing.createTitle', 'Create Dispatch Entry')}</DialogTitle>
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
                           {clients.map(c => {
                             const s = getClientBagSummary(c.name);
                             return <option key={c.id} value={c.name}>{c.name} ({s.remaining} bags remaining)</option>;
                           })}
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

                 {/* Client Bag Summary */}
                 <AnimatePresence>
                   {selectedClientSummary && (
                     <motion.div
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="p-6 bg-blue-50 dark:bg-blue-900/20 rounded-3xl border border-blue-100 dark:border-blue-800 flex items-center justify-between"
                     >
                       <div className="flex items-center gap-4">
                         <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                           <Package size={18} />
                         </div>
                         <div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">Client Inventory Summary</p>
                           <p className="text-xs font-black uppercase italic tracking-tighter text-blue-700 dark:text-blue-400">{formData.clientId}</p>
                         </div>
                       </div>
                       <div className="flex gap-6 text-center">
                         <div>
                           <p className="text-[8px] font-black uppercase text-blue-400 tracking-widest">In</p>
                           <p className="text-lg font-black text-emerald-500">{selectedClientSummary.totalIn}</p>
                         </div>
                         <div>
                           <p className="text-[8px] font-black uppercase text-blue-400 tracking-widest">Out</p>
                           <p className="text-lg font-black text-rose-500">{selectedClientSummary.totalOut}</p>
                         </div>
                         <div>
                           <p className="text-[8px] font-black uppercase text-blue-400 tracking-widest">Left</p>
                           <p className="text-lg font-black text-blue-600">{selectedClientSummary.remaining}</p>
                         </div>
                       </div>
                     </motion.div>
                   )}
                 </AnimatePresence>

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
                        {selectedClientSummary && formData.quantity > selectedClientSummary.remaining && (
                          <p className="text-[10px] font-black text-rose-500">⚠️ Exceeds available bags ({selectedClientSummary.remaining} remaining)</p>
                        )}
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">From Location</Label>
                        <select 
                          required
                          value={formData.locationId}
                          onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                          className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none"
                        >
                           <option value="">Select Block</option>
                           {locations.filter(l => l.status !== 'EMPTY').map(l => (
                             <option key={l.id} value={l.id}>
                               {l.chamber} › {l.floor} › {l.name} — {l.occupied || 0} bags ({l.status})
                             </option>
                           ))}
                        </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Vehicle Number</Label>
                        <Input 
                          required 
                          value={formData.vehicleNumber}
                          onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                          className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl font-black text-sm px-6 uppercase tracking-widest" 
                        />
                    </div>
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Release Order ID</Label>
                        <Input 
                          required 
                          value={formData.orderId}
                          onChange={(e) => setFormData({ ...formData, orderId: e.target.value })}
                          className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl font-black text-sm px-6 uppercase tracking-widest" 
                        />
                    </div>
                 </div>

                  <Button type="submit" disabled={loading} className="w-full h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-blue-500/20">
                     {loading ? 'Validating...' : 'Commit Dispatch'}
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
                className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-premium border border-slate-100 dark:border-white/5 group hover:border-blue-500/50 transition-all"
              >
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 bg-slate-50 dark:bg-slate-950 rounded-2xl flex items-center justify-center font-black text-blue-500 border border-slate-100 dark:border-white/5">
                          {s.quantity}
                       </div>
                       <div>
                          <h4 className="text-sm font-black uppercase tracking-tighter italic">{s.productId}</h4>
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">RO: {s.orderId}</p>
                       </div>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-500 border-none font-black text-[8px] px-3 py-1 uppercase">{s.status}</Badge>
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
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Vehicle</p>
                        <p className="text-[10px] font-black uppercase truncate">{s.vehicleNumber}</p>
                     </div>
                  </div>
              </motion.div>
           ))}
        </div>
      </div>
    </Layout>
  );
}
