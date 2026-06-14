import { INestApplication } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { LaunchesModule } from '../launches/launches.module';
import { LaunchMilestoneEvent } from '../launches/launches.service';
import { Ll2Service } from '../launches/ll2.service';
import type { LaunchSummary } from '../launches/launches.types';

describe('TestingModule solution: create an app', () => {
  let moduleRef: TestingModule;
  let app: INestApplication<App>;
  let ll2ServiceMock: { getLaunches: jest.Mock };

  beforeEach(async () => {
    ll2ServiceMock = {
      getLaunches: jest.fn(),
    };

    moduleRef = await Test.createTestingModule({
      imports: [LaunchesModule],
    })
      .overrideProvider(Ll2Service)
      .useValue(ll2ServiceMock)
      .overrideProvider(getModelToken(LaunchMilestoneEvent.name))
      .useValue({})
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
