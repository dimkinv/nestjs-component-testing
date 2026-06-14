import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FavouritesController } from './favourites.controller';
import {
  FavoriteLaunch,
  FavoriteLaunchSchema,
  FavouritesService,
} from './favourites.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FavoriteLaunch.name, schema: FavoriteLaunchSchema },
    ]),
  ],
  controllers: [FavouritesController],
  providers: [FavouritesService],
  exports: [FavouritesService],
})
export class FavouritesModule {}
