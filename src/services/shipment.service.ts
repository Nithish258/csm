import { dbService } from './db.service';
import { stockService } from './stock.service';
import { eventBus } from '../lib/events';
import { toast } from 'sonner';

/**
 * Enterprise Shipment Lifecycle Service
 * Manages incoming/outgoing logistics with atomic stock sync.
 */
export const shipmentService = {
  /**
   * Process a New Inward Entry
   */
  async createInward(data: {
    clientId: string;
    productId: string;
    locationId: string;
    quantity: number;
    vehicleNumber: string;
    gatePass: string;
    tenantId: string;
  }) {
    try {
      return await dbService.executeTransaction(async (transaction) => {
        // 1. Create the Shipment Record
        const shipmentRef = await dbService.add('incoming_shipments', {
          ...data,
          createdAt: new Date(),
          status: 'IN_STORAGE',
        });

        // 2. Atomically Increment Stock
        await stockService.adjustStock(data.productId, data.quantity, data.locationId, data.tenantId);

        // 3. Update Location Occupancy
        const locationRef = await dbService.get('locations', data.locationId);
        if (locationRef) {
          const newOccupied = (locationRef.occupied || 0) + data.quantity;
          const utilization = (newOccupied / (locationRef.capacity || 1000)) * 100;
          let newStatus = 'PARTIAL';
          if (utilization >= 100) newStatus = 'FULL';
          if (utilization <= 0) newStatus = 'EMPTY';
          
          await dbService.update('locations', data.locationId, {
            occupied: newOccupied,
            utilization: utilization,
            status: newStatus,
            lastRecalculated: new Date()
          });
        }

        // 4. Emit System Event
        await eventBus.emit({
          type: 'SHIPMENT_CREATED',
          payload: { shipmentId: shipmentRef.id, type: 'INCOMING', tenantId: data.tenantId }
        });

        return shipmentRef;
      });
    } catch (error: any) {
      toast.error(`Shipment Critical Failure: ${error.message}`);
      throw error;
    }
  },

  /**
   * Process a Dispatch Authorization
   */
  async createOutward(data: {
    clientId: string;
    productId: string;
    locationId: string;
    quantity: number;
    vehicleNumber: string;
    orderId: string;
    tenantId: string;
  }) {
    try {
      return await dbService.executeTransaction(async (transaction) => {
        // 1. Validate Stock Availability FIRST
        const isAvailable = await stockService.validateAvailability(
          data.productId, 
          data.locationId, 
          data.quantity, 
          data.tenantId
        );

        if (!isAvailable) {
          throw new Error(`Negative Stock Prevention: Requested ${data.quantity} bags but insufficient inventory in block.`);
        }

        // 2. Create the Dispatch Record
        const shipmentRef = await dbService.add('outgoing_shipments', {
          ...data,
          createdAt: new Date(),
          status: 'COMPLETED',
        });

        // 3. Atomically Decrement Stock
        await stockService.adjustStock(data.productId, -data.quantity, data.locationId, data.tenantId);

        // 4. Update Location Occupancy
        const locationRef = await dbService.get('locations', data.locationId);
        if (locationRef) {
          const newOccupied = (locationRef.occupied || 0) - data.quantity;
          const utilization = (newOccupied / (locationRef.capacity || 1000)) * 100;
          let newStatus = 'PARTIAL';
          if (utilization >= 100) newStatus = 'FULL';
          if (utilization <= 0) newStatus = 'EMPTY';

          await dbService.update('locations', data.locationId, {
            occupied: Math.max(0, newOccupied),
            utilization: Math.max(0, utilization),
            status: newStatus,
            lastRecalculated: new Date()
          });
        }

        // 5. Emit System Event
        await eventBus.emit({
          type: 'SHIPMENT_CREATED',
          payload: { shipmentId: shipmentRef.id, type: 'OUTGOING', tenantId: data.tenantId }
        });

        return shipmentRef;
      });
    } catch (error: any) {
      toast.error(`Dispatch Logic Violation: ${error.message}`);
      throw error;
    }
  }
};
