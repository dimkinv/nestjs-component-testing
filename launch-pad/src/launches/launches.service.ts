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
export class LaunchesService {
  constructor(
    private readonly ll2Service: Ll2Service,
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