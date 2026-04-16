import { InputType } from "@nestjs/graphql";
import { createProductDto, createProductInput } from "./createProduct.input";
import {PartialType} from '@nestjs/mapped-types'

// @InputType()
// export class updateProductInput extends PartialType(createProductInput){}

export class updateProductDto extends PartialType(createProductDto){}