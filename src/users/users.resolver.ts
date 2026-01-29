import { Args, Mutation, Resolver, Query, Context, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from 'src/typeorm/entities/User';
import { createUserInput } from './dtos/createUser.input';
import { ClassSerializerInterceptor, HttpException, HttpStatus, ParseIntPipe, ParseUUIDPipe, UnauthorizedException, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { JwtGqlGuard } from 'src/auth/guards/jwt.guard';
import { ROLES } from 'src/auth/decorators/roles.decorator';
import { Roles } from 'src/roles/dtos/enums/roles.enum';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { CurrentUser } from 'src/auth/decorators/userToken.decorator';
import { jwtPayloadDto } from 'src/auth/dtos/jwtPayload.dto';
import { RedisService } from 'src/redis/redis.service';

@Resolver(() => User)
export class UsersResolver {
    constructor(private userService: UsersService, private redisService: RedisService) { }

    @Mutation(() => User)
    @UsePipes(new ValidationPipe)
    async createUser(@Args('userInput') userInput: createUserInput) {
        const pass = userInput.password
        const confirmPass = userInput.confirmPassword
        if (pass !== confirmPass) throw new HttpException('Passwords do not match', HttpStatus.CONFLICT)
        return await this.userService.createUser(userInput)
    }

    @Mutation(() => User)
    @ROLES(Roles.ADMIN)
    @UseGuards(JwtGqlGuard, RolesGuard)
    @UsePipes(new ValidationPipe)
    async createAdmin(@Args('adminInput') adminInput: createUserInput) {
        const pass = adminInput.password
        const confirmPass = adminInput.confirmPassword
        if (pass !== confirmPass) throw new HttpException('Passwords do not match', HttpStatus.CONFLICT)
        return await this.userService.createAdmin(adminInput)
    }

    @Query(() => User)
    @UseGuards(JwtGqlGuard)
    @UsePipes(new ValidationPipe)
    async getUser(@Args("userId", ParseUUIDPipe) userId: string) {
        return await this.userService.getOneUser(userId)
    }

    @Query(() => [User])
    @ROLES(Roles.ADMIN, Roles.USER)
    @UseGuards(JwtGqlGuard, RolesGuard)
    @UsePipes(new ValidationPipe)
    async getAllUser(@Args("page", { type: () => Int }) page: number, @Args("limit", { type: () => Int }) limit: number) {
        return await this.userService.getAllUsers(page, limit)
    }

    @UseGuards(JwtGqlGuard)
    @Mutation(() => String)
    async deleteUser(@CurrentUser() userToken: jwtPayloadDto, @Context() context) {
        const authHeader = context.req.headers.authorization;
        if (!authHeader) throw new UnauthorizedException('No auth header provided');
        const extractedToken = authHeader.replace('Bearer ', '').trim();
        if (!extractedToken) throw new UnauthorizedException('No token provided')
        await this.userService.deleteUser(userToken.userId)
        await this.redisService.invalidateToken(extractedToken)
        return "User deleted successfully"
    }
}
