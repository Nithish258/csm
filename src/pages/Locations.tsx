import * as React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { dbService } from '../services/db.service';
import { 
  Plus, 
  ChevronRight, 
  ChevronDown,
  Box,
  Layers,
  LayoutGrid,
  Search,
  Pencil,
  Trash2,
  Save,
  X
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { useAuthStore } from '../store/authStore';

export default function Locations() {
  const { t } = useTranslation();
  const { tenant } = useAuthStore();
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedChambers, setExpandedChambers] = useState<string[]>([]);
  const [expandedFloors, setExpandedFloors] = useState<string[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  
  const emptyForm = { name: '', chamber: '', floor: '', capacity: 1000 };
  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    const unsub = dbService.sync('locations', setLocations);
    return () => unsub();
  }, []);

  // Keep selectedNode in sync with live data
  useEffect(() => {
    if (selectedNode) {
      const updated = locations.find(l => l.id === selectedNode.id);
      if (updated) setSelectedNode(updated);
    }
  }, [locations]);

  const openCreateDialog = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setIsDialogOpen(true);
  };

  const openEditDialog = (loc: any) => {
    setEditingId(loc.id);
    setFormData({ name: loc.name, chamber: loc.chamber, floor: loc.floor, capacity: loc.capacity });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    
    setLoading(true);
    try {
      if (editingId) {
        await dbService.update('locations', editingId, {
          ...formData,
        });
        toast.success('Location updated successfully');
        // Refresh selectedNode
        const updated = locations.find(l => l.id === editingId);
        if (updated) setSelectedNode({ ...updated, ...formData });
      } else {
        await dbService.add('locations', {
          ...formData,
          status: 'EMPTY',
          occupied: 0,
          utilization: 0,
          lastRecalculated: new Date()
        });
        toast.success(t('locations.createSuccess', 'Location created successfully'));
      }
      setIsDialogOpen(false);
      setFormData(emptyForm);
      setEditingId(null);
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this location?')) return;
    try {
      await dbService.delete('locations', id);
      toast.success('Location deleted');
      if (selectedNode?.id === id) setSelectedNode(null);
    } catch (error: any) {
      toast.error(error.message || 'Delete failed');
    }
  };

  // Build Hierarchy
  const chambers = Array.from(new Set(locations.map(l => l.chamber))).sort();
  const getFloors = (chamber: string) => Array.from(new Set(locations.filter(l => l.chamber === chamber).map(l => l.floor))).sort();
  const getBlocks = (chamber: string, floor: string) => locations.filter(l => l.chamber === chamber && l.floor === floor).sort((a, b) => a.name.localeCompare(b.name));

  const toggleChamber = (chamber: string) => {
    setExpandedChambers(prev => prev.includes(chamber) ? prev.filter(c => c !== chamber) : [...prev, chamber]);
  };

  const toggleFloor = (floorKey: string) => {
    setExpandedFloors(prev => prev.includes(floorKey) ? prev.filter(f => f !== floorKey) : [...prev, floorKey]);
  };

  // Compute summary stats per chamber/floor
  const getChamberStats = (chamber: string) => {
    const locs = locations.filter(l => l.chamber === chamber);
    const empty = locs.filter(l => l.status === 'EMPTY').length;
    const partial = locs.filter(l => l.status === 'PARTIAL').length;
    const full = locs.filter(l => l.status === 'FULL').length;
    return { total: locs.length, empty, partial, full };
  };

  const getFloorStats = (chamber: string, floor: string) => {
    const locs = locations.filter(l => l.chamber === chamber && l.floor === floor);
    const empty = locs.filter(l => l.status === 'EMPTY').length;
    const partial = locs.filter(l => l.status === 'PARTIAL').length;
    const full = locs.filter(l => l.status === 'FULL').length;
    return { total: locs.length, empty, partial, full };
  };

  // Occupancy distribution for bottom bar
  const totalLocs = locations.length;
  const emptyCount = locations.filter(l => l.status === 'EMPTY').length;
  const partialCount = locations.filter(l => l.status === 'PARTIAL').length;
  const fullCount = locations.filter(l => l.status === 'FULL').length;
  const emptyPct = totalLocs ? (emptyCount / totalLocs) * 100 : 100;
  const partialPct = totalLocs ? (partialCount / totalLocs) * 100 : 0;
  const fullPct = totalLocs ? (fullCount / totalLocs) * 100 : 0;

  return (
    <Layout>
      <div className="bg-[#F4F7F9] dark:bg-slate-950 -m-8 p-10 min-h-screen font-sans">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-[22px] font-bold text-[#111827] dark:text-white tracking-tight">{t('common.locations')}</h1>
            <p className="text-[12px] text-slate-500 font-medium mt-1">Hierarchical Storage Node Management</p>
          </div>

          <button 
            onClick={openCreateDialog}
            className="h-12 w-12 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </button>

          {/* Create / Edit Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent className="max-w-md rounded-[2rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
               <DialogHeader className="mb-8">
                  <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
                    {editingId ? 'Edit Storage Node' : 'Add Storage Node'}
                  </DialogTitle>
               </DialogHeader>
               <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                     <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">{t('locations.chamber', 'Chamber')}</Label>
                     <Input 
                       required 
                       placeholder="e.g. CHAMBER-1"
                       value={formData.chamber}
                       onChange={(e) => setFormData({ ...formData, chamber: e.target.value.toUpperCase() })}
                       className="h-12 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 text-xs font-semibold" 
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">{t('locations.floor', 'Floor')}</Label>
                     <Input 
                       required 
                       placeholder="e.g. FLOOR-1"
                       value={formData.floor}
                       onChange={(e) => setFormData({ ...formData, floor: e.target.value.toUpperCase() })}
                       className="h-12 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 text-xs font-semibold" 
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">{t('locations.name', 'Block / Slot')}</Label>
                     <Input 
                       required 
                       placeholder="e.g. BLOCK-A1"
                       value={formData.name}
                       onChange={(e) => setFormData({ ...formData, name: e.target.value.toUpperCase() })}
                       className="h-12 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 text-xs font-semibold" 
                     />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-[11px] font-bold uppercase tracking-widest text-slate-400 ml-1">{t('locations.capacity', 'Capacity (Bags)')}</Label>
                     <Input 
                       type="number"
                       required 
                       value={formData.capacity}
                       onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                       className="h-12 bg-slate-50 dark:bg-slate-800 rounded-xl px-4 text-sm font-bold" 
                     />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold uppercase tracking-widest text-[11px]">
                     {loading ? 'Saving...' : editingId ? 'Update Node' : 'Create Node'}
                  </Button>
               </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Left Panel: Tree View */}
          <div className="col-span-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col h-[calc(100vh-200px)]">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
               <h3 className="text-[13px] font-bold text-slate-800 dark:text-white">{t('locations.registry', 'Storage Registry')}</h3>
               <div className="h-8 w-8 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
                  <Layers className="h-4 w-4" />
               </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-200">
               {chambers.map(chamber => {
                 const stats = getChamberStats(chamber);
                 return (
                  <div key={chamber} className="space-y-1">
                     <button 
                       onClick={() => toggleChamber(chamber)}
                       className={cn(
                         "w-full flex items-center gap-3 p-3 rounded-xl transition-all",
                         expandedChambers.includes(chamber) ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                       )}
                     >
                        {expandedChambers.includes(chamber) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <Box size={16} className={expandedChambers.includes(chamber) ? "text-blue-500" : "text-slate-400"} />
                        <span className="text-[12px] font-bold uppercase tracking-tight flex-1 text-left">{chamber}</span>
                        <div className="flex gap-1">
                          {stats.empty > 0 && <span className="w-2 h-2 rounded-full bg-emerald-500" title={`${stats.empty} empty`} />}
                          {stats.partial > 0 && <span className="w-2 h-2 rounded-full bg-amber-500" title={`${stats.partial} partial`} />}
                          {stats.full > 0 && <span className="w-2 h-2 rounded-full bg-rose-500" title={`${stats.full} full`} />}
                        </div>
                     </button>
                     
                     {expandedChambers.includes(chamber) && (
                       <div className="ml-6 space-y-1 border-l-2 border-slate-100 dark:border-slate-800 pl-4">
                          {getFloors(chamber).map(floor => {
                            const floorKey = `${chamber}-${floor}`;
                            const fStats = getFloorStats(chamber, floor);
                            return (
                              <div key={floorKey} className="space-y-1">
                                 <button 
                                   onClick={() => toggleFloor(floorKey)}
                                   className={cn(
                                     "w-full flex items-center gap-3 p-2.5 rounded-lg transition-all",
                                     expandedFloors.includes(floorKey) ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                                   )}
                                 >
                                    {expandedFloors.includes(floorKey) ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                    <Layers size={14} className="text-slate-400" />
                                    <span className="text-[11px] font-bold uppercase flex-1 text-left">{floor}</span>
                                    <div className="flex gap-1">
                                      {fStats.empty > 0 && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                                      {fStats.partial > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                                      {fStats.full > 0 && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                                    </div>
                                 </button>
                                 
                                 {expandedFloors.includes(floorKey) && (
                                   <div className="ml-4 space-y-1">
                                      {getBlocks(chamber, floor).map(block => (
                                        <button 
                                          key={block.id}
                                          onClick={() => setSelectedNode(block)}
                                          className={cn(
                                            "w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left",
                                            selectedNode?.id === block.id ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                                          )}
                                        >
                                           <div className={cn(
                                             "w-2 h-2 rounded-full",
                                             block.status === 'FULL' ? "bg-rose-500" : block.status === 'PARTIAL' ? "bg-amber-500" : "bg-emerald-500"
                                           )} />
                                           <LayoutGrid size={14} className={selectedNode?.id === block.id ? "text-white" : "text-slate-300"} />
                                           <span className="text-[10px] font-bold uppercase flex-1">{block.name}</span>
                                           <span className={cn("text-[8px] font-bold uppercase", selectedNode?.id === block.id ? "text-blue-200" : "text-slate-400")}>
                                             {block.status}
                                           </span>
                                        </button>
                                      ))}
                                   </div>
                                 )}
                              </div>
                            );
                          })}
                       </div>
                     )}
                  </div>
                 );
               })}
               {chambers.length === 0 && (
                 <div className="flex flex-col items-center justify-center h-full opacity-30 italic text-[11px]">
                    No locations registered. Click + to add.
                 </div>
               )}
            </div>
          </div>

          {/* Right Panel: Node Details */}
          <div className="col-span-8 space-y-6">
             <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                {selectedNode ? (
                  <div className="space-y-8">
                     <div className="flex items-start justify-between">
                        <div>
                           <div className="flex items-center gap-2 mb-2">
                              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[9px] font-black uppercase rounded-md tracking-widest">{selectedNode.chamber}</span>
                              <span className="px-2 py-0.5 bg-slate-50 dark:bg-slate-800 text-slate-500 text-[9px] font-black uppercase rounded-md tracking-widest">{selectedNode.floor}</span>
                           </div>
                           <h2 className="text-3xl font-black text-slate-900 dark:text-white italic tracking-tighter uppercase">{selectedNode.name}</h2>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest",
                            selectedNode.status === 'FULL' ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600" : 
                            selectedNode.status === 'PARTIAL' ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600" : 
                            "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600"
                          )}>
                             {selectedNode.status}
                          </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-3 gap-8">
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Occupied</p>
                           <p className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">{selectedNode.occupied || 0} <span className="text-[10px] not-italic text-slate-400 font-bold uppercase">Bags</span></p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Capacity</p>
                           <p className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">{selectedNode.capacity} <span className="text-[10px] not-italic text-slate-400 font-bold uppercase">Bags</span></p>
                        </div>
                        <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Utilization</p>
                           <div className="flex items-center gap-4">
                              <p className="text-2xl font-black text-slate-900 dark:text-white italic tracking-tighter">{selectedNode.capacity > 0 ? Math.round(((selectedNode.occupied || 0) / selectedNode.capacity) * 100) : 0}%</p>
                              <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                 <div 
                                   className={cn(
                                     "h-full transition-all duration-500",
                                     selectedNode.status === 'FULL' ? "bg-rose-500" : selectedNode.status === 'PARTIAL' ? "bg-amber-500" : "bg-emerald-500"
                                   )}
                                   style={{ width: `${selectedNode.capacity > 0 ? Math.min(100, ((selectedNode.occupied || 0) / selectedNode.capacity) * 100) : 0}%` }}
                                 />
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex gap-3">
                           <Button 
                             onClick={() => openEditDialog(selectedNode)}
                             variant="outline" 
                             className="h-10 rounded-lg border-slate-200 dark:border-slate-700 font-bold uppercase text-[9px] tracking-widest gap-2"
                           >
                             <Pencil size={12} /> Edit Details
                           </Button>
                        </div>
                        <Button 
                          onClick={() => handleDelete(selectedNode.id)}
                          className="h-10 rounded-lg bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 border-none font-bold uppercase text-[9px] tracking-widest px-6 shadow-none gap-2"
                        >
                          <Trash2 size={12} /> Delete Node
                        </Button>
                     </div>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-400 italic">
                     <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                        <Search className="w-8 h-8 opacity-20" />
                     </div>
                     <p className="text-[11px] font-medium tracking-widest uppercase opacity-40">Select a node from hierarchy to view details</p>
                  </div>
                )}
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-8">
                   <h4 className="text-[12px] font-black uppercase tracking-widest text-slate-800 dark:text-white">Occupancy Distribution</h4>
                   <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                         <div className="w-2 h-2 rounded-full bg-emerald-500" />
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Empty ({emptyCount})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <div className="w-2 h-2 rounded-full bg-amber-500" />
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Partial ({partialCount})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                         <div className="w-2 h-2 rounded-full bg-rose-500" />
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Full ({fullCount})</span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-1 h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                   {emptyPct > 0 && <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${emptyPct}%` }} />}
                   {partialPct > 0 && <div className="bg-amber-500 h-full transition-all duration-500" style={{ width: `${partialPct}%` }} />}
                   {fullPct > 0 && <div className="bg-rose-500 h-full transition-all duration-500" style={{ width: `${fullPct}%` }} />}
                </div>
             </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
