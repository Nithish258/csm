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
    inwardDate: string;
    inBillNumber: string;
    clientId: string;
    clientName: string;
    farmerId: string;
    farmerName: string;
    commodityId: string;
    commodityName: string;
    varietyId: string;
    varietyName: string;
    locationId: string;
    chamber: string;
    floor: string;
    block: string;
    mark: string;
    quantity: number;
    weight: number;
    vehicleNumber: string;
    driverNumber: string;
    notes: string;
    tenantId: string;
  }) {
    try {
      let shipmentRef: any = null;
      await dbService.executeTransaction(async (transaction) => {
        // 1. Create the Shipment Record with remainingBags tracker
        shipmentRef = await dbService.add('incoming_shipments', {
          ...data,
          remainingBags: data.quantity,
          createdAt: new Date(),
          status: 'IN_STORAGE',
        });

        // 2. Atomically Increment Stock
        await stockService.adjustStock(data.commodityId, data.varietyId, data.quantity, data.locationId, data.tenantId);

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
      });
      return shipmentRef;
    } catch (error: any) {
      toast.error(`Shipment Critical Failure: ${error.message}`);
      throw error;
    }
  },

  /**
   * Process a Dispatch Authorization
   */
  async createOutward(data: {
    outwardDate: string;
    inwardShipmentId: string;
    clientId: string;
    clientName: string;
    farmerId?: string;
    farmerName?: string;
    commodityId: string;
    commodityName: string;
    varietyId: string;
    varietyName: string;
    locationId: string;
    quantity: number;
    weight: number;
    balanceBags: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
    vehicleNumber: string;
    orderId: string;
    tenantId: string;
  }) {
    try {
      let shipmentRef: any = null;
      await dbService.executeTransaction(async (transaction) => {
        // 1. Validate Stock Availability FIRST
        const isAvailable = await stockService.validateAvailability(
          data.commodityId, 
          data.varietyId,
          data.locationId, 
          data.quantity, 
          data.tenantId
        );

        if (!isAvailable) {
          throw new Error(`Negative Stock Prevention: Requested ${data.quantity} bags but insufficient inventory in block.`);
        }

        // 2. Validate Inward Shipment remaining bags
        const inwardRef = await dbService.get('incoming_shipments', data.inwardShipmentId);
        if (!inwardRef) {
          throw new Error(`Invalid Inward Shipment: Selected shipment not found.`);
        }
        const remaining = inwardRef.remainingBags !== undefined ? inwardRef.remainingBags : inwardRef.quantity;
        if (data.quantity > remaining) {
          throw new Error(`Exceeded Inward Shipment Stock: Only ${remaining} bags remaining in selected inward bill.`);
        }

        // 3. Create the Dispatch Record
        shipmentRef = await dbService.add('outgoing_shipments', {
          ...data,
          createdAt: new Date(),
          status: 'COMPLETED',
        });

        // 4. Update Inward Shipment remaining bags
        const newRemainingBags = remaining - data.quantity;
        await dbService.update('incoming_shipments', data.inwardShipmentId, {
          remainingBags: newRemainingBags,
          status: newRemainingBags === 0 ? 'DISPATCHED' : 'PARTIALLY_DISPATCHED'
        });

        // 5. Atomically Decrement Stock
        await stockService.adjustStock(data.commodityId, data.varietyId, -data.quantity, data.locationId, data.tenantId);

        // 6. Update Location Occupancy
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

        // 7. Emit System Event
        await eventBus.emit({
          type: 'SHIPMENT_CREATED',
          payload: { shipmentId: shipmentRef.id, type: 'OUTGOING', tenantId: data.tenantId }
        });
      });
      return shipmentRef;
    } catch (error: any) {
      toast.error(`Dispatch Logic Violation: ${error.message}`);
      throw error;
    }
  }
};
