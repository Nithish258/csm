import * as React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { dbService } from '../services/db.service';
import { 
  Users2, Plus, Search, Pencil, Trash2, Building, Receipt, ArrowRight,
  ArrowDownCircle, ArrowUpCircle, BookOpen, CreditCard, ExternalLink
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export default function Clients() {
  const { t } = useTranslation();
  const [clients, setClients] = useState<any[]>([]);
  const [incomingShipments, setIncomingShipments] = useState<any[]>([]);
  const [outgoingShipments, setOutgoingShipments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // Dialog States
  const [isClientOpen, setIsClientOpen] = useState(false);
  const [isFarmerOpen, setIsFarmerOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [ledgerClient, setLedgerClient] = useState<any | null>(null);

  // Form States
  const [clientForm, setClientForm] = useState({ name: '', phone: '', email: '', gst: '', address: '' });
  const [editingClientId, setEditingClientId] = useState<string | null>(null);

  const [farmerForm, setFarmerForm] = useState({ name: '', phone: '' });
  const [editingFarmerId, setEditingFarmerId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    // Real-time synchronization of clients
    const unsubClients = dbService.sync('clients', (data) => {
      setClients(data);
      setLoading(false);
    });

    // Synchronize transactions for ledgers
    const unsubIncoming = dbService.sync('incoming_shipments', (data) => {
      setIncomingShipments(data);
    });

    const unsubOutgoing = dbService.sync('outgoing_shipments', (data) => {
      setOutgoingShipments(data);
    });

    return () => {
      unsubClients();
      unsubIncoming();
      unsubOutgoing();
    };
  }, []);

  const openCreateClient = () => {
    setClientForm({ name: '', phone: '', email: '', gst: '', address: '' });
    setEditingClientId(null);
    setIsClientOpen(true);
  };

  const openEditClient = (client: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setClientForm({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      gst: client.gst || '',
      address: client.address || ''
    });
    setEditingClientId(client.id);
    setIsClientOpen(true);
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingClientId) {
        await dbService.update('clients', editingClientId, clientForm);
        toast.success(t('clients.updateClient'));
      } else {
        await dbService.add('clients', {
          ...clientForm,
          status: 'ACTIVE',
          farmers: []
        });
        toast.success(t('clients.registerClient'));
      }
      setIsClientOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleClientDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this Client Account? This will purge farmer registries under their account.')) return;
    try {
      await dbService.delete('clients', id);
      toast.success('Client Account purged');
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  // Farmer management handlers
  const openAddFarmer = () => {
    setFarmerForm({ name: '', phone: '' });
    setEditingFarmerId(null);
    setIsFarmerOpen(true);
  };

  const openEditFarmer = (farmer: any) => {
    setFarmerForm({
      name: farmer.name || '',
      phone: farmer.phone || ''
    });
    setEditingFarmerId(farmer.id);
    setIsFarmerOpen(true);
  };

  const handleFarmerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setLoading(true);
    try {
      const currentFarmers = selectedClient.farmers || [];
      let updatedFarmers = [];

      if (editingFarmerId) {
        updatedFarmers = currentFarmers.map((f: any) => 
          f.id === editingFarmerId ? { ...f, ...farmerForm } : f
        );
        toast.success(t('clients.updateFarmer'));
      } else {
        const newFarmer = {
          id: `farm-${Date.now()}`,
          ...farmerForm
        };
        updatedFarmers = [...currentFarmers, newFarmer];
        toast.success(t('clients.addFarmer'));
      }

      await dbService.update('clients', selectedClient.id, {
        farmers: updatedFarmers
      });

      setSelectedClient({
        ...selectedClient,
        farmers: updatedFarmers
      });

      setIsFarmerOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFarmerDelete = async (farmerId: string) => {
    if (!selectedClient || !confirm('Are you sure you want to delete this Farmer?')) return;
    try {
      const updatedFarmers = (selectedClient.farmers || []).filter((f: any) => f.id !== farmerId);
      await dbService.update('clients', selectedClient.id, {
        farmers: updatedFarmers
      });
      setSelectedClient({
        ...selectedClient,
        farmers: updatedFarmers
      });
      toast.success(t('common.delete'));
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  // Compute live client ledger summary
  const getClientLedger = (clientName: string) => {
    const incoming = incomingShipments.filter(s => s.clientName === clientName || s.clientId === clientName);
    const outgoing = outgoingShipments.filter(s => s.clientName === clientName || s.clientId === clientName);
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
      <div className="space-y-12 max-w-7xl mx-auto px-4 md:px-8">
        {/* cinematic Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Users2 className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase italic">
                {t('clients.title')} & <span className="text-emerald-500">{t('clients.farmers')}</span>
              </h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-xs">
              {t('clients.subtitle')}
            </p>
          </div>

          <Button onClick={openCreateClient} className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-2xl px-8 h-14 font-bold uppercase tracking-wider text-xs shadow-xl transition-all hover:scale-[1.02] active:scale-95">
            <Plus className="h-5 w-5 mr-3" /> {t('clients.addNew')}
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-premium">
           <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input 
                type="text" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('clients.searchPlaceholder')}
                className="w-full h-12 bg-slate-50 dark:bg-slate-950 border-none rounded-xl pl-12 text-xs font-bold uppercase tracking-wider outline-none text-slate-900 dark:text-white placeholder:text-slate-500" 
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
                   onClick={() => setSelectedClient(client)}
                   className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-premium border border-slate-200/50 dark:border-slate-800 group hover:border-emerald-500/50 hover:shadow-[0_20px_50px_-12px_rgba(16,185,129,0.12)] hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col justify-between min-h-[320px] cursor-pointer"
                 >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-emerald-500/10 transition-all" />
                    
                    <div>
                      <div className="flex justify-between items-start mb-6">
                          <div className="h-16 w-16 bg-slate-50 dark:bg-slate-850 rounded-3xl flex items-center justify-center font-black text-2xl text-emerald-500 border border-slate-100 dark:border-slate-800 shadow-inner">
                             {client.name?.charAt(0)}
                          </div>
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-none px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest">{client.status}</Badge>
                      </div>

                      <div className="space-y-1 mb-6">
                          <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none text-slate-800 dark:text-white group-hover:text-emerald-500 transition-colors truncate">{client.name}</h3>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{client.phone}</p>
                      </div>
                    </div>

                    <div>
                      <div className="grid grid-cols-3 gap-2 mb-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                          <div className="space-y-1">
                             <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('clients.totalIn')}</p>
                             <p className="text-sm font-black text-emerald-500">{ledger.totalIn}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('clients.totalOut')}</p>
                             <p className="text-sm font-black text-rose-500">{ledger.totalOut}</p>
                          </div>
                          <div className="space-y-1">
                             <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('clients.balance')}</p>
                             <p className="text-sm font-black text-blue-500">{ledger.remaining}</p>
                          </div>
                      </div>

                      <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                         <Button onClick={() => setLedgerClient(client)} variant="ghost" className="flex-1 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 hover:bg-emerald-500 hover:border-emerald-500 hover:text-white transition-all font-black uppercase text-[9px] tracking-widest gap-2">
                            <Receipt size={14} /> {t('clients.viewLedger')}
                         </Button>
                         <Button onClick={(e) => openEditClient(client, e)} variant="ghost" className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center hover:bg-blue-500 hover:border-blue-500 hover:text-white transition-all">
                            <Pencil size={14} />
                         </Button>
                         <Button onClick={(e) => handleClientDelete(client.id, e)} variant="ghost" className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 flex items-center justify-center hover:bg-rose-500 hover:border-rose-500 hover:text-white transition-all">
                            <Trash2 size={14} />
                         </Button>
                      </div>
                    </div>
                 </motion.div>
                );
              })}
           </AnimatePresence>
        </div>

        {/* Client Account Form Dialog */}
        <Dialog open={isClientOpen} onOpenChange={setIsClientOpen}>
          <DialogContent className="max-w-2xl sm:max-w-[580px] w-full rounded-[2rem] p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden space-y-6">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                {editingClientId ? t('clients.editClient') : t('clients.newClient')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleClientSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('clients.clientName')}</Label>
                  <Input required value={clientForm.name} onChange={(e) => setClientForm({ ...clientForm, name: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-900 dark:text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('clients.contactMobile')}</Label>
                  <Input required value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('clients.emailAddress')}</Label>
                  <Input type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-900 dark:text-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('clients.gstNumber')}</Label>
                  <Input value={clientForm.gst} onChange={(e) => setClientForm({ ...clientForm, gst: e.target.value.toUpperCase() })} className="h-14 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-900 dark:text-white" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('clients.officeAddress')}</Label>
                <Input required value={clientForm.address} onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-900 dark:text-white" />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all">
                {loading ? t('common.loading') : editingClientId ? t('clients.updateClient') : t('clients.registerClient')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Detailed Farmers & Contacts Dialog */}
        <Dialog open={!!selectedClient} onOpenChange={(open) => !open && setSelectedClient(null)}>
          <DialogContent className="max-w-4xl sm:max-w-3xl w-full rounded-[2.5rem] p-8 md:p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar space-y-6">
            {selectedClient && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-slate-850 dark:text-white flex items-center gap-3">
                      <Building className="text-emerald-500" size={28} /> {selectedClient.name}
                    </h2>
                    <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-400 uppercase mt-2">
                      <span>GST: {selectedClient.gst || 'N/A'}</span>
                      <span>•</span>
                      <span>Phone: {selectedClient.phone}</span>
                      <span>•</span>
                      <span>{t('clients.farmers')}: {(selectedClient.farmers || []).length}</span>
                    </div>
                  </div>
                  <Button onClick={openAddFarmer} className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-xl px-6 h-12 font-bold uppercase tracking-wider text-[10px] gap-2 shadow-md">
                    <Plus size={16} /> {t('clients.registerFarmer')}
                  </Button>
                </div>

                {/* Farmers Sub-management Section */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">{t('clients.associatedFarmers')}</h3>
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-850 text-slate-500 border-b border-slate-100 dark:border-slate-800">
                          <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">{t('clients.farmerName')}</th>
                          <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">{t('clients.mobileNumber')}</th>
                          <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest">{t('clients.farmerCode')}</th>
                          <th className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-right">{t('common.actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {(selectedClient.farmers || []).length > 0 ? (
                          (selectedClient.farmers || []).map((farmer: any) => (
                            <tr key={farmer.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 text-xs font-black uppercase italic text-slate-800 dark:text-white">{farmer.name}</td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-600 dark:text-slate-300">{farmer.phone || 'N/A'}</td>
                              <td className="px-6 py-4 text-xs font-bold text-slate-400 uppercase">{farmer.id}</td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <Button onClick={() => openEditFarmer(farmer)} variant="ghost" className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 hover:bg-emerald-500 hover:text-white p-0">
                                    <Pencil size={12} />
                                  </Button>
                                  <Button onClick={() => handleFarmerDelete(farmer.id)} variant="ghost" className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/50 hover:bg-rose-500 hover:text-white p-0">
                                    <Trash2 size={12} />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-400 italic">{t('clients.noFarmers')}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={() => setSelectedClient(null)} variant="outline" className="h-12 px-6 rounded-xl font-bold uppercase tracking-widest text-[10px]">
                    {t('clients.closeRegistry')}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Farmer Add / Edit Dialog */}
        <Dialog open={isFarmerOpen} onOpenChange={setIsFarmerOpen}>
          <DialogContent className="max-w-md sm:max-w-[460px] w-full rounded-[2rem] p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl z-[200] overflow-hidden space-y-6">
            <DialogHeader className="mb-2">
              <DialogTitle className="text-xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                {editingFarmerId ? t('clients.editFarmer') : t('clients.newFarmer')}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFarmerSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('clients.farmerName')}</Label>
                <Input 
                  required 
                  placeholder="e.g. Ramesh Kumar, S. Venkat Reddy"
                  value={farmerForm.name}
                  onChange={(e) => setFarmerForm({ ...farmerForm, name: e.target.value })}
                  className="h-14 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-900 dark:text-white" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('clients.mobileNumber')}</Label>
                <Input 
                  required 
                  placeholder="e.g. 9848022338"
                  value={farmerForm.phone}
                  onChange={(e) => setFarmerForm({ ...farmerForm, phone: e.target.value })}
                  className="h-14 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-900 dark:text-white" 
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl transition-all">
                {loading ? t('common.loading') : editingFarmerId ? t('clients.updateFarmer') : t('clients.addFarmer')}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Ledger Transaction Dialog */}
        <Dialog open={!!ledgerClient} onOpenChange={(open) => !open && setLedgerClient(null)}>
          <DialogContent className="max-w-3xl sm:max-w-3xl w-full rounded-[2.5rem] p-8 md:p-10 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl max-h-[80vh] overflow-y-auto custom-scrollbar space-y-6">
            {ledgerClient && (() => {
              const ledger = getClientLedger(ledgerClient.name);
              return (
                <div className="space-y-8">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">{ledgerClient.name} — {t('clients.inventoryLedger')}</DialogTitle>
                  </DialogHeader>
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-5 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl text-center border border-emerald-100 dark:border-emerald-900/30">
                      <p className="text-[9px] font-black uppercase text-emerald-600 tracking-widest mb-1">{t('clients.totalIn')}</p>
                      <p className="text-2xl font-black text-emerald-600 italic">{ledger.totalIn}</p>
                      <p className="text-[8px] font-bold text-emerald-500 uppercase">Bags</p>
                    </div>
                    <div className="p-5 bg-rose-50 dark:bg-rose-950/30 rounded-2xl text-center border border-rose-100 dark:border-rose-900/30">
                      <p className="text-[9px] font-black uppercase text-rose-600 tracking-widest mb-1">{t('clients.totalOut')}</p>
                      <p className="text-2xl font-black text-rose-600 italic">{ledger.totalOut}</p>
                      <p className="text-[8px] font-bold text-rose-500 uppercase">Bags</p>
                    </div>
                    <div className="p-5 bg-blue-50 dark:bg-blue-950/30 rounded-2xl text-center border border-blue-100 dark:border-blue-900/30">
                      <p className="text-[9px] font-black uppercase text-blue-600 tracking-widest mb-1">{t('clients.stockBalance')}</p>
                      <p className="text-2xl font-black text-blue-600 italic">{ledger.remaining}</p>
                      <p className="text-[8px] font-bold text-blue-500 uppercase">Bags</p>
                    </div>
                  </div>

                  {/* Incoming Transactions */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <ArrowDownCircle size={14} className="text-emerald-500" /> {t('clients.incomingLots')} ({ledger.incoming.length})
                    </h4>
                    {ledger.incoming.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {ledger.incoming.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-black text-emerald-500">+{s.quantity} bags</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{s.commodityName} ({s.varietyName})</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-black text-slate-400 block">BILL: {s.inBillNumber}</span>
                              <span className="text-[8px] font-bold text-slate-400">LOC: {s.chamber} › {s.floor} › {s.block}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-[10px] text-slate-400 italic">{t('clients.noIncoming')}</p>}
                  </div>

                  {/* Outgoing Transactions */}
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                      <ArrowUpCircle size={14} className="text-rose-500" /> {t('clients.outgoingLots')} ({ledger.outgoing.length})
                    </h4>
                    {ledger.outgoing.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {ledger.outgoing.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-black text-rose-500">-{s.quantity} bags</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">{s.commodityName} ({s.varietyName})</span>
                            </div>
                            <div className="text-right">
                              <span className="text-[9px] font-black text-slate-400 block">RO: {s.orderId}</span>
                              <span className="text-[8px] font-bold text-slate-400">STATUS: {s.paymentStatus}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-[10px] text-slate-400 italic">{t('clients.noOutgoing')}</p>}
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
