import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Orders } from 'src/typeorm/entities/Order';
import { Repository } from 'typeorm';
import { createOrderInput } from './Dtos/createOrder.input';
import { Product } from 'src/typeorm/entities/Product';
import { User } from 'src/typeorm/entities/User';
import { orderItems } from 'src/typeorm/entities/orderItems';
import { QueuesService } from 'src/queues/queues.service';

@Injectable()
export class OrdersService {
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
        }> = []
        for (const item of payload.items) {
            const product = await this.productRepository.findOne({ where: { productId: item.productId } })
            if (!product) throw new NotFoundException('Product not found')

            //check if quantity is available
            const availableQuantity = product.quantity - product.reservedQuantity
            if (availableQuantity < item.quantity) throw new BadRequestException(`Insufficient inventory for ${product.name}` +
                `Available: ${availableQuantity}, Requested: ${item.quantity}`)

            //store valid products
            productChecks.push({
                product,
                requestedQty: item.quantity,
                unitPrice: item.unitPrice
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
            await this.queueService.addOrderJob({
                orderId: savedOrder.orderId,
                userId,
                total,
                paymentMethod: payload.paymentMethod,
                billingAddress: payload.billingAddress,
                items: payload.items.map((item)=>({
                    productId: item.productId,
                    quantity: item.quantity,
                    price: item.unitPrice
                }))
            })
        } catch (error) {
            console.log(`Failed to queue order: ${error.message}`)
        }

        //return response after order is processed in the queue
        const completedOrder = await this.orderRepository.findOne({
            where: {orderId: savedOrder.orderId},
            relations: ['orderItems','orderItems.product'],
        })

        return {...completedOrder,message: 'Order created successfully and queued for processing'}
    }
}
