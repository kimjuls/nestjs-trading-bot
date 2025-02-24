import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionService } from './execution.service';
import { BinanceApiModule } from 'src/binance-api/binance-api.module';

describe('ExecutionService', () => {
  let service: ExecutionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [BinanceApiModule],
      providers: [ExecutionService],
    }).compile();

    service = module.get<ExecutionService>(ExecutionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
