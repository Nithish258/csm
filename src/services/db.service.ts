import { 
  collection, 
  doc, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  QueryConstraint,
  DocumentData,
  serverTimestamp,
  runTransaction
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from '../store/authStore';

/**
 * Enterprise Firestore Service Wrapper
 * Enforces mandatory tenant isolation at the protocol level.
 */
export const dbService = {
  /**
   * Get a tenant-scoped collection reference
   */
  getCollection(path: string) {
    const tenantId = useAuthStore.getState().tenant?.id;
    if (!tenantId) throw new Error("Security Violation: Attempted data access without tenant context.");
    
    return query(collection(db, path), where('tenantId', '==', tenantId));
  },

  /**
   * Add a document with automatic tenant branding and metadata
   */
  async add(path: string, data: any) {
    const user = useAuthStore.getState().user;
    const tenantId = useAuthStore.getState().tenant?.id;
    
    if (!tenantId || !user) {
      throw new Error("Security Violation: Write attempted without auth/tenant context.");
    }

    try {
      return await addDoc(collection(db, path), {
        ...data,
        tenantId,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error(`Firestore Write Error [${path}]:`, error);
      throw error;
    }
  },

  /**
   * Update a document with metadata update
   */
  async update(path: string, id: string, data: any) {
    const docRef = doc(db, path, id);
    return await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Get a single document by ID
   */
  async get(path: string, id: string) {
    const docRef = doc(db, path, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  },

  /**
   * Delete a document by ID
   */
  async delete(path: string, id: string) {
    const docRef = doc(db, path, id);
    return await deleteDoc(docRef);
  },

  /**
   * Real-time listener scoped to the current tenant
   */
  sync(path: string, callback: (data: any[]) => void, constraints: QueryConstraint[] = []) {
    const tenantId = useAuthStore.getState().tenant?.id;
    if (!tenantId) return () => {};

    const q = query(
      collection(db, path), 
      where('tenantId', '==', tenantId),
      ...constraints
    );

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(items);
    });
  },

  /**
   * Transactional operations (Crucial for Stock movements)
   */
  async executeTransaction(logic: (transaction: any) => Promise<void>) {
    return await runTransaction(db, logic);
  }
};
