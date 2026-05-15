type ERPEvent = 
  | { type: 'SHIPMENT_CREATED'; payload: { shipmentId: string; type: 'INCOMING' | 'OUTGOING'; tenantId: string } }
  | { type: 'STOCK_UPDATED'; payload: { productId: string; delta: number; tenantId: string } }
  | { type: 'PAYMENT_RECEIVED'; payload: { invoiceId: string; amount: number; tenantId: string } }
  | { type: 'OCCUPANCY_CHANGED'; payload: { locationId: string; tenantId: string } };

type Handler = (event: ERPEvent) => Promise<void>;

/**
 * Internal Event-Driven Architecture Bus
 * Decouples core actions from side effects like analytics and logging.
 */
class ERPEventBus {
  private handlers: Set<Handler> = new Set();

  subscribe(handler: Handler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  async emit(event: ERPEvent) {
    console.log(`[ERP_EVENT]: ${event.type}`, event.payload);
    
    // Execute all handlers in parallel
    const promises = Array.from(this.handlers).map(handler => 
      handler(event).catch(err => console.error(`[ERP_EVENT_ERROR] in ${event.type}:`, err))
    );
    
    await Promise.all(promises);
  }
}

export const eventBus = new ERPEventBus();
