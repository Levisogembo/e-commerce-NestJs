import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/guards/jwtRest.guard";
import { CartService } from "./cart.service";
import { addToCartDto } from "./Dtos/addCart.input";

@Controller('cart')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe())
export class CartController {

    constructor(private cartService: CartService) { }

    @Post()
    async addToCart(@Req() userToken: Request, @Body() cartPayload: addToCartDto) {
        //console.log(cartPayload);
        const user = userToken.user
        return await this.cartService.addToCart(user, cartPayload)
    }

    @Get()
    async getCartItems(@Req() userToken: Request) {
        const user = userToken.user
        //console.log(user)
        //console.log([await this.cartService.getOrCreateCart(user)]);
        const results = await this.cartService.getOrCreateCart(user)
        return results.items
    }

    @Delete('delete/:productId')
    async removeFromCart(@Req() userToken: Request, @Param("productId", ParseUUIDPipe) productId: string) {
        const user = userToken.user
        const results = await this.cartService.removeFromCart(user, productId)
        return results.items
    }

    @Patch("update/:productId")
    async updateQuantity(@Req() userToken: Request, @Param("productId", ParseUUIDPipe) productId: string, @Body() { quantity }: { quantity: number }) {
        const user = userToken.user
        const results = await this.cartService.updateQuantity(user, productId, quantity)
        return results.items
    }

    @Get('recommendations')
    async getRecommendations(@Req() userToken: Request) {
        const results = await this.cartService.getRecommendations(userToken.user)
        return results
    }

}