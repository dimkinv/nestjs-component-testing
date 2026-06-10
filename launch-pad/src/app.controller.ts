import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('launches')
  getLaunches() {
    return this.appService.getLaunches();
  }

  @Get('launches/:id')
  getLaunchById(@Param('id') id: string) {
    return this.appService.getLaunchById(id);
  }

  @Post('launches/:id/favorite')
  addFavorite(@Param('id') id: string, @Headers('x-user-id') userId?: string) {
    return this.appService.addFavorite(id, this.requireUserId(userId));
  }

  @Delete('launches/:id/favorite')
  removeFavorite(
    @Param('id') id: string,
    @Headers('x-user-id') userId?: string,
  ) {
    return this.appService.removeFavorite(id, this.requireUserId(userId));
  }

  @Get('favorites')
  getFavorites(@Headers('x-user-id') userId?: string) {
    return this.appService.getFavorites(this.requireUserId(userId));
  }

  @Post('launches/:id/simulate')
  simulateLaunch(@Param('id') id: string) {
    return this.appService.simulateLaunch(id);
  }

  @Get('launches/:id/events')
  getLaunchEvents(@Param('id') id: string) {
    return this.appService.getLaunchEvents(id);
  }

  private requireUserId(userId?: string): string {
    if (!userId) {
      throw new BadRequestException('x-user-id header is required');
    }

    return userId;
  }
}
