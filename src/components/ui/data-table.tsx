import * as React from 'react';
import { useState, useMemo } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './table';
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  Download, 
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from './dropdown-menu';
import { Button } from './button';
import { Input } from './input';
import { Badge } from './badge';

export interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => React.ReactNode;
  filterable?: boolean;
  sortable?: boolean;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  pageSize?: number;
  isLoading?: boolean;
}

export function DataTable<T extends Record<string, any>>({ 
  data, 
  columns, 
  onRowClick, 
  pageSize = 10,
  isLoading = false
}: DataTableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter and Sort Logic
  const processedData = useMemo(() => {
    let result = [...data];

    // Global Search
    if (searchQuery) {
      result = result.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }

    // Column Filters
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        result = result.filter(item => 
          String(item[key]).toLowerCase().includes(filters[key].toLowerCase())
        );
      }
    });

    // Sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchQuery, filters, sortConfig]);

  // Pagination
  const totalPages = Math.ceil(processedData.length / pageSize);
  const paginatedData = processedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-6">
      {/* Table Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
         <div className="relative group flex-1 max-w-sm">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <Input 
              placeholder="Search record matrix..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-premium text-xs font-bold"
            />
         </div>
         <div className="flex items-center gap-3">
            <Button variant="outline" className="h-12 px-6 rounded-2xl border-none bg-white dark:bg-slate-900 shadow-premium font-black text-[10px] uppercase tracking-widest">
               <Download className="h-4 w-4 mr-3" /> Export Ledger
            </Button>
         </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-premium overflow-hidden border-none">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-100 dark:border-white/5 hover:bg-transparent h-20 bg-slate-50/50 dark:bg-white/2">
                {columns.map((col, i) => (
                  <TableHead key={i} className="px-8 font-black text-[10px] uppercase tracking-widest text-slate-400 italic group/header">
                    <div className="flex items-center gap-2">
                       <span 
                         className={cn(
                           "cursor-pointer hover:text-emerald-500 transition-colors flex items-center gap-2",
                           sortConfig?.key === col.accessorKey && "text-emerald-500"
                         )}
                         onClick={() => {
                           if (col.sortable !== false) {
                             setSortConfig({
                               key: col.accessorKey as string,
                               direction: sortConfig?.key === col.accessorKey && sortConfig.direction === 'asc' ? 'desc' : 'asc'
                             });
                           }
                         }}
                       >
                         {col.header}
                         {col.sortable !== false && <ArrowUpDown className="h-3 w-3 opacity-30 group-hover/header:opacity-100 transition-opacity" />}
                       </span>
                       
                       {col.filterable !== false && (
                         <DropdownMenu>
                           <DropdownMenuTrigger asChild>
                              <button className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
                                 <Filter className={cn("h-3 w-3", filters[col.accessorKey as string] ? "text-emerald-500" : "text-slate-300")} />
                              </button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent className="p-3 w-56 rounded-2xl shadow-2xl border-none">
                              <Input 
                                placeholder={`Filter ${col.header}...`}
                                className="h-10 text-[10px] font-bold rounded-xl"
                                value={filters[col.accessorKey as string] || ''}
                                onChange={(e) => setFilters(prev => ({ ...prev, [col.accessorKey as string]: e.target.value }))}
                              />
                           </DropdownMenuContent>
                         </DropdownMenu>
                       )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                   <TableCell colSpan={columns.length} className="h-64 text-center">
                      <div className="flex flex-col items-center gap-4">
                         <div className="h-12 w-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Loading Operational Data...</span>
                      </div>
                   </TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={columns.length} className="h-64 text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">No records found in current segment.</p>
                   </TableCell>
                </TableRow>
              ) : (
                paginatedData.map((item, i) => (
                  <TableRow 
                    key={i} 
                    onClick={() => onRowClick?.(item)}
                    className={cn(
                      "border-slate-50 dark:border-white/2 hover:bg-slate-50/50 dark:hover:bg-white/2 transition-colors cursor-pointer group",
                      i % 2 === 0 ? "bg-transparent" : "bg-slate-50/30 dark:bg-white/1"
                    )}
                  >
                    {columns.map((col, j) => (
                      <TableCell key={j} className="px-8 py-6 font-bold text-xs">
                        {col.cell ? col.cell(item) : item[col.accessorKey as string]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-8 py-4 bg-white dark:bg-slate-900 rounded-[2rem] shadow-premium">
         <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Showing <span className="text-slate-900 dark:text-white">{((currentPage-1)*pageSize)+1}</span> to <span className="text-slate-900 dark:text-white">{Math.min(currentPage*pageSize, processedData.length)}</span> of <span className="text-slate-900 dark:text-white">{processedData.length}</span> records
         </p>
         <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.max(1, p-1))}
              disabled={currentPage === 1}
              className="h-10 w-10 rounded-xl p-0"
            >
               <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
               {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage-3), currentPage+2).map(p => (
                 <button 
                   key={p}
                   onClick={() => setCurrentPage(p)}
                   className={cn(
                     "h-10 w-10 rounded-xl text-[10px] font-black transition-all",
                     currentPage === p ? "bg-slate-900 dark:bg-emerald-600 text-white shadow-lg" : "text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5"
                   )}
                 >
                   {p}
                 </button>
               ))}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))}
              disabled={currentPage === totalPages}
              className="h-10 w-10 rounded-xl p-0"
            >
               <ChevronRight className="h-4 w-4" />
            </Button>
         </div>
      </div>
    </div>
  );
}
