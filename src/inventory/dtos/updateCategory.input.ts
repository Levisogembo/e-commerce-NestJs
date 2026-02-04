import { InputType, PartialType } from "@nestjs/graphql";
import { createCategoryInput } from "./createCategory.input";

@InputType()
export class updateCategoryInput extends PartialType(createCategoryInput){}