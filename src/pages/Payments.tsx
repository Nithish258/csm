import * as React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { dbService } from '../services/db.service';
import { 
  Plus, 
  CreditCard, 
  Search, 
  Filter, 
  ArrowDownCircle, 
  ArrowRight,
  User,
  Receipt,
  Activity,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { useAuthStore } from '../store/authStore';
import { Badge } from '../components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';

export default function Payments() {
  const { t } = useTranslation();
  const { tenant } = useAuthStore();
  const [payments, setPayments] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    invoiceId: '',
    clientId: '',
    amount: 0,
    method: 'Cash',
    reference: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const unsub = dbService.sync('payments', setPayments);
    dbService.sync('invoices', (items) => setInvoices(items.filter(inv => inv.status !== 'PAID')));
    dbService.sync('clients', setClients);
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    setLoading(true);
    try {
      // 1. Record the payment
      await dbService.add('payments', {
        ...formData,
        createdAt: new Date(),
      });

      // 2. Update Invoice Paid Amount (Simplification: just add to paidAmount)
      const invoice = invoices.find(inv => inv.invoiceNumber === formData.invoiceId || inv.id === formData.invoiceId);
      if (invoice) {
        const newPaidAmount = (invoice.paidAmount || 0) + formData.amount;
        const newStatus = newPaidAmount >= invoice.amount ? 'PAID' : 'PARTIAL';
        await dbService.update('invoices', invoice.id, {
          paidAmount: newPaidAmount,
          status: newStatus
        });
      }

      toast.success(t('payments.createSuccess', 'Payment Settlement Recorded'));
      setIsDialogOpen(false);
      setFormData({ invoiceId: '', clientId: '', amount: 0, method: 'Cash', reference: '', date: new Date().toISOString().split('T')[0] });
    } catch (error: any) {
      toast.error(error.message || t('payments.createError', 'Settlement Failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{t('common.payments')}</h2>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">{t('payments.subtitle', 'Register customer payments, verify settlements, and reconcile accounts.')}</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
             <DialogTrigger render={
                <Button className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-[10px] shadow-xl transition-all">
                   <Plus className="h-5 w-5 mr-3" /> {t('payments.addNew', 'Record Payment Entry')}
                </Button>
             } />
             <DialogContent className="max-w-md rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
                <DialogHeader className="mb-8">
                   <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">{t('payments.createTitle', 'Payment Settlement')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-8">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('payments.client', 'Select Client')}</Label>
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
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('payments.invoice', 'Select Invoice')}</Label>
                         <select 
                           required
                           value={formData.invoiceId}
                           onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                           className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none"
                         >
                            <option value="">Select Invoice</option>
                            {invoices.filter(inv => inv.clientId === formData.clientId).map(inv => (
                               <option key={inv.id} value={inv.id}>{inv.invoiceNumber} (₹{inv.amount - inv.paidAmount} Due)</option>
                            ))}
                         </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('payments.amount', 'Amount Paid')}</Label>
                         <Input 
                           type="number"
                           required 
                           value={formData.amount}
                           onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                           className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-lg font-black italic tracking-tighter text-emerald-500" 
                         />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('payments.method', 'Payment Method')}</Label>
                         <select 
                           required
                           value={formData.method}
                           onChange={(e) => setFormData({ ...formData, method: e.target.value })}
                           className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none"
                         >
                            <option value="Cash">Cash</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                            <option value="UPI">UPI</option>
                            <option value="Check">Check</option>
                         </select>
                      </div>
                   </div>

                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('payments.reference', 'Reference / TXN ID')}</Label>
                      <Input 
                        placeholder="e.g. TXN98271387"
                        value={formData.reference}
                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                        className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase" 
                      />
                   </div>

                   <Button type="submit" disabled={loading} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/20">
                      {loading ? t('common.loading') : t('payments.createButton', 'Commit Settlement Entry')}
                   </Button>
                </form>
             </DialogContent>
          </Dialog>
        </div>

        {/* Payments Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-premium overflow-hidden border border-slate-100 dark:border-white/5">
           <Table>
              <TableHeader>
                 <TableRow className="border-slate-100 dark:border-white/5 hover:bg-transparent">
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500">Transaction ID</TableHead>
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500">Invoice</TableHead>
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500">Method</TableHead>
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500">Date</TableHead>
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500 text-right">Settled (₹)</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {payments.map((p) => (
                    <TableRow key={p.id} className="border-slate-100 dark:border-white/5 group hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                       <TableCell className="px-10 py-6">
                          <p className="font-black text-xs uppercase text-slate-400 truncate w-32">{p.id.slice(0, 10)}...</p>
                       </TableCell>
                       <TableCell className="px-10 py-6 font-bold text-xs uppercase text-slate-900 dark:text-white">
                          {p.invoiceId}
                       </TableCell>
                       <TableCell className="px-10 py-6">
                          <Badge variant="outline" className="rounded-lg border-slate-200 dark:border-white/10 text-[8px] font-black uppercase px-3">{p.method}</Badge>
                       </TableCell>
                       <TableCell className="px-10 py-6 font-bold text-xs text-slate-500 uppercase">{p.date}</TableCell>
                       <TableCell className="px-10 py-6 text-right font-black text-lg italic tracking-tighter text-emerald-500">₹{p.amount.toLocaleString()}</TableCell>
                    </TableRow>
                 ))}
              </TableBody>
           </Table>
        </div>
      </div>
    </Layout>
  );
}
