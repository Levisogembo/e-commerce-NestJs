import { Body, Controller, Get, Post, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Request } from "express";
import { JwtAuthGuard } from "src/auth/guards/jwtRest.guard";
import { CartService } from "./cart.service";
import { addToCartDto } from "./Dtos/addCart.input";

@Controller('cart')
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe())
export class CartController {

    constructor (private cartService: CartService) {}

    @Post()
    async addToCart (@Req() userToken: Request, @Body() cartPayload: addToCartDto) {
        //console.log(cartPayload);
        const user = userToken.user
        return await this.cartService.addToCart(user,cartPayload)  
    }
    
    @Get()
    async getCartItems (@Req() userToken: Request) {
        const user = userToken.user
        //console.log([await this.cartService.getOrCreateCart(user)]);
        const results = await this.cartService.getOrCreateCart(user)
        return results.items
    }

}