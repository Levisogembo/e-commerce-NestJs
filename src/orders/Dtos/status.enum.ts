import { registerEnumType } from "@nestjs/graphql";

export enum orderStatus {
    PENDING = 'PENDING',          
    PROCESSING = 'PROCESSING',     
    COMPLETED = 'COMPLETED',       
    PAYMENT_FAILED = 'PAYMENT_FAILED', 
    CANCELLED = 'CANCELLED',       
    EXPIRED = 'EXPIRED',           
    REFUNDED = 'REFUNDED'
}

registerEnumType(orderStatus, { name: 'status' })