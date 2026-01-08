import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from 'src/typeorm/entities/User';
import { localInput } from './dtos/localLogin.input';
import { HttpException, HttpStatus, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { GqlLocalGuard } from './guards/local.guard';
import { CurrentUser} from './decorators/userToken.decorator';
import { changePasswordInput } from './dtos/changePassword.input';
import { JwtGqlGuard } from './guards/jwt.guard';
import { jwtPayloadDto } from './dtos/jwtPayload.dto';
import { AuthService } from './auth.service';
import { EmailsService } from 'src/emails/emails.service';

@Resolver(() => User)
export class AuthResolver {
  constructor(private authService: AuthService,private readonly emailService: EmailsService){}

  @Mutation(() => String)
  @UseGuards(GqlLocalGuard)
  @UsePipes(new ValidationPipe)
  async login(@CurrentUser() userToken: string ,@Args('loginInput') loginInput: localInput) {
    return userToken;
  }

  @Mutation(()=>String)
  @UseGuards(JwtGqlGuard)
  @UsePipes(new ValidationPipe)
  async changePassword(@CurrentUser() req: jwtPayloadDto, @Args('passwordInput') {newPassword,confirmedPassword,currentPassword}: changePasswordInput){
    if(newPassword !== confirmedPassword) throw new HttpException('Passwords do not match',HttpStatus.CONFLICT)
    const userId = req.userId
    return await this.authService.changePassword(userId,currentPassword,newPassword)
  }

  @Query(() => String)
  hello() {
    return 'Hello GraphQL';
  }
}
