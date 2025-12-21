import { MACD, RSI } from 'technicalindicators';

describe('Technical Indicators Library Sanity Check', () => {
  it('should instantiate MACD correctly', () => {
    const macd = new MACD({
      values: [],
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    expect(macd).toBeDefined();
    // Verify it has expected methods
    expect(typeof macd.nextValue).toBe('function');
    expect(typeof macd.getResult).toBe('function');
  });

  it('should instantiate RSI correctly', () => {
    const rsi = new RSI({
      values: [],
      period: 14,
    });
    expect(rsi).toBeDefined();
    expect(typeof rsi.nextValue).toBe('function');
    expect(typeof rsi.getResult).toBe('function');
  });
});
