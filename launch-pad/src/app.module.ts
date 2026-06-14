import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FavouritesController } from './favourites.controller';
import {
  FavoriteLaunch,
  FavoriteLaunchSchema,
  FavouritesService,
} from './favourites.service';
import { Ll2Service } from './ll2.service';
import {
  LaunchesController,
} from './launches.controller';
import {
  LaunchMilestoneEvent,
  LaunchMilestoneEventSchema,
  LaunchesService,
} from './launches.service';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017/launchpad',
    ),
    MongooseModule.forFeature([
      { name: FavoriteLaunch.name, schema: FavoriteLaunchSchema },
      { name: LaunchMilestoneEvent.name, schema: LaunchMilestoneEventSchema },
    ]),
  ],
  controllers: [LaunchesController, FavouritesController],
  providers: [LaunchesService, FavouritesService, Ll2Service],
})
export class AppModule {}
