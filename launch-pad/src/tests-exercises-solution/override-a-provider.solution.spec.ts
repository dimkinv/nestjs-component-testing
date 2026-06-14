import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { LaunchesModule } from '../launches/launches.module';
import { LaunchMilestoneEvent, LaunchesService } from '../launches/launches.service';
import { Ll2Service } from '../launches/ll2.service';
import type { LaunchSummary } from '../launches/launches.types';

describe('TestingModule solution: override a provider', () => {
  let moduleRef: TestingModule;
  let launchesService: LaunchesService;
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

    launchesService = moduleRef.get(LaunchesService);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('overrides Ll2Service while keeping the rest of the slice real', async () => {
    const launches: LaunchSummary[] = [
      {
        id: 'mock-launch',
        name: 'Mock Falcon',
        status: 'upcoming',
        missionName: 'Mock Mission',
        launchDateUtc: '2026-06-14T12:00:00.000Z',
      },
    ];

    ll2ServiceMock.getLaunches.mockResolvedValueOnce(launches);

    await expect(launchesService.getLaunches()).resolves.toEqual({
      data: launches,
    });
    expect(ll2ServiceMock.getLaunches).toHaveBeenCalledTimes(1);
  });
});