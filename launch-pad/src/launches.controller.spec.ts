import { LaunchesController } from './launches.controller';
import { LaunchesService } from './launches.service';

describe('LaunchesController', () => {
  let launchesController: LaunchesController;
  let launchesServiceMock: Partial<LaunchesService>;
  let getLaunchesMock: jest.Mock;

  beforeEach(() => {
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

    launchesServiceMock = {
      getLaunches: getLaunchesMock,
    };

    launchesController = new LaunchesController(
      launchesServiceMock as LaunchesService,
    );
    jest.clearAllMocks();
  });

  describe('getLaunches', () => {
    it('returns launch summaries from the launches service', async () => {
      await expect(launchesController.getLaunches()).resolves.toEqual({
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