import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { FavouritesService } from './favourites.service';

@Controller()
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  @Post('launches/:id/favorite')
  addFavorite(@Param('id') id: string, @Headers('x-user-id') userId?: string) {
    return this.favouritesService.addFavorite(id, this.requireUserId(userId));
  }

  @Delete('launches/:id/favorite')
  removeFavorite(
    @Param('id') id: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.favouritesService.removeFavorite(id, this.requireUserId(userId));
  }

  @Get('favorites')
  getFavorites(@Headers('x-user-id') userId?: string) {
    return this.favouritesService.getFavorites(this.requireUserId(userId));
  }

  private requireUserId(userId?: string): string {
    if (!userId) {
      throw new BadRequestException('x-user-id header is required');
    }

    return userId;
  }
}