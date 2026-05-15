import * as React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { dbService } from '../services/db.service';
import { 
  CloudSun, 
  CloudRain, 
  Sun, 
  Wind,
  Plus,
  Pencil,
  Trash2,
  X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';

export default function Seasons() {
  const { t } = useTranslation();
  const { tenant } = useAuthStore();
  const [seasons, setSeasons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyForm = { name: '', period: '', status: 'UPCOMING', commodities: '' };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const unsub = dbService.sync('seasons', setSeasons);
    return () => unsub();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (season: any) => {
    setEditingId(season.id);
    setFormData({
      name: season.name,
      period: season.period,
      status: season.status,
      commodities: Array.isArray(season.commodities) ? season.commodities.join(', ') : season.commodities || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    setLoading(true);
    try {
      const data = {
        name: formData.name,
        period: formData.period,
        status: formData.status,
        commodities: formData.commodities.split(',').map(c => c.trim()).filter(Boolean),
      };

      if (editingId) {
        await dbService.update('seasons', editingId, data);
        toast.success('Season updated');
      } else {
        await dbService.add('seasons', data);
        toast.success('Season created');
      }
      setIsDialogOpen(false);
      setFormData(emptyForm);
      setEditingId(null);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this season?')) return;
    try {
      await dbService.delete('seasons', id);
      toast.success('Season deleted');
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const toggleStatus = async (season: any) => {
    const nextStatus: Record<string, string> = { ACTIVE: 'INACTIVE', INACTIVE: 'UPCOMING', UPCOMING: 'ACTIVE' };
    try {
      await dbService.update('seasons', season.id, { status: nextStatus[season.status] || 'ACTIVE' });
      toast.success(`Status changed to ${nextStatus[season.status]}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed');
    }
  };

  const getIcon = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes('rabi') || n.includes('winter')) return <Sun size={24} />;
    if (n.includes('kharif') || n.includes('monsoon')) return <CloudRain size={24} />;
    return <Wind size={24} />;
  };

  return (
    <Layout>
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <CloudSun className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{t('common.seasons', 'Seasons')}</h2>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Agricultural cycle configuration and commodity alignment</p>
          </div>

          <Button onClick={openCreate} className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-[10px] shadow-xl transition-all">
             <Plus className="h-5 w-5 mr-3" /> Add Season
          </Button>
        </div>

        {/* Create / Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                {editingId ? 'Edit Season' : 'New Season'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Season Name</Label>
                <Input required placeholder="e.g. Rabi, Kharif, Zaid" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl px-6 text-xs font-bold uppercase" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Period</Label>
                <Input required placeholder="e.g. Oct - Mar" value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl px-6 text-xs font-bold uppercase" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Status</Label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none">
                  <option value="ACTIVE">Active</option>
                  <option value="UPCOMING">Upcoming</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Commodities (comma-separated)</Label>
                <Input placeholder="e.g. Wheat, Mustard, Gram" value={formData.commodities} onChange={(e) => setFormData({ ...formData, commodities: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl px-6 text-xs font-bold uppercase" />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/20">
                {loading ? 'Saving...' : editingId ? 'Update Season' : 'Create Season'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           <AnimatePresence>
           {seasons.map((season, i) => (
              <motion.div
                key={season.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-premium border border-slate-100 dark:border-white/5 relative overflow-hidden group"
              >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all" />
                 
                 <div className="flex justify-between items-start mb-10">
                    <div className="h-14 w-14 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-emerald-500 border border-slate-100 dark:border-white/5">
                       {getIcon(season.name)}
                    </div>
                    <button onClick={() => toggleStatus(season)}>
                      <Badge className={cn(
                         "border-none px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest cursor-pointer hover:opacity-80 transition-all",
                         season.status === 'ACTIVE' ? "bg-emerald-500/10 text-emerald-500" : 
                         season.status === 'UPCOMING' ? "bg-blue-500/10 text-blue-500" :
                         "bg-slate-100 dark:bg-white/5 text-slate-400"
                      )}>
                         {season.status}
                      </Badge>
                    </button>
                 </div>

                 <div className="space-y-2 mb-10">
                    <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">{season.name}</h3>
                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest">{season.period}</p>
                 </div>

                 <div className="space-y-4 mb-10">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Primary Commodities</p>
                    <div className="flex flex-wrap gap-2">
                       {(Array.isArray(season.commodities) ? season.commodities : []).map((c: string) => (
                          <Badge key={c} variant="outline" className="rounded-lg border-slate-100 dark:border-white/5 text-[8px] font-black uppercase px-3 py-1">{c}</Badge>
                       ))}
                    </div>
                 </div>

                 <div className="flex gap-2">
                   <Button onClick={() => openEdit(season)} className="flex-1 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-blue-500 hover:text-white transition-all font-black uppercase text-[9px] tracking-widest gap-2">
                      <Pencil size={12} /> Edit
                   </Button>
                   <Button onClick={() => handleDelete(season.id)} className="h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-500 hover:text-white transition-all font-black uppercase text-[9px] tracking-widest px-5 gap-2">
                      <Trash2 size={12} />
                   </Button>
                 </div>
              </motion.div>
           ))}
           </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
