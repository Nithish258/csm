import * as React from 'react';
import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { useAuthStore } from './store/authStore';
import { Toaster } from './components/ui/sonner';
import { RoleGate } from './components/common/RoleGate';

// Pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Products from './pages/Products';
import Clients from './pages/Clients';
import Locations from './pages/Locations';
import Incoming from './pages/Incoming';
import Outgoing from './pages/Outgoing';
import Stock from './pages/Stock';
import Users from './pages/Users';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';
import VehicleLogs from './pages/VehicleLogs';
import AuditLogs from './pages/AuditLogs';
import Settings from './pages/Settings';

import { handleFirestoreError, OperationType } from './lib/firestore-errors';

function App() {
  const { setUser, setProfile, setTenant, setLoading, loading, user, profile } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
      if (authUser) {
        setUser(authUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', authUser.uid));
          if (userDoc.exists()) {
            const profileData = userDoc.data() as any;
            setProfile(profileData);
            
            if (profileData.tenantId) {
              const tenantDoc = await getDoc(doc(db, 'tenants', profileData.tenantId));
              if (tenantDoc.exists()) {
                setTenant({ id: tenantDoc.id, ...tenantDoc.data() } as any);
              }
            }
          } else {
            console.warn("User profile node missing from cloud ledger.");
            setProfile({
              uid: authUser.uid,
              email: authUser.email || '',
              name: authUser.displayName || 'Operator',
              role: 'OPERATOR',
              tenantId: null
            } as any);
          }
        } catch (error) {
          console.error("Critical Auth Fetch Error:", error);
        }
      } else {
        setUser(null);
        setProfile(null);
        setTenant(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-6">
          <div className="h-16 w-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin shadow-lg shadow-emerald-500/20" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 animate-pulse">Initializing System Node</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
        <Route path="/signup" element={!user ? <Signup /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
        <Route path="/products" element={user ? <Products /> : <Navigate to="/login" />} />
        <Route path="/clients" element={user ? <Clients /> : <Navigate to="/login" />} />
        <Route path="/locations" element={user ? <Locations /> : <Navigate to="/login" />} />
        <Route path="/incoming" element={user ? <Incoming /> : <Navigate to="/login" />} />
        <Route path="/outgoing" element={user ? <Outgoing /> : <Navigate to="/login" />} />
        <Route path="/stock" element={user ? <Stock /> : <Navigate to="/login" />} />
        <Route path="/vehicle-logs" element={user ? <VehicleLogs /> : <Navigate to="/login" />} />
        <Route path="/invoices" element={user ? <Invoices /> : <Navigate to="/login" />} />
        <Route path="/payments" element={user ? <Payments /> : <Navigate to="/login" />} />
        <Route path="/expenses" element={user ? <Expenses /> : <Navigate to="/login" />} />
        <Route path="/reports" element={user ? <Reports /> : <Navigate to="/login" />} />
        <Route path="/audit-logs" element={user ? <RoleGate allowedRoles={['ADMIN', 'SUPER_ADMIN']}><AuditLogs /></RoleGate> : <Navigate to="/login" />} />
        <Route path="/users" element={user ? <RoleGate allowedRoles={['ADMIN', 'SUPER_ADMIN']}><Users /></RoleGate> : <Navigate to="/login" />} />
        <Route path="/settings" element={user ? <Settings /> : <Navigate to="/login" />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
