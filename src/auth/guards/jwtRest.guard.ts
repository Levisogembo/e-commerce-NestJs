import { ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";

export class JwtAuthGuard extends AuthGuard('jwt'){
    constructor (){super()}
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        console.log('inside jwt auth guard');
        return super.canActivate(context)
    }
}