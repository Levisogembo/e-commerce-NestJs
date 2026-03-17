import { registerEnumType } from "@nestjs/graphql";

export enum orderStatus {
    Pending = 'PENDING',
    Processing = 'PROCESSING',
    Completed = 'COMPLETED',
    Failed = 'FAILED'
}

registerEnumType(orderStatus,{name:'status'})