import { Injectable, OnModuleInit } from '@nestjs/common';
import * as client from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  constructor() {}

  readonly successfulLogins = new client.Counter({
    name: 'elixir_successful_logins_total',
    help: 'Total successful logins',
  });

  readonly failedLogins = new client.Counter({
    name: 'elixir_failed_logins_total',
    help: 'Total failed logins',
  });

  readonly usersRegistered = new client.Counter({
    name: 'elixir_users_registered_total',
    help: 'Total registered users',
  });

  readonly ordersCreated = new client.Counter({
    name: 'elixir_orders_created_total',
    help: 'Total orders created',
  });

  readonly completedOrders = new client.Counter({
    name: 'elixir_completed_orders_total',
    help: 'Total completed orders',
  });

  readonly invoicesDownloaded = new client.Counter({
    name: 'elixir_invoice_downloads_total',
    help: 'Total invoice downloads',
  });

  readonly successfulPayments = new client.Counter({
    name: 'elixir_successful_payments_total',
    help: 'Total successful payments',
  });

  readonly failedPayments = new client.Counter({
    name: 'elixir_failed_payments_total',
    help: 'Total failed payments',
  });

  readonly httpRequestDuration = new client.Histogram({
    name: 'elixir_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'operation', 'statusCode'],
    buckets: [
      0.005, // 5ms
      0.01, 
      0.025, // 25ms
      0.05, // 50ms
      0.1, 
      0.25, // 250ms
      0.5, // 500ms
      1, // 1 second
      2, // 2 seconds
      5
    ],
  });
  
  onModuleInit() {
    client.collectDefaultMetrics({
      prefix: 'elixir_',
    });
  }

  async getMetrics(): Promise<string> {
    return await client.register.metrics();
  }

  incrementSuccessfulLogin() {
    this.successfulLogins.inc();
  }

  incrementFailedLogin() {
    this.failedLogins.inc();
  }

  incrementUserRegistration() {
    this.usersRegistered.inc();
  }

  incrementOrderCreated() {
    this.ordersCreated.inc();
  }

  incrementCompletedOrder() {
    this.completedOrders.inc();
  }

  incrementInvoiceDownload() {
    this.invoicesDownloaded.inc();
  }

  incrementSuccessfulPayment() {
    this.successfulPayments.inc();
  }

  incrementFailedPayment() {
    this.failedPayments.inc();
  }

  observeHttpRequest (method: string, route: string, operation = '' ,statusCode: number, duration: number) {
    this.httpRequestDuration.labels(method, route, operation, statusCode.toString()).observe(duration)
  }
}
