import * as React from 'react';
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';
import Layout from '../components/layout/Layout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { UserPlus, Shield } from 'lucide-react';

export default function Users() {
  const { profile } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    if (!profile?.tenantId) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'users'), where('tenantId', '==', profile.tenantId));
      const snapshot = await getDocs(q);
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [profile?.tenantId]);

  if (profile?.role !== 'ADMIN') {
    return <Layout><div className="p-8 text-center text-red-500 font-medium">Access Denied. Admins only.</div></Layout>;
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Team Management</h2>
            <p className="text-muted-foreground">Manage employees and their roles.</p>
          </div>
          <Button disabled><UserPlus className="h-4 w-4 mr-2" /> Invite Member (PRO)</Button>
        </div>

        <div className="border rounded-lg bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                 <TableRow><TableCell colSpan={4} className="text-center py-10">Loading...</TableCell></TableRow>
              ) : users.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                       <Shield className="h-3 w-3 text-primary" />
                       <span className="capitalize text-sm">{u.role}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="h-2 w-2 rounded-full bg-green-500 inline-block mr-2" />
                    <span className="text-sm">Active</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {u.createdAt?.toDate ? u.createdAt.toDate().toLocaleDateString() : 'N/A'}
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
