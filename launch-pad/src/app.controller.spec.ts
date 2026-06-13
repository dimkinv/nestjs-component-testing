import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;
  let getLaunchesMock: jest.Mock;

  beforeEach(async () => {
    getLaunchesMock = jest.fn().mockResolvedValue({
      data: [
        {
          id: 'launch-1',
          name: 'FalconSat',
          status: 'past',
          missionName: 'FalconSat',
          launchDateUtc: '2006-03-24T22:30:00.000Z',
        },
      ],
    });

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            getLaunches: getLaunchesMock,
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('getLaunches', () => {
    it('returns launch summaries from the app service', async () => {
      await expect(appController.getLaunches()).resolves.toEqual({
        data: [
          {
            id: 'launch-1',
            name: 'FalconSat',
            status: 'past',
            missionName: 'FalconSat',
            launchDateUtc: '2006-03-24T22:30:00.000Z',
          },
        ],
      });
      expect(getLaunchesMock).toHaveBeenCalledTimes(1);
    });
  });
});
