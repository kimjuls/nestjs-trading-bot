import { Injectable } from '@nestjs/common';
import { PositionSizer } from '../domain/position.sizer';
import { RiskConfig } from '../domain/risk.config';

@Injectable()
export class PercentPositionSizer implements PositionSizer {
  constructor(private readonly config: RiskConfig) {}

  calculate(equity: number, entryPrice: number, stopLossPrice: number): number {
    const priceDiff = Math.abs(entryPrice - stopLossPrice);

    if (priceDiff === 0) {
      return 0; // Avoid division by zero
    }

    const riskAmount = equity * this.config.riskPerTradePercent;
    const positionSize = riskAmount / priceDiff;

    return positionSize;
  }
}
