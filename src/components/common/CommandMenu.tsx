import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Command } from 'cmdk';
import { 
  Search, 
  LayoutDashboard, 
  Package, 
  Users, 
  ArrowDownCircle, 
  ArrowUpCircle,
  Settings,
  History,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-[600px] bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/5"
          >
            <Command className="flex flex-col h-full">
              <div className="flex items-center border-b dark:border-white/5 px-6">
                <Search className="h-5 w-5 text-slate-400 mr-4" />
                <Command.Input 
                  placeholder="Type a command or search..." 
                  className="w-full h-16 bg-transparent border-none focus:ring-0 text-sm font-black uppercase tracking-widest outline-none"
                />
              </div>
              <Command.List className="max-h-[400px] overflow-y-auto p-4 custom-scrollbar-hidden">
                <Command.Empty className="py-10 text-center text-xs font-black uppercase text-slate-400 tracking-widest">No results found.</Command.Empty>
                
                <Command.Group heading="Navigation" className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2">
                  <Item onSelect={() => runCommand(() => navigate('/'))}>
                    <LayoutDashboard className="mr-3 h-4 w-4" />
                    <span>Dashboard</span>
                  </Item>
                  <Item onSelect={() => runCommand(() => navigate('/stock'))}>
                    <Package className="mr-3 h-4 w-4" />
                    <span>Inventory Hub</span>
                  </Item>
                  <Item onSelect={() => runCommand(() => navigate('/clients'))}>
                    <Users className="mr-3 h-4 w-4" />
                    <span>Consignor List</span>
                  </Item>
                </Command.Group>

                <Command.Group heading="Operations" className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2 mt-4">
                  <Item onSelect={() => runCommand(() => navigate('/incoming'))}>
                    <ArrowDownCircle className="mr-3 h-4 w-4" />
                    <span>New Inward Entry</span>
                  </Item>
                  <Item onSelect={() => runCommand(() => navigate('/outgoing'))}>
                    <ArrowUpCircle className="mr-3 h-4 w-4" />
                    <span>New Dispatch Order</span>
                  </Item>
                </Command.Group>

                <Command.Group heading="System" className="px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] text-emerald-500 mb-2 mt-4">
                  <Item onSelect={() => runCommand(() => navigate('/settings'))}>
                    <Settings className="mr-3 h-4 w-4" />
                    <span>Settings</span>
                  </Item>
                  <Item onSelect={() => runCommand(() => navigate('/audit-logs'))}>
                    <History className="mr-3 h-4 w-4" />
                    <span>System Audit Logs</span>
                  </Item>
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Item({ children, onSelect }: { children: React.ReactNode, onSelect: () => void }) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex items-center px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 aria-selected:bg-emerald-500 aria-selected:text-white cursor-pointer transition-all mb-1"
    >
      {children}
    </Command.Item>
  );
}
