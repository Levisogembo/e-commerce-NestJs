import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { log } from 'console';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class SeedService implements OnModuleInit {
  constructor(
    private userService: UsersService,
    private configService: ConfigService,
  ) {}

  async onModuleInit() {
      await this.createAdmin()
  }

  async createAdmin() {
    const shouldSeed = this.configService.get<string>('SEED_ADMIN') === 'true';

    if (!shouldSeed) {
      return;
    }

    const email = this.configService.get<string>('ADMIN_EMAIL')!;
    const existingAdmin = await this.userService.findUserbyEmail(email);
    if (existingAdmin) {
      console.log('Admin already exists. Skipping seed.');
      return;
    }
    const password = this.configService.get<string>('ADMIN_PASSWORD');
    const lastName = this.configService.getOrThrow<string>('ADMIN_LAST_NAME');
    const firstName = this.configService.get<string>('ADMIN_FIRST_NAME')!;
    const phoneNumber = this.configService.get<string>('ADMIN_PHONENUMBER')!;

    await this.userService.createAdmin({
      email,
      password,
      lastName,
      firstName,
      phoneNumber,
    },
    "verified"
  );
    console.log("Admin account created");    
  }
}
