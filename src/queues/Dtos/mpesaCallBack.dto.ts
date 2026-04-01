
export class handleMpesaCallbackDto {
    checkoutRequestId: string
    resultCode: number
    resultDesc: string
    metadata?: Array<{ Name: string; Value: string | number }>
}