import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {
  FavoriteLaunch,
  FavoriteLaunchSchema,
  LaunchMilestoneEvent,
  LaunchMilestoneEventSchema,
} from './app.service';

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
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
