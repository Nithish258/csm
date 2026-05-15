import * as React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { dbService } from '../services/db.service';
import { 
  Plus, 
  Package, 
  Search, 
  Filter, 
  Tag,
  ArrowRight,
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
import { useAuthStore } from '../store/authStore';
import { Badge } from '../components/ui/badge';

export default function Products() {
  const { t } = useTranslation();
  const { tenant } = useAuthStore();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const emptyForm = { name: '', category: '', unit: 'Bags', baseRate: 0 };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const unsub = dbService.sync('products', setProducts);
    return () => unsub();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (product: any) => {
    setEditingId(product.id);
    setFormData({ name: product.name, category: product.category, unit: product.unit, baseRate: product.baseRate });
    setIsDialogOpen(true);
  };

  const openDetail = (product: any) => {
    setSelectedProduct(product);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    setLoading(true);
    try {
      if (editingId) {
        await dbService.update('products', editingId, formData);
        toast.success('Product updated successfully');
      } else {
        await dbService.add('products', {
          ...formData,
          status: 'ACTIVE',
          totalStock: 0,
          lastUpdated: new Date()
        });
        toast.success(t('products.createSuccess', 'Product registered'));
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
    if (!confirm('Delete this product?')) return;
    try {
      await dbService.delete('products', id);
      toast.success('Product deleted');
      if (selectedProduct?.id === id) setSelectedProduct(null);
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  const filteredProducts = products.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) || 
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Package className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{t('common.products')}</h2>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">{t('products.subtitle', 'Configure commodity types, unit metrics, and storage rates.')}</p>
          </div>

          <Button onClick={openCreate} className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-[10px] shadow-xl transition-all">
            <Plus className="h-5 w-5 mr-3" /> {t('products.addNew', 'Add New Product')}
          </Button>
        </div>

        {/* Create / Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                {editingId ? 'Edit Product' : t('products.createTitle', 'New Product')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Commodity Name</Label>
                <Input 
                  required 
                  placeholder="e.g. Red Chilli"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl px-6 text-xs font-bold uppercase" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Category</Label>
                <Input 
                  required 
                  placeholder="e.g. Spices / Grains"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl px-6 text-xs font-bold uppercase" 
                />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Default Unit</Label>
                  <Input 
                    required 
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl px-6 text-xs font-bold uppercase" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Rate / Unit (₹)</Label>
                  <Input 
                    type="number"
                    required 
                    value={formData.baseRate}
                    onChange={(e) => setFormData({ ...formData, baseRate: parseFloat(e.target.value) || 0 })}
                    className="h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl px-6 text-lg font-black italic tracking-tighter" 
                  />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/20">
                {loading ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Detail Panel */}
        <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && setSelectedProduct(null)}>
          <DialogContent className="max-w-lg rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
            {selectedProduct && (
              <div className="space-y-8">
                <div className="flex items-start justify-between">
                  <div>
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest mb-3">{selectedProduct.category}</Badge>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">{selectedProduct.name}</h2>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest">{selectedProduct.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Unit</p>
                    <p className="text-lg font-black">{selectedProduct.unit}</p>
                  </div>
                  <div className="p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                    <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Rate</p>
                    <p className="text-lg font-black text-emerald-500">₹{selectedProduct.baseRate}/{selectedProduct.unit}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => { setSelectedProduct(null); openEdit(selectedProduct); }} className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[9px] tracking-widest gap-2">
                    <Pencil size={14} /> Edit Product
                  </Button>
                  <Button onClick={() => { handleDelete(selectedProduct.id); setSelectedProduct(null); }} className="h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 text-rose-600 font-bold uppercase text-[9px] tracking-widest px-6 gap-2">
                    <Trash2 size={14} /> Delete
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Filter Bar */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-premium">
           <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('products.searchPlaceholder', 'SEARCH BY NAME OR CATEGORY...')}
                className="w-full h-12 bg-slate-50 dark:bg-slate-950 rounded-xl pl-12 text-[10px] font-black uppercase tracking-widest outline-none placeholder:text-slate-500" 
              />
           </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
           <AnimatePresence>
              {filteredProducts.map((product, i) => (
                 <motion.div
                   key={product.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                   className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-premium border border-slate-100 dark:border-white/5 group hover:border-emerald-500/50 transition-all"
                 >
                    <div className="flex justify-between items-start mb-8">
                       <div className="h-14 w-14 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center font-black text-emerald-500 border border-slate-100 dark:border-white/5 shadow-inner">
                          <Tag size={20} />
                       </div>
                       <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest">{product.status}</Badge>
                    </div>

                    <div className="space-y-1 mb-8">
                       <h3 className="text-xl font-black uppercase italic tracking-tighter leading-none">{product.name}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{product.category}</p>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-50 dark:border-white/5">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Rate</p>
                          <p className="text-sm font-black text-emerald-500">₹{product.baseRate}/{product.unit}</p>
                       </div>
                       <div className="flex gap-2">
                         <Button onClick={() => openEdit(product)} variant="ghost" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all p-0">
                            <Pencil size={14} />
                         </Button>
                         <Button onClick={() => openDetail(product)} variant="ghost" className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all p-0">
                            <ArrowRight size={14} />
                         </Button>
                       </div>
                    </div>
                 </motion.div>
              ))}
           </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
