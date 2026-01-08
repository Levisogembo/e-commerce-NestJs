import { Global, Module } from '@nestjs/common';
import { EmailsResolver } from './emails.resolver';
import { EmailsService } from './emails.service';

@Global()
@Module({
  providers: [EmailsResolver, EmailsService],
  exports: [EmailsService]
})
export class EmailsModule {}
