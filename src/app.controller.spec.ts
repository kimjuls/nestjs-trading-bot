import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    describe('checkHealth', () => {
      it('should complete without a return value', () => {
        expect(appController.checkHealth()).toBeUndefined();
      });
    });
  });
});
