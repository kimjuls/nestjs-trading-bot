import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  NotificationService,
  NotificationLevel,
} from '../domain/notification.service.interface';
import { TradeAlertDto } from '../dto/trade-alert.dto';
import { Position } from '../../exchange/dto/position.dto';
import { Balance } from '../../exchange/dto/balance.dto';
import { Order } from '../../exchange/dto/order.dto';

@Injectable()
export class DiscordNotificationService
  implements NotificationService, OnModuleInit
{
  private readonly logger = new Logger(DiscordNotificationService.name);
  private webhookUrl: string | undefined;

  constructor(private configService: ConfigService) {
    this.webhookUrl = this.configService.get<string>('DISCORD_WEBHOOK_URL');
  }

  async onModuleInit() {
    await this.sendMessage('🚀 Trading Bot Started', NotificationLevel.Success);
  }

  async sendMessage(
    message: string,
    level: NotificationLevel = NotificationLevel.Info,
  ): Promise<void> {
    if (!this.webhookUrl) {
      this.logger.warn('Discord Webhook URL is not configured.');
      return;
    }

    try {
      const payload = {
        content:
          level === NotificationLevel.Error
            ? `<@&ROLE_ID> ${message}`
            : message, // Error일 때 멘션 등 추가 가능
        embeds: [
          {
            description: message,
            color: this.getColorByLevel(level),
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await this.sendToDiscord(payload);
    } catch (error) {
      this.logger.error(`Failed to send discord message: ${error.message}`);
    }
  }

  async sendTradeAlert(tradeInfo: TradeAlertDto): Promise<void> {
    if (!this.webhookUrl) return;

    const isLong = tradeInfo.action.includes('LONG');
    const isOpen = tradeInfo.action.includes('OPEN');

    // 제목 및 색상 결정
    let title = '';
    let color = 0; // Black

    if (isOpen) {
      title = isLong ? '📈 Long 진입' : '📉 Short 진입';
      color = isLong ? 0x00ff00 : 0xff0000; // Green : Red
    } else {
      title = isLong ? '💰 Long 청산' : '💸 Short 청산';
      // profit check
      const profit = tradeInfo.profit ?? 0;
      color = profit >= 0 ? 0x00ff00 : 0xff0000;
    }

    const payload = {
      embeds: [
        {
          title: `${title} - ${tradeInfo.symbol}`,
          color: color,
          fields: [
            { name: 'Price', value: `${tradeInfo.price}`, inline: true },
            { name: 'Quantity', value: `${tradeInfo.quantity}`, inline: true },
            {
              name: 'Strategy',
              value: tradeInfo.strategyName || 'Manual',
              inline: true,
            },
            ...(tradeInfo.profit !== undefined
              ? [{ name: 'Profit', value: `${tradeInfo.profit}`, inline: true }]
              : []),
          ],
          timestamp: tradeInfo.timestamp.toISOString(),
          footer: {
            text: 'Trading Bot Notification',
          },
        },
      ],
    };

    try {
      await this.sendToDiscord(payload);
    } catch (error) {
      this.logger.error(`Failed to send trade alert: ${error.message}`);
    }
  }

  async sendErrorAlert(error: Error, context?: string): Promise<void> {
    if (!this.webhookUrl) return;

    const payload = {
      content: '🚨 **Critical Error Occurred**',
      embeds: [
        {
          title: context ? `Error in ${context}` : 'System Error',
          description: `\`\`\`${error.message}\n${error.stack?.slice(0, 1000) || ''}\`\`\``,
          color: 0xff0000, // Red
          timestamp: new Date().toISOString(),
        },
      ],
    };

    try {
      await this.sendToDiscord(payload);
    } catch (err) {
      this.logger.error(`Failed to send error alert: ${err.message}`);
    }
  }

  private getColorByLevel(level: NotificationLevel): number {
    switch (level) {
      case NotificationLevel.Info:
        return 0x3498db; // Blue
      case NotificationLevel.Warn:
        return 0xf1c40f; // Yellow
      case NotificationLevel.Error:
        return 0xe74c3c; // Red
      case NotificationLevel.Success:
        return 0x2ecc71; // Green
      default:
        return 0x95a5a6; // Grey
    }
  }

  async sendStartupNotification(
    positions: Position[],
    balances: Balance[],
  ): Promise<void> {
    if (!this.webhookUrl) return;

    const fields = [
      {
        name: 'Positions',
        value: this.formatPositions(positions),
        inline: false,
      },
      {
        name: 'Wallet Balance',
        value: this.formatBalances(balances),
        inline: false,
      },
    ];

    const payload = {
      embeds: [
        {
          title: '🚀 Trading Bot Started',
          description:
            'The bot has successfully started and is monitoring the market.',
          color: this.getColorByLevel(NotificationLevel.Success),
          fields: fields,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await this.sendToDiscord(payload);
  }

  async sendOrderExecutionNotification(
    order: Order,
    positions: Position[],
    balances: Balance[],
  ): Promise<void> {
    if (!this.webhookUrl) return;

    const fields = [
      { name: 'Symbol', value: order.symbol, inline: true },
      { name: 'Side', value: order.side, inline: true },
      { name: 'Type', value: order.type, inline: true },
      {
        name: 'Price',
        value: order.averagePrice ? `${order.averagePrice}` : `${order.price}`,
        inline: true,
      },
      { name: 'Quantity', value: `${order.filledQuantity}`, inline: true },
      { name: 'Status', value: order.status, inline: true },
      { name: 'Order ID', value: order.id, inline: true },
      {
        name: 'Positions',
        value: this.formatPositions(positions),
        inline: false,
      },
      {
        name: 'Wallet Balance',
        value: this.formatBalances(balances),
        inline: false,
      },
    ];

    const payload = {
      embeds: [
        {
          title: `✅ Order Executed - ${order.symbol}`,
          color: this.getColorByLevel(NotificationLevel.Success), // Or dynamic based on side
          fields: fields,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await this.sendToDiscord(payload);
  }

  private formatPositions(positions: Position[]): string {
    if (positions.length === 0) return 'No active positions.';
    return positions
      .map(
        (p) =>
          `**${p.symbol}**: Size: ${p.size}, PnL: ${p.unrealizedPnl.toFixed(2)}`,
      )
      .join('\n');
  }

  private formatBalances(balances: Balance[]): string {
    if (balances.length === 0) return 'No balance info.';
    return balances
      .filter((b) => b.total > 0)
      .map((b) => `**${b.asset}**: ${b.total.toFixed(4)}`)
      .join('\n');
  }

  private async sendToDiscord(payload: any): Promise<void> {
    if (!this.webhookUrl) return;

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Discord API responded with status ${response.status}`);
    }
  }
}
