import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { LaunchesModule } from './launches/launches.module';
import { FavouritesModule } from './favourites/favourites.module';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
    }),
    MongooseModule.forRoot(
      process.env.MONGODB_URI ?? 'mongodb://localhost:27017/launchpad',
    ),
    LaunchesModule,
    FavouritesModule,
  ],
})
export class AppModule {}
