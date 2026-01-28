import { InputType, PartialType } from "@nestjs/graphql";
import { createAddressInput } from "./createAddress.input";

@InputType()
export class updateUserAddressInput extends PartialType(createAddressInput){}