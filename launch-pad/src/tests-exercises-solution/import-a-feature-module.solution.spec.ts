import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { FavouritesModule } from '../favourites/favourites.module';
import {
  FavoriteLaunch,
  FavouritesService,
} from '../favourites/favourites.service';

const favoriteLaunchModelMock = {
  find: jest.fn(),
};

describe('TestingModule solution: import a feature module', () => {
  let moduleRef: TestingModule;
  let favouritesService: FavouritesService;
  let findMock: jest.Mock;
  let sortMock: jest.Mock;
  let leanMock: jest.Mock;

  beforeEach(async () => {
    leanMock = jest.fn();
    sortMock = jest.fn().mockReturnValue({
      lean: leanMock,
    });
    findMock = favoriteLaunchModelMock.find as jest.Mock;
    findMock.mockReturnValue({
      sort: sortMock,
    });

    moduleRef = await Test.createTestingModule({
      imports: [FavouritesModule],
    })
      .overrideProvider(getModelToken(FavoriteLaunch.name))
      .useValue(favoriteLaunchModelMock)
      .compile();

    favouritesService = moduleRef.get(FavouritesService);
    jest.clearAllMocks();
  });

  afterEach(async () => {
    if (moduleRef) {
      await moduleRef.close();
    }
  });

  it('imports a narrower feature module instead of AppModule', async () => {
    leanMock.mockResolvedValueOnce([
      {
        userId: 'user-1',
        launchId: 'falcon-9',
        favoritedAt: '2026-06-14T10:00:00.000Z',
      },
    ]);

    await expect(favouritesService.getFavorites('user-1')).resolves.toEqual({
      data: [
        {
          userId: 'user-1',
          launchId: 'falcon-9',
          favoritedAt: '2026-06-14T10:00:00.000Z',
        },
      ],
    });

    expect(findMock).toHaveBeenCalledWith({ userId: 'user-1' });
    expect(sortMock).toHaveBeenCalledWith({ favoritedAt: -1 });
  });
});