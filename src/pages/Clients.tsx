import * as React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { dbService } from '../services/db.service';
import { 
  Plus, 
  Users2, 
  Search, 
  Filter, 
  Phone, 
  Mail, 
  MapPin,
  ArrowRight,
  Pencil,
  Trash2,
  Receipt,
  ArrowDownCircle,
  ArrowUpCircle,
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

export default function Clients() {
  const { t } = useTranslation();
  const { tenant } = useAuthStore();
  const [clients, setClients] = useState<any[]>([]);
  const [incomingShipments, setIncomingShipments] = useState<any[]>([]);
  const [outgoingShipments, setOutgoingShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [ledgerClient, setLedgerClient] = useState<any>(null);
  const [detailClient, setDetailClient] = useState<any>(null);

  const emptyForm = { name: '', email: '', phone: '', address: '', gst: '' };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const unsub1 = dbService.sync('clients', setClients);
    const unsub2 = dbService.sync('incoming_shipments', setIncomingShipments);
    const unsub3 = dbService.sync('outgoing_shipments', setOutgoingShipments);
    return () => { unsub1(); unsub2(); unsub3(); };
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const openEdit = (client: any) => {
    setEditingId(client.id);
    setFormData({ name: client.name, email: client.email || '', phone: client.phone, address: client.address, gst: client.gst || '' });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    setLoading(true);
    try {
      if (editingId) {
        await dbService.update('clients', editingId, formData);
        toast.success('Client updated');
      } else {
        await dbService.add('clients', {
          ...formData,
          status: 'ACTIVE',
          balance: 0,
          totalShipments: 0
        });
        toast.success(t('clients.createSuccess', 'Client registered'));
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
    if (!confirm('Delete this client?')) return;
    try {
      await dbService.delete('clients', id);
      toast.success('Client deleted');
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  // Ledger data for a client
  const getClientLedger = (clientName: string) => {
    const incoming = incomingShipments.filter(s => s.clientId === clientName);
    const outgoing = outgoingShipments.filter(s => s.clientId === clientName);
    const totalIn = incoming.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const totalOut = outgoing.reduce((sum, s) => sum + (s.quantity || 0), 0);
    const remaining = totalIn - totalOut;
    return { incoming, outgoing, totalIn, totalOut, remaining };
  };

  const filteredClients = clients.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) || 
    c.phone?.includes(search)
  );

  return (
    <Layout>
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Users2 className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{t('common.clients')}</h2>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">{t('clients.subtitle', 'Manage client database, ledger balances, and contact registry.')}</p>
          </div>

          <Button onClick={openCreate} className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-[10px] shadow-xl transition-all">
            <Plus className="h-5 w-5 mr-3" /> {t('clients.addNew', 'Add New Client')}
          </Button>
        </div>

        {/* Create / Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">
                {editingId ? 'Edit Client' : t('clients.createTitle', 'New Client')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Client Name</Label>
                  <Input required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl px-6 text-xs font-bold uppercase" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Mobile</Label>
                  <Input required value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl px-6 text-xs font-bold uppercase" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email</Label>
                  <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl px-6 text-xs font-bold uppercase" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">GST Number</Label>
                  <Input value={formData.gst} onChange={(e) => setFormData({ ...formData, gst: e.target.value.toUpperCase() })} className="h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl px-6 text-xs font-bold uppercase" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Address</Label>
                <Input required value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 rounded-2xl px-6 text-xs font-bold uppercase" />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/20">
                {loading ? 'Saving...' : editingId ? 'Update Client' : 'Register Client'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Ledger Dialog */}
        <Dialog open={!!ledgerClient} onOpenChange={(open) => !open && setLedgerClient(null)}>
          <DialogContent className="max-w-2xl rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl max-h-[80vh] overflow-y-auto">
            {ledgerClient && (() => {
              const ledger = getClientLedger(ledgerClient.name);
              return (
                <div className="space-y-8">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">{ledgerClient.name} — Ledger</DialogTitle>
                  </DialogHeader>
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-5 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-center">
                      <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest mb-1">Total In</p>
                      <p className="text-2xl font-black text-emerald-600 italic">{ledger.totalIn}</p>
                      <p className="text-[8px] font-bold text-emerald-500 uppercase">Bags</p>
                    </div>
                    <div className="p-5 bg-rose-50 dark:bg-rose-900/20 rounded-2xl text-center">
                      <p className="text-[9px] font-black uppercase text-rose-600 tracking-widest mb-1">Total Out</p>
                      <p className="text-2xl font-black text-rose-600 italic">{ledger.totalOut}</p>
                      <p className="text-[8px] font-bold text-rose-500 uppercase">Bags</p>
                    </div>
                    <div className="p-5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl text-center">
                      <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest mb-1">Remaining</p>
                      <p className="text-2xl font-black text-blue-600 italic">{ledger.remaining}</p>
                      <p className="text-[8px] font-bold text-blue-500 uppercase">Bags</p>
                    </div>
                  </div>

                  {/* Incoming Entries */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <ArrowDownCircle size={14} className="text-emerald-500" /> Incoming Entries ({ledger.incoming.length})
                    </h4>
                    {ledger.incoming.length > 0 ? (
                      <div className="space-y-2">
                        {ledger.incoming.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-black text-emerald-500">+{s.quantity}</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{s.productId}</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">{s.vehicleNumber}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-[10px] text-slate-400 italic">No incoming entries</p>}
                  </div>

                  {/* Outgoing Entries */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <ArrowUpCircle size={14} className="text-rose-500" /> Outgoing Entries ({ledger.outgoing.length})
                    </h4>
                    {ledger.outgoing.length > 0 ? (
                      <div className="space-y-2">
                        {ledger.outgoing.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-black text-rose-500">-{s.quantity}</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{s.productId}</span>
                            </div>
                            <span className="text-[9px] font-bold text-slate-400">{s.vehicleNumber}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-[10px] text-slate-400 italic">No outgoing entries</p>}
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* Detail / Edit Dialog */}
        <Dialog open={!!detailClient} onOpenChange={(open) => !open && setDetailClient(null)}>
          <DialogContent className="max-w-lg rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
            {detailClient && (
              <div className="space-y-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter">{detailClient.name}</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{detailClient.phone}</p>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest">{detailClient.status}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1"><Mail size={10} className="inline mr-1" />Email</p>
                    <p className="text-xs font-bold">{detailClient.email || 'N/A'}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                    <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">GST</p>
                    <p className="text-xs font-bold">{detailClient.gst || 'N/A'}</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1"><MapPin size={10} className="inline mr-1" />Address</p>
                  <p className="text-xs font-bold">{detailClient.address}</p>
                </div>
                <div className="flex gap-3">
                  <Button onClick={() => { setDetailClient(null); openEdit(detailClient); }} className="flex-1 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[9px] tracking-widest gap-2">
                    <Pencil size={14} /> Edit
                  </Button>
                  <Button onClick={() => { handleDelete(detailClient.id); setDetailClient(null); }} className="h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 text-rose-600 font-bold uppercase text-[9px] tracking-widest px-6 gap-2">
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
                placeholder="SEARCH BY NAME OR PHONE..."
                className="w-full h-12 bg-slate-50 dark:bg-slate-950 rounded-xl pl-12 text-[10px] font-black uppercase tracking-widest outline-none placeholder:text-slate-500" 
              />
           </div>
        </div>

        {/* Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           <AnimatePresence>
              {filteredClients.map((client, i) => {
                const ledger = getClientLedger(client.name);
                return (
                 <motion.div
                   key={client.id}
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                   className="bg-white dark:bg-slate-900 p-8 rounded-[3.5rem] shadow-premium border border-slate-100 dark:border-white/5 group hover:border-emerald-500/50 transition-all relative overflow-hidden"
                 >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all" />
                    
                    <div className="flex justify-between items-start mb-10">
                       <div className="h-16 w-16 bg-slate-50 dark:bg-white/5 rounded-3xl flex items-center justify-center font-black text-2xl text-emerald-500 border border-slate-100 dark:border-white/5 shadow-inner">
                          {client.name?.charAt(0)}
                       </div>
                       <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest">{client.status}</Badge>
                    </div>

                    <div className="space-y-2 mb-10">
                       <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{client.name}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{client.phone}</p>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-10 pt-8 border-t border-slate-50 dark:border-white/5">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">In</p>
                          <p className="text-sm font-black text-emerald-500">{ledger.totalIn}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Out</p>
                          <p className="text-sm font-black text-rose-500">{ledger.totalOut}</p>
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Balance</p>
                          <p className="text-sm font-black text-blue-500">{ledger.remaining}</p>
                       </div>
                    </div>

                    <div className="flex gap-2">
                       <Button onClick={() => setLedgerClient(client)} variant="ghost" className="flex-1 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-emerald-500 hover:text-white transition-all font-black uppercase text-[9px] tracking-widest gap-2">
                          <Receipt size={14} /> View Ledger
                       </Button>
                       <Button onClick={() => setDetailClient(client)} variant="ghost" className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all">
                          <ArrowRight size={14} />
                       </Button>
                    </div>
                 </motion.div>
                );
              })}
           </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
