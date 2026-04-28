import { BadRequestException, ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Orders } from 'src/typeorm/entities/Order';
import { Repository } from 'typeorm';
import { createOrderInput } from './Dtos/createOrder.input';
import { Product } from 'src/typeorm/entities/Product';
import { User } from 'src/typeorm/entities/User';
import { orderItems } from 'src/typeorm/entities/orderItems';
import { QueuesService } from 'src/queues/queues.service';
import { handleMpesaCallbackDto } from 'src/queues/Dtos/mpesaCallBack.dto';
import { Payments } from 'src/typeorm/entities/Payments';
import { orderStatus } from './Dtos/status.enum';

@Injectable()
export class OrdersService {
    private logger = new Logger(OrdersService.name)
    constructor(@InjectRepository(Orders) private orderRepository: Repository<Orders>,
        @InjectRepository(Product) private productRepository: Repository<Product>,
        @InjectRepository(User) private userRepository: Repository<User>,
        @InjectRepository(orderItems) private orderItemsRepository: Repository<orderItems>,
        private queueService: QueuesService) { }

    async createOrder(userId: string, payload: createOrderInput) {
        const user = await this.userRepository.findOne({ where: { userId } })
        if (!user) throw new NotFoundException('User not found')
        //checking products if they exist
        const productChecks: Array<{
            product: Product;
            requestedQty: number;
            unitPrice: number;
            name: string
        }> = []
        for (const item of payload.items) {
            const product = await this.productRepository.findOne({ where: { productId: item.productId } })
            if (!product) throw new NotFoundException('Product not found')

            //check if quantity is available
            const availableQuantity = product.quantity - product.reservedQuantity
            if (availableQuantity < item.quantity) throw new BadRequestException(`Insufficient inventory for ${product.name}` + ' ' +
                `Available: ${availableQuantity}, Requested: ${item.quantity}`)

            //store valid products
            productChecks.push({
                product,
                requestedQty: item.quantity,
                unitPrice: item.unitPrice,
                name: product.name
            })


        }
        const subtotal = productChecks.reduce(
            (sum, item) => sum + (item.requestedQty * item.unitPrice),
            0
        )
        const total = subtotal

        //create a pending order using transactions
        const savedOrder = await this.orderRepository.manager.transaction(
            async (transactionalEntityManager) => {
                //create order
                const order = await this.orderRepository.create({
                    total,
                    billingAddress: payload.billingAddress,
                    paymentMethod: payload.paymentMethod,
                    user,
                    createdAt: new Date()
                })
                const saved = await transactionalEntityManager.save(order)

                //create order items
                const orderItems: any = []
                for (const item of productChecks) {
                    const newItems = await this.orderItemsRepository.create({
                        quantity: item.requestedQty,
                        unitPrice: item.unitPrice,
                        subTotal: item.requestedQty * item.unitPrice,
                        Order: saved,
                        Product: item.product
                    })
                    orderItems.push(newItems)
                }
                await transactionalEntityManager.save(orderItems)

                //reserve inventory
                for (const item of productChecks) {
                    await transactionalEntityManager.createQueryBuilder().update(Product)
                        .set({
                            reservedQuantity: () => `reservedQuantity + ${item.requestedQty}`
                        })
                        .where('productId = :productId', { productId: item.product.productId }).execute()
                }
                return saved
            }
        )

        //push the saved order to the queue for processing

        try {
            //include the name of the product
            const productValues = payload.items.map((item) => {
                const match = productChecks.find((res) => res.product.productId === item.productId)
                if (!match) throw new NotFoundException('Product name not found')
                return {
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.unitPrice,
                    name: match.name
                }
            })
            //console.log(productValues);

            await this.queueService.addOrderJob({
                orderId: savedOrder.orderId,
                userId,
                total,
                paymentMethod: payload.paymentMethod,
                billingAddress: payload.billingAddress,
                items: productValues,
                phoneNumber: payload.phoneNumber
            })
        } catch (error) {
            console.log(`Failed to queue order: ${error.message}`)
            throw error
        }

        //return response after order is processed in the queue
        const completedOrder = await this.orderRepository.findOne({
            where: { orderId: savedOrder.orderId },
            relations: ['orderItems', 'orderItems.Product'],
        })

        return { ...completedOrder, message: 'Order created successfully and queued for processing' }
    }

