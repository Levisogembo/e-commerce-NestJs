import { InputType, PartialType } from "@nestjs/graphql";
import { createProductInput } from "./createProduct.input";

@InputType()
export class updateProductInput extends PartialType(createProductInput){}