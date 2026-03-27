
import {IsOptional, IsString, IsNumber, IsPhoneNumber, Min, Max, IsNotEmpty } from 'class-validator';


export class StkPushDto {
  @IsString()
  @IsPhoneNumber('KE') // Kenyan phone number format
  @IsNotEmpty()
  phoneNumber: string;

  @IsNumber()
  @Min(1)
  @Max(150000) // M-Pesa max transaction limit
  amount: number;

  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsOptional()
  accountReference?: string;

  @IsString()
  @IsOptional()
  transactionDesc?: string;
}