    async handleMpesaCallback(data: handleMpesaCallbackDto) {
        this.logger.log(`Processing mpesa callback for requestId: ${data.checkoutRequestId}`)
        const foundOrder = await this.orderRepository.findOne({
            where: { mpesaCheckoutRequestId: data.checkoutRequestId },
            relations: ['user', 'orderItems', 'orderItems.Product']
        })
        if (!foundOrder) throw new NotFoundException('Order could not be found')
        const foundUser = await this.userRepository.findOne({ where: { userId: foundOrder.user.userId } })
        if (!foundUser) throw new NotFoundException('User could not be found')
        //handle successful payments
        if (data.resultCode === 0) {
            let amount = foundOrder.total
            let receiptNumber = ''
            let transactionDate = ''
            let phoneNumber = ''

            if (data.metadata) {
                for (const item of data.metadata) {
                    switch (item.Name) {
                        case 'Amount':
                            amount = Number(item.Value);
                            break;
                        case 'MpesaReceiptNumber':
                            receiptNumber = String(item.Value);
                            break;
                        case 'TransactionDate':
                            transactionDate = String(item.Value);
                            break;
                        case 'PhoneNumber':
                            phoneNumber = String(item.Value);
                            break;
                    }
                }
            }

            await this.orderRepository.manager.transaction(async (transactionManager) => {
                //update inventory to sold
                const soldItems = await transactionManager.find(orderItems, {
                    where: { Order: { orderId: foundOrder.orderId } },
                    relations: ['Product']
                })

                for (const item of soldItems) {
                    await transactionManager
                        .createQueryBuilder()
                        .update(Product)
                        .set({
                            quantity: () => `quantity - ${item.quantity}`,
                            reservedQuantity: () => `reservedQuantity - ${item.quantity}`,
                            soldQuantity: () => `soldQuantity + ${item.quantity}`,
                        })
                        .where('productId = :productId', { productId: item.Product.productId })
                        .execute();
                }

                //create a payment entry
                const payment = await transactionManager.create(Payments, {
                    amount,
                    transactionId: receiptNumber,
                    order: foundOrder,
                    paidAt: new Date(),
                    user: foundUser,
                    mpesaNumber: phoneNumber
                })
                await transactionManager.save(payment)

                //update order status to completed
                await transactionManager.update(Orders, foundOrder.orderId, {
                    status: orderStatus.COMPLETED,
                    transactionId: receiptNumber,
                    paidAt: new Date()
                })
            })

            //send success email to the queue for processing
            await this.queueService.addEmailJobData({
                to: foundUser.email,
                subject: `Order ${foundOrder.orderId} Confirmed!`,
                template: 'orderSuccess',
                data: {
                    orderId: foundOrder.orderId,
                    total: foundOrder.total,
                    items: foundOrder.orderItems.map(item => ({
                        productId: item.Product.productId,
                        quantity: item.quantity,
                        price: item.unitPrice,
                        name: item.Product?.name,
                    })),
                    transactionId: receiptNumber,
                    date: new Date().toISOString()
                }
            })
            this.logger.log(`Email queued to ${foundUser.email}`)
            return {
                success: true,
                orderId: foundOrder.orderId,
                message: 'Payment successful, order completed'
            }
        } else {
            //handle failed payments
            this.logger.warn(`Payment failed for order ${foundOrder.orderId}`)

            await this.orderRepository.manager.transaction(async (transactionManager) => {
                const releasedOrderItems = await transactionManager.find(orderItems, {
                    where: { Order: { orderId: foundOrder.orderId } },
                    relations: ['Product']
                })

                for (const item of releasedOrderItems) {
                    await transactionManager
                        .createQueryBuilder()
                        .update(Product)
                        .set({
                            reservedQuantity: () => `reservedQuantity - ${item.quantity}`,
                        })
                        .where('productId = :productId', { productId: item.Product.productId })
                        .execute();
                }

                await transactionManager.update(Orders, foundOrder.orderId, {
                    status: orderStatus.PAYMENT_FAILED
                })

            })

            //send failed email notification
            await this.queueService.addEmailJobData({
                to: foundUser.email,
                subject: `Payment failed for order ${foundOrder.orderId}!`,
                template: 'orderFailure',
                data: {
                    orderId: foundOrder.orderId,
                    total: foundOrder.total,
                    items: foundOrder.orderItems.map(item => ({
                        productId: item.Product.productId,
                        quantity: item.quantity,
                        price: item.unitPrice,
                        name: item.Product?.name,
                    })),
                    date: new Date().toISOString()
                }
            })

            return {
                success: false,
                orderID: foundOrder.orderId,
                message: 'Payment failed'
            }
        }


        //im

    }

    async cancelOrder(orderId: string, userId: string) {
        this.logger.log(`Canceling order number: ${orderId}`)
        const foundOrder = await this.orderRepository.findOne({ where: { orderId }, relations: ['orderItems', 'orderItems.Product'] })
        if (!foundOrder) throw new NotFoundException('Order not found')

        const cancellableStatuses = ['PENDING', 'PENDING_PAYMENT', 'PROCESSING']
        if (!cancellableStatuses.includes(foundOrder.status)) throw new ConflictException('Only orders with status PENDING, PENDING_PAYMENT, or PROCESSING can be cancelled')

        await this.orderRepository.manager.transaction(async (transactionManager) => {
            const savedOrders = await transactionManager.find(orderItems, {
                where: { Order: { orderId } },
                relations: ['Product']
            })
            this.logger.log(`Releasing inventory`)
            for (const item of savedOrders) {
                this.logger.log(`   Releasing product ${item.Product.productId}: ${item.quantity} units`)
                await transactionManager
                    .createQueryBuilder()
                    .update(Product)
                    .set({
                        reservedQuantity: () => `reservedQuantity - ${item.quantity}`,
                    })
                    .where('productId = :productId', { productId: item.Product.productId })
                    .execute()
            }
            this.logger.log(`Updating order status to canceled`)
            await transactionManager.update(Orders,foundOrder.orderId,{status: orderStatus.CANCELLED})
            this.logger.log(`Order cancelled successfully`)
        })
        return {
            success: true,
            message: 'Order cancelled successfully'
        }
    }
}
