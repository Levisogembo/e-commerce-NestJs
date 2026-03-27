import { ConfigService } from '@nestjs/config';

export const MPESA_ENDPOINTS = {
    // Authentication endpoint
    AUTH: 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',

    // STK Push (Lipa Na M-Pesa Online)
    STK_PUSH: 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',

    // Query STK Push status
    STK_QUERY: 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',

    // Balance inquiry (for later use)
    BALANCE: 'https://sandbox.safaricom.co.ke/mpesa/accountbalance/v1/query',

    // Reversal (for refunds)
    REVERSAL: 'https://sandbox.safaricom.co.ke/mpesa/reversal/v1/request',
};

/**
 * Production endpoints 
 */
export const MPESA_PRODUCTION_ENDPOINTS = {
    AUTH: 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    STK_PUSH: 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    STK_QUERY: 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query',
    BALANCE: 'https://api.safaricom.co.ke/mpesa/accountbalance/v1/query',
    REVERSAL: 'https://api.safaricom.co.ke/mpesa/reversal/v1/request',
};


export const getMpesaConfig = (configService: ConfigService) => ({
    businessShortcode: configService.get<string>('MPESA_BUSINESS_SHORTCODE',"17467"),
    passkey: configService.get<string>('MPESA_PASSKEY',"abcekkkd"),
    callbackUrl: configService.get<string>('MPESA_CALLBACK_URL'),
    environment: configService.get<string>('MPESA_ENVIRONMENT', 'sandbox'),

    accountReference: 'EcommerceStore',
    transactionDesc: 'Payment for order',
    transactionType: 'CustomerPayBillOnline',

    // Test phone number for sandbox
    testPhoneNumber: '254708374149',
});


export const getMpesaEndpoints = (environment: 'sandbox' | 'production' = 'sandbox') => {
    if (environment === 'production') {
        return MPESA_PRODUCTION_ENDPOINTS;
    }
    return MPESA_ENDPOINTS;
};