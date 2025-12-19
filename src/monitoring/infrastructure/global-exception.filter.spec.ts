import { Test, TestingModule } from '@nestjs/testing';
import { GlobalExceptionFilter } from './global-exception.filter';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { DiscordNotificationService } from './discord-notification.service';

describe('GlobalExceptionFilter', () => {
  let filter: GlobalExceptionFilter;
  let notificationService: DiscordNotificationService;

  const mockNotificationService = {
    sendErrorAlert: jest.fn().mockResolvedValue(undefined),
  };

  const mockJson = jest.fn();
  const mockStatus = jest.fn().mockReturnValue({ json: mockJson });
  const mockGetResponse = jest.fn().mockReturnValue({ status: mockStatus });
  const mockGetRequest = jest.fn().mockReturnValue({ url: '/test-url' });
  const mockHttpArgumentsHost = jest.fn().mockReturnValue({
    getResponse: mockGetResponse,
    getRequest: mockGetRequest,
  });

  const mockArgumentsHost = {
    switchToHttp: mockHttpArgumentsHost,
  };

  beforeEach(async () => {
    mockJson.mockClear();
    mockStatus.mockClear();
    mockNotificationService.sendErrorAlert.mockClear();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GlobalExceptionFilter,
        {
          provide: DiscordNotificationService,
          useValue: mockNotificationService,
        },
      ],
    }).compile();

    filter = module.get<GlobalExceptionFilter>(GlobalExceptionFilter);
    notificationService = module.get<DiscordNotificationService>(
      DiscordNotificationService,
    );
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should catch http exception and send alert', async () => {
    const exception = new HttpException('Forbidden', HttpStatus.FORBIDDEN);

    await filter.catch(
      exception,
      mockArgumentsHost as unknown as ArgumentsHost,
    );

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
    expect(mockJson).toHaveBeenCalled();
    expect(mockNotificationService.sendErrorAlert).toHaveBeenCalledWith(
      exception,
      expect.stringContaining('/test-url'),
    );
  });

  it('should catch unknown error and send alert', async () => {
    const error = new Error('Unknown Error');

    await filter.catch(error, mockArgumentsHost as unknown as ArgumentsHost);

    expect(mockStatus).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockNotificationService.sendErrorAlert).toHaveBeenCalledWith(
      error,
      expect.stringContaining('/test-url'),
    );
  });
});
