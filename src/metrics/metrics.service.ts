import { Injectable, OnModuleInit } from "@nestjs/common";
import * as client from 'prom-client'

@Injectable()
export class MetricsService implements OnModuleInit {
    constructor () {}

    onModuleInit () {
        client.collectDefaultMetrics({
            prefix: 'elixir_'
        })
    }

    async getMetrics (): Promise<string> {
        return await client.register.metrics()
    }
}