import * as React from 'react';
import { useState, useEffect } from 'react';
import Layout from '../components/layout/Layout';
import { dbService } from '../services/db.service';
import { 
  Inbox, 
  Filter, 
  X, 
  Download, 
  FileSpreadsheet, 
  FileText, 
  Calendar as CalendarIcon,
  RefreshCw,
  Search,
  ChevronDown
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
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem 
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

const TABS = [
  { id: 'incoming', label: 'reports.recentIncoming', collection: 'incoming_shipments' },
  { id: 'outgoing', label: 'reports.recentOutgoing', collection: 'outgoing_shipments' },
  { id: 'stock', label: 'reports.currentStock', collection: 'locations' },
  { id: 'clients', label: 'reports.clients', collection: 'clients' },
];

export default function Reports() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter Panel States
  const [showFilters, setShowFilters] = useState(true);
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    client: '',
    farmer: '',
    commodity: '',
    variety: '',
    billNumber: '',
    mark: '',
    chamber: '',
    block: '',
    paymentStatus: '',
    outwardStatus: ''
  });

  useEffect(() => {
    setLoading(true);
    const tab = TABS.find(t => t.id === activeTab);
    if (tab) {
      const unsub = dbService.sync(tab.collection, (data) => {
        setReportData(data);
        setLoading(false);
      });
      return () => unsub();
    }
  }, [activeTab]);

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      client: '',
      farmer: '',
      commodity: '',
      variety: '',
      billNumber: '',
      mark: '',
      chamber: '',
      block: '',
      paymentStatus: '',
      outwardStatus: ''
    });
  };

  // Instant Client-side Filter Logic
  const filteredData = reportData.filter(item => {
    // 1. Date Range Filter
    if (filters.startDate || filters.endDate) {
      const recordDateStr = item.inwardDate || item.outwardDate;
      if (recordDateStr) {
        const date = new Date(recordDateStr);
        if (filters.startDate && date < new Date(filters.startDate)) return false;
        if (filters.endDate && date > new Date(filters.endDate)) return false;
      } else if (item.createdAt?.seconds) {
        const date = new Date(item.createdAt.seconds * 1000);
        if (filters.startDate && date < new Date(filters.startDate)) return false;
        if (filters.endDate && date > new Date(filters.endDate)) return false;
      } else {
        return false; // Skip if date is required but missing
      }
    }

    // 2. Client Name Filter
    if (filters.client) {
      const clientVal = (item.clientName || item.clientId || item.name || '').toLowerCase();
      if (!clientVal.includes(filters.client.toLowerCase())) return false;
    }

    // 3. Farmer Name Filter
    if (filters.farmer) {
      const farmerVal = (item.farmerName || item.farmerId || '').toLowerCase();
      if (!farmerVal.includes(filters.farmer.toLowerCase())) return false;
    }

    // 4. Commodity Filter
    if (filters.commodity) {
      const commVal = (item.commodityName || item.commodityId || '').toLowerCase();
      if (!commVal.includes(filters.commodity.toLowerCase())) return false;
    }

    // 5. Variety Filter
    if (filters.variety) {
      const varVal = (item.varietyName || item.varietyId || '').toLowerCase();
      if (!varVal.includes(filters.variety.toLowerCase())) return false;
    }

    // 6. Bill Number / Release Order ID Filter
    if (filters.billNumber) {
      const billVal = (item.inBillNumber || item.orderId || '').toLowerCase();
      if (!billVal.includes(filters.billNumber.toLowerCase())) return false;
    }

    // 7. Bag Marks Filter
    if (filters.mark) {
      const markVal = (item.mark || '').toLowerCase();
      if (!markVal.includes(filters.mark.toLowerCase())) return false;
    }

    // 8. Chamber Filter
    if (filters.chamber) {
      const chamberVal = (item.chamber || '').toLowerCase();
      if (!chamberVal.includes(filters.chamber.toLowerCase())) return false;
    }

    // 9. Block / Slot Filter
    if (filters.block) {
      const blockVal = (item.block || item.locationId || item.name || '').toLowerCase();
      if (!blockVal.includes(filters.block.toLowerCase())) return false;
    }

    // 10. Payment Status Filter
    if (filters.paymentStatus) {
      const payVal = (item.paymentStatus || '').toLowerCase();
      if (payVal !== filters.paymentStatus.toLowerCase()) return false;
    }

    // 11. Outward / Custody Status Filter
    if (filters.outwardStatus) {
      const statusVal = (item.status || '').toLowerCase();
      if (statusVal !== filters.outwardStatus.toLowerCase()) return false;
    }

    return true;
  });

  // Export 1: CSV Export
  const exportCSV = () => {
    if (filteredData.length === 0) {
      toast.error('No record matched current filters to export.');
      return;
    }

    const headers = getHeadersForTab();
    const rows = filteredData.map((row, idx) => getRowValuesForTab(row, idx));

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `warehouse-report-${activeTab}-${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('CSV Report exported successfully');
  };

  // Export 2: Excel Export
  const exportExcel = () => {
    if (filteredData.length === 0) {
      toast.error('No record matched current filters to export.');
      return;
    }

    const headers = getHeadersForTab();
    const rows = filteredData.map((row, idx) => getRowValuesForTab(row, idx));

    const xlsContent = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');

    const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `warehouse-report-${activeTab}-${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Excel Spreadsheet exported successfully');
  };

  // Export 3: PDF Export
  const exportPDF = () => {
    if (filteredData.length === 0) {
      toast.error('No record matched current filters to export.');
      return;
    }

    const headers = getHeadersForTab();
    const rows = filteredData.map((row, idx) => getRowValuesForTab(row, idx));
    const titleText = t(TABS.find(t => t.id === activeTab)?.label || '');

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Pop-up window blocked. Please allow pop-ups to generate PDF.');
      return;
    }

    const tableHeadersHTML = headers.map(h => `<th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: left; font-size: 10px; font-weight: 800; text-transform: uppercase;">${h}</th>`).join('');
    const tableRowsHTML = rows.map(row => {
      return `<tr>${row.map(val => `<td style="padding: 12px; border-bottom: 1px solid #eee; font-size: 11px; font-weight: 600; text-transform: uppercase;">${val}</td>`).join('')}</tr>`;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${titleText} - Audit Ledger</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #111827; margin: 40px; }
            h1 { font-size: 24px; font-weight: 900; font-style: italic; text-transform: uppercase; margin-bottom: 5px; }
            p { font-size: 10px; font-weight: 700; color: #6b7280; text-transform: uppercase; margin-bottom: 30px; letter-spacing: 1px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 20px; font-size: 9px; font-weight: 800; color: #9ca3af; text-align: right; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <h1>ColdChain OS Ledger Registry</h1>
          <p>${titleText} • Generated on ${new Date().toLocaleString()} • ${filteredData.length} active records</p>
          <table>
            <thead>
              <tr style="background-color: #f9fafb;">${tableHeadersHTML}</tr>
            </thead>
            <tbody>
              ${tableRowsHTML}
            </tbody>
          </table>
          <div class="footer">ColdChain OS • SECURE DIGITAL AUDIT SIGN OFF</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getHeadersForTab = () => {
    switch (activeTab) {
      case 'incoming':
        return [
          t('reports.date'),
          t('reports.billNumber'),
          t('reports.client'),
          t('reports.farmer'),
          t('reports.commodity'),
          t('reports.variety'),
          t('reports.bags'),
          t('reports.mark'),
          t('reports.location'),
          t('reports.vehicle')
        ];
      case 'outgoing':
        return [
          t('reports.outwardDate'),
          t('reports.orderId'),
          t('reports.client'),
          t('reports.farmer'),
          t('reports.commodity'),
          t('reports.variety'),
          t('reports.bagsReleased'),
          t('reports.totalAmount'),
          t('reports.paymentStatus'),
          t('reports.vehicle')
        ];
      case 'stock':
        return [
          t('reports.chamber'),
          t('reports.floor'),
          t('reports.name'),
          t('reports.occupied'),
          t('reports.capacity'),
          t('reports.status')
        ];
      case 'clients':
        return [
          t('reports.client'),
          t('reports.phone'),
          t('reports.address'),
          t('reports.gst'),
          t('reports.accountStatus')
        ];
      default:
        return [];
    }
  };

  const getRowValuesForTab = (row: any, index: number) => {
    switch (activeTab) {
      case 'incoming':
        return [
          row.inwardDate || (row.createdAt?.seconds ? new Date(row.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'),
          row.inBillNumber || 'N/A',
          row.clientName || row.clientId || 'N/A',
          row.farmerName || 'N/A',
          row.commodityName || 'N/A',
          row.varietyName || 'N/A',
          `${row.remainingBags !== undefined ? row.remainingBags : row.quantity} / ${row.quantity}`,
          row.mark || 'N/A',
          `${row.chamber || ''} ${row.floor || ''} ${row.block || row.locationId || ''}`,
          row.vehicleNumber || 'N/A'
        ];
      case 'outgoing':
        return [
          row.outwardDate || (row.createdAt?.seconds ? new Date(row.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'),
          row.orderId || 'N/A',
          row.clientName || row.clientId || 'N/A',
          row.farmerName || 'N/A',
          row.commodityName || 'N/A',
          row.varietyName || 'N/A',
          `-${row.quantity}`,
          row.totalAmount || 0,
          row.paymentStatus || 'UNPAID',
          row.vehicleNumber || 'N/A'
        ];
      case 'stock':
        return [
          row.chamber || 'N/A',
          row.floor || 'N/A',
          row.name || 'N/A',
          row.occupied || 0,
          row.capacity || 500,
          row.status || 'EMPTY'
        ];
      case 'clients':
        return [
          row.name || 'N/A',
          row.phone || 'N/A',
          row.address || 'N/A',
          row.gst || 'N/A',
          row.status || 'ACTIVE'
        ];
      default:
        return [];
    }
  };

  return (
    <Layout>
      <div className="space-y-12 max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
             <h1 className="text-4xl font-extrabold text-[#111827] dark:text-white uppercase italic tracking-tight">{t('reports.title')}</h1>
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t('reports.subtitle')}</p>
          </div>

          {/* Unified Premium Download Dropdown */}
          <div className="flex flex-wrap items-center gap-3">
             <DropdownMenu>
               <DropdownMenuTrigger asChild>
                 <Button className="bg-slate-900 dark:bg-emerald-500 hover:bg-slate-800 dark:hover:bg-emerald-600 text-white rounded-xl px-6 h-12 font-bold uppercase tracking-wider text-[10px] gap-2 shadow-md transition-all active:scale-95">
                   <Download size={14} /> {t('common.download')} <ChevronDown size={12} />
                 </Button>
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 shadow-xl z-50">
                 <DropdownMenuItem onClick={exportPDF} className="flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                   <FileText size={14} className="text-rose-500" /> {t('common.downloadPdf')}
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={exportExcel} className="flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                   <FileSpreadsheet size={14} className="text-emerald-500" /> {t('common.downloadExcel')}
                 </DropdownMenuItem>
                 <DropdownMenuItem onClick={exportCSV} className="flex items-center gap-2.5 px-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors">
                   <Download size={14} className="text-blue-500" /> {t('common.downloadCsv')}
                 </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-premium overflow-x-auto no-scrollbar">
           {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); clearFilters(); }}
                className={cn(
                  "px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                  activeTab === tab.id ? "bg-slate-900 dark:bg-emerald-500 text-white shadow-lg" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                )}
              >
                {t(tab.label)}
              </button>
           ))}
        </div>

        {/* Analytical Filter Center Card */}
        <AnimatePresence>
           {showFilters && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200/50 dark:border-slate-800 shadow-premium space-y-6"
              >
                 <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                       <Filter size={14} /> {t('common.filter')}
                    </h3>
                    <button onClick={clearFilters} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline flex items-center gap-1">
                       <X size={12} /> {t('common.clear')}
                    </button>
                 </div>

                 {/* Filters Input Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {/* Date Filters */}
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('reports.startDate')}</Label>
                       <Input type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} className="h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('reports.endDate')}</Label>
                       <Input type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} className="h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white" />
                    </div>

                    {/* Autocomplete fields */}
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('reports.client')}</Label>
                       <Input placeholder="Search Client..." value={filters.client} onChange={(e) => setFilters({ ...filters, client: e.target.value })} className="h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold uppercase text-slate-900 dark:text-white" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('reports.farmer')}</Label>
                       <Input placeholder="Search Farmer..." value={filters.farmer} onChange={(e) => setFilters({ ...filters, farmer: e.target.value })} className="h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold uppercase text-slate-900 dark:text-white" />
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('reports.commodity')}</Label>
                       <Input placeholder="e.g. Red Chilli" value={filters.commodity} onChange={(e) => setFilters({ ...filters, commodity: e.target.value })} className="h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold uppercase text-slate-900 dark:text-white" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('reports.variety')}</Label>
                       <Input placeholder="e.g. Teja, 341" value={filters.variety} onChange={(e) => setFilters({ ...filters, variety: e.target.value })} className="h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold uppercase text-slate-900 dark:text-white" />
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('reports.billNumber')} / RO</Label>
                       <Input placeholder="Search ID..." value={filters.billNumber} onChange={(e) => setFilters({ ...filters, billNumber: e.target.value })} className="h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold uppercase text-slate-900 dark:text-white" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('reports.mark')}</Label>
                       <Input placeholder="Bag Marking Label..." value={filters.mark} onChange={(e) => setFilters({ ...filters, mark: e.target.value })} className="h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold uppercase text-slate-900 dark:text-white" />
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('reports.chamber')}</Label>
                       <Input placeholder="e.g. Chamber 1" value={filters.chamber} onChange={(e) => setFilters({ ...filters, chamber: e.target.value })} className="h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold uppercase text-slate-900 dark:text-white" />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('reports.name')}</Label>
                       <Input placeholder="e.g. Block A" value={filters.block} onChange={(e) => setFilters({ ...filters, block: e.target.value })} className="h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold uppercase text-slate-900 dark:text-white" />
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('reports.paymentStatus')}</Label>
                       <select value={filters.paymentStatus} onChange={(e) => setFilters({ ...filters, paymentStatus: e.target.value })} className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-xs font-bold uppercase outline-none text-slate-900 dark:text-white">
                          <option value="">{t('reports.paymentAll')}</option>
                          <option value="PAID">{t('reports.paid')}</option>
                          <option value="PARTIAL">{t('reports.partial')}</option>
                          <option value="UNPAID">{t('reports.unpaid')}</option>
                       </select>
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400">{t('reports.status')}</Label>
                       <select value={filters.outwardStatus} onChange={(e) => setFilters({ ...filters, outwardStatus: e.target.value })} className="w-full h-12 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 text-xs font-bold uppercase outline-none text-slate-900 dark:text-white">
                          <option value="">{t('reports.outwardAll')}</option>
                          <option value="IN_STORAGE">{t('reports.inStorage')}</option>
                          <option value="PARTIALLY_DISPATCHED">{t('reports.partiallyDispatched')}</option>
                          <option value="DISPATCHED">{t('reports.dispatched')}</option>
                       </select>
                    </div>
                 </div>
              </motion.div>
           )}
        </AnimatePresence>

        {/* Analytical Table Card (Restored Register Layout) */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-premium border border-slate-200/50 dark:border-slate-800 overflow-hidden">
           <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                 <h3 className="text-lg font-black uppercase italic tracking-tighter text-slate-900 dark:text-white">{t('common.activeFilters')}</h3>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                    {filteredData.length} records identified in active selection partition
                 </p>
              </div>
           </div>

           <div className="overflow-x-auto">
              <Table className="border-collapse min-w-full">
                  <TableHeader>
                     <TableRow className="hover:bg-slate-50/50 border-b border-slate-100 dark:border-slate-800">
                        {getHeadersForTab().map((h, i) => (
                           <TableHead key={i} className="font-black text-slate-900 dark:text-slate-300 text-[9px] uppercase tracking-widest px-6 h-14 bg-slate-50 dark:bg-slate-850 border-none whitespace-nowrap">{h}</TableHead>
                        ))}
                     </TableRow>
                  </TableHeader>
                  <TableBody>
                     {loading ? (
                        <TableRow>
                           <TableCell colSpan={12} className="h-64 py-12 text-center text-xs text-slate-400 italic">
                              <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2 text-emerald-500" /> Scanning records pool...
                           </TableCell>
                        </TableRow>
                     ) : filteredData.length > 0 ? (
                        filteredData.map((row, idx) => {
                           const cellClass = "text-xs font-bold py-5 px-6 text-slate-600 dark:text-slate-300 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap uppercase tracking-tight";
                           const tabVals = getRowValuesForTab(row, idx);
                           return (
                              <TableRow key={row.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                 {tabVals.map((cell, cidx) => {
                                    let colorClass = "";
                                    if (activeTab === 'incoming' && cidx === 6) colorClass = "text-emerald-500 font-black";
                                    if (activeTab === 'outgoing' && cidx === 6) colorClass = "text-rose-500 font-black";
                                    
                                    // Special badge render for payment status column in outgoing shipments
                                    if (activeTab === 'outgoing' && cidx === 8) {
                                       return (
                                          <TableCell key={cidx} className={cellClass}>
                                             <Badge className={`border-none px-2.5 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                                               cell === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' :
                                               cell === 'PARTIAL' ? 'bg-amber-500/10 text-amber-500' :
                                               'bg-rose-500/10 text-rose-500'
                                             }`}>{String(cell)}</Badge>
                                          </TableCell>
                                       );
                                    }
                                    return (
                                       <TableCell key={cidx} className={cn(cellClass, colorClass)}>{String(cell)}</TableCell>
                                    );
                                 })}
                              </TableRow>
                           );
                        })
                     ) : (
                        <TableRow>
                           <TableCell colSpan={12} className="h-96 py-20">
                              <div className="flex flex-col items-center justify-center text-slate-400">
                                <div className="w-24 h-24 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-850">
                                  <Inbox className="w-12 h-12 opacity-10" />
                                </div>
                                <p className="text-[12px] font-black uppercase tracking-[0.2em] opacity-30 italic">{t('reports.emptyState')}</p>
                                <p className="text-[10px] font-bold text-slate-400 mt-2 opacity-50 uppercase tracking-widest">{t('reports.adjustFilters')}</p>
                              </div>
                           </TableCell>
                        </TableRow>
                     )}
                  </TableBody>
              </Table>
           </div>
        </div>
      </div>
    </Layout>
  );
}
