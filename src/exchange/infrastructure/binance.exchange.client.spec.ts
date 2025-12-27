import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BinanceExchangeClient } from './binance.exchange.client';
import { OrderSide, OrderType } from '../dto/order.dto';

// Mock dependencies
const mockConfigService = {
  get: jest.fn((key: string) => {
    switch (key) {
      case 'BINANCE_API_KEY':
        return 'test-api-key';
      case 'BINANCE_API_SECRET':
        return 'test-api-secret';
      case 'BINANCE_BASE_URL':
        return 'https://testnet.binancefuture.com';
      default:
        return null;
    }
  }),
};

const mockSubmitNewOrder = jest.fn();
const mockCancelOrder = jest.fn();
const mockGetPositions = jest.fn();
const mockGetAccountTrades = jest.fn();
const mockGetBalance = jest.fn();

// We need to mock the 'binance' library's USDMClient
// Since USDMClient is instantiated inside the constructor, we can mock the module.
jest.mock('binance', () => {
  return {
    USDMClient: jest.fn().mockImplementation(() => ({
      submitNewOrder: mockSubmitNewOrder,
      cancelOrder: mockCancelOrder,
      getPositions: mockGetPositions,
      getAccountTrades: mockGetAccountTrades,
      getBalance: mockGetBalance,
    })),
  };
});

// Import the mocked class to access the mock instances
import { USDMClient } from 'binance';

describe('BinanceExchangeClient', () => {
  let service: BinanceExchangeClient;
  let mockUsdmClient: any;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BinanceExchangeClient,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<BinanceExchangeClient>(BinanceExchangeClient);

    // Get the instance of the mock that was created inside the service
    mockUsdmClient = (USDMClient as unknown as jest.Mock).mock.instances[0];
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(USDMClient).toHaveBeenCalledWith({
      api_key: 'test-api-key',
      api_secret: 'test-api-secret',
      baseUrl: 'https://testnet.binancefuture.com',
    });
  });

  describe('createOrder', () => {
    it('should submit a new order and return mapped Order', async () => {
      // Arrange
      const orderDto = {
        symbol: 'BTCUSDT',
        side: OrderSide.BUY,
        type: OrderType.LIMIT,
        quantity: 1,
        price: 50000,
      };

      const mockResponse = {
        orderId: 12345,
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'LIMIT',
        status: 'NEW',
        origQty: '1',
        executedQty: '0',
        price: '50000',
        updateTime: 1620000000000,
      };

      mockSubmitNewOrder.mockResolvedValue(mockResponse);

      // Act
      const result = await service.createOrder(orderDto);

      // Assert
      expect(mockSubmitNewOrder).toHaveBeenCalledWith({
        symbol: 'BTCUSDT',
        side: 'BUY',
        type: 'LIMIT',
        quantity: 1,
        price: 50000,
      });
      expect(result).toEqual({
        id: '12345',
        symbol: 'BTCUSDT',
        side: OrderSide.BUY,
        type: OrderType.LIMIT,
        status: 'NEW',
        originalQuantity: 1,
        filledQuantity: 0,
        price: 50000,
        averagePrice: undefined,
        timestamp: 1620000000000,
      });
    });
  });

  describe('getPositions', () => {
    it('should return mapped positions', async () => {
      // Arrange
      const mockResponse = [
        {
          symbol: 'BTCUSDT',
          positionAmt: '1.5',
          entryPrice: '45000.00',
          markPrice: '46000.00',
          unRealizedProfit: '1500.00',
          leverage: '10',
          marginType: 'isolated',
          liquidationPrice: '40000.00',
        },
        {
          symbol: 'ETHUSDT',
          positionAmt: '0', // Should be filtered out
          entryPrice: '0',
          markPrice: '0',
          unRealizedProfit: '0',
          leverage: '10',
          marginType: 'cross',
          liquidationPrice: '0',
        },
      ];

      mockGetPositions.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getPositions();

      // Assert
      expect(mockGetPositions).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        symbol: 'BTCUSDT',
        size: 1.5,
        entryPrice: 45000,
        markPrice: 46000,
        unrealizedPnl: 1500,
        leverage: 10,
        marginType: 'isolated',
        liquidationPrice: 40000,
      });
    });
  });

  describe('getBalance', () => {
    it('should return mapped balances', async () => {
      const mockResponse = [
        {
          asset: 'USDT',
          balance: '10000',
          availableBalance: '9000',
        },
      ];
      mockGetBalance.mockResolvedValue(mockResponse);

      const result = await service.getBalance();

      expect(result[0]).toEqual({
        asset: 'USDT',
        free: 9000,
        locked: 1000,
        total: 10000,
      });
    });
  });
});
