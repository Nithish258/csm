import * as React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { dbService } from '../services/db.service';
import { 
  Truck, 
  Search, 
  Filter, 
  Plus, 
  Calendar, 
  Clock, 
  User, 
  ArrowRight,
  ShieldCheck,
  Activity,
  MapPin,
  ClipboardList
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

export default function VehicleLogs() {
  const { t } = useTranslation();
  const { tenant } = useAuthStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    vehicleNumber: '',
    driverName: '',
    driverPhone: '',
    entryTime: new Date().toISOString(),
    gatePass: '',
    purpose: 'Loading',
  });

  useEffect(() => {
    const unsub = dbService.sync('vehicle_logs', setLogs);
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    setLoading(true);
    try {
      await dbService.add('vehicle_logs', {
        ...formData,
        status: 'AT_GATE',
        tenantId: tenant.id
      });
      toast.success(t('vehicles.createSuccess', 'Vehicle Entry Authorized'));
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Truck className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">{t('common.vehicleLogs')}</h2>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">{t('vehicles.subtitle', 'Monitor gate traffic, vehicle arrival/departure, and carrier identity.')}</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
             <DialogTrigger render={
                <Button className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-2xl px-8 h-14 font-black uppercase tracking-widest text-[10px] shadow-xl transition-all">
                   <Plus className="h-5 w-5 mr-3" /> {t('vehicles.addNew', 'Register Gate Entry')}
                </Button>
             } />
             <DialogContent className="max-w-md rounded-[3rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
                <DialogHeader className="mb-8">
                   <DialogTitle className="text-2xl font-black uppercase tracking-tighter italic">{t('vehicles.createTitle', 'Gate Access Control')}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-8">
                   <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vehicle Number</Label>
                      <Input 
                        required 
                        placeholder="TS 09 EQ 1234"
                        value={formData.vehicleNumber}
                        onChange={(e) => setFormData({ ...formData, vehicleNumber: e.target.value.toUpperCase() })}
                        className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase" 
                      />
                   </div>
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Driver Name</Label>
                         <Input 
                           required 
                           value={formData.driverName}
                           onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                           className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase" 
                         />
                      </div>
                      <div className="space-y-2">
                         <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Driver Contact</Label>
                         <Input 
                           required 
                           value={formData.driverPhone}
                           onChange={(e) => setFormData({ ...formData, driverPhone: e.target.value })}
                           className="h-14 bg-slate-50 dark:bg-slate-950 border-none rounded-2xl px-6 text-xs font-bold uppercase" 
                         />
                      </div>
                   </div>
                   <Button type="submit" disabled={loading} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl shadow-emerald-500/20">
                      {loading ? t('common.loading') : t('vehicles.createButton', 'Authorize Entry')}
                   </Button>
                </form>
             </DialogContent>
          </Dialog>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-premium overflow-hidden border border-slate-100 dark:border-white/5">
           <Table>
              <TableHeader>
                 <TableRow className="border-slate-100 dark:border-white/5 hover:bg-transparent">
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500">Vehicle</TableHead>
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500">Driver</TableHead>
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500">Status</TableHead>
                    <TableHead className="h-16 px-10 font-black uppercase text-[9px] tracking-widest text-slate-500 text-right">Entry Time</TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                 {logs.map((log) => (
                    <TableRow key={log.id} className="border-slate-100 dark:border-white/5 group hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                       <TableCell className="px-10 py-6">
                          <p className="font-black text-sm uppercase italic tracking-tighter">{log.vehicleNumber}</p>
                       </TableCell>
                       <TableCell className="px-10 py-6">
                          <p className="font-bold text-xs uppercase text-slate-900 dark:text-white">{log.driverName}</p>
                          <p className="text-[9px] font-bold text-slate-400">{log.driverPhone}</p>
                       </TableCell>
                       <TableCell className="px-10 py-6">
                          <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[8px] uppercase">{log.status}</Badge>
                       </TableCell>
                       <TableCell className="px-10 py-6 text-right font-bold text-xs text-slate-500 uppercase">
                          {new Date(log.entryTime).toLocaleTimeString()}
                       </TableCell>
                    </TableRow>
                 ))}
              </TableBody>
           </Table>
        </div>
      </div>
    </Layout>
  );
}
