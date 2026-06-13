import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { AppService } from './../src/app.service';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
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

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AppService)
      .useValue({
        getLaunches: getLaunchesMock,
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/launches (GET)', () => {
    return request(app.getHttpServer())
      .get('/launches')
      .expect(200)
      .expect({
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
  });
});
