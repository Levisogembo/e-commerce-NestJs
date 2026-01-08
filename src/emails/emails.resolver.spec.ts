import { Test, TestingModule } from '@nestjs/testing';
import { EmailsResolver } from './emails.resolver';

describe('EmailsResolver', () => {
  let resolver: EmailsResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailsResolver],
    }).compile();

    resolver = module.get<EmailsResolver>(EmailsResolver);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });
});
