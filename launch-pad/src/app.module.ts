import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LaunchesModule } from './launches/launches.module';
import { FavouritesModule } from './favourites/favourites.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017/launchpad',
    ),
    LaunchesModule,
    FavouritesModule,
  ],
})
export class AppModule {}
