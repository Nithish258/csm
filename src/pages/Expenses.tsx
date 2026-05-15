import * as React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { dbService } from '../services/db.service';
import { 
  Plus, 
  Wallet, 
  Search, 
  Filter, 
  TrendingDown, 
  Calendar, 
  Tag, 
  ArrowRight,
  ChevronRight,
  Receipt,
  Activity,
  AlertCircle
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

export default function Expenses() {
  const { t } = useTranslation();
  const { tenant } = useAuthStore();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    category: 'Operational',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    description: '',
  });

  useEffect(() => {
    const unsub = dbService.sync('expenses', setExpenses);
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    setLoading(true);
    try {
      await dbService.add('expenses', {
        ...formData,
        status: 'PAID',
        month: new Date(formData.date).getMonth() + 1,
        year: new Date(formData.date).getFullYear(),
      });
      toast.success(t('expenses.createSuccess', 'Expense Record Logged'));
      setIsDialogOpen(false);
      setFormData({ title: '', category: 'Operational', amount: 0, date: new Date().toISOString().split('T')[0], description: '' });
    } catch (error: any) {
      toast.error(error.message || t('expenses.createError', 'Logging Failed'));
    } finally {
      setLoading(false);
    }
  };

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <Layout>
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{t('common.expenses')}</h2>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">{t('expenses.subtitle', 'Track operational burn, machine maintenance, and utility costs.')}</p>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:block text-right mr-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('expenses.totalBurn', 'Total Operational Burn')}</p>
                <p className="text-2xl font-black text-rose-500 italic tracking-tighter">₹{totalExpense.toLocaleString()}</p>
             </div>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger render={
                   <Button className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-[10px] shadow-xl transition-all">
                      <Plus className="h-5 w-5 mr-3" /> {t('expenses.addNew', 'Log New Expense')}
                   </Button>
                } />
                <DialogContent className="max-w-md rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
                   <DialogHeader className="mb-8">
                      <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">{t('expenses.createTitle', 'Expense Authorization')}</DialogTitle>
                   </DialogHeader>
                   <form onSubmit={handleSubmit} className="space-y-8">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('expenses.title', 'Expense Description')}</Label>
                         <Input 
                           required 
                           placeholder="e.g. Electricity Bill - Phase 1"
                           value={formData.title}
                           onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                           className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase" 
                         />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('expenses.category', 'Category')}</Label>
                            <select 
                              required
                              value={formData.category}
                              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                              className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none"
                            >
                               <option value="Operational">Operational</option>
                               <option value="Maintenance">Maintenance</option>
                               <option value="Utilities">Utilities</option>
                               <option value="Salary">Salary</option>
                               <option value="Tax">Tax</option>
                            </select>
                         </div>
                         <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('expenses.amount', 'Amount (INR)')}</Label>
                            <Input 
                              type="number"
                              required 
                              value={formData.amount}
                              onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                              className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-lg font-black italic tracking-tighter text-rose-500" 
                            />
                         </div>
                      </div>

                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('expenses.date', 'Transaction Date')}</Label>
                         <Input 
                           type="date"
                           required 
                           value={formData.date}
                           onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                           className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase" 
                         />
                      </div>

                      <Button type="submit" disabled={loading} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/20">
                         {loading ? t('common.loading') : t('expenses.createButton', 'Log Expense Entry')}
                      </Button>
                   </form>
                </DialogContent>
             </Dialog>
          </div>
        </div>

        {/* Expense List Table */}
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-premium overflow-hidden border border-slate-100 dark:border-white/5">
           <Table>
              <TableHeader>
                 <TableRow className="border-slate-100 dark:border-white/5 hover:bg-transparent">
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500">Description</TableHead>
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500">Category</TableHead>
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500">Date</TableHead>
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500 text-right">Amount (₹)</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {expenses.map((expense) => (
                    <TableRow key={expense.id} className="border-slate-100 dark:border-white/5 group hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                       <TableCell className="px-10 py-6">
                          <p className="font-black text-sm uppercase italic tracking-tighter">{expense.title}</p>
                       </TableCell>
                       <TableCell className="px-10 py-6">
                          <Badge variant="outline" className="rounded-lg border-slate-200 dark:border-white/10 text-[8px] font-black uppercase px-3">{expense.category}</Badge>
                       </TableCell>
                       <TableCell className="px-10 py-6 font-bold text-xs text-slate-500 uppercase">{expense.date}</TableCell>
                       <TableCell className="px-10 py-6 text-right font-black text-lg italic tracking-tighter text-rose-500">₹{expense.amount.toLocaleString()}</TableCell>
                    </TableRow>
                 ))}
                 {expenses.length === 0 && (
                    <TableRow>
                       <TableCell colSpan={4} className="h-40 text-center text-xs font-black uppercase text-slate-400 tracking-widest">No expense records logged</TableCell>
                    </TableRow>
                 )}
              </TableBody>
           </Table>
        </div>
      </div>
    </Layout>
  );
}
