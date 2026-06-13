import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { HydratedDocument, Model, Schema } from 'mongoose';
import { Ll2Service } from './ll2.service';

type LaunchSummaries = Awaited<ReturnType<Ll2Service['getLaunches']>>;
type LaunchDetail = Awaited<ReturnType<Ll2Service['getLaunchById']>>;

export type MilestoneType =
  | 'COUNTDOWN'
  | 'LIFTOFF'
  | 'MAX_Q'
  | 'MECO'
  | 'STAGE_SEPARATION'
  | 'PAYLOAD_DEPLOY';

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

export class LaunchMilestoneEvent {
  id!: string;
  launchId!: string;
  type!: MilestoneType;
  missionTime!: string;
  description!: string;
  publishedAt!: string;
}

export type LaunchMilestoneEventDocument =
  HydratedDocument<LaunchMilestoneEvent>;

export const LaunchMilestoneEventSchema = new Schema<LaunchMilestoneEvent>(
  {
    id: { type: String, required: true, unique: true },
    launchId: { type: String, required: true, index: true },
    type: { type: String, required: true },
    missionTime: { type: String, required: true },
    description: { type: String, required: true },
    publishedAt: { type: String, required: true },
  },
  {
    versionKey: false,
  },
);

@Injectable()
export class AppService {
  constructor(
    private readonly ll2Service: Ll2Service,
    @InjectModel(FavoriteLaunch.name)
    private readonly favoriteLaunchModel: Model<FavoriteLaunch>,
    @InjectModel(LaunchMilestoneEvent.name)
    private readonly launchMilestoneEventModel: Model<LaunchMilestoneEvent>,
  ) {}

  private readonly eventsByLaunchId: Record<string, LaunchMilestoneEvent[]> = {
    'falcon9-starlink-1': [
      {
        id: 'evt-1',
        launchId: 'falcon9-starlink-1',
        type: 'COUNTDOWN',
        missionTime: 'T-00:10',
        description: 'Final countdown has started.',
        publishedAt: '2026-04-18T10:02:00.000Z',
      },
      {
        id: 'evt-2',
        launchId: 'falcon9-starlink-1',
        type: 'LIFTOFF',
        missionTime: 'T+00:00',
        description: 'Vehicle cleared the pad.',
        publishedAt: '2026-04-18T10:12:00.000Z',
      },
    ],
    'falcon9-crew-orbit': [
      {
        id: 'evt-3',
        launchId: 'falcon9-crew-orbit',
        type: 'COUNTDOWN',
        missionTime: 'T-00:10',
        description: 'Countdown sequence queued for simulation.',
        publishedAt: '2026-11-02T14:20:00.000Z',
      },
    ],
  };

  async getLaunches(): Promise<{ data: LaunchSummaries }> {
    return {
      data: await this.ll2Service.getLaunches(),
    };
  }

  async getLaunchById(id: string): Promise<{ data: LaunchDetail }> {
    return {
      data: await this.ll2Service.getLaunchById(id),
    };
  }

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

  async simulateLaunch(launchId: string): Promise<{
    data: {
      launchId: string;
      status: 'queued';
      events: LaunchMilestoneEvent[];
    };
  }> {
    const events =
      this.eventsByLaunchId[launchId] ?? this.buildDefaultEvents(launchId);

    await Promise.all(
      events.map((event) =>
        this.launchMilestoneEventModel.updateOne({ id: event.id }, event, {
          upsert: true,
        }),
      ),
    );

    return {
      data: {
        launchId,
        status: 'queued',
        events,
      },
    };
  }

  async getLaunchEvents(
    launchId: string,
  ): Promise<{ data: LaunchMilestoneEvent[] }> {
    const events = await this.launchMilestoneEventModel
      .find({ launchId })
      .sort({ publishedAt: 1 })
      .lean();

    return {
      data:
        events.length > 0
          ? events.map((event) => this.mapEvent(event))
          : (this.eventsByLaunchId[launchId] ??
            this.buildDefaultEvents(launchId)),
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

  private mapEvent(
    event: LaunchMilestoneEvent | (LaunchMilestoneEvent & { _id?: unknown }),
  ): LaunchMilestoneEvent {
    return {
      id: event.id,
      launchId: event.launchId,
      type: event.type,
      missionTime: event.missionTime,
      description: event.description,
      publishedAt: event.publishedAt,
    };
  }

  private buildDefaultEvents(launchId: string): LaunchMilestoneEvent[] {
    return [
      {
        id: `${launchId}-countdown`,
        launchId,
        type: 'COUNTDOWN',
        missionTime: 'T-00:10',
        description: 'Default mock countdown event.',
        publishedAt: '2026-06-10T09:30:00.000Z',
      },
      {
        id: `${launchId}-liftoff`,
        launchId,
        type: 'LIFTOFF',
        missionTime: 'T+00:00',
        description: 'Default mock liftoff event.',
        publishedAt: '2026-06-10T09:40:00.000Z',
      },
      {
        id: `${launchId}-payload-deploy`,
        launchId,
        type: 'PAYLOAD_DEPLOY',
        missionTime: 'T+31:15',
        description: 'Default mock payload deployment event.',
        publishedAt: '2026-06-10T10:11:15.000Z',
      },
    ];
  }
}
