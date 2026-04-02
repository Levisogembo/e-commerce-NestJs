import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Orders } from 'src/typeorm/entities/Order';
import { Repository } from 'typeorm';
import { Product } from 'src/typeorm/entities/Product';
import { User } from 'src/typeorm/entities/User';
import { orderItems } from 'src/typeorm/entities/orderItems';
import { QueuesService } from 'src/queues/queues.service';
import { Payments } from 'src/typeorm/entities/Payments';
import { orderStatus } from './Dtos/status.enum';
import { MpesaService } from 'src/mpesa/mpesa.service';
import { refundOrderInput } from './Dtos/returnOrder.input';

@Injectable()
export class OrdersRetryService {
    private logger = new Logger(OrdersRetryService.name)
    constructor(@InjectRepository(Orders) private orderRepository: Repository<Orders>,
        @InjectRepository(Product) private productRepository: Repository<Product>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(orderItems) private orderItemsRepository: Repository<orderItems>,
        @InjectRepository(Payments) private paymentsRepository: Repository<Payments>,
        private queueService: QueuesService, private mpesaService: MpesaService) { }

    async retryPayment(orderId: string, phoneNumber?: string) {
        this.logger.log(`retrying payment for order ${orderId}`)

        const foundOrder = await this.orderRepository.findOne({
            where: { orderId },
            relations: ['orderItems', 'orderItems.Product', 'user', 'user.address']
        })
        if (!foundOrder) throw new NotFoundException('Order not found')
        if (foundOrder.status !== orderStatus.PAYMENT_FAILED) {
            throw new BadRequestException('Only orders with payment failed status can be retried')
        }
        //confirm if inventory is still available
        this.logger.log(`Checking inventory availability`)
        for (const item of foundOrder.orderItems) {
            const product = await this.productRepository.findOne({
                where: { productId: item.Product.productId },
            })
            if (!product) throw new NotFoundException('product does not exist anymore')
            const availableInventory = product.quantity - product.reservedQuantity
            if (availableInventory < item.quantity) {
                throw new BadRequestException(`Insufficient inventory for ${product.name}, Available: ${availableInventory}, Required: ${item.quantity}`)
            }
            this.logger.log(`${product.name} still available`)
            this.logger.log(`Reserving inventory for ${orderId}`)
            //reserve inventory
            await this.orderRepository.manager.transaction(async (transactionManager) => {
                for (const item of foundOrder.orderItems) {
                    await transactionManager
                        .createQueryBuilder()
                        .update(Product)
                        .set({
                            reservedQuantity: () => `reservedQuantity + ${item.quantity}`,
                        })
                        .where('productId = :productId', { productId: item.Product.productId })
                        .execute();
                }
            })

            const customerPhone = phoneNumber || foundOrder.user.address?.phoneNumber
            if (!customerPhone) throw new BadRequestException('Phone number required for M-Pesa payment')

            //initiating stk push
            try {
                const mpesaPayment = await this.mpesaService.initiateStkPush(customerPhone, foundOrder.total, orderId)
                this.logger.log(`stk push for order ${orderId} initiated`)

                await this.orderRepository.update(orderId, {
                    mpesaCheckoutRequestId: mpesaPayment.CheckoutRequestID,
                    status: orderStatus.PENDING_PAYMENT
                })
                this.logger.log(`Order ${orderId} updated for payment entry`)
                return {
                    success: true,
                    message: 'Payment retry initiated. Check your phone for M-Pesa prompt.',
                    checkoutRequestId: mpesaPayment.CheckoutRequestID,
                }
            } catch (error) {
                this.logger.error(`Payment retry failed`)

                //release committed inventory
                await this.orderRepository.manager.transaction(async (transactionManager) => {
                    for (const item of foundOrder.orderItems) {
                        await transactionManager
                            .createQueryBuilder()
                            .update(Product)
                            .set({
                                reservedQuantity: () => `reservedQuantity - ${item.quantity}`,
                            })
                            .where('productId = :productId', { productId: item.Product.productId })
                            .execute();
                    }
                });

                throw new BadRequestException(`Payment retry failed: ${error.message}`)
            }
        }
    }

    async processReversal(orderId: string, refundData: refundOrderInput) {
        this.logger.log(`processing mpesa reversal`)
        const foundOrder = await this.orderRepository.findOne({
            where: { orderId },
            relations: ['orderItems', 'orderItems.Product', 'user', 'payments']
        })
        if (!foundOrder) throw new NotFoundException('Order not found')
        const refundableStatuses = ['COMPLETED', 'SHIPPED', 'DELIVERED']
        if (!refundableStatuses.includes(foundOrder.status)) {
            throw new BadRequestException('only completed, shipped or delivered orders can be refunded')
        }
        if (foundOrder.isRefunded) throw new BadRequestException('Order already refunded')

        const refundAmount = refundData.amount || foundOrder.total
        if (refundAmount > foundOrder.total) throw new ConflictException('Refund amount cannot be higher than original amount')

        const originalPayment = foundOrder.payments.find((pay) => pay.transactionId)
        if (!originalPayment) throw new BadRequestException('No transaction id found')

        //initiate mpesa reversal
        let reversalResult: any = null
        try {
            reversalResult = await this.mpesaService.processReversal(originalPayment.transactionId, refundAmount, orderId, refundData.reason)
            this.logger.log(`Mpesa reversal initiated for order ${orderId}`)
        } catch (error) {
            this.logger.error(`M-Pesa reversal failed: ${error.message}`);
            throw new BadRequestException(`Refund failed: ${error.message}`)
        }

        let refundRecord: any = null
        await this.orderRepository.manager.transaction(async (transactionManager) => {
            this.logger.log(`Returning inventory to stock`)
            const releasedOrderItems = await transactionManager.find(orderItems, { where: { Order: { orderId } } })
            for (const item of releasedOrderItems) {
                this.logger.log(`   Returning product ${item.Product.productId}: ${item.quantity} units`);

                await transactionManager
                    .createQueryBuilder()
                    .update(Product)
                    .set({
                        quantity: () => `quantity + ${item.quantity}`,
                        soldQuantity: () => `soldQuantity - ${item.quantity}`,
                    })
                    .where('productId = :productId', { productId: item.Product.productId })
                    .execute();
            }
            await transactionManager.update(Orders,orderId,{
                status: orderStatus.REFUNDED,
                isRefunded: true,
                refundedAt: new Date(),
                refundReason: refundData.reason,
                refundTransactionId: reversalResult?.ConversationID || null
            })
            this.logger.log(`order refunded successfully`)
        })

        //send reversal confirmation via mail
        await this.queueService.addEmailJobData({
            to: foundOrder.user.email,
            subject: `Refund Processed for Order ${orderId.slice(0, 8)}`,
            template: 'refund-confirmation',
            data: {
                orderId,
                name: foundOrder.user.firstName,
                refundAmount,
                reason: refundData.reason,
                refundedAt: new Date().toISOString()
            }
        })

        this.logger.log(`Refund complete for order: ${orderId}`)
        return {
            success: true,
            message: 'Refund was successful'
        }
    }

}
