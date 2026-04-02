import { registerEnumType } from "@nestjs/graphql";

export enum orderStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    PAYMENT_FAILED = 'PAYMENT_FAILED',
    CANCELLED = 'CANCELLED',
    EXPIRED = 'EXPIRED',
    REFUNDED = 'REFUNDED',
    PENDING_PAYMENT = 'PENDING_PAYMENT',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
}

registerEnumType(orderStatus, { name: 'status' })