import { dbService } from './db.service';
import { eventBus } from '../lib/events';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

/**
 * Enterprise Location & Occupancy Service
 * Calculates real-time utilization for Chamber -> Floor -> Block hierarchy.
 */
export const occupancyService = {
  /**
   * Recalculate utilization when stock changes
   */
  async refreshOccupancy(locationId: string, tenantId: string) {
    const locRef = doc(db, 'locations', locationId);
    const locDoc = await getDoc(locRef);
    
    if (!locDoc.exists()) return;

    const data = locDoc.data();
    const capacity = data.capacity || 1000; // Fallback
    
    // Get all stock in this specific block
    const stockSnapshot = await dbService.sync('stock', (items) => {
      const occupied = items
        .filter(s => s.locationId === locationId)
        .reduce((sum, s) => sum + s.quantity, 0);

      const utilization = (occupied / capacity) * 100;
      
      let status = 'EMPTY';
      if (utilization > 0 && utilization < 90) status = 'PARTIAL';
      if (utilization >= 90) status = 'FULL';

      // Update the location record
      updateDoc(locRef, {
        occupied,
        utilization,
        status,
        lastRecalculated: new Date()
      });
    }, []);
  }
};

// Subscribe to system events to trigger auto-recalculation
eventBus.subscribe(async (event) => {
  if (event.type === 'OCCUPANCY_CHANGED') {
    await occupancyService.refreshOccupancy(event.payload.locationId, event.payload.tenantId);
  }
});
