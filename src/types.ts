export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'ACCOUNTANT' | 'CLIENT';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  tenantId: string;
  tenantSlug: string;
  phone?: string;
  active: boolean;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  email: string;
  phone?: string;
  address?: string;
  primaryColor?: string;
  logoUrl?: string;
  createdAt: any;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  tenantId: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  gstNumber?: string;
  address?: string;
  balance: number;
  tenantId: string;
}

export interface Location {
  id: string;
  chamber: string;
  floor: string;
  slot: string;
  capacity: number;
  occupiedBags: number;
  tenantId: string;
}

export interface InventoryItem {
  id: string;
  clientId: string;
  productId: string;
  locationId: string;
  bags: number;
  tenantId: string;
  clientName?: string;
  productName?: string;
  locationName?: string;
}
