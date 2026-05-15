import * as React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { dbService } from '../services/db.service';
import { 
  Cloud,
  Menu,
  Inbox,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../lib/utils';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table';
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";

const TABS = [
  { id: 'incoming', label: 'reports.recentIncoming', collection: 'incoming_shipments' },
  { id: 'outgoing', label: 'reports.recentOutgoing', collection: 'outgoing_shipments' },
  { id: 'stock', label: 'reports.currentStock', collection: 'locations' }, // Stock comes from locations
  { id: 'clients', label: 'reports.clients', collection: 'clients' },
];

export default function Reports() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [reportData, setReportData] = useState<any[]>([]);
  
  // Real Calendar Filter States
  const [viewDate, setViewDate] = useState(new Date()); // For month navigation
  const [filterDate, setFilterDate] = useState<Date | null>(null); // Specific day filter
  const [filterMonth, setFilterMonth] = useState<number | null>(null); // Specific month filter
  const [filterYear, setFilterYear] = useState<number | null>(null); // Specific year filter
  
  const [listFilters, setListFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    const tab = TABS.find(t => t.id === activeTab);
    if (tab) {
      const unsub = dbService.sync(tab.collection, setReportData);
      return () => unsub();
    }
  }, [activeTab]);

  const getUniqueValues = (key: string) => {
    const values = reportData.map(item => item[key]).filter(Boolean);
    return Array.from(new Set(values));
  };

  // Filtering Logic
  const filteredData = reportData.filter(item => {
    // 1. List Filters (Client, Product, etc)
    for (const [key, value] of Object.entries(listFilters)) {
      if (item[key] !== value) return false;
    }

    // 2. Date Filters
    if (item.createdAt?.seconds) {
      const date = new Date(item.createdAt.seconds * 1000);
      
      if (filterYear && date.getFullYear() !== filterYear) return false;
      if (filterMonth !== null && date.getMonth() !== filterMonth) return false;
      if (filterDate && (
        date.getFullYear() !== filterDate.getFullYear() ||
        date.getMonth() !== filterDate.getMonth() ||
        date.getDate() !== filterDate.getDate()
      )) return false;
    } else if (filterYear || filterMonth !== null || filterDate) {
        // If filtering by date but item has no date (like a client), skip it or show? 
        // Usually, reports like stock/shipments have dates.
        if (activeTab !== 'clients') return false; 
    }

    return true;
  });

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const selectDateFilter = (day: number) => {
    const d = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    setFilterDate(d);
    setFilterMonth(null);
    setFilterYear(null);
  };

  const selectMonthFilter = () => {
    setFilterMonth(viewDate.getMonth());
    setFilterYear(viewDate.getFullYear());
    setFilterDate(null);
  };

  const selectYearFilter = () => {
    setFilterYear(viewDate.getFullYear());
    setFilterMonth(null);
    setFilterDate(null);
  };

  const clearDateFilters = () => {
    setFilterDate(null);
    setFilterMonth(null);
    setFilterYear(null);
  };

  const renderTableHeader = () => {
    const headerClass = "font-black text-[#1A1F2B] text-[10px] uppercase tracking-widest px-4 h-14 bg-slate-50 border-b border-slate-200 whitespace-nowrap";
    
    const FilterIcon = ({ type, dataKey }: { type: 'date' | 'list', dataKey?: string }) => (
      <Popover>
        <PopoverTrigger asChild>
          <button className={cn(
            "ml-2 p-1.5 rounded-lg transition-all",
            ((type === 'date' && (filterDate || filterMonth !== null || filterYear)) || (type === 'list' && dataKey && listFilters[dataKey]))
              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
              : "hover:bg-slate-200 text-slate-400"
          )}>
            <Filter className="h-3 w-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 rounded-3xl border-none shadow-2xl overflow-hidden" align="start">
          {type === 'date' ? (
            <div className="bg-white dark:bg-slate-900 w-80">
               {/* Header: Month/Year Picker */}
               <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                  <button onClick={handlePrevMonth} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                     <ChevronLeft size={20} />
                  </button>
                  <div className="flex flex-col items-center">
                     <button onClick={selectMonthFilter} className="text-xs font-black uppercase tracking-widest hover:text-emerald-400 transition-colors">
                        {viewDate.toLocaleString('default', { month: 'long' })}
                     </button>
                     <button onClick={selectYearFilter} className="text-[18px] font-black italic tracking-tighter hover:text-emerald-400 transition-colors">
                        {viewDate.getFullYear()}
                     </button>
                  </div>
                  <button onClick={handleNextMonth} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                     <ChevronRight size={20} />
                  </button>
               </div>

               {/* Days Grid */}
               <div className="p-4">
                  <div className="grid grid-cols-7 mb-2">
                     {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                        <div key={d} className="text-center text-[9px] font-black text-slate-400 uppercase">{d}</div>
                     ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                     {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} />
                     ))}
                     {Array.from({ length: new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate() }).map((_, i) => {
                        const day = i + 1;
                        const isSelected = filterDate?.getDate() === day && filterDate?.getMonth() === viewDate.getMonth() && filterDate?.getFullYear() === viewDate.getFullYear();
                        return (
                           <button 
                             key={day} 
                             onClick={() => selectDateFilter(day)}
                             className={cn(
                                "h-9 w-9 rounded-xl text-[11px] font-bold transition-all",
                                isSelected ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 scale-110" : "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-300"
                             )}
                           >
                              {day}
                           </button>
                        );
                     })}
                  </div>
               </div>

               {/* Footer */}
               <div className="p-4 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                  <button onClick={clearDateFilters} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">Clear Filters</button>
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                     {filterDate ? filterDate.toLocaleDateString() : filterMonth !== null ? `${viewDate.toLocaleString('default', { month: 'short' })} ${filterYear}` : filterYear ? `${filterYear}` : 'Select Date'}
                  </div>
               </div>
            </div>
          ) : (
            <div className="p-4 max-h-80 overflow-y-auto min-w-[200px] bg-white dark:bg-slate-900">
              <div className="flex items-center justify-between mb-4 border-b border-slate-50 dark:border-white/5 pb-3">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.filter')} {dataKey}</p>
                 <button onClick={() => setListFilters(prev => { const n = {...prev}; delete n[dataKey!]; return n; })} className="text-emerald-500 hover:text-emerald-600">
                    <X size={14} />
                 </button>
              </div>
              <div className="space-y-1">
                 <button 
                   onClick={() => setListFilters(prev => { const n = {...prev}; delete n[dataKey!]; return n; })}
                   className={cn("w-full text-left px-4 py-3 text-[11px] rounded-xl font-bold uppercase transition-all", !listFilters[dataKey!] ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400")}
                 >
                   Show All
                 </button>
                 {getUniqueValues(dataKey!).map(val => (
                   <button 
                     key={val} 
                     onClick={() => setListFilters(prev => ({ ...prev, [dataKey!]: val }))}
                     className={cn("w-full text-left px-4 py-3 text-[11px] rounded-xl font-bold uppercase transition-all", listFilters[dataKey!] === val ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/10" : "hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400")}
                   >
                     {val}
                   </button>
                 ))}
              </div>
            </div>
          )}
        </PopoverContent>
      </Popover>
    );

    const headers: Record<string, any[]> = {
      incoming: [
        { label: '#', type: 'none' },
        { label: t('reports.date'), type: 'date' },
        { label: t('reports.product'), type: 'list', key: 'productId' },
        { label: t('reports.client'), type: 'list', key: 'clientId' },
        { label: 'Gate Pass', type: 'none' },
        { label: t('reports.bags'), type: 'none' },
        { label: t('reports.location'), type: 'list', key: 'locationId' },
        { label: t('reports.vehicleNumber'), type: 'list', key: 'vehicleNumber' },
      ],
      outgoing: [
        { label: '#', type: 'none' },
        { label: t('reports.date'), type: 'date' },
        { label: t('reports.product'), type: 'list', key: 'productId' },
        { label: t('reports.client'), type: 'list', key: 'clientId' },
        { label: 'Order ID', type: 'none' },
        { label: t('reports.bags'), type: 'none' },
        { label: t('reports.location'), type: 'list', key: 'locationId' },
        { label: t('reports.vehicleNumber'), type: 'list', key: 'vehicleNumber' },
      ],
      stock: [
        { label: '#', type: 'none' },
        { label: 'Chamber', type: 'list', key: 'chamber' },
        { label: 'Floor', type: 'list', key: 'floor' },
        { label: 'Block', type: 'none' },
        { label: 'Occupied', type: 'none' },
        { label: 'Capacity', type: 'none' },
        { label: 'Status', type: 'list', key: 'status' },
      ],
      clients: [
        { label: '#', type: 'none' },
        { label: 'Client Name', type: 'none' },
        { label: 'Phone', type: 'none' },
        { label: 'Address', type: 'none' },
        { label: 'GST', type: 'none' },
        { label: 'Status', type: 'list', key: 'status' },
      ]
    };

    const currentHeaders = headers[activeTab] || [];

    return (
      <TableRow className="hover:bg-slate-50">
        {currentHeaders.map((h, idx) => (
          <TableHead key={idx} className={headerClass}>
            <div className="flex items-center">
               {h.label} 
               {h.type !== 'none' && <FilterIcon type={h.type as any} dataKey={h.key} />}
            </div>
          </TableHead>
        ))}
      </TableRow>
    );
  };

  const renderTableRow = (row: any, index: number) => {
    const cellClass = "text-[11px] font-bold py-5 px-4 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-white/5 whitespace-nowrap uppercase tracking-tight";
    
    switch (activeTab) {
      case 'incoming':
        return (
          <TableRow key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
            <TableCell className={cellClass}>{index + 1}</TableCell>
            <TableCell className={cellClass}>{row.createdAt?.seconds ? new Date(row.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
            <TableCell className={cellClass}>{row.productId}</TableCell>
            <TableCell className={cellClass}>{row.clientId}</TableCell>
            <TableCell className={cellClass}>{row.gatePass || 'N/A'}</TableCell>
            <TableCell className={cn(cellClass, "text-emerald-500 font-black")}>+{row.quantity}</TableCell>
            <TableCell className={cellClass}>{row.locationId}</TableCell>
            <TableCell className={cellClass}>{row.vehicleNumber}</TableCell>
          </TableRow>
        );
      case 'outgoing':
        return (
          <TableRow key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
            <TableCell className={cellClass}>{index + 1}</TableCell>
            <TableCell className={cellClass}>{row.createdAt?.seconds ? new Date(row.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
            <TableCell className={cellClass}>{row.productId}</TableCell>
            <TableCell className={cellClass}>{row.clientId}</TableCell>
            <TableCell className={cellClass}>{row.orderId || 'N/A'}</TableCell>
            <TableCell className={cn(cellClass, "text-rose-500 font-black")}>-{row.quantity}</TableCell>
            <TableCell className={cellClass}>{row.locationId}</TableCell>
            <TableCell className={cellClass}>{row.vehicleNumber}</TableCell>
          </TableRow>
        );
      case 'stock':
        return (
          <TableRow key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
            <TableCell className={cellClass}>{index + 1}</TableCell>
            <TableCell className={cellClass}>{row.chamber}</TableCell>
            <TableCell className={cellClass}>{row.floor}</TableCell>
            <TableCell className={cellClass}>{row.name}</TableCell>
            <TableCell className={cn(cellClass, "text-emerald-500")}>{row.occupied || 0}</TableCell>
            <TableCell className={cellClass}>{row.capacity}</TableCell>
            <TableCell className={cellClass}>
               <span className={cn(
                  "px-2 py-0.5 rounded text-[8px] font-black",
                  row.status === 'FULL' ? "bg-rose-500/10 text-rose-500" : row.status === 'PARTIAL' ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
               )}>{row.status}</span>
            </TableCell>
          </TableRow>
        );
      case 'clients':
        return (
          <TableRow key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
            <TableCell className={cellClass}>{index + 1}</TableCell>
            <TableCell className={cn(cellClass, "font-black text-slate-900 dark:text-white italic")}>{row.name}</TableCell>
            <TableCell className={cellClass}>{row.phone}</TableCell>
            <TableCell className={cellClass}>{row.address}</TableCell>
            <TableCell className={cellClass}>{row.gst || 'N/A'}</TableCell>
            <TableCell className={cellClass}>{row.status}</TableCell>
          </TableRow>
        );
      default:
        return null;
    }
  };

  return (
    <Layout>
      <div className="bg-[#F4F7F9] dark:bg-slate-950 -m-8 p-10 min-h-screen font-sans">
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-1">
             <h1 className="text-3xl font-black text-[#111827] dark:text-white uppercase italic tracking-tighter">Analytical <span className="text-emerald-500">Reports</span></h1>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enterprise Data Intelligence and Logistics Audit</p>
          </div>
          <div className="flex items-center gap-4">
             <div className="bg-white dark:bg-slate-900 p-2 rounded-2xl flex gap-2 border border-slate-200 dark:border-white/5 shadow-sm">
                {TABS.map(tab => (
                   <button
                     key={tab.id}
                     onClick={() => { setActiveTab(tab.id); setListFilters({}); clearDateFilters(); }}
                     className={cn(
                       "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                       activeTab === tab.id ? "bg-slate-900 text-white shadow-lg" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                     )}
                   >
                     {t(tab.label)}
                   </button>
                ))}
             </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-premium border border-slate-200 dark:border-white/5 overflow-hidden">
          <div className="p-8 border-b border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                   <CalendarIcon size={18} />
                </div>
                <div>
                   <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase italic tracking-tighter">{t(TABS.find(t => t.id === activeTab)?.label || '')}</h3>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {filteredData.length} records identified in selected partition
                   </p>
                </div>
             </div>
             
             {/* Active Filter Indicators */}
             <div className="flex gap-2">
                {(filterDate || filterMonth !== null || filterYear) && (
                   <Badge className="bg-emerald-500/10 text-emerald-600 border-none px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2">
                      <CalendarIcon size={12} /> 
                      {filterDate ? filterDate.toLocaleDateString() : filterMonth !== null ? `${new Date(2000, filterMonth).toLocaleString('default', { month: 'short' })} ${filterYear}` : filterYear}
                      <button onClick={clearDateFilters} className="hover:text-emerald-800 transition-colors"><X size={10} /></button>
                   </Badge>
                )}
                {Object.entries(listFilters).map(([key, val]) => (
                   <Badge key={key} className="bg-blue-500/10 text-blue-600 border-none px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center gap-2">
                      {key}: {val}
                      <button onClick={() => setListFilters(prev => { const n = {...prev}; delete n[key]; return n; })} className="hover:text-blue-800 transition-colors"><X size={10} /></button>
                   </Badge>
                ))}
             </div>
          </div>
          
          <div className="overflow-x-auto no-scrollbar">
            <Table className="border-collapse min-w-full">
              <TableHeader>
                {renderTableHeader()}
              </TableHeader>
              <TableBody>
                {filteredData.length > 0 ? (
                  filteredData.map((row, i) => renderTableRow(row, i))
                ) : (
                  <TableRow>
                    <TableCell colSpan={12} className="h-96 py-20">
                      <div className="flex flex-col items-center justify-center text-slate-400">
                        <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-white/5">
                          <Inbox className="w-12 h-12 opacity-10" />
                        </div>
                        <p className="text-[12px] font-black uppercase tracking-[0.2em] opacity-30 italic">Target Data Pool Empty</p>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 opacity-50 uppercase tracking-widest">Adjust filters to re-scan</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Batch Partition: 20 Items</p>
            <div className="flex items-center gap-4">
               <button className="h-10 px-8 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-400 cursor-not-allowed transition-all">
                 {t('reports.previous')}
               </button>
               <button className="h-10 px-8 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition-all shadow-sm active:scale-95">
                 {t('reports.next')}
               </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
