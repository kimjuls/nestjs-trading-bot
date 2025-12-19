import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DiscordNotificationService } from './discord-notification.service';

@Catch()
@Injectable()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  constructor(
    private readonly notificationService: DiscordNotificationService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : exception instanceof Error
          ? exception.message
          : 'Internal server error';

    this.logger.error(`Exception occurred: ${JSON.stringify(message)}`);

    // 비동기로 알림 전송 (await 안함)
    if (exception instanceof Error) {
      this.notificationService
        .sendErrorAlert(exception, `Request to ${request.url}`)
        .catch((err) => {
          this.logger.error(`Failed to send alert: ${err.message}`);
        });
    } else {
      // Error 객체가 아닌 경우 에러로 래핑
      this.notificationService
        .sendErrorAlert(
          new Error(JSON.stringify(message)),
          `Request to ${request.url}`,
        )
        .catch((err) => {
          this.logger.error(`Failed to send alert: ${err.message}`);
        });
    }

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: message,
    });
  }
}
