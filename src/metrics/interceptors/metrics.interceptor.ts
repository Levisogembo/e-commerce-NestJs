import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Request, Response } from 'express';
import { MetricsService } from '../metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    let method = 'UNKNOWN';
    let route = 'UNKNOWN';
    let operation = '';
    let response: any;

    if (context.getType<'http'>() === 'http') {
      const request = context.switchToHttp().getRequest();
      response = context.switchToHttp().getResponse();

      method = request?.method ?? 'UNKNOWN';

      if (request?.route?.path) {
        route = `${request.baseUrl}${request.route.path}`;
      } else {
        route = request?.originalUrl ?? 'UNKNOWN';
      }
    } else if (context.getType<'graphql'>() === 'graphql') {
      const gqlContext = GqlExecutionContext.create(context);

      const ctx = gqlContext.getContext();

      const request = ctx?.req;
      response = ctx?.res;

      method = request?.method ?? 'POST';

      route = '/graphql';

      operation = request?.body?.operationName; //get operation name from apollo

      if (!operation) {
        operation = gqlContext.getInfo()?.fieldName;
      }

      if (!operation && request?.body?.query) {
        const match = request.body.query.match(
          /(query|mutation|subscription)\s+(\w+)/,
        );

        operation = match?.[2] ?? 'AnonymousOperation';
      }

      operation ??= 'AnonymousOperation';
    }

    const start = process.hrtime();

    return next.handle().pipe(
      finalize(() => {
        try {
          const [seconds, nanoseconds] = process.hrtime(start);

          const duration = seconds + nanoseconds / 1e9;

          const statusCode = response?.statusCode ?? 500;

          this.metricsService.observeHttpRequest(
            method,
            route,
            operation,
            statusCode,
            duration,
          );
        } catch (error) {
          // Metrics collection should never break the application.
          console.error('Failed to record Prometheus metrics', error);
        }
      }),
    );
  }
}
