import { Query, Resolver } from '@nestjs/graphql';
import { User } from 'src/typeorm/entities/User';

@Resolver(()=>User)
export class AuthResolver {

    @Query(()=>String)
    login(){
        return 'login sucess'
    }
}
