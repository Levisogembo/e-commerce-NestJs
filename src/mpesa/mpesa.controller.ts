import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';

class CallbackMetadataItem {
    Name: string;
    Value: string | number;
}

class StkCallback {
    MerchantRequestID: string;
    CheckoutRequestID: string;
    ResultCode: number;
    ResultDesc: string;
    CallbackMetadata?: {
        Item: CallbackMetadataItem[];
    };
}

class CallbackBody {
    stkCallback: StkCallback;
}

class MpesaCallbackDto {
    Body: CallbackBody;
}

@Controller('mpesa')
export class MpesaController {
    private readonly logger = new Logger(MpesaController.name)
    @Post('callback')
    async handleCallBack(@Body() callBackData: MpesaCallbackDto) {
        this.logger.log('Mpesa callback received')
        try {
            const stkCallback = callBackData.Body.stkCallback
            const checkoutRequestId = stkCallback.CheckoutRequestID;
            const resultCode = stkCallback.ResultCode;
            const resultDesc = stkCallback.ResultDesc;
            const merchantRequestId = stkCallback.MerchantRequestID

            //successful payments
            if (resultCode === 0) {
                const metadata = stkCallback.CallbackMetadata?.Item || []
                metadata.forEach(item => {
                    this.logger.log(`   ${item.Name}: ${item.Value}`);
                });
            } else {
                this.logger.log(`Payment failed `)
            }
            return {
                ResultCode: 0,
                ResultDesc: 'Callback received successfully',
            }
        } catch (error) {
            this.logger.error(`Error processing callback: ${error.message}`);
            this.logger.error(error.stack);

            // Even on error, return success to Safaricom
            return {
                ResultCode: 0,
                ResultDesc: 'Callback received',
            };
        }
    }

    @Post('test')
    @HttpCode(HttpStatus.OK)
    async testConnection() {
        this.logger.log(`Testing mpesa connection`)
        return {
            success: true,
            message: 'M-Pesa controller is working',
            timestamp: new Date().toISOString(),
        }
    }
}
