
export interface orderJobData {
    orderId: string
    userId: string
    total: number
    items: Array<{
        productId: string
        quantity: number
        price: number
        name?: string
    }>
    paymentMethod: string
    billingAddress: any
}

export interface paymentJobData {
    orderId: string
    userId: string
    amount: number
    paymentMethod: string
    paymentDetails?: Record<string,any>
}

export interface emailJobData {
    to: string
    subject: string
    template: string
    data: Record<string,any>
}

export interface inventoryJobData {
    orderId: string
    items: Array<{
        productId: string
        quantity: number
    }>
    action: 'reserver' | 'commit' | 'release'
}