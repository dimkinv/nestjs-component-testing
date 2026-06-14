import { INestApplication, Module } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { LaunchMilestoneEvent, LaunchesService } from '../launches.service';
import { LaunchesController } from '../launches.controller';
import { Ll2Service } from '../ll2.service';
import type { LaunchSummary } from '../launches.types';

const launchMilestoneEventModelMock = {};

@Module({
  controllers: [LaunchesController],
  providers: [
    LaunchesService,
    Ll2Service,
    {
      provide: getModelToken(LaunchMilestoneEvent.name),
      useValue: launchMilestoneEventModelMock,
    },
  ],
})
class LaunchesFeatureModule {}

describe('TestingModule solution: create an app', () => {
  let moduleRef: TestingModule;
  let app: INestApplication<App>;
  let ll2ServiceMock: { getLaunches: jest.Mock };

  beforeEach(async () => {
    ll2ServiceMock = {
      getLaunches: jest.fn(),
    };

    moduleRef = await Test.createTestingModule({
      imports: [LaunchesFeatureModule],
    })
      .overrideProvider(Ll2Service)
      .useValue(ll2ServiceMock)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('creates a Nest app from a TestingModule and exercises the HTTP surface', async () => {
    const launches: LaunchSummary[] = [
      {
        id: 'launch-1',
        name: 'FalconSat',
        status: 'upcoming',
        missionName: 'FalconSat',
        launchDateUtc: '2006-03-24T22:30:00.000Z',
      },
    ];

    ll2ServiceMock.getLaunches.mockResolvedValueOnce(launches);

    await request(app.getHttpServer()).get('/launches').expect(200).expect({
      data: launches,
    });
  });
});
