
import { IsObject, IsNumber, IsString, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Metadata item in callback
 */
export class CallbackMetadataItem {
  @IsString()
  Name: string;

  @IsOptional()
  Value?: string | number;
}


export class CallbackMetadata {
  @ValidateNested({ each: true })
  @Type(() => CallbackMetadataItem)
  Item: CallbackMetadataItem[];
}


export class StkCallback {
  @IsString()
  MerchantRequestID: string;

  @IsString()
  CheckoutRequestID: string;

  @IsNumber()
  ResultCode: number;

  @IsString()
  ResultDesc: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CallbackMetadata)
  CallbackMetadata?: CallbackMetadata;
}


export class CallbackBody {
  @ValidateNested()
  @Type(() => StkCallback)
  stkCallback: StkCallback;
}


export class MpesaCallbackDto {
  @ValidateNested()
  @Type(() => CallbackBody)
  Body: CallbackBody;
}