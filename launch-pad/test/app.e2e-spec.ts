import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  MongoDBContainer,
  StartedMongoDBContainer,
} from '@testcontainers/mongodb';
import { AppModule } from './../src/app.module';

type FavoriteResponseBody = {
  data: {
    userId: string;
    launchId: string;
    favoritedAt: string;
  };
};

type FavoritesResponseBody = {
  data: Array<{
    userId: string;
    launchId: string;
    favoritedAt: string;
  }>;
};

jest.setTimeout(180000);

describe('Favorites component test', () => {
  let app: INestApplication<App>;
  let mongoContainer: StartedMongoDBContainer;
  let originalMongoUri: string | undefined;

  beforeAll(async () => {
    originalMongoUri = process.env.MONGODB_URI;
    mongoContainer = await new MongoDBContainer('mongo:8.0').start();

    process.env.MONGODB_URI = mongoContainer.getConnectionString();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  }, 180000);

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    if (originalMongoUri === undefined) {
      delete process.env.MONGODB_URI;
    } else {
      process.env.MONGODB_URI = originalMongoUri;
    }

    if (mongoContainer) {
      await mongoContainer.stop();
    }
  }, 180000);

  it('stores a favorite and returns it from the database', async () => {
    const userId = 'component-test-user';
    const launchId = 'falcon9-starlink-1';

    const addFavoriteResponse = await request(app.getHttpServer())
      .post(`/launches/${launchId}/favorite`)
      .set('x-user-id', userId)
      .expect(201);

    const addFavoriteBody = addFavoriteResponse.body as FavoriteResponseBody;

    expect(addFavoriteBody.data.userId).toBe(userId);
    expect(addFavoriteBody.data.launchId).toBe(launchId);
    expect(addFavoriteBody.data.favoritedAt).toEqual(expect.any(String));

    const favoritesResponse = await request(app.getHttpServer())
      .get('/favorites')
      .set('x-user-id', userId)
      .expect(200);

    const favoritesBody = favoritesResponse.body as FavoritesResponseBody;

    expect(favoritesBody).toEqual({
      data: [
        {
          userId,
          launchId,
          favoritedAt: addFavoriteBody.data.favoritedAt,
        },
      ],
    });
  });
});
