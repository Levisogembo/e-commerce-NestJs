
export interface orderJobData {
    orderId: string
    userId: string
    total: number
    item: Array<{
        productId: string
        quantity: number
        price: number
        name?: string
    }>
    paymentMethod: string
    billingAddress: any
}