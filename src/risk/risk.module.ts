import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { StandardRiskManager } from './application/standard.risk.manager';
import { PercentPositionSizer } from './application/percent.position.sizer';
import { DEFAULT_RISK_CONFIG, RiskConfig } from './domain/risk.config';

@Module({
  imports: [ConfigModule], // ConfigService 사용을 위해 import
  providers: [
    {
      provide: 'RiskConfig',
      inject: [ConfigService],
      useFactory: (configService: ConfigService): RiskConfig => {
        return {
          maxDailyLossPercent: parseFloat(
            configService.get<string>('RISK_MAX_DAILY_LOSS_PERCENT') ??
              String(DEFAULT_RISK_CONFIG.maxDailyLossPercent),
          ),
          maxLeverage: parseFloat(
            configService.get<string>('RISK_MAX_LEVERAGE') ??
              String(DEFAULT_RISK_CONFIG.maxLeverage),
          ),
          riskPerTradePercent: parseFloat(
            configService.get<string>('RISK_PER_TRADE_PERCENT') ??
              String(DEFAULT_RISK_CONFIG.riskPerTradePercent),
          ),
          rewardToRiskRatio: parseFloat(
            configService.get<string>('RISK_REWARD_TO_RISK_RATIO') ??
              String(DEFAULT_RISK_CONFIG.rewardToRiskRatio),
          ),
        };
      },
    },
    {
      provide: 'PositionSizer',
      useClass: PercentPositionSizer,
    },
    {
      provide: 'RiskManager',
      useClass: StandardRiskManager,
    },
    StandardRiskManager,
  ],
  exports: ['RiskManager', 'RiskConfig'],
})
export class RiskModule {}
