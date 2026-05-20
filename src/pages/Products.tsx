import * as React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { dbService } from '../services/db.service';
import { 
  Plus, 
  Package, 
  Search, 
  Tag,
  ArrowRight,
  Pencil,
  Trash2,
  X,
  Layers,
  Settings,
  Scale
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

export default function Products() {
  const { t } = useTranslation();
  const { tenant } = useAuthStore();
  const [commodities, setCommodities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Commodity Dialog
  const [isCommodityOpen, setIsCommodityOpen] = useState(false);
  const [editingCommodityId, setEditingCommodityId] = useState<string | null>(null);
  const [commodityForm, setCommodityForm] = useState({ name: '', category: '' });

  // Detail & Variety Dialog
  const [selectedCommodity, setSelectedCommodity] = useState<any>(null);
  const [isVarietyOpen, setIsVarietyOpen] = useState(false);
  const [editingVarietyId, setEditingVarietyId] = useState<string | null>(null);
  const [varietyForm, setVarietyForm] = useState({ name: '', baseRate: 0, unit: 'Bags' });

  useEffect(() => {
    // Sync using products collection name in Firestore to maintain backwards compatibility
    const unsub = dbService.sync('products', setCommodities);
    return () => unsub();
  }, []);

  // Update selected commodity details dynamically on live data change
  useEffect(() => {
    if (selectedCommodity) {
      const updated = commodities.find(c => c.id === selectedCommodity.id);
      if (updated) setSelectedCommodity(updated);
    }
  }, [commodities]);

  const openCreateCommodity = () => {
    setEditingCommodityId(null);
    setCommodityForm({ name: '', category: '' });
    setIsCommodityOpen(true);
  };

  const openEditCommodity = (commodity: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingCommodityId(commodity.id);
    setCommodityForm({ name: commodity.name, category: commodity.category });
    setIsCommodityOpen(true);
  };

  const handleCommoditySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    setLoading(true);
    try {
      if (editingCommodityId) {
        await dbService.update('products', editingCommodityId, commodityForm);
        toast.success('Commodity updated successfully');
      } else {
        await dbService.add('products', {
          ...commodityForm,
          status: 'ACTIVE',
          varieties: [],
          totalStock: 0,
          lastUpdated: new Date()
        });
        toast.success('Commodity registered successfully');
      }
      setIsCommodityOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCommodityDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this Commodity and all its Varieties? This cannot be undone.')) return;
    try {
      await dbService.delete('products', id);
      toast.success('Commodity deleted successfully');
      if (selectedCommodity?.id === id) setSelectedCommodity(null);
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const openAddVariety = () => {
    setEditingVarietyId(null);
    setVarietyForm({ name: '', baseRate: 0, unit: 'Bags' });
    setIsVarietyOpen(true);
  };

  const openEditVariety = (variety: any) => {
    setEditingVarietyId(variety.id);
    setVarietyForm({ name: variety.name, baseRate: variety.baseRate, unit: variety.unit });
    setIsVarietyOpen(true);
  };

  const handleVarietySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCommodity) return;

    setLoading(true);
    try {
      const currentVarieties = selectedCommodity.varieties || [];
      let updatedVarieties = [];

      if (editingVarietyId) {
        // Edit existing variety
        updatedVarieties = currentVarieties.map((v: any) => 
          v.id === editingVarietyId ? { ...v, ...varietyForm } : v
        );
        toast.success('Variety updated');
      } else {
        // Add new variety
        const newVariety = {
          id: `var-${Date.now()}`,
          ...varietyForm
        };
        updatedVarieties = [...currentVarieties, newVariety];
        toast.success('Variety registered');
      }

      await dbService.update('products', selectedCommodity.id, {
        varieties: updatedVarieties,
        lastUpdated: new Date()
      });

      setIsVarietyOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVarietyDelete = async (varietyId: string) => {
    if (!selectedCommodity || !confirm('Delete this variety?')) return;
    try {
      const updatedVarieties = (selectedCommodity.varieties || []).filter((v: any) => v.id !== varietyId);
      await dbService.update('products', selectedCommodity.id, {
        varieties: updatedVarieties,
        lastUpdated: new Date()
      });
      toast.success('Variety deleted');
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const filteredCommodities = commodities.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-12 max-w-7xl mx-auto px-4 md:px-8">
        {/* cinematic Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Package className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase italic">
                Commodities & <span className="text-emerald-500">Varieties</span>
              </h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-xs">
              Manage physical register catalogs of storage commodities and their specific sub-varieties.
            </p>
          </div>

          <Button onClick={openCreateCommodity} className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-2xl px-8 h-14 font-bold uppercase tracking-wider text-xs shadow-xl transition-all hover:scale-[1.02] active:scale-95">
            <Plus className="h-5 w-5 mr-3" /> New Commodity
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-premium">
           <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="SEARCH COMMODITIES BY NAME OR CATEGORY..."
                className="w-full h-12 bg-slate-50 dark:bg-slate-950 border-none rounded-xl pl-12 text-xs font-bold uppercase tracking-wider outline-none text-slate-900 dark:text-white placeholder:text-slate-500" 
              />
           </div>
        </div>

        {/* Commodities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           <AnimatePresence>
              {filteredCommodities.map((commodity, i) => (
                 <motion.div
                   key={commodity.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                   onClick={() => setSelectedCommodity(commodity)}
                   className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-premium border border-slate-100 dark:border-slate-800 group hover:border-emerald-500/50 hover:shadow-intense transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[250px]"
                 >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all" />
                    
                    <div className="flex justify-between items-start mb-6">
                       <div className="h-14 w-14 bg-slate-50 dark:bg-slate-850 rounded-2xl flex items-center justify-center font-bold text-emerald-500 border border-slate-100 dark:border-slate-800 shadow-inner">
                          <Layers size={22} />
                       </div>
                       <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest">{commodity.status}</Badge>
                    </div>

                    <div className="space-y-2 mb-6">
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors">{commodity.name}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{commodity.category}</p>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-slate-850">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Varieties</p>
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{(commodity.varieties || []).length} Types</p>
                       </div>
                       <div className="flex gap-2">
                         <Button onClick={(e) => openEditCommodity(commodity, e)} variant="ghost" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all p-0">
                            <Pencil size={14} />
                         </Button>
                         <Button onClick={(e) => handleCommodityDelete(commodity.id, e)} variant="ghost" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all p-0">
                            <Trash2 size={14} />
                         </Button>
                         <Button variant="ghost" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-850 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all p-0">
                            <ArrowRight size={14} />
                         </Button>
                       </div>
                    </div>
                 </motion.div>
              ))}
           </AnimatePresence>
        </div>

        {/* Commodity Create / Edit Dialog */}
        <Dialog open={isCommodityOpen} onOpenChange={setIsCommodityOpen}>
          <DialogContent className="max-w-md rounded-[2.5rem] p-8 bg-white dark:bg-slate-900 border-none shadow-2xl">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                {editingCommodityId ? 'Edit Commodity' : 'New Commodity'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCommoditySubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Commodity Name</Label>
                <Input 
                  required 
                  placeholder="e.g. Red Chilli, Cotton, Maize"
                  value={commodityForm.name}
                  onChange={(e) => setCommodityForm({ ...commodityForm, name: e.target.value })}
                  className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</Label>
                <Input 
                  required 
                  placeholder="e.g. Spices, Grains, Cash Crops"
                  value={commodityForm.category}
                  onChange={(e) => setCommodityForm({ ...commodityForm, category: e.target.value })}
                  className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none" 
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/20">
                {loading ? 'Saving...' : editingCommodityId ? 'Update Commodity' : 'Create Commodity'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Detailed Varieties View Dialog */}
        <Dialog open={!!selectedCommodity} onOpenChange={(open) => !open && setSelectedCommodity(null)}>
          <DialogContent className="max-w-3xl rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl max-h-[85vh] overflow-y-auto">
            {selectedCommodity && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest mb-3">{selectedCommodity.category}</Badge>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-800 dark:text-white">{selectedCommodity.name}</h2>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Registry Code: {selectedCommodity.id}</p>
                  </div>
                  <Button onClick={openAddVariety} className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-xl px-6 h-12 font-bold uppercase tracking-wider text-[10px] gap-2">
                    <Plus size={16} /> Add Variety
                  </Button>
                </div>

                {/* Varieties Table */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Registered Varieties</h3>
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                          <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Variety Name</th>
                          <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Default Unit</th>
                          <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">Storage Rate (₹)</th>
                          <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(selectedCommodity.varieties || []).length > 0 ? (
                          (selectedCommodity.varieties || []).map((variety: any) => (
                            <tr key={variety.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 text-xs font-black uppercase italic text-slate-800 dark:text-white">{variety.name}</td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300">{variety.unit || 'Bags'}</td>
                              <td className="px-6 py-4 text-xs font-bold text-emerald-500">₹{variety.baseRate || 0}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button onClick={() => openEditVariety(variety)} variant="ghost" className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-500 hover:text-white p-0">
                                    <Pencil size={12} />
                                  </Button>
                                  <Button onClick={() => handleVarietyDelete(variety.id)} variant="ghost" className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-rose-500 hover:text-white p-0">
                                    <Trash2 size={12} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-400 italic">No varieties added to this commodity yet. Add your first variety to begin tracking inventory.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={() => setSelectedCommodity(null)} variant="outline" className="h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                    Close Registry
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Variety Add / Edit Dialog */}
        <Dialog open={isVarietyOpen} onOpenChange={setIsVarietyOpen}>
          <DialogContent className="max-w-md rounded-[2.5rem] p-8 bg-white dark:bg-slate-900 border-none shadow-2xl z-[100]">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-xl font-black uppercase tracking-tighter italic">
                {editingVarietyId ? 'Edit Variety' : 'Add New Variety'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleVarietySubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Variety Name</Label>
                <Input 
                  required 
                  placeholder="e.g. Teja, 341, Wonder Hot, Chapata"
                  value={varietyForm.name}
                  onChange={(e) => setVarietyForm({ ...varietyForm, name: e.target.value })}
                  className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none" 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Default Unit</Label>
                  <Input 
                    required 
                    value={varietyForm.unit}
                    onChange={(e) => setVarietyForm({ ...varietyForm, unit: e.target.value })}
                    className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Storage Rate / Unit (₹)</Label>
                  <Input 
                    type="number"
                    required 
                    value={varietyForm.baseRate}
                    onChange={(e) => setVarietyForm({ ...varietyForm, baseRate: parseFloat(e.target.value) || 0 })}
                    className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-lg font-black italic outline-none" 
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/20">
                {loading ? 'Saving...' : editingVarietyId ? 'Update Variety' : 'Add Variety'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
