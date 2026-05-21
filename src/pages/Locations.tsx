import * as React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { dbService } from '../services/db.service';
import { 
  Plus, 
  MapPin, 
  Search, 
  Grid3X3, 
  Columns, 
  TrendingUp, 
  Filter,
  CheckCircle,
  HelpCircle,
  Trash2,
  Boxes,
  Home,
  Edit3
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

export default function Locations() {
  const { t } = useTranslation();
  const { tenant } = useAuthStore();
  const [locations, setLocations] = useState<any[]>([]);
  const [stocks, setStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedSlotDetails, setSelectedSlotDetails] = useState<{ loc: any, slot: string } | null>(null);
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChamber, setFilterChamber] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [formData, setFormData] = useState({
    chamber: '',
    floor: '',
    name: '', // Block Name
    subSlots: '',
  });
  const [editId, setEditId] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setFormData({ chamber: '', floor: '', name: '', subSlots: '' });
      setEditId(null);
    }
  };

  const handleEditClick = (loc: any) => {
    setEditId(loc.id);
    setFormData({
      chamber: loc.chamber || '',
      floor: loc.floor || '',
      name: loc.name || '',
      subSlots: loc.subSlots || '',
    });
    setIsDialogOpen(true);
  };

  useEffect(() => {
    const unsub = dbService.sync('locations', setLocations);
    const unsub2 = dbService.sync('incoming_shipments', setStocks);
    return () => { unsub(); unsub2(); };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setLoading(true);
    try {
      if (editId) {
        await dbService.update('locations', editId, { ...formData });
        toast.success('Storage Block updated successfully');
      } else {
        await dbService.add('locations', {
          ...formData,
          capacity: 500, // Provide default capacity for legacy components
          occupied: 0,
          utilization: 0,
          status: 'EMPTY',
          tenantId: tenant.id,
          createdAt: new Date(),
        });
        toast.success('Storage Block registered successfully');
      }

      setIsDialogOpen(false);
      setFormData({ chamber: '', floor: '', name: '', subSlots: '' });
      setEditId(null);
    } catch (error: any) {
      toast.error(error.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, occupied: number) => {
    if (occupied > 0) {
      toast.error('Cannot delete block containing active stock. Dispatch all bags first.');
      return;
    }
    if (!confirm('Are you sure you want to delete this storage block?')) return;
    try {
      await dbService.delete('locations', id);
      toast.success('Storage Block deleted');
    } catch (error: any) {
      toast.error('Failed to delete block');
    }
  };

  // Grouping and Filtering
  const chambers = Array.from(new Set(locations.map(l => l.chamber))).filter(Boolean) as string[];

  const filteredLocations = locations.filter(l => {
    const matchesSearch = l.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          l.floor?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.chamber?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesChamber = filterChamber === 'ALL' || l.chamber === filterChamber;
    const matchesStatus = filterStatus === 'ALL' || l.status === filterStatus;

    return matchesSearch && matchesChamber && matchesStatus;
  });

  // Calculate high-level space statistics
  const totalCapacity = locations.reduce((sum, l) => sum + (l.capacity || 0), 0);
  const totalOccupied = locations.reduce((sum, l) => sum + (l.occupied || 0), 0);
  const globalUtilization = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  // Group locations: Chamber -> Floor -> Blocks
  const groupedData: Record<string, Record<string, any[]>> = {};
  filteredLocations.forEach(loc => {
    const ch = loc.chamber || 'UNASSIGNED';
    const fl = loc.floor || 'UNASSIGNED';
    if (!groupedData[ch]) groupedData[ch] = {};
    if (!groupedData[ch][fl]) groupedData[ch][fl] = [];
    groupedData[ch][fl].push(loc);
  });

  return (
    <Layout>
      <div className="space-y-12 max-w-7xl mx-auto px-4 md:px-8">
        {/* cinematic Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight uppercase italic">
                {t('locations.title', 'Chambers & Blocks Map')}
              </h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-xs">
              {t('locations.subtitle', 'Visual structural topology maps of active storage cold rooms, floors, and slot allotments.')}
            </p>
          </div>

          <Button onClick={() => setIsDialogOpen(true)} className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-2xl px-8 h-14 font-bold uppercase tracking-wider text-xs shadow-xl transition-all hover:scale-[1.02] active:scale-95">
            <Plus className="h-5 w-5 mr-3" /> {t('locations.addNew', 'New Block Slot')}
          </Button>
        </div>

        {/* Global Warehouse Capacity Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-premium flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('locations.globalCapacity', 'Global Storage Capacity')}</p>
                 <h4 className="text-3xl font-black italic tracking-tighter text-slate-850 dark:text-white">{totalCapacity}</h4>
              </div>
              <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
                 <Boxes size={22} />
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-premium flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('locations.totalStock', 'Total Stock in Storage')}</p>
                 <h4 className="text-3xl font-black italic tracking-tighter text-emerald-500">{totalOccupied}</h4>
              </div>
              <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                 <TrendingUp size={22} />
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-premium flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('locations.globalUtilization', 'Global Occupancy Utilization')}</p>
                 <h4 className="text-3xl font-black italic tracking-tighter text-blue-500">{globalUtilization}% <span className="text-xs font-bold text-slate-400 uppercase not-italic">{t('locations.filled', 'Filled')}</span></h4>
              </div>
              <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
                 <Home size={22} />
              </div>
           </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-premium space-y-6">
           <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="flex-1 w-full relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                 <input 
                   type="text" 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   placeholder={t('locations.searchPlaceholder', 'SEARCH MAP BY CHAMBER, FLOOR OR BLOCK SLOT ID...')}
                   className="w-full h-12 bg-slate-50 dark:bg-slate-950 border-none rounded-xl pl-12 text-xs font-bold uppercase tracking-wider outline-none text-slate-900 dark:text-white placeholder:text-slate-500" 
                 />
              </div>

              <div className="w-full lg:w-auto flex flex-col md:flex-row gap-4">
                 <div className="space-y-1.5 min-w-[200px]">
                    <select
                      value={filterChamber}
                      onChange={(e) => setFilterChamber(e.target.value)}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-4 text-xs font-bold uppercase outline-none text-slate-700 dark:text-slate-300"
                    >
                       <option value="ALL">{t('locations.allChambers', 'ALL CHAMBERS')}</option>
                       {chambers.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                    </select>
                 </div>

                 <div className="space-y-1.5 min-w-[200px]">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-4 text-xs font-bold uppercase outline-none text-slate-700 dark:text-slate-300"
                    >
                       <option value="ALL">{t('locations.allStatus', 'ALL STATUS STATES')}</option>
                       <option value="EMPTY">{t('locations.emptyBlocks', '🟢 EMPTY BLOCKS')}</option>
                       <option value="PARTIAL">{t('locations.partialOccupancy', '🟡 PARTIAL OCCUPANCY')}</option>
                       <option value="FULL">{t('locations.fullOccupancy', '🔴 FULL OCCUPANCY')}</option>
                    </select>
                 </div>
              </div>
           </div>
        </div>

        {/* Visual Structural Map */}
        <div className="space-y-12">
           {Object.keys(groupedData).map(chamberName => (
              <div key={chamberName} className="space-y-8 bg-slate-50 dark:bg-slate-950/20 p-8 rounded-[3.5rem] border border-slate-100 dark:border-slate-800 shadow-inner">
                 <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center justify-center text-white text-[10px] font-black">CH</div>
                    <h3 className="text-xl font-extrabold uppercase italic tracking-tighter text-slate-850 dark:text-white">{chamberName}</h3>
                 </div>

                 {Object.keys(groupedData[chamberName]).map(floorName => (
                     <div key={floorName} className="space-y-6 p-6 rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-950/50">
                        <div className="flex items-center gap-2">
                           <div className="h-6 w-6 bg-slate-200 dark:bg-slate-800 rounded-lg flex items-center justify-center text-[8px] font-black uppercase text-slate-500">FL</div>
                           <p className="text-[10px] font-black uppercase text-slate-600 dark:text-slate-300 tracking-widest">{floorName}</p>
                        </div>
                        
                        {/* Grid of Blocks */}
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {groupedData[chamberName][floorName].map(loc => {
                             const pct = Math.min(100, Math.round(((loc.occupied || 0) / (loc.capacity || 500)) * 100));
                             return (
                                <motion.div
                                  key={loc.id}
                                  initial={{ opacity: 0, scale: 0.98 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className={`bg-white dark:bg-slate-900 p-6 rounded-3xl border shadow-premium relative flex flex-col justify-between min-h-[180px] group transition-all hover:scale-[1.02] ${
                                    loc.status === 'EMPTY' ? 'border-emerald-500/20 hover:border-emerald-500' :
                                    loc.status === 'PARTIAL' ? 'border-amber-500/20 hover:border-amber-500' :
                                    'border-rose-500/20 hover:border-rose-500'
                                  }`}
                                >
                                   <div>
                                     <div className="flex items-center justify-between mb-4">
                                        <Badge className={`border-none px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                          loc.status === 'EMPTY' ? 'bg-emerald-500/10 text-emerald-500' :
                                          loc.status === 'PARTIAL' ? 'bg-amber-500/10 text-amber-500' :
                                          'bg-rose-500/10 text-rose-500'
                                        }`}>{loc.status}</Badge>

                                        <div className="flex gap-2">
                                           <button onClick={() => handleEditClick(loc)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-50 dark:bg-slate-800 hover:bg-blue-500 hover:text-white rounded-lg text-slate-400">
                                              <Edit3 size={12} />
                                           </button>
                                           <button onClick={() => handleDelete(loc.id, loc.occupied || 0)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-50 dark:bg-slate-800 hover:bg-rose-500 hover:text-white rounded-lg text-slate-400">
                                              <Trash2 size={12} />
                                           </button>
                                        </div>
                                     </div>
                                     <h4 className="text-lg font-black uppercase italic tracking-tighter text-slate-850 dark:text-white">{loc.name}</h4>
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">CAP: {loc.capacity}</p>
                                   </div>

                                   <div className="space-y-2 pt-4">
                                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                         <span>{t('locations.occupied', 'Occupied')}</span>
                                         <span className="font-black italic">{loc.occupied || 0}</span>
                                      </div>
                                      <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                         <div 
                                           style={{ width: `${pct}%` }} 
                                           className={`h-full rounded-full transition-all duration-500 ${
                                             loc.status === 'EMPTY' ? 'bg-emerald-500' :
                                             loc.status === 'PARTIAL' ? 'bg-amber-500' :
                                             'bg-rose-500'
                                           }`} 
                                         />
                                      </div>
                                   </div>

                                    {/* Mock Sub-Slots for visual hierarchy */}
                                    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">{t('locations.subSlots', 'Sub-Slots / Sub-Blocks')}</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {(loc.subSlots ? loc.subSlots.split(',').map((s: string) => s.trim()).filter(Boolean) : [1, 2, 3, 4]).map((slot: any) => {
                                                const slotStocks = stocks.filter(s => s.locationId === loc.id && s.subSlot === slot && s.quantity > 0);
                                                const isOccupied = slotStocks.length > 0;
                                                return (
                                                <div 
                                                    key={slot} 
                                                    onClick={() => setSelectedSlotDetails({ loc, slot })}
                                                    className={`h-8 rounded-lg border flex items-center justify-center text-[8px] font-bold uppercase cursor-pointer transition-colors ${isOccupied ? 'bg-emerald-500 text-white border-emerald-600 shadow-md' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 text-slate-400 hover:border-emerald-500'}`}
                                                >
                                                    {slot.toString().length > 2 ? slot : (slot.toString().startsWith('S') ? slot : `S${slot}`)}
                                                </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </motion.div>
                             );
                          })}
                       </div>
                    </div>
                 ))}
              </div>
           ))}
        </div>

        {/* Create / Edit Block Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-3xl sm:max-w-[720px] w-full rounded-[2.5rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
               <DialogHeader className="mb-6">
                  <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic text-slate-900 dark:text-white">
                     {editId ? t('locations.editBlock', 'Edit Block Details') : t('locations.registerBlock', 'Register Block Slot')}
                  </DialogTitle>
               </DialogHeader>
               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('locations.chamberRoom', 'Chamber Room')}</Label>
                        <Input required placeholder={t('locations.chamberPlaceholder', 'e.g. Chamber 1, Chamber 2')} value={formData.chamber} onChange={(e) => setFormData({ ...formData, chamber: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-900 dark:text-white" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('locations.floorLevel', 'Floor Level')}</Label>
                        <Input required placeholder={t('locations.floorPlaceholder', 'e.g. Floor 1, Floor 2')} value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-900 dark:text-white" />
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('locations.blockName', 'Block / Bay Name')}</Label>
                        <Input required placeholder={t('locations.blockPlaceholder', 'e.g. Block A, Slot B')} value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-900 dark:text-white" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('locations.subslotLabel', 'Subslot / Subblock')}</Label>
                        <Input required placeholder={t('locations.subslotPlaceholder', 'e.g. S1, S2, A, B (comma separated)')} value={formData.subSlots} onChange={(e) => setFormData({ ...formData, subSlots: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none text-slate-900 dark:text-white" />
                     </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/20">
                     {loading ? t('locations.processing', 'Processing...') : (editId ? t('locations.saveChanges', 'Save Changes') : t('locations.addStorageSlot', 'Add Storage Slot'))}
                  </Button>
               </form>
            </DialogContent>
         </Dialog>
         {/* Sub-Slot Details Dialog */}
         <Dialog open={!!selectedSlotDetails} onOpenChange={(open) => !open && setSelectedSlotDetails(null)}>
            <DialogContent className="max-w-3xl rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
               {selectedSlotDetails && (
                  <div className="space-y-6">
                     <DialogHeader>
                        <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic text-slate-800 dark:text-white">
                           {selectedSlotDetails.loc.chamber} › {selectedSlotDetails.loc.floor} › {selectedSlotDetails.loc.name} › <span className="text-emerald-500">Sub-Slot {selectedSlotDetails.slot}</span>
                        </DialogTitle>
                     </DialogHeader>
                     
                     <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">{t('locations.activeCustodyDetails', 'Active Custody Stock Details')}</p>
                        <div className="max-h-[50vh] overflow-y-auto pr-2 space-y-4">
                           {(() => {
                              const slotStocks = stocks.filter(s => s.locationId === selectedSlotDetails.loc.id && s.subSlot === selectedSlotDetails.slot && s.quantity > 0);
                              if (slotStocks.length === 0) {
                                 return (
                                    <div className="py-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                                       <p className="text-xs text-slate-400 italic">{t('locations.emptySubSlot', 'This sub-slot is currently empty.')}</p>
                                    </div>
                                 );
                              }
                              return slotStocks.map(stock => (
                                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={stock.id} className="p-5 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-100 dark:border-slate-800 flex justify-between items-center group hover:border-emerald-500/50 transition-colors">
                                    <div className="space-y-1">
                                       <div className="flex items-center gap-2 mb-2">
                                          <Badge className="bg-blue-500/10 text-blue-500 border-none px-2 py-0.5 rounded-md font-black text-[8px] uppercase tracking-widest">{stock.inBillNumber}</Badge>
                                          {stock.mark && <Badge className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-none px-2 py-0.5 rounded-md font-black text-[8px] uppercase tracking-widest">Mark: {stock.mark}</Badge>}
                                       </div>
                                       <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase leading-none">{stock.clientName}</h4>
                                       {stock.farmerName && <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t('locations.farmer', 'Farmer')}: {stock.farmerName}</p>}
                                       <p className="text-[11px] text-slate-600 dark:text-slate-300 font-bold uppercase mt-2">
                                          {stock.commodityName} <span className="text-slate-400">›</span> <span className="text-emerald-500">{stock.varietyName}</span>
                                       </p>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-2">
                                       <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                                          <Boxes className="h-6 w-6 text-emerald-500" />
                                       </div>
                                       <p className="text-xl font-black italic text-emerald-500 tracking-tighter">{stock.quantity} <span className="text-[9px] font-bold text-slate-400 uppercase not-italic tracking-widest">{t('locations.bags', 'Bags')}</span></p>
                                    </div>
                                 </motion.div>
                              ));
                           })()}
                        </div>
                     </div>
                  </div>
               )}
            </DialogContent>
         </Dialog>

      </div>
    </Layout>
  );
}
