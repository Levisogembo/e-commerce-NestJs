import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from 'src/typeorm/entities/User';
import { localInput } from './dtos/localLogin.input';
import { UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { GqlLocalGuard } from './guards/localGuard';
import { CurrentUser} from './decorators/userToken.decorator';

@Resolver(() => User)
export class AuthResolver {

  @Mutation(() => String)
  @UseGuards(GqlLocalGuard)
  @UsePipes(new ValidationPipe)
  async login(@CurrentUser() userToken: string ,@Args('loginInput') loginInput: localInput) {
    return userToken;
  }

  @Query(() => String)
  hello() {
    return 'Hello GraphQL';
  }
}
