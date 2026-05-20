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
  Home
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
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Search and Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChamber, setFilterChamber] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');

  const [formData, setFormData] = useState({
    chamber: '',
    floor: '',
    name: '', // Block Name
    capacity: 500,
  });

  useEffect(() => {
    const unsub = dbService.sync('locations', setLocations);
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setLoading(true);
    try {
      await dbService.add('locations', {
        ...formData,
        occupied: 0,
        utilization: 0,
        status: 'EMPTY',
        tenantId: tenant.id,
        createdAt: new Date(),
      });

      toast.success('Storage Block registered successfully');
      setIsDialogOpen(false);
      setFormData({ chamber: '', floor: '', name: '', capacity: 500 });
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
                Chambers & <span className="text-emerald-500">Blocks Map</span>
              </h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-xs">
              Visual structural topology maps of active storage cold rooms, floors, and slot allotments.
            </p>
          </div>

          <Button onClick={() => setIsDialogOpen(true)} className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-2xl px-8 h-14 font-bold uppercase tracking-wider text-xs shadow-xl transition-all hover:scale-[1.02] active:scale-95">
            <Plus className="h-5 w-5 mr-3" /> New Block Slot
          </Button>
        </div>

        {/* Global Warehouse Capacity Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-premium flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Storage Capacity</p>
                 <h4 className="text-3xl font-black italic tracking-tighter text-slate-850 dark:text-white">{totalCapacity}</h4>
              </div>
              <div className="h-12 w-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-400">
                 <Boxes size={22} />
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-premium flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Stock in Storage</p>
                 <h4 className="text-3xl font-black italic tracking-tighter text-emerald-500">{totalOccupied}</h4>
              </div>
              <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                 <TrendingUp size={22} />
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-premium flex items-center justify-between">
              <div>
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Global Occupancy Utilization</p>
                 <h4 className="text-3xl font-black italic tracking-tighter text-blue-500">{globalUtilization}% <span className="text-xs font-bold text-slate-400 uppercase not-italic">Filled</span></h4>
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
                   placeholder="SEARCH MAP BY CHAMBER, FLOOR OR BLOCK SLOT ID..."
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
                       <option value="ALL">ALL CHAMBERS</option>
                       {chambers.map(c => <option key={c} value={c}>{c.toUpperCase()}</option>)}
                    </select>
                 </div>

                 <div className="space-y-1.5 min-w-[200px]">
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full h-12 bg-slate-50 dark:bg-slate-950 border-none rounded-xl px-4 text-xs font-bold uppercase outline-none text-slate-700 dark:text-slate-300"
                    >
                       <option value="ALL">ALL STATUS STATES</option>
                       <option value="EMPTY">🟢 EMPTY BLOCKS</option>
                       <option value="PARTIAL">🟡 PARTIAL OCCUPANCY</option>
                       <option value="FULL">🔴 FULL OCCUPANCY</option>
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

                                        <button onClick={() => handleDelete(loc.id, loc.occupied || 0)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-slate-50 dark:bg-slate-800 hover:bg-rose-500 hover:text-white rounded-lg text-slate-400">
                                           <Trash2 size={12} />
                                        </button>
                                     </div>
                                     <h4 className="text-lg font-black uppercase italic tracking-tighter text-slate-850 dark:text-white">{loc.name}</h4>
                                     <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">CAP: {loc.capacity}</p>
                                   </div>

                                   <div className="space-y-2 pt-4">
                                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-600 dark:text-slate-300">
                                         <span>Occupied</span>
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
                                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Sub-Slots / Sub-Blocks</p>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[1, 2, 3, 4].map(slot => (
                                                <div key={slot} className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-850 flex items-center justify-center text-[8px] font-bold text-slate-400">
                                                    S{slot}
                                                </div>
                                            ))}
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

        {/* Create Block Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <DialogContent className="max-w-md rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
              <DialogHeader className="mb-6">
                 <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">Register Block Slot</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-6">
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Chamber Room</Label>
                    <Input required placeholder="e.g. Chamber 1, Chamber 2" value={formData.chamber} onChange={(e) => setFormData({ ...formData, chamber: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none" />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Floor Level</Label>
                       <Input required placeholder="e.g. Floor 1, Floor 2" value={formData.floor} onChange={(e) => setFormData({ ...formData, floor: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Block / Bay Name</Label>
                       <Input required placeholder="e.g. Block A, Slot B" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase outline-none" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Max Capacity (Bags)</Label>
                    <Input type="number" required value={formData.capacity} onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })} className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-lg font-black italic outline-none" />
                 </div>
                 <Button type="submit" disabled={loading} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/20">
                    {loading ? 'Registering...' : 'Add Storage Slot'}
                 </Button>
              </form>
           </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
