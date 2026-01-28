import { Args, Mutation, Query, Resolver } from "@nestjs/graphql";
import { Address } from "src/typeorm/entities/Addresses";
import { createAddressInput } from "./dtos/createAddress.input";
import { CurrentUser } from "src/auth/decorators/userToken.decorator";
import { jwtPayloadDto } from "src/auth/dtos/jwtPayload.dto";
import { use } from "passport";
import {  UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { JwtGqlGuard } from "src/auth/guards/jwt.guard";
import { addressService } from "./address.service";
import { updateUserAddressInput } from "./dtos/updateAddress.input";

@Resolver(() => Address)
@UseGuards(JwtGqlGuard)
@UsePipes(new ValidationPipe)
export class userAddressesResolver {
    constructor(private addressService: addressService) { }

    @Mutation(() => Address)
    async createAddress(@CurrentUser() userToken: jwtPayloadDto, @Args('addressPayload') addressPayload: createAddressInput) {
        const userId = userToken.userId
        return await this.addressService.createUserAddress(userId, addressPayload)
    }

    @Mutation(()=> Address)
    async updateAddress(@CurrentUser() userToken: jwtPayloadDto, @Args('uploadPayload') uploadPayload: updateUserAddressInput){
        const userId = userToken.userId
        //console.log(uploadPayload);
        return await this.addressService.updateUserAddress(userId,uploadPayload)
    }

    @Query(()=>Address)
    async getAddressData(@CurrentUser() userToken: jwtPayloadDto){
        const userId = userToken.userId
        return await this.addressService.getUserAddress(userId)
    }
}