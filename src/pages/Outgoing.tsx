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
  Package,
  Search,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  Receipt,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Badge } from '../components/ui/badge';
import { draftQueue } from '../services/draft.service';
import { useTranslation } from 'react-i18next';

export default function Outgoing() {
  const { t } = useTranslation();
  const { tenant } = useAuthStore();
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [inwardLots, setInwardLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Search filter for custody lots
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Inward Lot for dispatch
  const [selectedLot, setSelectedLot] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    outwardDate: new Date().toISOString().split('T')[0],
    quantity: 0, // bags taken
    weight: 0, // weight out
    totalAmount: 0,
    paidAmount: 0,
    vehicleNumber: '',
    orderId: '' // Outward Release Order Bill Number
  });

  useEffect(() => {
    const unsub1 = dbService.sync('outgoing_shipments', setDispatches);
    // Fetch inward shipments that are in storage and have remaining bags
    const unsub2 = dbService.sync('incoming_shipments', (data) => {
      setInwardLots(data.filter(s => (s.remainingBags !== undefined ? s.remainingBags : s.quantity) > 0));
    });
    return () => { unsub1(); unsub2(); };
  }, []);

  // Generate Release Order ID helper
  useEffect(() => {
    if (selectedLot && !formData.orderId) {
      setFormData(prev => ({
        ...prev,
        orderId: `RO-${Date.now().toString().slice(-6)}`
      }));
    }
  }, [selectedLot]);

  // Derived Calculations
  const lotRemainingBags = selectedLot ? (selectedLot.remainingBags !== undefined ? selectedLot.remainingBags : selectedLot.quantity) : 0;
  const balanceBags = Math.max(0, lotRemainingBags - formData.quantity);
  const remainingAmount = Math.max(0, formData.totalAmount - formData.paidAmount);

  // Auto-calculated Payment status
  let calculatedPaymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID' = 'UNPAID';
  if (formData.totalAmount > 0) {
    if (remainingAmount <= 0) {
      calculatedPaymentStatus = 'PAID';
    } else if (formData.paidAmount > 0) {
      calculatedPaymentStatus = 'PARTIAL';
    }
  }

  const handleSelectLot = (lot: any) => {
    setSelectedLot(lot);
    setFormData({
      outwardDate: new Date().toISOString().split('T')[0],
      quantity: 0,
      weight: 0,
      totalAmount: 0,
      paidAmount: 0,
      vehicleNumber: '',
      orderId: ''
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !selectedLot) return;

    if (formData.quantity <= 0) {
      toast.error('Dispatch quantity must be greater than zero.');
      return;
    }

    if (formData.quantity > lotRemainingBags) {
      toast.error(`Stock violation: Selected lot only has ${lotRemainingBags} bags in custody.`);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        outwardDate: formData.outwardDate,
        inwardShipmentId: selectedLot.id,
        clientId: selectedLot.clientId,
        clientName: selectedLot.clientName,
        farmerId: selectedLot.farmerId || '',
        farmerName: selectedLot.farmerName || '',
        commodityId: selectedLot.commodityId,
        commodityName: selectedLot.commodityName,
        varietyId: selectedLot.varietyId,
        varietyName: selectedLot.varietyName,
        locationId: selectedLot.locationId,
        chamber: selectedLot.chamber || '',
        floor: selectedLot.floor || '',
        block: selectedLot.block || '',
        quantity: formData.quantity,
        weight: formData.weight,
        balanceBags: balanceBags,
        totalAmount: formData.totalAmount,
        paidAmount: formData.paidAmount,
        remainingAmount: remainingAmount,
        paymentStatus: calculatedPaymentStatus,
        vehicleNumber: formData.vehicleNumber,
        orderId: formData.orderId,
        tenantId: tenant.id
      };

      await shipmentService.createOutward(payload);
      toast.success('Dispatch Authorized and Ledger Updated Successfully!');
      setSelectedLot(null);
    } catch (error: any) {
      await draftQueue.saveDraft('OUTGOING', formData);
      toast.error(error.message || 'Dispatch entry failed');
    } finally {
      setLoading(false);
    }
  };

  // Search active storage lots matching input query
  const filteredLots = inwardLots.filter(lot => {
    const query = searchQuery.toLowerCase();
    return (
      lot.clientName?.toLowerCase().includes(query) ||
      lot.farmerName?.toLowerCase().includes(query) ||
      lot.inBillNumber?.toLowerCase().includes(query) ||
      lot.mark?.toLowerCase().includes(query) ||
      lot.commodityName?.toLowerCase().includes(query) ||
      lot.varietyName?.toLowerCase().includes(query)
    );
  });

  return (
    <Layout>
      <div className="space-y-12 max-w-7xl mx-auto px-4 md:px-8">
        {/* cinematic Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="space-y-4">
               <div className="flex items-center gap-3">
                  <div className="h-12 w-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                     <ArrowUpCircle className="h-6 w-6 text-white" />
                  </div>
                  <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase italic">{t('outgoing.title', 'Outward Dispatch')} <span className="text-blue-500">{t('outgoing.orders', 'Release')}</span></h2>
               </div>
               <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-xs">{t('outgoing.subtitle', 'Locate custody stocks in storage and authorize physical release dispatches.')}</p>
            </div>
        </div>

        {/* Section 1: Stock Lot Search Engine */}
        <div className="space-y-6">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-premium space-y-6">
              <div className="space-y-2">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">1. Locate Custody Lot in Storage</h3>
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="SEARCH CUSTODY LOT BY CLIENT, FARMER, MARK, BILL NUMBER, COMMODITY, OR VARIETY..."
                      className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-xl pl-12 text-xs font-bold uppercase tracking-wider outline-none text-slate-900 dark:text-white placeholder:text-slate-500" 
                    />
                 </div>
              </div>
           </div>

           {/* Custody Lots Results Grid */}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredLots.map(lot => {
                 const remaining = lot.remainingBags !== undefined ? lot.remainingBags : lot.quantity;
                 return (
                    <motion.div
                      key={lot.id}
                      className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-premium flex flex-col justify-between min-h-[300px] hover:shadow-intense group hover:border-blue-500/50 transition-all"
                    >
                       <div>
                         <div className="flex justify-between items-start mb-6">
                            <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest">IN STORAGE</Badge>
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">{lot.inBillNumber}</span>
                         </div>

                         <div className="space-y-1 mb-6">
                            <h4 className="text-xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white group-hover:text-blue-500 transition-colors leading-none">{lot.clientName}</h4>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Farmer: {lot.farmerName}</p>
                         </div>

                         <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-slate-50 dark:border-slate-850">
                            <div className="space-y-1">
                               <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Commodity Lot</p>
                               <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase">{lot.commodityName} ({lot.varietyName})</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Cold room block</p>
                               <p className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase truncate">{lot.chamber} › {lot.block}</p>
                            </div>
                         </div>
                       </div>

                       <div>
                         <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800">
                            <div>
                               <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Custody Stock</p>
                               <p className="text-lg font-black italic tracking-tighter text-slate-850 dark:text-white">{remaining} / {lot.quantity} <span className="text-[9px] font-bold uppercase not-italic text-slate-400">Bags</span></p>
                            </div>
                            <div>
                               <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Bag Marks</p>
                               <p className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-350">{lot.mark || 'N/A'}</p>
                            </div>
                         </div>

                         <Button onClick={() => handleSelectLot(lot)} className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[9px]">
                            Authorize Dispatch
                         </Button>
                       </div>
                    </motion.div>
                 );
              })}
              {filteredLots.length === 0 && (
                 <div className="col-span-full py-16 text-center bg-slate-50 dark:bg-slate-900 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <p className="text-xs text-slate-400 italic">No active custody lots matching query search.</p>
                 </div>
              )}
           </div>
        </div>

        {/* Section 2: Dispatch Authorization Form Dialog */}
        <Dialog open={!!selectedLot} onOpenChange={(open) => !open && setSelectedLot(null)}>
           <DialogContent className="max-w-4xl rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl max-h-[90vh] overflow-y-auto">
              {selectedLot && (
                 <form onSubmit={handleSubmit} className="space-y-8">
                    <DialogHeader>
                       <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Release Dispatch Authorization</DialogTitle>
                    </DialogHeader>

                    {/* Pre-populated Lot Information */}
                    <div className="p-6 bg-blue-50 dark:bg-blue-950/30 rounded-3xl border border-blue-100 dark:border-blue-900/30 grid grid-cols-2 md:grid-cols-4 gap-6">
                       <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-blue-500">Merchant Client</p>
                          <p className="text-xs font-black uppercase italic tracking-tighter text-blue-700 dark:text-blue-300">{selectedLot.clientName}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-blue-500">Farmer linked</p>
                          <p className="text-xs font-bold uppercase text-slate-700 dark:text-slate-350 truncate">{selectedLot.farmerName}</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-blue-500">Commodity Stock</p>
                          <p className="text-xs font-bold uppercase text-slate-700 dark:text-slate-350">{selectedLot.commodityName} ({selectedLot.varietyName})</p>
                       </div>
                       <div>
                          <p className="text-[8px] font-black uppercase tracking-widest text-blue-500">Custody Room</p>
                          <p className="text-xs font-bold uppercase text-slate-700 dark:text-slate-350">{selectedLot.chamber} › {selectedLot.floor} › {selectedLot.block}</p>
                       </div>
                    </div>

                    {/* Step 1: Logistics Metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Outward Dispatch Date</Label>
                          <Input 
                            type="date" 
                            required 
                            value={formData.outwardDate}
                            onChange={(e) => setFormData({ ...formData, outwardDate: e.target.value })}
                            className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase" 
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Release Order ID (Bill #)</Label>
                          <Input 
                            required 
                            readOnly
                            value={formData.orderId}
                            className="h-14 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-6 text-xs font-black italic uppercase tracking-wider text-slate-500" 
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Transport Vehicle Number</Label>
                          <Input 
                            required 
                            placeholder="e.g. AP 09 BD 2212"
                            value={formData.vehicleNumber}
                            onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                            className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase tracking-widest" 
                          />
                       </div>
                    </div>

                    {/* Step 2: Release Stock validation */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bags to Release</Label>
                          <Input 
                            type="number" 
                            required 
                            value={formData.quantity || ''}
                            onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                            className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl text-lg font-black italic px-6" 
                          />
                          {formData.quantity > lotRemainingBags && (
                             <p className="text-[9px] font-bold text-rose-500 flex items-center gap-1">
                                <AlertTriangle size={10} /> Exceeds lot custody limit ({lotRemainingBags} bags)
                             </p>
                          )}
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Weight Out (Quintals/KG)</Label>
                          <Input 
                            type="number" 
                            required 
                            value={formData.weight || ''}
                            onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                            className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl text-lg font-black italic px-6" 
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Balance Bags (Auto-Calc)</Label>
                          <Input 
                            readOnly
                            value={`${balanceBags} bags free`}
                            className="h-14 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-6 text-sm font-black italic text-slate-500 uppercase" 
                          />
                       </div>
                    </div>

                    {/* Step 3: Billing & Ledgers */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-slate-50 dark:border-slate-850">
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Total Charges (₹)</Label>
                          <Input 
                            type="number" 
                            required 
                            value={formData.totalAmount || ''}
                            onChange={(e) => setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })}
                            className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl text-lg font-black italic px-6 text-emerald-500" 
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Paid Amount (₹)</Label>
                          <Input 
                            type="number" 
                            required 
                            value={formData.paidAmount || ''}
                            onChange={(e) => setFormData({ ...formData, paidAmount: parseFloat(e.target.value) || 0 })}
                            className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl text-lg font-black italic px-6 text-emerald-500" 
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Remaining Due (₹)</Label>
                          <Input 
                            readOnly
                            value={`₹${remainingAmount}`}
                            className="h-14 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-6 text-lg font-black italic text-rose-500" 
                          />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payment Status</Label>
                          <Input 
                            readOnly
                            value={calculatedPaymentStatus}
                            className={`h-14 border-none rounded-2xl px-6 text-xs font-black tracking-wider text-center uppercase ${
                              calculatedPaymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' :
                              calculatedPaymentStatus === 'PARTIAL' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-rose-500/10 text-rose-500'
                            }`}
                          />
                       </div>
                    </div>

                    <div className="flex gap-4">
                       <Button type="button" onClick={() => setSelectedLot(null)} variant="outline" className="flex-1 h-16 rounded-[2rem] font-black uppercase tracking-widest text-xs">
                          Cancel
                       </Button>
                       <Button type="submit" disabled={loading || formData.quantity > lotRemainingBags} className="flex-[2] h-16 bg-blue-500 hover:bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-blue-500/20">
                          {loading ? 'Processing Release...' : 'Commit Release Dispatch'}
                       </Button>
                    </div>
                 </form>
              )}
           </DialogContent>
        </Dialog>

        {/* Section 3: Dispatch Logs */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-premium overflow-hidden">
           <div className="p-8 border-b border-slate-50 dark:border-slate-800">
              <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-850 dark:text-white">Recent Release Dispatches</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Log records of physical outward dispatches released from active storage custody</p>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-100 dark:border-slate-800 text-slate-500">
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Release Order #</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Date</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Client Name</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Farmer Name</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Commodity Lot</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Bags Dispatched</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Billing Charges</th>
                       <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Payment Status</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {dispatches.length > 0 ? (
                      dispatches.map(d => (
                         <tr key={d.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                            <td className="px-6 py-4 text-xs font-black text-slate-800 dark:text-white italic uppercase tracking-wider">{d.orderId}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-350">{d.outwardDate || 'N/A'}</td>
                            <td className="px-6 py-4 text-xs font-black text-slate-800 dark:text-white truncate max-w-[150px] uppercase">{d.clientName}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-350 truncate max-w-[150px] uppercase">{d.farmerName || 'N/A'}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-350 uppercase">{d.commodityName} › {d.varietyName}</td>
                            <td className="px-6 py-4 text-xs font-black text-rose-500">-{d.quantity} bags</td>
                            <td className="px-6 py-4 text-xs font-black text-slate-800 dark:text-white">₹{d.totalAmount || 0}</td>
                            <td className="px-6 py-4 text-xs font-black">
                               <Badge className={`border-none px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                 d.paymentStatus === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' :
                                 d.paymentStatus === 'PARTIAL' ? 'bg-amber-500/10 text-amber-500' :
                                 'bg-rose-500/10 text-rose-500'
                               }`}>{d.paymentStatus || 'UNPAID'}</Badge>
                            </td>
                         </tr>
                      ))
                    ) : (
                       <tr>
                          <td colSpan={8} className="px-6 py-12 text-center text-xs text-slate-400 italic">No release dispatches authorized yet.</td>
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
