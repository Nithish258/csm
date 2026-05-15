import { doc, getDoc, setDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { dbService } from './db.service';
import { eventBus } from '../lib/events';

/**
 * Enterprise Stock Management Service
 * Enforces atomic updates and prevents negative inventory.
 */
export const stockService = {
  /**
   * Adjust stock levels atomically
   */
  async adjustStock(productId: string, delta: number, locationId: string, tenantId: string) {
    return await dbService.executeTransaction(async (transaction) => {
      const stockRef = doc(db, 'stock', `${tenantId}_${productId}_${locationId}`);
      const stockDoc = await transaction.get(stockRef);
      
      const currentQuantity = stockDoc.exists() ? stockDoc.data().quantity : 0;
      const newQuantity = currentQuantity + delta;

      if (newQuantity < 0) {
        throw new Error(`Insufficient Inventory: Current (${currentQuantity}), Requested reduction (${Math.abs(delta)})`);
      }

      if (!stockDoc.exists()) {
        transaction.set(stockRef, {
          productId,
          locationId,
          tenantId,
          quantity: newQuantity,
          updatedAt: new Date()
        });
      } else {
        transaction.update(stockRef, {
          quantity: newQuantity,
          updatedAt: new Date()
        });
      }

      // Emit event for side effects (occupancy, analytics)
      await eventBus.emit({ 
        type: 'STOCK_UPDATED', 
        payload: { productId, delta, tenantId } 
      });
      
      if (locationId) {
        await eventBus.emit({
          type: 'OCCUPANCY_CHANGED',
          payload: { locationId, tenantId }
        });
      }
    });
  },

  /**
   * Validate if enough stock is available before a transaction
   */
  async validateAvailability(productId: string, locationId: string, required: number, tenantId: string) {
    const stockRef = doc(db, 'stock', `${tenantId}_${productId}_${locationId}`);
    const stockDoc = await getDoc(stockRef);
    
    if (!stockDoc.exists() || stockDoc.data().quantity < required) {
      return false;
    }
    return true;
  }
};
