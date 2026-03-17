// queues/processors/email.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { QUEUES, JOB_NAMES } from '../Dtos/queues.constants';

@Processor(QUEUES.EMAIL)
@Injectable()
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor() {
    super();
  }

  async process(job: Job<any>): Promise<any> {
    this.logger.log(`Processing email job ${job.id}`);
    
    try {
      switch (job.name) {
        case JOB_NAMES.SEND_CONFIRMATION_EMAIL:
          return await this.sendConfirmationEmail(job);
        
        default:
          this.logger.warn(`Unknown email job type: ${job.name}`);
          return { success: false, message: 'Unknown job type' };
      }
    } catch (error) {
      this.logger.error(`Email job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }

  private async sendConfirmationEmail(job: Job) {
    const { to, subject, template, data } = job.data;
    
    this.logger.log(`Sending email to ${to}: ${subject}`);
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 500));
    
    this.logger.log(`Email sent to ${to}`);
    
    return {
      success: true,
      to,
      subject,
      sentAt: new Date().toISOString(),
    };
  }
}