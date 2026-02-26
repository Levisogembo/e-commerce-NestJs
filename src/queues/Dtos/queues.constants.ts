
export const QUEUES = {
    ORDER: 'order-queue',
    EMAIL: 'email-queue',
    INVENTORY: 'inventory-queue',
    PAYMENT: 'payment-queue',
} as const;

export const JOB_NAMES = {
    PROCESS_ORDER: 'process-order',
    SEND_CONFIRMATION_EMAIL: 'send-confirmation-email',
    UPDATE_INVENTORY: 'update-inventory',
    PROCESS_PAYMENT: 'process-payment',
    RELEASE_EXPIRED_RESERVATIONS: 'release-expired-reservations',
} as const;

export type QueueName = typeof QUEUES[keyof typeof QUEUES];
export type JobName = typeof JOB_NAMES[keyof typeof JOB_NAMES];