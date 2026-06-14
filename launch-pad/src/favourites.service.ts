import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Schema } from 'mongoose';

export class FavoriteLaunch {
  userId!: string;
  launchId!: string;
  favoritedAt!: string;
}

export type FavoriteLaunchDocument = HydratedDocument<FavoriteLaunch>;

export const FavoriteLaunchSchema = new Schema<FavoriteLaunch>(
  {
    userId: { type: String, required: true, index: true },
    launchId: { type: String, required: true },
    favoritedAt: { type: String, required: true },
  },
  {
    versionKey: false,
  },
);

FavoriteLaunchSchema.index({ userId: 1, launchId: 1 }, { unique: true });

@Injectable()
export class FavouritesService {
  constructor(
    @InjectModel(FavoriteLaunch.name)
    private readonly favoriteLaunchModel: Model<FavoriteLaunch>,
  ) {}

  async addFavorite(
    launchId: string,
    userId: string,
  ): Promise<{ data: FavoriteLaunch }> {
    const favorite = await this.favoriteLaunchModel.findOneAndUpdate(
      { userId, launchId },
      {
        userId,
        launchId,
        favoritedAt: new Date().toISOString(),
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    return {
      data: this.mapFavorite(favorite),
    };
  }

  async removeFavorite(
    launchId: string,
    userId: string,
  ): Promise<{ data: { removed: boolean; userId: string; launchId: string } }> {
    const result = await this.favoriteLaunchModel.deleteOne({
      userId,
      launchId,
    });

    return {
      data: {
        removed: result.deletedCount > 0,
        userId,
        launchId,
      },
    };
  }

  async getFavorites(userId: string): Promise<{ data: FavoriteLaunch[] }> {
    const favorites = await this.favoriteLaunchModel
      .find({ userId })
      .sort({ favoritedAt: -1 })
      .lean();

    return {
      data: favorites.map((favorite) => this.mapFavorite(favorite)),
    };
  }

  private mapFavorite(
    favorite: FavoriteLaunch | (FavoriteLaunch & { _id?: unknown }),
  ): FavoriteLaunch {
    return {
      userId: favorite.userId,
      launchId: favorite.launchId,
      favoritedAt: favorite.favoritedAt,
    };
  }
}