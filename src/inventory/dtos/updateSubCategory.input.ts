import { InputType, PartialType } from "@nestjs/graphql";
import { createSubCategoryInput } from "./createSubCategory.input";

@InputType()
export class updateSubCategoryInput extends PartialType(createSubCategoryInput) {}