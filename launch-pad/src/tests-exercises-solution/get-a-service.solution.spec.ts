import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { LaunchMilestoneEvent, LaunchesService } from '../launches/launches.service';
import { Ll2Service } from '../launches/ll2.service';
import type { LaunchSummary } from '../launches/launches.types';

describe('TestingModule solution: get a service', () => {
  let moduleRef: TestingModule;
  let launchesService: LaunchesService;
  let ll2ServiceMock: { getLaunches: jest.Mock };

  beforeEach(async () => {
    ll2ServiceMock = {
      getLaunches: jest.fn(),
    };

    moduleRef = await Test.createTestingModule({
      providers: [
        LaunchesService,
        {
          provide: Ll2Service,
          useValue: ll2ServiceMock,
        },
        {
          provide: getModelToken(LaunchMilestoneEvent.name),
          useValue: {},
        },
      ],
    }).compile();

    launchesService = moduleRef.get(LaunchesService);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('gets LaunchesService from a compiled TestingModule and calls getLaunches', async () => {
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

    await expect(launchesService.getLaunches()).resolves.toEqual({
      data: launches,
    });
    expect(ll2ServiceMock.getLaunches).toHaveBeenCalledTimes(1);
  });
});