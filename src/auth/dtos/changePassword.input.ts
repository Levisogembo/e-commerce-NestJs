import { Field, InputType } from "@nestjs/graphql";
import { IsNotEmpty, IsString, Matches } from "class-validator";

@InputType()
export class changePasswordInput{
    @Field()
    @IsNotEmpty()
    @IsString()
    currentPassword: string

    @Field()
    @IsNotEmpty()
    @IsString()
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
        message:
          'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character, and be at least 8 characters long',
      })
    newPassword: string

    @Field()
    @IsNotEmpty()
    @IsString()
    @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, {
        message:
          'Password must contain at least 1 uppercase letter, 1 lowercase letter, 1 number, 1 special character, and be at least 8 characters long',
      })
    confirmedPassword: string
}