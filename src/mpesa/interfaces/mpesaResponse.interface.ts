
export interface StkPushResponse {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResponseCode: string;
    ResponseDescription: string;
    CustomerMessage: string;
}

export interface StkQueryResponse {
    ResponseCode: string;
    ResponseDescription: string;
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResultCode: number;
    ResultDesc: string;
    CallbackMetadata?: {
        Item: Array<{
            Name: string;
            Value: string | number;
        }>;
    };
}


export interface MpesaCallback {
    Body: {
        stkCallback: {
            MerchantRequestID: string;
            CheckoutRequestID: string;
            ResultCode: number;
            ResultDesc: string;
            CallbackMetadata?: {
                Item: Array<{
                    Name: string;
                    Value: string | number;
                }>;
            };
        };
    };
}

/**
 * Extracted payment details from callback metadata
 */
export interface PaymentDetails {
    amount: number;
    mpesaReceiptNumber: string;
    transactionDate: string;
    phoneNumber: string;
}

/**
 * Token response from Safaricom
 */
export interface TokenResponse {
    access_token: string;
    expires_in: string;
}