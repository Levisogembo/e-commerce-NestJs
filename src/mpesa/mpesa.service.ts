import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios'
import { getMpesaConfig, getMpesaEndpoints } from './constants/mpesaEndpoints';
import * as crypto from 'crypto-js';
import { firstValueFrom } from 'rxjs';
import { MpesaCallback, PaymentDetails, StkPushResponse, TokenResponse } from './interfaces/mpesaResponse.interface';

@Injectable()
export class MpesaService {
    private readonly logger = new Logger(MpesaService.name)
    private accessToken: string
    private tokenExpiry: Date

    constructor(private configService: ConfigService, private httpService: HttpService) {
        this.logger.log(`Mpesa service initialized`)
    }

    //get auth token
    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
            this.logger.debug('Using cached access token')
            return this.accessToken;
        }
        this.logger.log('Requesting new access token from Safaricom...')
        const consumerKey = this.configService.get<string>('MPESA_CONSUMER_KEY')
        const consumerSecret = this.configService.get<string>('MPESA_CONSUMER_SECRET')
        if (!consumerKey || !consumerSecret) {
            throw new BadRequestException('M-Pesa credentials not configured')
        }

        const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')
        const environment = this.configService.get<string>('MPESA_ENVIRONMENT', 'sandbox')
        const endpoints = getMpesaEndpoints(environment as 'sandbox' | 'production')
        try {
            const response = await firstValueFrom(
                this.httpService.get<TokenResponse>(endpoints.AUTH, {
                    headers: {
                        Authorization: `Basic ${auth}`
                    }
                })
            )
            this.accessToken = response.data.access_token
            this.tokenExpiry = new Date(Date.now() + 3500 * 1000)
            this.logger.log('Access token obtained successfully')
            return this.accessToken
        } catch (error) {
            this.logger.error('Failed to get access token:', error.response?.data || error.message);
            throw new BadRequestException('M-Pesa authentication failed');
        }
    }

    //generate stk push password
    private generatePassword = (shortCode: string, passkey: string, timeStamp: string): string => {
        const str = shortCode + passkey + timeStamp
        return crypto.enc.Base64.stringify(crypto.enc.Utf8.parse(str))
    }

    private getTimestamp(): string {
        const now = new Date()
        const year = now.getFullYear()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const day = String(now.getDate()).padStart(2, '0')
        const hour = String(now.getHours()).padStart(2, '0')
        const minute = String(now.getMinutes()).padStart(2, '0')
        const second = String(now.getSeconds()).padStart(2, '0')

        return `${year}${month}${day}${hour}${minute}${second}`;
    }

    //initiate payment to customer's mpesa phone
    async initiateStkPush(phoneNumber: string, amount: number, orderId: string): Promise<StkPushResponse> {
        this.logger.log(`Initiating STK Push for order ${orderId} to ${phoneNumber}`)
        try {
            const token = await this.getAccessToken()
            const config = getMpesaConfig(this.configService)
            const environment = this.configService.get('MPESA_ENVIRONMENT', 'sandbox')
            const endpoints = getMpesaEndpoints(environment as 'sandbox' | 'production')
            const timeStamp = this.getTimestamp()
            const password = this.generatePassword(config.businessShortcode, config.passkey, timeStamp)

            //format phone number to ensure it has kenyan format
            const formatedPhone = phoneNumber.startsWith('0')
                ? `254${phoneNumber.slice(1)}`
                : phoneNumber.startsWith('254')
                    ? phoneNumber
                    : `254${phoneNumber}`

            const payload = {
                BusinessShortCode: config.businessShortcode,
                Password: password,
                Timestamp: timeStamp,
                TransactionType: config.transactionType,
                Amount: Math.round(amount),
                PartyA: formatedPhone,
                PartyB: config.businessShortcode,
                PhoneNumber: formatedPhone,
                CallBackURL: config.callbackUrl,
                AccountReference: `${config.accountReference}-${orderId.slice(0, 8)}`,
                TransactionDesc: `${config.transactionDesc} - ${orderId.slice(0, 8)}`
            }
            this.logger.debug('STK Push payload:', payload)
            const response = await firstValueFrom(
                this.httpService.post<StkPushResponse>(endpoints.STK_PUSH, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": 'application/json'
                    }
                })

            )
            //this.logger.log(`STK Push initiated. CheckoutRequestID: ${response.data.CheckoutRequestID})
            return response.data
        } catch (error) {
            this.logger.error(`Failed to initiate STK push`, error.response?.data || error.message)
            throw new BadRequestException(error.response?.data?.errorMessage, 'Failed to initiate push request')
        }
    }

    //query payment status incase callback delays 
    async queryStkStatus(checkoutRequestId: string) {
        this.logger.log(`Querying stk status for ${checkoutRequestId}`)
        try {
            const token = await this.getAccessToken()
            const config = getMpesaConfig(this.configService);
            const environment = this.configService.get('MPESA_ENVIRONMENT', 'sandbox')
            const endpoints = getMpesaEndpoints(environment as 'sandbox' | 'production')
            const timestamp = this.getTimestamp();
            const password = this.generatePassword(
                config.businessShortcode,
                config.passkey,
                timestamp,
            )
            const payload = {
                BusinessShortCode: config.businessShortcode,
                Password: password,
                Timestamp: timestamp,
                CheckoutRequestID: checkoutRequestId,
            }
            const response = await firstValueFrom(
                this.httpService.post(endpoints.STK_QUERY, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            )
            return response.data
        } catch (error) {
            this.logger.error('STK query failed:', error.response?.data || error.message);
            throw new BadRequestException('Failed to query payment status');
        }
    }

    //process callback when payment succeeds or fails
    async processCallBack(callBackData: MpesaCallback) {
        this.logger.log(`Processing payment details`)

        const stkCallBack = callBackData.Body.stkCallback
        const { ResultCode, ResultDesc, CheckoutRequestID, MerchantRequestID } = stkCallBack
        this.logger.log(`ResultCode: ${ResultCode}, ResultDesc: ${ResultDesc}`)
        //handle successful payments
        if (ResultCode === 0) {
            this.logger.log(`Successful payment`)
            const metadata = stkCallBack.CallbackMetadata?.Item || []

            const paymentDetails: PaymentDetails = {
                amount: 0,
                mpesaReceiptNumber: '',
                transactionDate: '',
                phoneNumber: ''
            }

            metadata.forEach((item) => {
                switch (item.Name) {
                    case 'Amount':
                        paymentDetails.amount = Number(item.Value);
                        break;
                    case 'MpesaReceiptNumber':
                        paymentDetails.mpesaReceiptNumber = String(item.Value);
                        break;
                    case 'TransactionDate':
                        paymentDetails.transactionDate = String(item.Value);
                        break;
                    case 'PhoneNumber':
                        paymentDetails.phoneNumber = String(item.Value);
                        break;
                }
            })
            this.logger.log(`Payment details - Receipt: ${paymentDetails.mpesaReceiptNumber}, Amount: ${paymentDetails.amount}`)
            return paymentDetails
        } else {
            //failed payments
            this.logger.warn(`Payment failed`)
            return null
        }
    }

    async processReversal(originalTransactionId: string, amount: number, orderId: string, reason: string) {
        this.logger.log(`Processing reversal request for order: ${orderId}`)

        try {
            const token = await this.getAccessToken()
            const config = getMpesaConfig(this.configService);
            const environment = this.configService.get('MPESA_ENVIRONMENT', 'sandbox');
            const endpoints = getMpesaEndpoints(environment as 'sandbox' | 'production');

            const timestamp = this.getTimestamp();
            const password = this.generatePassword(
                config.businessShortcode,
                config.passkey,
                timestamp,
            )

            const payload = {
                CommandID: 'TransactionReversal',
                Amount: Math.round(amount),
                ReceiverParty: config.businessShortcode,
                RecieverIdentifierType: '11',  // 11 = Paybill/Till number
                TransactionID: originalTransactionId,
                Occasion: reason.slice(0, 100),  // Reason (max 100 chars)
                Remarks: `Refund for order ${orderId}`,
                Initiator: 'api',
                SecurityCredential: password,
                QueueTimeOutURL: `${config.callbackUrl}/timeout`,
                ResultURL: `${config.callbackUrl}/result`,
            };
            this.logger.debug('Reversal payload:', payload)
            const response = await firstValueFrom(
                this.httpService.post(endpoints.REVERSAL, payload, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                }),
            )
            this.logger.log(`Reversal initiated`)
            return response.data
        } catch (error) {
            this.logger.error('Reversal failed:', error.response?.data || error.message);
            throw new BadRequestException('Failed to process refund')
        }
    }

}
