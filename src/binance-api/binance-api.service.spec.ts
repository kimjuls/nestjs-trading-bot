import { Test, TestingModule } from '@nestjs/testing';
import { BinanceApiService } from './binance-api.service';
import { ConfigModule } from '@nestjs/config';

describe('BinanceApiService', () => {
  let service: BinanceApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule],
      providers: [BinanceApiService],
    }).compile();

    service = module.get<BinanceApiService>(BinanceApiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
