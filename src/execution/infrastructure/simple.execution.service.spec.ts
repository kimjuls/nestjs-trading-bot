import { Test, TestingModule } from '@nestjs/testing';
import { SimpleExecutionService } from './simple.execution.service';
import { ExchangeClient } from '../../exchange/domain/exchange.client';
import { SignalType, TradeSignal } from '../dto/trade-signal.dto';
import {
  OrderSide,
  OrderType,
  OrderStatus,
} from '../../exchange/dto/order.dto';

describe('SimpleExecutionService', () => {
  let service: SimpleExecutionService;
  let exchangeClient: ExchangeClient;

  const mockExchangeClient = {
    createOrder: jest.fn(),
    getBalance: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimpleExecutionService,
        {
          provide: 'ExchangeClient',
          useValue: mockExchangeClient,
        },
        {
          provide: 'NotificationService',
          useValue: {
            send: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SimpleExecutionService>(SimpleExecutionService);
    exchangeClient = module.get<ExchangeClient>('ExchangeClient');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should execute a LONG signal as a BUY order', async () => {
    const signal: TradeSignal = {
      symbol: 'BTCUSDT',
      type: SignalType.Long,
      reason: 'Golden Cross',
      quantity: 0.1,
    };

    const expectedOrderFn = {
      id: '123',
      symbol: 'BTCUSDT',
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      status: OrderStatus.NEW,
      originalQuantity: 0.1,
      filledQuantity: 0,
      price: 50000,
      timestamp: Date.now(),
    };

    mockExchangeClient.createOrder.mockResolvedValue(expectedOrderFn);

    const result = await service.execute(signal);

    expect(exchangeClient.createOrder).toHaveBeenCalledWith({
      symbol: 'BTCUSDT',
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      quantity: 0.1,
      price: undefined,
    });
    expect(result).toEqual(expectedOrderFn);
  });

  it('should execute a SHORT signal as a SELL order', async () => {
    const signal: TradeSignal = {
      symbol: 'ETHUSDT',
      type: SignalType.Short,
      reason: 'Bearish Divergence',
      quantity: 1,
    };

    mockExchangeClient.createOrder.mockResolvedValue({} as any);

    await service.execute(signal);

    expect(exchangeClient.createOrder).toHaveBeenCalledWith({
      symbol: 'ETHUSDT',
      side: OrderSide.SELL,
      type: OrderType.MARKET,
      quantity: 1,
      price: undefined,
    });
  });

  it('should execute an EXIT_LONG signal as a SELL order', async () => {
    const signal: TradeSignal = {
      symbol: 'BTCUSDT',
      type: SignalType.ExitLong,
      reason: 'Take Profit',
      quantity: 0.1,
    };

    await service.execute(signal);

    expect(exchangeClient.createOrder).toHaveBeenCalledWith({
      symbol: 'BTCUSDT',
      side: OrderSide.SELL,
      type: OrderType.MARKET,
      quantity: 0.1,
      price: undefined,
    });
  });

  it('should execute an EXIT_SHORT signal as a BUY order', async () => {
    const signal: TradeSignal = {
      symbol: 'BTCUSDT',
      type: SignalType.ExitShort,
      reason: 'Stop Loss',
      quantity: 0.1,
    };

    await service.execute(signal);

    expect(exchangeClient.createOrder).toHaveBeenCalledWith({
      symbol: 'BTCUSDT',
      side: OrderSide.BUY,
      type: OrderType.MARKET,
      quantity: 0.1,
      price: undefined,
    });
  });

  it('should place a LIMIT order if price is provided', async () => {
    const signal: TradeSignal = {
      symbol: 'BTCUSDT',
      type: SignalType.Long,
      reason: 'Limit Entry',
      quantity: 0.1,
      price: 45000,
    };

    await service.execute(signal);

    expect(exchangeClient.createOrder).toHaveBeenCalledWith({
      symbol: 'BTCUSDT',
      side: OrderSide.BUY,
      type: OrderType.LIMIT,
      quantity: 0.1,
      price: 45000,
    });
  });

  it('should throw an error if createOrder fails', async () => {
    const signal: TradeSignal = {
      symbol: 'BTCUSDT',
      type: SignalType.Long,
      reason: 'Fail Test',
      quantity: 0.1,
    };

    mockExchangeClient.createOrder.mockRejectedValue(new Error('API Error'));

    await expect(service.execute(signal)).rejects.toThrow('API Error');
  });
});
