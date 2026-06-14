import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LaunchesController } from './launches.controller';
import {
  LaunchMilestoneEvent,
  LaunchMilestoneEventSchema,
  LaunchesService,
} from './launches.service';
import { Ll2Service } from './ll2.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LaunchMilestoneEvent.name, schema: LaunchMilestoneEventSchema },
    ]),
  ],
  controllers: [LaunchesController],
  providers: [LaunchesService, Ll2Service],
  exports: [LaunchesService],
})
export class LaunchesModule {}
