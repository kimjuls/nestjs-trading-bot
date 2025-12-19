import { Test, TestingModule } from '@nestjs/testing';
import { BinanceMarketStream } from './binance.market.stream';
import { WebSocket } from 'ws';
import { Logger } from '@nestjs/common';

jest.mock('ws');

describe('BinanceMarketStream', () => {
  let service: BinanceMarketStream;
  let mockWs: any;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Mock WebSocket implementation
    mockWs = {
      on: jest.fn(),
      send: jest.fn(),
      close: jest.fn(),
      removeAllListeners: jest.fn(),
      readyState: 1, // OPEN
    };
    (WebSocket as unknown as jest.Mock).mockImplementation(() => mockWs);

    const module: TestingModule = await Test.createTestingModule({
      providers: [BinanceMarketStream],
    }).compile();

    // Silence logger during tests
    module.useLogger(new Logger());

    service = module.get<BinanceMarketStream>(BinanceMarketStream);
  });

  afterEach(async () => {
    await service.onModuleDestroy();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('connect', () => {
    it('should connect to WebSocket and setup listeners', async () => {
      // Manually trigger the 'open' event callback passed to ws.on
      mockWs.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'open') {
          callback();
        }
      });

      await service.connect();

      expect(WebSocket).toHaveBeenCalledWith('wss://fstream.binance.com/ws');
      expect(mockWs.on).toHaveBeenCalledWith('open', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function));
      expect(mockWs.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('getRealtimeTicker', () => {
    it('should subscribe and emit values when message is received', (done) => {
      let messageCallback: (data: any) => void = () => {};

      // 1. Simulate Connection
      mockWs.on.mockImplementation(
        (event: string, callback: (...args: any[]) => void) => {
          if (event === 'open') {
            callback(); // Trigger open
          }
          if (event === 'message') {
            // Store the message callback to invoke later
            messageCallback = callback;
          }
        },
      );
      service.connect();

      // 2. Setup subscription
      const symbol = 'BTCUSDT';
      service.getRealtimeTicker(symbol).subscribe((ticker) => {
        expect(ticker.symbol).toBe('BTCUSDT');
        expect(ticker.price).toBe(50000);
        done();
      });

      // 3. Verify subscription message sent
      expect(mockWs.send).toHaveBeenCalledWith(
        expect.stringContaining('SUBSCRIBE'),
      );

      // 4. Simulate a message from WS
      if (messageCallback) {
        const mockPayload = {
          e: 'markPriceUpdate',
          s: 'BTCUSDT',
          p: '50000.00',
          E: 1620000000000,
        };

        messageCallback(Buffer.from(JSON.stringify(mockPayload)));
      }
    });
  });
});
