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
  Info,
  Calendar,
  Layers,
  FileText,
  User,
  Scale
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
  const [commodities, setCommodities] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    inwardDate: new Date().toISOString().split('T')[0],
    inBillNumber: '',
    clientId: '',
    clientName: '',
    farmerId: '',
    farmerName: '',
    commodityId: '',
    commodityName: '',
    varietyId: '',
    varietyName: '',
    locationId: '',
    mark: '',
    quantity: 0,
    weight: 0,
    vehicleNumber: '',
    driverNumber: '',
    notes: ''
  });

  useEffect(() => {
    const unsub = dbService.sync('incoming_shipments', setShipments);
    dbService.sync('clients', setClients);
    dbService.sync('products', setCommodities); // repurpose products as commodities in database
    dbService.sync('locations', setLocations);
    return () => unsub();
  }, []);

  // Sync dependant lists
  const selectedClientObj = clients.find(c => c.id === formData.clientId || c.name === formData.clientName);
  const farmersList = selectedClientObj?.farmers || [];

  const selectedCommodityObj = commodities.find(c => c.id === formData.commodityId || c.name === formData.commodityName);
  const varietiesList = selectedCommodityObj?.varieties || [];

  const selectedLoc = locations.find(l => l.id === formData.locationId);



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    if (!formData.clientId || !formData.commodityId || !formData.varietyId || !formData.locationId) {
      toast.error('Please complete all required selection fields before saving.');
      return;
    }

    if (formData.quantity <= 0) {
      toast.error('Bags quantity must be greater than zero.');
      return;
    }

    setLoading(true);
    try {
      // Find names for ID entries
      const client = clients.find(c => c.id === formData.clientId);
      const farmer = client?.farmers?.find((f: any) => f.id === formData.farmerId);
      const commodity = commodities.find(c => c.id === formData.commodityId);
      const variety = commodity?.varieties?.find((v: any) => v.id === formData.varietyId);
      const loc = locations.find(l => l.id === formData.locationId);

      const payload = {
        ...formData,
        clientName: client?.name || '',
        farmerName: farmer?.name || '',
        commodityName: commodity?.name || '',
        varietyName: variety?.name || '',
        chamber: loc?.chamber || '',
        floor: loc?.floor || '',
        block: loc?.name || '',
        tenantId: tenant.id
      };

      await shipmentService.createInward(payload);
      
      toast.success(t('incoming.success', 'Inward Record Committed Successfully'));
      setIsDialogOpen(false);
      setFormData({
        inwardDate: new Date().toISOString().split('T')[0],
        inBillNumber: '',
        clientId: '',
        clientName: '',
        farmerId: '',
        farmerName: '',
        commodityId: '',
        commodityName: '',
        varietyId: '',
        varietyName: '',
        locationId: '',
        mark: '',
        quantity: 0,
        weight: 0,
        vehicleNumber: '',
        driverNumber: '',
        notes: '',
        subSlot: ''
      });
    } catch (error: any) {
      await draftQueue.saveDraft('INCOMING', formData);
      toast.error(error.message || 'Failed to create entry');
    } finally {
      setLoading(false);
    }
  };

  const sortedLocations = [...locations].sort((a, b) => {
    const order: Record<string, number> = { EMPTY: 0, PARTIAL: 1, FULL: 2 };
    return (order[a.status] || 0) - (order[b.status] || 0);
  });

  const filteredShipments = shipments.filter(s => 
    s.clientName?.toLowerCase().includes(search.toLowerCase()) ||
    s.farmerName?.toLowerCase().includes(search.toLowerCase()) ||
    s.commodityName?.toLowerCase().includes(search.toLowerCase()) ||
    s.inBillNumber?.toLowerCase().includes(search.toLowerCase()) ||
    s.mark?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-12 max-w-7xl mx-auto px-4 md:px-8">
        {/* cinematic Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <ArrowDownCircle className="h-6 w-6 text-white" />
                 </div>
                 <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase italic">{t('incoming.title', 'Inward Entry')} <span className="text-emerald-500">{t('incoming.logistics', 'Register')}</span></h2>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-xs">{t('incoming.subtitle', 'Register physical inward stocks and assign them to cold rooms.')}</p>
           </div>

           <Button onClick={() => setIsDialogOpen(true)} className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-2xl px-8 h-14 font-bold uppercase tracking-wider text-xs shadow-xl transition-all hover:scale-[1.02] active:scale-95">
              <Plus className="h-5 w-5 mr-3" /> New Inward Entry
           </Button>
        </div>



        {/* Dialog Form */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogContent className="w-[95vw] max-w-[1400px] rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader className="mb-6">
                 <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Create Inward Entry</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-8">
                 {/* Step 1: Logistics Metadata */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Inward Date</Label>
                       <Input 
                         type="date" 
                         required 
                         value={formData.inwardDate}
                         onChange={(e) => setFormData({ ...formData, inwardDate: e.target.value })}
                         className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase" 
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">In Bill Number</Label>
                       <Input 
                         required 
                         placeholder="ENTER BILL #"
                         value={formData.inBillNumber}
                         onChange={(e) => setFormData({ ...formData, inBillNumber: e.target.value.toUpperCase() })}
                         className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase tracking-wider" 
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bag Markings (Label)</Label>
                       <Input 
                         required 
                         placeholder="e.g. G.E. / RED"
                         value={formData.mark}
                         onChange={(e) => setFormData({ ...formData, mark: e.target.value.toUpperCase() })}
                         className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase" 
                       />
                    </div>
                 </div>

                 {/* Step 2: Dependant Entities selection */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Client Selection */}
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Merchant Client</Label>
                       <select 
                         required
                         value={formData.clientId}
                         onChange={(e) => setFormData({ ...formData, clientId: e.target.value, farmerId: '' })}
                         className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-700 dark:text-slate-350"
                       >
                          <option value="">Select Merchant Client</option>
                          {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                    </div>

                    {/* Farmer Selection */}
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Farmer (Under Selected Merchant) - Optional</Label>
                       <select 
                         disabled={!formData.clientId}
                         value={formData.farmerId}
                         onChange={(e) => setFormData({ ...formData, farmerId: e.target.value })}
                         className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-700 dark:text-slate-350 disabled:opacity-50"
                       >
                          <option value="">No Farmer (Direct to Client)</option>
                          {farmersList.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                       </select>
                    </div>
                 </div>

                 {/* Step 3: Dependant Products Selection */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Commodity Catalog</Label>
                       <select 
                         required
                         value={formData.commodityId}
                         onChange={(e) => setFormData({ ...formData, commodityId: e.target.value, varietyId: '' })}
                         className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-700 dark:text-slate-350"
                       >
                          <option value="">Select Commodity</option>
                          {commodities.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                       </select>
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Variety (Under Selected Commodity)</Label>
                       <select 
                         required
                         disabled={!formData.commodityId}
                         value={formData.varietyId}
                         onChange={(e) => setFormData({ ...formData, varietyId: e.target.value })}
                         className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-700 dark:text-slate-350 disabled:opacity-50"
                       >
                          <option value="">Select Variety</option>
                          {varietiesList.map((v: any) => <option key={v.id} value={v.id}>{v.name} (₹{v.baseRate || 0})</option>)}
                       </select>
                    </div>
                 </div>

                 {/* Step 4: Storage layout and quantity */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bags Quantity</Label>
                       <Input 
                         type="number" 
                         required 
                         value={formData.quantity || ''}
                         onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                         className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl text-lg font-black italic px-6" 
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Weight In (Quintals/KG)</Label>
                       <Input 
                         type="number" 
                         required 
                         value={formData.weight || ''}
                         onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                         className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl text-lg font-black italic px-6" 
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Cold Room Location Slot</Label>
                       <select 
                         required
                         value={formData.locationId}
                         onChange={(e) => setFormData({ ...formData, locationId: e.target.value, subSlot: '' })}
                         className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-700 dark:text-slate-350"
                       >
                          <option value="">Select Target Block</option>
                          {sortedLocations.map(l => (
                            <option key={l.id} value={l.id} disabled={l.status === 'FULL'}>
                              {l.status === 'EMPTY' ? '🟢' : l.status === 'PARTIAL' ? '🟡' : '🔴'} {l.chamber} › {l.floor} › {l.name} — Free: {(l.capacity || 0) - (l.occupied || 0)} bags
                            </option>
                          ))}
                       </select>
                    </div>
                    {selectedLoc && selectedLoc.subSlots && (
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sub-Slot</Label>
                          <select 
                            required
                            value={formData.subSlot || ''}
                            onChange={(e) => setFormData({ ...formData, subSlot: e.target.value })}
                            className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-700 dark:text-slate-350"
                          >
                             <option value="">Select Sub-Slot</option>
                             {selectedLoc.subSlots.split(',').map((s: string) => s.trim()).filter(Boolean).map((s: string) => (
                               <option key={s} value={s}>{s}</option>
                             ))}
                          </select>
                       </div>
                    )}
                 </div>

                 {/* Realtime Block status feedback gauge */}
                 <AnimatePresence>
                    {selectedLoc && (
                       <motion.div 
                         initial={{ opacity: 0, y: 10 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="p-6 bg-slate-50 dark:bg-slate-850 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between"
                       >
                          <div className="flex items-center gap-4">
                             <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${
                               selectedLoc.status === 'EMPTY' ? 'bg-emerald-500/10 text-emerald-500' : 
                               selectedLoc.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-500' : 
                               'bg-rose-500/10 text-rose-500'
                             }`}>
                                <Info size={20} />
                             </div>
                             <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Target Block Slot</p>
                                <p className="text-xs font-black uppercase italic tracking-tighter">{selectedLoc.chamber} › {selectedLoc.floor} › {selectedLoc.name}</p>
                             </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Capacity Free</p>
                             <p className="text-xs font-black italic tracking-tighter">{(selectedLoc.capacity || 0) - (selectedLoc.occupied || 0)} bags remaining</p>
                          </div>
                       </motion.div>
                    )}
                 </AnimatePresence>

                 {/* Step 5: Vehicle logistics */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vehicle Registration Number</Label>
                       <Input 
                         required 
                         placeholder="e.g. AP 39 TV 2234"
                         value={formData.vehicleNumber}
                         onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                         className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl font-black text-sm px-6 uppercase tracking-wider" 
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Driver Contact Number</Label>
                       <Input 
                         required 
                         placeholder="e.g. 9866023349"
                         value={formData.driverNumber}
                         onChange={(e) => setFormData({ ...formData, driverNumber: e.target.value })}
                         className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl font-black text-sm px-6 tracking-wider" 
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Audit Notes / Remarks</Label>
                    <textarea 
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="ADD REGISTER AUDIT NOTES HERE..."
                      className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-950 border-none rounded-2xl p-6 text-xs font-bold uppercase tracking-wider outline-none text-slate-800 dark:text-white"
                    />
                 </div>

                 <Button type="submit" disabled={loading} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/20">
                    {loading ? 'Processing Transaction...' : 'Commit Inward Entry'}
                 </Button>
              </form>
           </DialogContent>
        </Dialog>

        {/* Table view logs instead of simple grid cards for professional register layout */}
        <div className="bg-transparent dark:bg-transparent rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden">
           <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                 <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">Active Inward Storage Ledger</h3>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Historical physical register entries under active custody</p>
              </div>
              <div className="relative w-full sm:w-72">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                 <input 
                   type="text" 
                   value={search}
                   onChange={(e) => setSearch(e.target.value)}
                   placeholder="Search logs..."
                   className="w-full h-10 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-4 text-[10px] font-bold uppercase tracking-wider outline-none text-slate-900 dark:text-white placeholder:text-slate-500" 
                 />
              </div>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500">
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Bill #</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Date</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Client Name</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Farmer Name</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Commodity</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Bags (Custody)</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Mark</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Storage Location</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredShipments.length > 0 ? (
                      filteredShipments.map(s => (
                         <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-xs font-black text-slate-800 dark:text-white italic uppercase tracking-wider">{s.inBillNumber}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-350">{s.inwardDate || 'N/A'}</td>
                            <td className="px-6 py-4 text-xs font-black text-slate-800 dark:text-white truncate max-w-[150px] uppercase">{s.clientName}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-350 truncate max-w-[150px] uppercase">{s.farmerName}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-350 uppercase">{s.commodityName} › {s.varietyName}</td>
                            <td className="px-6 py-4 text-xs font-black text-emerald-500">
                              {s.remainingBags !== undefined ? s.remainingBags : s.quantity} / {s.quantity} bags
                            </td>
                            <td className="px-6 py-4 text-xs font-black text-slate-800 dark:text-white uppercase">{s.mark || 'N/A'}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">{s.chamber} › {s.floor} › {s.block}</td>
                         </tr>
                      ))
                    ) : (
                       <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-xs text-slate-400 italic">No inward storage registries logged matching search filter.</td>
                       </tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      </div>
    </Layout>
  );
}
