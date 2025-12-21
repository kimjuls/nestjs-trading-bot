import { Test, TestingModule } from '@nestjs/testing';
import { PaperExchangeClient } from './paper.exchange.client';
import { PaperPositionManager } from './paper.position.manager';
import { ExchangeClient } from '../../exchange/domain/exchange.client';
import {
  CreateOrderDto,
  OrderSide,
  OrderType,
} from '../../exchange/dto/order.dto';
import { MarketStream } from '../../exchange/domain/market.stream';
import { of } from 'rxjs';
import { ConfigService } from '@nestjs/config';

describe('PaperExchangeClient', () => {
  let client: PaperExchangeClient;
  let positionManager: PaperPositionManager;
  let marketStream: MarketStream;

  const mockMarketStream = {
    getRealtimeTicker: jest
      .fn()
      .mockReturnValue(
        of({ symbol: 'BTCUSDT', price: 50000, timestamp: 123456 }),
      ),
    getRealtimeCandles: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === 'PAPER_INITIAL_BALANCE') return '10000';
      if (key === 'TRADING_SYMBOL') return 'BTCUSDT';
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaperExchangeClient,
        PaperPositionManager,
        {
          provide: 'MarketStream',
          useValue: mockMarketStream,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    client = module.get<PaperExchangeClient>(PaperExchangeClient);
    positionManager = module.get<PaperPositionManager>(PaperPositionManager);

    // Initialize manager
    positionManager.init(10000);

    // Manually trigger onModuleInit to subscribe
    client.onModuleInit();
  });

  it('should be defined', () => {
    expect(client).toBeDefined();
  });

  describe('createOrder', () => {
    it('should create a long market order', async () => {
      // Simulate getting current price from stream (client logic dependent)
      // Assuming client subscribes or gets latest.
      // For this test, we might need to simulate price update if the client listens to stream.
      // But if client calls getRealtimeTicker on order, mock return works.

      // However, typical MarketStream.getRealtimeTicker returns observable.
      // If PaperExchangeClient logic is "Get latest price from cache", we need to push data.

      // Let's assume PaperExchangeClient has a method or logic to get price.
      // For simplicity in Paper Trading, maybe we start with fetching One-time via promise if possible?
      // No, MarketStream is Observable.
      // So PaperExchangeClient needs to keep track of price.

      // Setup: Mock subscribe behavior or simulate "last price" availability
      // Ideally PaperExchangeClient is injected with MarketStream and subscribes to symbol on init or first need?

      // For now, let's implement a "setCurrentPrice" helper on client for testing ease,
      // or assume it subscribes to 'BTCUSDT' (which we use).

      // Let's force update price in client if we can't easily mock stream flow in unit test without async complexity
      // Actually, we can just mock `getRealtimeTicker` to return `of({ price: 50000 })` and if client takes 1st value, it works.

      const orderDto: CreateOrderDto = {
        symbol: 'BTCUSDT',
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        quantity: 0.1,
      };

      const order = await client.createOrder(orderDto);

      expect(order.symbol).toBe('BTCUSDT');
      expect(order.price).toBe(50000);
      expect(order.status).toBe('FILLED');

      const positions = await client.getPositions();
      expect(positions).toHaveLength(1);
      expect(positions[0].size).toBe(0.1);
    });
  });
});
