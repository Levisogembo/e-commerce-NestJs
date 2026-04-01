import { Body, Controller, HttpCode, HttpStatus, Logger, Post } from '@nestjs/common';
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
    constructor (private readonly ordersService: OrdersService){}

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
            if(stkCallback.CallbackMetadata) {
                metadata = stkCallback.CallbackMetadata.Item
            }
            
            const result = await this.ordersService.handleMpesaCallback({checkoutRequestId, resultCode, resultDesc, metadata})
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
