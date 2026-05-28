import { Body, Controller, Get, HttpCode, HttpStatus, Logger, Param, Post } from '@nestjs/common';
import { OrdersService } from 'src/orders/orders.service';

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
    constructor(private readonly ordersService: OrdersService) { }

    @Post('callback')
    async handleCallBack(@Body() callBackData: MpesaCallbackDto) {
        this.logger.log('Mpesa callback received')
        try {
            const stkCallback = callBackData.Body.stkCallback
            const checkoutRequestId = stkCallback.CheckoutRequestID;
            const resultCode = stkCallback.ResultCode;
            const resultDesc = stkCallback.ResultDesc;
            const merchantRequestId = stkCallback.MerchantRequestID

            //extract possible metadata
            let metadata: any = null
            if (stkCallback.CallbackMetadata) {
                metadata = stkCallback.CallbackMetadata.Item
            }

            const result = await this.ordersService.handleMpesaCallback({ checkoutRequestId, resultCode, resultDesc, metadata })
            this.logger.log(`Callback processed: ${result.message}`)

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

    @Get('status/:orderId')
    async getPaymentStatus(@Param('orderId') orderId: string) {
        return await this.ordersService.getPaymentStatus(orderId)
    }

    @Post('result')
    @HttpCode(HttpStatus.OK)
    async reversalResult(@Body() callbackData: any) {
        this.logger.log('Reversal result received');
        this.logger.debug(JSON.stringify(callbackData, null, 2));

        const { ResultCode, ResultDesc, ConversationID, TransactionID } = callbackData;

        if (ResultCode === 0) {
            this.logger.log(`Reversal successful for ConversationID: ${ConversationID}`);

        } else {
            this.logger.error(`Reversal failed: ${ResultDesc} (Code: ${ResultCode})`);
        }

      
        return { ResultCode: 0, ResultDesc: 'Success' };
    }

   
    @Post('timeout')
    @HttpCode(HttpStatus.OK)
    async reversalTimeout(@Body() timeoutData: any) {
        this.logger.warn('Reversal timeout received');
        this.logger.debug(JSON.stringify(timeoutData, null, 2));
        return { ResultCode: 0, ResultDesc: 'Timeout acknowledged' };
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
