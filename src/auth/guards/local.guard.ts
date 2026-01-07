import { ExecutionContext, Injectable } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";

@Injectable()
export class GqlLocalGuard extends AuthGuard('local'){
    constructor(){super()}
    getRequest(context: ExecutionContext) {
        console.log('inside gql guard');
        const ctx = GqlExecutionContext.create(context)
        const req: Request = ctx.getContext().req
        const args = ctx.getArgs()
        req.body = args.loginInput
        return req
    }
}