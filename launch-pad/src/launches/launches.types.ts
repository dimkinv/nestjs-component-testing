export type LaunchStatus = 'past' | 'upcoming';

export interface LaunchSummary {
  id: string;
  name: string;
  status: LaunchStatus;
  missionName: string;
  launchDateUtc: string;
}

export interface LaunchDetails extends LaunchSummary {
  rocket: {
    id: string;
    name: string;
    type: string;
  };
  launchpad: {
    id: string;
    name: string;
    locality: string;
  };
  details: string;
}