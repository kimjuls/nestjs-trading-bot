import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiscordNotificationService } from './discord-notification.service';
import { NotificationLevel } from '../domain/notification.service.interface';
import { TradeAlertDto } from '../dto/trade-alert.dto';
import { Position } from '../../exchange/dto/position.dto';
import { Balance } from '../../exchange/dto/balance.dto';
import {
  Order,
  OrderSide,
  OrderStatus,
  OrderType,
} from '../../exchange/dto/order.dto';
import { RiskConfig } from '../../risk/domain/risk.config';

describe('DiscordNotificationService', () => {
  let service: DiscordNotificationService;
  let configService: ConfigService;

  // Mock fetch
  const mockFetch = jest.fn();
  global.fetch = mockFetch;

  // Mock RiskConfig
  const mockRiskConfig: RiskConfig = {
    maxDailyLossPercent: 0.03,
    maxLeverage: 5,
    riskPerTradePercent: 0.01,
    rewardToRiskRatio: 1.5,
  };

  beforeEach(async () => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('ok'),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DiscordNotificationService,
        {
          provide: ConfigService,
          useValue: {
            get: jest
              .fn()
              .mockReturnValue('https://discord.com/api/webhooks/test'),
          },
        },
        {
          provide: 'RiskConfig',
          useValue: mockRiskConfig,
        },
      ],
    }).compile();

    service = module.get<DiscordNotificationService>(
      DiscordNotificationService,
    );
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should log and send startup message with risk info', async () => {
      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
      await service.onModuleInit();

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Risk Config Loaded'),
      );
      expect(mockFetch).toHaveBeenCalledTimes(1); // Risk Info Msg

      // Check Risk Info Msg
      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);
      expect(body.embeds[0].title).toContain('Risk Configuration Applied');
      expect(body.embeds[0].fields).toContainEqual(
        expect.objectContaining({ name: 'Max Leverage', value: '5x' }),
      );

      logSpy.mockRestore();
    });
  });

  describe('sendMessage', () => {
    it('should send a message to discord webhook', async () => {
      await service.sendMessage('Hello World', NotificationLevel.Info);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://discord.com/api/webhooks/test',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('Hello World'),
        }),
      );
    });

    // Integrated test case from verification script for Basic Message
    it('should send basic notification message correctly', async () => {
      const message =
        '🔔 Test message from NestJS Trading Bot Verification Script';
      await service.sendMessage(message);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining(message),
        }),
      );
    });

    it('should warn if webhook url is missing', async () => {
      jest.spyOn(configService, 'get').mockReturnValue(null);
      // Re-initialize to pick up null config
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          DiscordNotificationService,
          {
            provide: ConfigService,
            useValue: {
              get: jest.fn().mockReturnValue(null),
            },
          },
          {
            provide: 'RiskConfig',
            useValue: mockRiskConfig,
          },
        ],
      }).compile();
      const serviceNoConfig = module.get<DiscordNotificationService>(
        DiscordNotificationService,
      );
      const loggerSpy = jest
        .spyOn(Logger.prototype, 'warn')
        .mockImplementation();

      await serviceNoConfig.sendMessage('test');
      expect(mockFetch).not.toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalled();
      loggerSpy.mockRestore();
    });
  });

  describe('sendTradeAlert', () => {
    it('should format and send trade alert', async () => {
      const trade: TradeAlertDto = {
        symbol: 'BTCUSDT',
        action: 'OPEN_LONG',
        price: 50000,
        quantity: 0.1,
        timestamp: new Date('2024-01-01T00:00:00Z'),
      };

      await service.sendTradeAlert(trade);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('BTCUSDT'),
        }),
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.embeds).toBeDefined();
      expect(body.embeds[0].title).toContain('Long 진입');
    });

    // Integrated test case from verification script for Trade Alert
    it('should send detailed trade alert (Open Long) correctly', async () => {
      const tradeAlert: TradeAlertDto = {
        symbol: 'BTCUSDT',
        action: 'OPEN_LONG',
        price: 95432.1,
        quantity: 0.5,
        timestamp: new Date('2024-01-01T12:00:00Z'),
      };

      await service.sendTradeAlert(tradeAlert);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.embeds[0].title).toContain('Long 진입 - BTCUSDT');
      expect(body.embeds[0].color).toBe(0x00ff00); // Green
      expect(body.embeds[0].fields).toContainEqual(
        expect.objectContaining({ name: 'Price', value: '95432.1' }),
      );
      expect(body.embeds[0].fields).toContainEqual(
        expect.objectContaining({ name: 'Quantity', value: '0.5' }),
      );
    });
  });

  describe('sendErrorAlert', () => {
    it('should send error alert', async () => {
      const error = new Error('Test Error');
      await service.sendErrorAlert(error, 'TestContext');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('Test Error'),
        }),
      );
    });

    // Integrated test case from verification script for Error Alert
    it('should send error alert with correct context', async () => {
      const error = new Error('Test Error for Verification');
      const context = 'Verification Script';

      await service.sendErrorAlert(error, context);

      const callArgs = mockFetch.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.embeds[0].title).toBe(`Error in ${context}`);
      expect(body.embeds[0].description).toBeDefined();
      expect(body.embeds[0].description).toContain(
        'Test Error for Verification',
      );
      expect(body.embeds[0].color).toBe(0xff0000); // Red
    });
  });

  describe('sendStartupNotification', () => {
    it('should send startup notification with positions and balances', async () => {
      const positions: Position[] = [
        {
          symbol: 'BTCUSDT',
          size: 0.1,
          entryPrice: 50000,
          markPrice: 51000,
          unrealizedPnl: 100,
          leverage: 10,
          marginType: 'cross',
          liquidationPrice: 40000,
        },
      ];
      const balances: Balance[] = [
        {
          asset: 'USDT',
          free: 1000,
          locked: 0,
          total: 1000,
        },
      ];

      await service.sendStartupNotification(positions, balances);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('Trading Bot Started'),
        }),
      );
      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.embeds).toBeDefined();
      expect(body.embeds[0].fields).toBeDefined();
      // Check for Position field
      expect(body.embeds[0].fields).toContainEqual(
        expect.objectContaining({
          name: 'Positions',
          value: expect.stringContaining('BTCUSDT'),
        }),
      );
      // Check for Balance field
      expect(body.embeds[0].fields).toContainEqual(
        expect.objectContaining({
          name: 'Wallet Balance',
          value: expect.stringContaining('USDT'),
        }),
      );
    });
  });

  describe('sendOrderExecutionNotification', () => {
    it('should send order execution notification', async () => {
      const order: Order = {
        id: '123',
        symbol: 'BTCUSDT',
        side: OrderSide.BUY,
        type: OrderType.MARKET,
        status: OrderStatus.FILLED,
        originalQuantity: 0.1,
        filledQuantity: 0.1,
        price: 50000,
        averagePrice: 50000,
        timestamp: new Date().getTime(),
      };
      const positions: Position[] = [];
      const balances: Balance[] = [];

      await service.sendOrderExecutionNotification(order, positions, balances);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('Order Executed'),
        }),
      );

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.embeds[0].title).toBe('✅ Order Executed - BTCUSDT');
      expect(body.embeds[0].fields).toContainEqual(
        expect.objectContaining({ name: 'Order ID', value: '123' }),
      );
    });
  });
});
