import { BadRequestException } from '@nestjs/common';
import { FavouritesController } from './favourites.controller';
import { FavouritesService } from './favourites.service';

describe('FavouritesController', () => {
  let favouritesController: FavouritesController;
  let favouritesServiceMock: Partial<FavouritesService>;
  let getFavoritesMock: jest.Mock;

  beforeEach(() => {
    getFavoritesMock = jest.fn().mockResolvedValue({
      data: [],
    });

    favouritesServiceMock = {
      getFavorites: getFavoritesMock,
      addFavorite: jest.fn(),
      removeFavorite: jest.fn(),
    };

    favouritesController = new FavouritesController(
      favouritesServiceMock as FavouritesService,
    );
    jest.clearAllMocks();
  });

  describe('getFavorites', () => {
    it('returns favorites for the supplied user', async () => {
      await expect(favouritesController.getFavorites('user-1')).resolves.toEqual(
        {
          data: [],
        },
      );

      expect(getFavoritesMock).toHaveBeenCalledWith('user-1');
    });

    it('throws when the user header is missing', () => {
      expect(() => favouritesController.getFavorites()).toThrow(
        new BadRequestException('x-user-id header is required'),
      );
    });
  });
});