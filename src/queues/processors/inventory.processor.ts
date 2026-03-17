// queues/processors/inventory.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { QUEUES } from '../Dtos/queues.constants';

@Processor(QUEUES.INVENTORY)
@Injectable()
export class InventoryProcessor extends WorkerHost {
  private readonly logger = new Logger(InventoryProcessor.name);

  constructor() {
    super();
  }

  async process(job: Job<any>) {
    this.logger.log(`Processing inventory job ${job.id}: ${job.name}`);
    
    try {
      const { orderId, items, action } = job.data;
      
      this.logger.log(`${action} inventory for order ${orderId} (${items.length} items)`);
      
      // Simulate inventory update
      for (const item of items) {
        this.logger.log(`- ${action} product ${item.productId}: ${item.quantity} units`);
        // Add actual inventory update logic here
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.logger.log(`Inventory ${action} completed for order ${orderId}`);
      
      return {
        success: true,
        orderId,
        action,
        itemsProcessed: items.length,
        timestamp: new Date().toISOString(),
      };
      
    } catch (error) {
      this.logger.error(`Inventory job failed: ${error.message}`);
      throw error;
    }
  }
}