
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
    phoneNumber?: string
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

export interface welcomeEmailJobData {
    to: string
    firstName: string
}

export interface verificationEmailJobData {
    to: string
    verificationUrl: string
    firstName: string
}

export interface inventoryJobData {
    orderId: string
    items: Array<{
        productId: string
        quantity: number
    }>
    action: 'reserver' | 'commit' | 'release'
}