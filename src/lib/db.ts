import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  onSnapshot, 
  query, 
  where, 
  orderBy,
  getDocs,
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db } from './firebase';
import { toast } from 'sonner';

export const crud = {
  // Create with tenantId
  async create(collectionName: string, data: any, tenantId: string) {
    if (!tenantId) {
      const error = "Unauthorized: Tenant ID missing.";
      toast.error(error);
      throw new Error(error);
    }
    
    try {
      const docRef = await addDoc(collection(db, collectionName), {
        ...data,
        tenantId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error: any) {
      console.error(`Firestore Create Error [${collectionName}]:`, error);
      toast.error(`System Error: Failed to save to ${collectionName}. Check console.`);
      throw error;
    }
  },

  // Update
  async update(collectionName: string, id: string, data: any) {
    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
    } catch (error: any) {
      console.error(`Firestore Update Error [${collectionName}]:`, error);
      toast.error(`System Error: Failed to update ${collectionName}.`);
      throw error;
    }
  },

  // Delete
  async delete(collectionName: string, id: string) {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error: any) {
      console.error(`Firestore Delete Error [${collectionName}]:`, error);
      toast.error(`System Error: Failed to delete ${collectionName}.`);
      throw error;
    }
  },

  // Realtime Sync
  sync(collectionName: string, tenantId: string, callback: (data: any[]) => void, constraints: QueryConstraint[] = []) {
    if (!tenantId) return () => {};

    const q = query(
      collection(db, collectionName),
      where('tenantId', '==', tenantId),
      ...constraints
    );

    return onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(data);
    }, (error) => {
      console.error(`Firestore Sync Error [${collectionName}]:`, error);
      toast.error(`Realtime Sync Error: ${collectionName}`);
    });
  }
};
