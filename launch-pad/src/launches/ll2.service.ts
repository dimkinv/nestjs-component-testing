import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  fetch as undiciFetch,
  type Response as UndiciResponse,
  ProxyAgent,
} from 'undici';
import type { LaunchDetails, LaunchSummary } from './launches.types';

interface Ll2LaunchListResponse {
  results: Ll2Launch[];
}

interface Ll2Launch {
  id: string;
  name: string;
  net: string;
  mission: {
    name: string;
    description: string | null;
  } | null;
  rocket: {
    configuration: {
      id: number;
      name: string;
      family: string;
    } | null;
  } | null;
  pad: {
    id: number;
    name: string;
    location: {
      name: string;
    } | null;
  } | null;
}

interface Ll2RocketConfiguration {
  id: number;
  name: string;
  family: string;
  full_name: string;
}

@Injectable()
export class Ll2Service {
  private readonly logger = new Logger(Ll2Service.name);
  private readonly ll2ApiBaseUrl =
    process.env.LL2_BASE_URL ?? 'https://ll.thespacedevs.com/2.3.0';
  private readonly ll2ProxyUrl =
    process.env.LL2_PROXY_URL ?? 'http://cso.proxy.att.com:8888';
  private readonly ll2ProxyAgent = this.ll2ProxyUrl
    ? new ProxyAgent(this.ll2ProxyUrl)
    : undefined;

  async getLaunches(): Promise<LaunchSummary[]> {
    const launches = await this.fetchLl2<Ll2LaunchListResponse>(
      '/launches/upcoming/?mode=normal&limit=20',
    );

    return launches.results.map((launch) => this.mapLaunchSummary(launch));
  }

  async getLaunchById(id: string): Promise<LaunchDetails | null> {
    const launch = await this.fetchLl2<Ll2Launch | null>(
      `/launches/${id}/?mode=detailed`,
      {
        allowNotFound: true,
      },
    );

    if (!launch) {
      return null;
    }

    const rocketConfigurationId = launch.rocket?.configuration?.id;
    const rocket = rocketConfigurationId
      ? await this.fetchLl2<Ll2RocketConfiguration>(
          `/launcher_configurations/${rocketConfigurationId}/`,
        )
      : null;

    return this.mapLaunchDetails(launch, rocket);
  }

  private mapLaunchSummary(launch: Ll2Launch): LaunchSummary {
    return {
      id: launch.id,
      name: launch.name,
      status: 'upcoming',
      missionName: launch.mission?.name ?? launch.name,
      launchDateUtc: launch.net,
    };
  }

  private mapLaunchDetails(
    launch: Ll2Launch,
    rocket: Ll2RocketConfiguration | null,
  ): LaunchDetails {
    return {
      ...this.mapLaunchSummary(launch),
      rocket: {
        id: String(rocket?.id ?? launch.rocket?.configuration?.id ?? ''),
        name: rocket?.full_name ?? launch.rocket?.configuration?.name ?? '',
        type: rocket?.family ?? launch.rocket?.configuration?.family ?? '',
      },
      launchpad: {
        id: String(launch.pad?.id ?? ''),
        name: launch.pad?.name ?? '',
        locality: launch.pad?.location?.name ?? '',
      },
      details: launch.mission?.description ?? '',
    };
  }

  private async fetchLl2<T>(
    path: string,
    options?: { allowNotFound?: boolean },
  ): Promise<T> {
    let response: UndiciResponse;
    const url = this.buildLl2Url(path);

    this.logger.log(`Fetching LL2: ${url}${this.ll2ProxyAgent ? ' (via proxy)' : ''}`);

    try {
      response = await undiciFetch(url, {
        ...(this.ll2ProxyAgent && { dispatcher: this.ll2ProxyAgent }),
      });
    } catch (error) {
      this.logger.error(`LL2 fetch failed for ${path}: ${error}`);
      throw new ServiceUnavailableException(
        `Unable to reach LL2 API for ${path}`,
        {
          cause: error,
        },
      );
    }

    this.logger.log(`LL2 response for ${path}: ${response.status}`);

    if (options?.allowNotFound && response.status === 404) {
      return null as T;
    }

    if (!response.ok) {
      throw new BadGatewayException(
        `LL2 API request failed for ${path} with status ${response.status}`,
      );
    }

    return (await response.json()) as T;
  }

  private buildLl2Url(path: string): string {
    const base = this.ll2ApiBaseUrl.endsWith('/')
      ? this.ll2ApiBaseUrl
      : this.ll2ApiBaseUrl + '/';
    const relativePath = path.startsWith('/') ? path.slice(1) : path;
    const url = new URL(relativePath, base);

    if (!url.searchParams.has('format')) {
      url.searchParams.set('format', 'json');
    }

    return url.toString();
  }
}
