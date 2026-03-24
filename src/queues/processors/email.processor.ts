// queues/processors/email.processor.ts
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { QUEUES, JOB_NAMES } from '../Dtos/queues.constants';
import { EmailsService } from 'src/emails/emails.service';

@Processor(QUEUES.EMAIL)
@Injectable()
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private emailService: EmailsService) {
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
    
    try {
      await this.emailService.sendOrderSuccess(to,subject,template,data)
      this.logger.log(`Email sent to ${to}`)
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
    
    return {
      success: true,
      to,
      subject,
      sentAt: new Date().toISOString(),
    };
  }
}