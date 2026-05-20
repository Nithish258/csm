import * as React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { dbService } from '../services/db.service';
import { 
  Plus, 
  Receipt, 
  Search, 
  Filter, 
  FileText, 
  Download, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  User,
  ArrowRight,
  Pencil,
  Trash2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
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

export default function Invoices() {
  const { t } = useTranslation();
  const { tenant } = useAuthStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const defaultForm = {
    clientId: '',
    amount: 0,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  };

  const [formData, setFormData] = useState(defaultForm);

  useEffect(() => {
    const unsub = dbService.sync('invoices', setInvoices);
    dbService.sync('clients', setClients);
    return () => unsub();
  }, []);

  const openCreate = () => {
    setFormData(defaultForm);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEdit = (inv: any) => {
    setFormData({
      clientId: inv.clientId || '',
      amount: inv.amount || 0,
      dueDate: inv.dueDate || '',
      notes: inv.notes || '',
    });
    setEditingId(inv.id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice? This action is irreversible.')) return;
    try {
      await dbService.delete('invoices', id);
      toast.success('Invoice deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    setLoading(true);
    try {
      if (editingId) {
        await dbService.update('invoices', editingId, formData);
        toast.success('Invoice updated successfully');
      } else {
        await dbService.add('invoices', {
          ...formData,
          status: 'PENDING',
          paidAmount: 0,
          createdAt: new Date(),
          invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        });
        toast.success(t('invoices.createSuccess', 'Invoice Generated Successfully'));
      }
      setIsDialogOpen(false);
      setFormData(defaultForm);
      setEditingId(null);
    } catch (error: any) {
      toast.error(error.message || t('invoices.createError', 'Generation Failed'));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID': return <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[8px] uppercase">{status}</Badge>;
      case 'PARTIAL': return <Badge className="bg-amber-500/10 text-amber-500 border-none font-black text-[8px] uppercase">{status}</Badge>;
      case 'OVERDUE': return <Badge className="bg-rose-500/10 text-rose-500 border-none font-black text-[8px] uppercase">{status}</Badge>;
      default: return <Badge className="bg-slate-500/10 text-slate-500 border-none font-black text-[8px] uppercase">{status}</Badge>;
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.clientId?.toLowerCase().includes(search.toLowerCase()) ||
    inv.invoiceNumber?.toLowerCase().includes(search.toLowerCase()) ||
    inv.notes?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{t('common.invoices')}</h2>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">{t('invoices.subtitle', 'Generate commercial invoices, track receivable balances, and due dates.')}</p>
          </div>

          <Button onClick={openCreate} className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-[10px] shadow-xl transition-all">
             <Plus className="h-5 w-5 mr-3" /> {t('invoices.addNew', 'Generate New Invoice')}
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-premium">
           <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="SEARCH INVOICES..."
                className="w-full h-12 bg-slate-50 dark:bg-slate-950 border-none rounded-xl pl-12 text-[10px] font-black uppercase tracking-widest outline-none placeholder:text-slate-500" 
              />
           </div>
        </div>

        {/* Invoice Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-premium overflow-hidden border border-slate-100 dark:border-white/5">
           <Table>
              <TableHeader>
                 <TableRow className="border-slate-100 dark:border-white/5 hover:bg-transparent">
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500">Invoice ID</TableHead>
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500">Client</TableHead>
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500">Status</TableHead>
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500">Due Date</TableHead>
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500 text-right">Total (₹)</TableHead>
                    <TableHead className="h-16 px-6 font-black uppercase text-[9px] tracking-widest text-slate-500 text-center">Actions</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {filteredInvoices.map((inv) => (
                    <TableRow key={inv.id} className="border-slate-100 dark:border-white/5 group hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                       <TableCell className="px-10 py-6">
                          <div className="flex items-center gap-3">
                             <FileText className="h-4 w-4 text-emerald-500" />
                             <span className="font-black text-sm uppercase italic tracking-tighter">{inv.invoiceNumber}</span>
                          </div>
                       </TableCell>
                       <TableCell className="px-10 py-6">
                          <p className="font-bold text-xs uppercase text-slate-900 dark:text-white">{inv.clientId}</p>
                       </TableCell>
                       <TableCell className="px-10 py-6">
                          {getStatusBadge(inv.status)}
                       </TableCell>
                       <TableCell className="px-10 py-6 font-bold text-xs text-slate-500 uppercase">{inv.dueDate}</TableCell>
                       <TableCell className="px-10 py-6 text-right">
                          <div className="flex flex-col items-end">
                             <span className="font-black text-lg italic tracking-tighter text-slate-900 dark:text-white">₹{inv.amount?.toLocaleString()}</span>
                             <span className="text-[8px] font-black uppercase text-slate-500 tracking-widest">Paid: ₹{(inv.paidAmount || 0).toLocaleString()}</span>
                          </div>
                       </TableCell>
                       <TableCell className="px-6 py-6">
                          <div className="flex items-center justify-center gap-2">
                             <button onClick={() => openEdit(inv)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-blue-500 hover:text-white rounded-lg text-slate-400 transition-colors">
                                <Pencil size={14} />
                             </button>
                             <button onClick={() => handleDelete(inv.id)} className="p-2 bg-slate-50 dark:bg-slate-800 hover:bg-rose-500 hover:text-white rounded-lg text-slate-400 transition-colors">
                                <Trash2 size={14} />
                             </button>
                          </div>
                       </TableCell>
                    </TableRow>
                 ))}
                 {filteredInvoices.length === 0 && (
                    <TableRow>
                       <TableCell colSpan={6} className="h-40 text-center text-xs font-black uppercase text-slate-400 tracking-widest">No invoice records found</TableCell>
                    </TableRow>
                 )}
              </TableBody>
           </Table>
        </div>

        {/* Create / Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) { setEditingId(null); setFormData(defaultForm); } }}>
           <DialogContent className="max-w-md rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
              <DialogHeader className="mb-8">
                 <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                    {editingId ? 'Edit Invoice' : t('invoices.createTitle', 'Invoice Billing')}
                 </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-8">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('invoices.client', 'Select Client')}</Label>
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

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('invoices.amount', 'Total Amount')}</Label>
                       <Input 
                         type="number"
                         required 
                         value={formData.amount || ''}
                         onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                         className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-lg font-black italic tracking-tighter" 
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('invoices.dueDate', 'Due Date')}</Label>
                       <Input 
                         type="date"
                         required 
                         value={formData.dueDate}
                         onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                         className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase" 
                       />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('invoices.notes', 'Internal Notes')}</Label>
                    <Input 
                      placeholder="e.g. Storage charges for Jan 2024"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase" 
                    />
                 </div>

                 <Button type="submit" disabled={loading} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/20">
                    {loading ? t('common.loading') : (editingId ? 'Save Changes' : t('invoices.createButton', 'Commit Commercial Invoice'))}
                 </Button>
              </form>
           </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
