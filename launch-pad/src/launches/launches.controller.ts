import { Controller, Get, Param, Post } from '@nestjs/common';
import { LaunchesService } from './launches.service';

@Controller()
export class LaunchesController {
  constructor(private readonly launchesService: LaunchesService) {}

  @Get('launches')
  getLaunches() {
    return this.launchesService.getLaunches();
  }

  @Get('launches/:id')
  getLaunchById(@Param('id') id: string) {
    return this.launchesService.getLaunchById(id);
  }

  @Post('launches/:id/simulate')
  simulateLaunch(@Param('id') id: string) {
    return this.launchesService.simulateLaunch(id);
  }

  @Get('launches/:id/events')
  getLaunchEvents(@Param('id') id: string) {
    return this.launchesService.getLaunchEvents(id);
  }
}