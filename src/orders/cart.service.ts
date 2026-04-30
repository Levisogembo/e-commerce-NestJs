import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Cart } from "src/typeorm/entities/Cart";
import { In, Repository } from "typeorm";
import { addToCartDto } from "./Dtos/addCart.input";
import { jwtPayloadDto } from "src/auth/dtos/jwtPayload.dto";
import { Product } from "src/typeorm/entities/Product";
import { log } from "console";

@Injectable()
export class CartService {
    constructor(
        @InjectRepository(Cart) private cartRepository: Repository<Cart>,
        @InjectRepository(Product) private productRepository: Repository<Product>
    ) { }

    async getOrCreateCart(user): Promise<Cart> {
        const userId = user.userId
        let cart = await this.cartRepository.findOne({
            where: { userId },
        });

        if (!cart) {
            console.log('creating new items');

            cart = this.cartRepository.create({
                userId,
                items: [],
                totalItems: 0,
                totalAmount: 0,
            });
            await this.cartRepository.save(cart);
        }
        return cart;
    }

    async addToCart(user, cartPayload: addToCartDto): Promise<Cart> {
        const cart = await this.getOrCreateCart(user);
        let items = [...cart.items];

        // Find existing item
        const existingItemIndex = items.findIndex(
            (item) => item.productId === cartPayload.productId,
        );

        if (existingItemIndex !== -1) {
            console.log('found existing one')
            // INCREMENT quantity 
            items[existingItemIndex] = {
                ...items[existingItemIndex],
                quantity: items[existingItemIndex].quantity + 1,
            };
        } else {
            console.log('adding new product')
            // ADD new item with quantity 1
            items.push({
                ...cartPayload,
                quantity: 1,
            });
        }

        // Recalculate totals
        const { totalItems, totalAmount } = this.calculateTotals(items);

        // Update cart
        cart.items = items;
        cart.totalItems = totalItems;
        cart.totalAmount = totalAmount;

        return this.cartRepository.save(cart);
    }

    async updateQuantity(user, productId: string, quantity: number,): Promise<Cart> {
        const { userId } = user
        const cart = await this.getOrCreateCart(userId);
        let items = [...cart.items];

        const itemIndex = items.findIndex(
            (item) => item.productId === productId,
        );

        if (itemIndex === -1) {
            throw new NotFoundException('Item not found in cart');
        }

        if (quantity <= 0) {
            // Remove item if quantity is 0 or negative
            items = items.filter((item) => item.productId !== productId);
        } else {
            // Update quantity
            items[itemIndex] = {
                ...items[itemIndex],
                quantity,
            };
        }

        const { totalItems, totalAmount } = this.calculateTotals(items);

        cart.items = items;
        cart.totalItems = totalItems;
        cart.totalAmount = totalAmount;

        return this.cartRepository.save(cart);
    }

    async removeFromCart(user, productId: string): Promise<Cart> {
        const { userId } = user
        const cart = await this.getOrCreateCart(userId);

        const items = cart.items.filter(
            (item) => item.productId !== productId,
        );

        const { totalItems, totalAmount } = this.calculateTotals(items);

        cart.items = items;
        cart.totalItems = totalItems;
        cart.totalAmount = totalAmount;

        return this.cartRepository.save(cart);
    }

    async clearCart(userId: string): Promise<Cart> {
        const cart = await this.getOrCreateCart(userId);

        cart.items = [];
        cart.totalItems = 0;
        cart.totalAmount = 0;

        return this.cartRepository.save(cart);
    }

    private calculateTotals(items): {
        totalItems: number;
        totalAmount: number;
    } {
        const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
        const totalAmount = items.reduce(
            (sum, item) => sum + item.price * item.quantity,
            0,
        );

        return { totalItems, totalAmount };
    }

    async getRecommendations(user): Promise<Product[]> {
        const cart = await this.getOrCreateCart(user)

        // fallback helper to avoid repetition
        const getFeaturedFallback = async (limit: number) => {
            return await this.productRepository.find({
                where: { isFeatured: true },
                relations: ['images', 'category'],
                take: limit
            })
        }

        // empty cart — return featured products
        if (!cart.items.length) {
            return await getFeaturedFallback(4)
        }

        const cartProductIds = cart.items.map(item => item.productId)

        // fetch cart products to get their categories
        const cartProducts = await this.productRepository.find({
            where: { productId: In(cartProductIds) },
            relations: ['category']
        })

        // extract unique category ids
        const categoryIds = [
            ...new Set(
                cartProducts
                    .map(p => p.category?.categoryId)
                    .filter(Boolean)
            )
        ]

        // no categories found — return featured fallback
        if (!categoryIds.length) {
            return await getFeaturedFallback(4)
        }

        // step 1 — get random product IDs using raw SQL safely without DISTINCT conflict
        const randomIds = await this.productRepository
            .createQueryBuilder('product')
            .select('product.productId')
            .leftJoin('product.category', 'category')
            .where('category.categoryId IN (:...categoryIds)', { categoryIds })
            .andWhere('product.productId NOT IN (:...cartProductIds)', { cartProductIds })
            .andWhere('product.deletedAt IS NULL')
            .orderBy('RANDOM()')
            .limit(4)
            .getRawMany()

        const ids = randomIds.map(r => r.product_productId)

        // no recommendations found — return featured fallback
        if (!ids.length) {
            return await getFeaturedFallback(4)
        }

        // step 2 — fetch full product details for those IDs
        const recommendations = await this.productRepository.find({
            where: { productId: In(ids) },
            relations: ['images', 'category']
        })

        // fill remaining slots with featured products if less than 4
        if (recommendations.length < 4) {
            const featured = await getFeaturedFallback(4 - recommendations.length)

            const featuredNotInRecommendations = featured.filter(
                f => !recommendations.some(r => r.productId === f.productId)
            )

            return [...recommendations, ...featuredNotInRecommendations]
        }    
        return recommendations
    }
}

