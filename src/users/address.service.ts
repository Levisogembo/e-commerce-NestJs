import { HttpException, HttpStatus, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Address } from "src/typeorm/entities/Addresses";
import { Repository } from "typeorm";
import { createAddressInput } from "./dtos/createAddress.input";
import { User } from "src/typeorm/entities/User";
import { updateUserAddressInput } from "./dtos/updateAddress.input";

@Injectable()
export class addressService {
    constructor(@InjectRepository(Address) private addressRepository: Repository<Address>,
        @InjectRepository(User) private userRepository: Repository<User>) { }

    async createUserAddress(userId: string, addressPayload: createAddressInput) {
        try {
            const foundUser = await this.userRepository.findOne({ where: { userId } })
            if (!foundUser) throw new NotFoundException()
            const newAddress = await this.addressRepository.create({
                ...addressPayload,
                user: foundUser
            })
            const savedAddress = await this.addressRepository.save(newAddress)
            return await this.addressRepository.findOne({
                where: {addressId: savedAddress.addressId},
                relations: ['user']
            })
        } catch (err) {
            console.log(err.message);
            const errMessage = err.message
            if(errMessage.startsWith("duplicate key value violates unique constraint")) throw new HttpException('Profile already exists',HttpStatus.CONFLICT)
        }
    }

    async updateUserAddress(userId: string, payload: updateUserAddressInput){
        await this.userRepository.findOneByOrFail({userId})
        const address = await this.addressRepository.findOne({where:{user:{userId}}})
        if(!address) throw new NotFoundException()
        const addressId = address.addressId
        await this.addressRepository.update(addressId,payload)
        return await this.addressRepository.findOne({where:{addressId},relations:['user']})
    }

    async getUserAddress(userId:string){
        const foundAddress = await this.addressRepository.findOne({
            where: {user:{userId}}
        })
        if(!foundAddress) throw new NotFoundException()
        return foundAddress
    }

    
}