import { create } from 'zustand';
import { User } from 'firebase/auth';
import { UserProfile, Tenant } from '../types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  tenant: Tenant | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setTenant: (tenant: Tenant | null) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  tenant: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setTenant: (tenant) => set({ tenant }),
  setLoading: (loading) => set({ loading }),
  logout: () => set({ user: null, profile: null, tenant: null, loading: false }),
}));
