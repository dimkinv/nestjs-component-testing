# Launch Library 2 (LL2) — API Integration Details

> **Companion document to:** Course_Plan_Node_Component_Testing.md  
> **Date:** 2026-06-09  
> **Replaces:** SpaceX API v4 (deprecated — API no longer operational)

---

## 1. API Overview

| Field | Details |
|-------|---------|
| **API** | Launch Library 2 (LL2) v2.3.0 by TheSpaceDevs |
| **Production URL** | `https://ll.thespacedevs.com/2.3.0/` |
| **Development URL** | `https://lldev.thespacedevs.com/2.3.0/` (stale data, **no rate limits**) |
| **Auth** | None required (free tier) |
| **Rate Limit** | 15 requests/hour (production). Dev endpoint: **unlimited**. |
| **Docs** | https://ll.thespacedevs.com/2.3.0/swagger |
| **License** | Apache 2.0 |

> **Tip:** Use the dev URL (`lldev.thespacedevs.com`) during development. Configure via env variable. In component tests, everything is mocked with MSW — neither URL is hit.

---

## 2. Response Modes

LL2 supports 3 response verbosity levels via the `mode` query parameter:

| Mode | Schema Level | Use Case |
|------|-------------|----------|
| `mode=list` | `LaunchMini` — minimal fields | Fast listing, smallest payload |
| `mode=normal` | `LaunchNormal` — moderate detail (default) | List views in the app |
| `mode=detailed` | `LaunchDetailed` — all nested objects | Single launch detail view |

**For our app:**
- List endpoints → `mode=normal`
- Detail endpoint → `mode=detailed`

---

## 3. Pagination

All list endpoints return a standard paginated envelope:

```json
{
  "count": 7341,
  "next": "https://ll.thespacedevs.com/2.3.0/launches/?limit=10&offset=10",
  "previous": null,
  "results": [ ... ]
}
```

| Param | Type | Default | Max | Description |
|-------|------|---------|-----|-------------|
| `limit` | int | 10 | 100 | Results per page |
| `offset` | int | 0 | — | Pagination offset |

---

## 4. Migration: SpaceX API → LL2

| # | LaunchPad Feature | Old SpaceX Endpoint | New LL2 Endpoint |
|---|-------------------|---------------------|------------------|
| 1 | List all launches | `GET /v4/launches` | `GET /2.3.0/launches/?mode=normal&limit=20` |
| 2 | Get launch by ID | `GET /v4/launches/:id` | `GET /2.3.0/launches/{id}/?mode=detailed` |
| 3 | Upcoming launches | `GET /v4/launches/upcoming` | `GET /2.3.0/launches/upcoming/?mode=normal&limit=20` |
| 4 | Past launches | `GET /v4/launches/past` | `GET /2.3.0/launches/previous/?mode=normal&limit=20` |
| 5 | Rocket details | `GET /v4/rockets/:id` | `GET /2.3.0/launcher_configurations/{id}/` |

---

## 5. Endpoint Details

### 5.1 List Upcoming Launches

```
GET /2.3.0/launches/upcoming/?mode=normal&limit=20
```

**Useful Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `mode` | string | `list` \| `normal` \| `detailed` |
| `limit` | int | Results per page (max 100) |
| `offset` | int | Pagination offset |
| `search` | string | Text search on launch name |
| `ordering` | string | Sort field, e.g. `net` or `-net` |
| `lsp__name` | string | Filter by launch service provider (e.g. `SpaceX`) |
| `hide_recent_previous` | bool | Exclude recent past launches (default false) |

**Response (200 OK):**

```json
{
  "count": 182,
  "next": "https://ll.thespacedevs.com/2.3.0/launches/upcoming/?limit=20&offset=20",
  "previous": null,
  "results": [
    {
      "id": "e3df2ecd-c239-472f-95e4-2b89b4f75800",
      "name": "Falcon 9 Block 5 | Starlink Group 10-54",
      "slug": "falcon-9-block-5-starlink-group-10-54",
      "net": "2026-06-12T12:27:00Z",
      "net_precision": {
        "id": 1,
        "name": "Minute",
        "abbrev": "MIN"
      },
      "status": {
        "id": 1,
        "name": "Go for Launch",
        "abbrev": "Go",
        "description": "Current T-0 confirmed by official or reliable sources."
      },
      "launch_service_provider": {
        "id": 121,
        "name": "SpaceX",
        "type": "Commercial"
      },
      "rocket": {
        "id": 1234,
        "configuration": {
          "id": 164,
          "name": "Falcon 9 Block 5",
          "family": "Falcon",
          "full_name": "Falcon 9 Block 5"
        }
      },
      "mission": {
        "id": 5678,
        "name": "Starlink Group 10-54",
        "description": "A batch of satellites for Starlink mega-constellation...",
        "type": "Communications",
        "orbit": {
          "id": 8,
          "name": "Low Earth Orbit",
          "abbrev": "LEO"
        }
      },
      "pad": {
        "id": 80,
        "name": "Space Launch Complex 40",
        "location": {
          "id": 12,
          "name": "Cape Canaveral SFS, FL, USA"
        }
      },
      "image": {
        "id": 100,
        "name": "Falcon 9 Block 5",
        "image_url": "https://...",
        "thumbnail_url": "https://..."
      }
    }
  ]
}
```

### 5.2 List Previous Launches

```
GET /2.3.0/launches/previous/?mode=normal&limit=20
```

Same response shape as upcoming. Additional useful date filters:

| Param | Type | Description |
|-------|------|-------------|
| `net__gte` | ISO 8601 datetime | Launches **after** this date |
| `net__lte` | ISO 8601 datetime | Launches **before** this date |

### 5.3 Get Launch by ID

```
GET /2.3.0/launches/{id}/?mode=detailed
```

**Response (200 OK):** Same core fields as list item, plus additional nested objects:

| Extra Field | Description |
|-------------|-------------|
| `vid_urls[]` | Webcast URLs with `priority`, `title`, `url`, `type` |
| `info_urls[]` | Info/article links |
| `rocket.configuration` | Full launcher config with specs (height, diameter, thrust, etc.) |
| `rocket.first_stage[]` | First stage details (landing info, reuse count) |
| `rocket.spacecraft_flights[]` | Crewed spacecraft info |
| `rocket.payload_flights[]` | Payload details |
| `pad` | Full pad object with `latitude`, `longitude`, `map_image` |
| `program[]` | Related programs (e.g. Starship, ISS, Artemis) |

### 5.4 Get Launcher Configuration (Rocket Details)

```
GET /2.3.0/launcher_configurations/{id}/
```

Replaces SpaceX's `/v4/rockets/:id`. Returns detailed rocket/vehicle specs.

**Response (200 OK):**

```json
{
  "id": 164,
  "name": "Falcon 9 Block 5",
  "family": "Falcon",
  "full_name": "Falcon 9 Block 5",
  "manufacturer": {
    "id": 121,
    "name": "SpaceX",
    "type": "Commercial"
  },
  "length": 70.0,
  "diameter": 3.7,
  "maiden_flight": "2018-05-11",
  "launch_mass": 549,
  "leo_capacity": 22800,
  "gto_capacity": 8300,
  "to_thrust": 7607,
  "consecutive_successful_launches": 200,
  "successful_launches": 350,
  "failed_launches": 1,
  "reusable": true,
  "image": {
    "image_url": "https://...",
    "thumbnail_url": "https://..."
  }
}
```

---

## 6. How It Fits in the LaunchPad Design

### 6.1 Endpoint-to-Integration Mapping

| LaunchPad Endpoint | LL2 Call | DB | Event Hub | Notes |
|--------------------|----------|----|-----------|-------|
| `GET /launches` | ✅ `launches/upcoming/` | — | — | Proxies LL2 with field mapping |
| `GET /launches/:id` | ✅ `launches/{id}/` | — | — | Proxies LL2 detailed mode |
| `POST /launches/:id/favorite` | — | ✅ Write | — | Stores LL2 launch UUID as FK |
| `DELETE /launches/:id/favorite` | — | ✅ Delete | — | |
| `GET /favorites` | Optional LL2 enrichment | ✅ Read | — | Could cache launch data locally |
| `POST /launches/:id/simulate` | — | — | ✅ Publish | Uses LL2 launch UUID for correlation |
| `GET /launches/:id/events` | — | ✅ Read | ✅ Consumed | Events consumed & persisted |

### 6.2 Data Flow

```
                    ┌──────────────┐
                    │  LL2 API     │
                    │  (upstream)  │
                    └──────┬───────┘
                           │ HTTP (mocked with MSW in tests)
                           ▼
Client ──────▶ LaunchPad API (Nest.js)
                    │              │
                    ▼              ▼
              ┌──────────┐  ┌──────────────┐
              │PostgreSQL │  │Azure Event   │
              │(TypeORM)  │  │Hub           │
              │favorites  │  │launch events │
              └──────────┘  └──────────────┘
              Testcontainers  Testcontainers
              in tests        in tests
```

---

## 7. Component Test Mocking with MSW

Students will mock LL2 endpoints using MSW. Example handler:

```typescript
import { http, HttpResponse } from 'msw';

// Mock fixture — realistic but minimal
const mockLaunches = {
  count: 2,
  next: null,
  previous: null,
  results: [
    {
      id: 'e3df2ecd-c239-472f-95e4-2b89b4f75800',
      name: 'Falcon 9 Block 5 | Starlink Group 10-54',
      net: '2026-06-12T12:27:00Z',
      status: { id: 1, name: 'Go for Launch', abbrev: 'Go' },
      launch_service_provider: { id: 121, name: 'SpaceX', type: 'Commercial' },
      rocket: {
        id: 1234,
        configuration: { id: 164, name: 'Falcon 9 Block 5', family: 'Falcon' },
      },
      mission: {
        id: 5678,
        name: 'Starlink Group 10-54',
        description: 'A batch of satellites...',
        type: 'Communications',
        orbit: { id: 8, name: 'Low Earth Orbit', abbrev: 'LEO' },
      },
      pad: {
        id: 80,
        name: 'Space Launch Complex 40',
        location: { id: 12, name: 'Cape Canaveral SFS, FL, USA' },
      },
      image: null,
    },
  ],
};

export const handlers = [
  // List upcoming launches
  http.get('*/2.3.0/launches/upcoming/*', () => {
    return HttpResponse.json(mockLaunches);
  }),

  // Get launch by ID
  http.get('*/2.3.0/launches/:id/', ({ params }) => {
    const launch = mockLaunches.results.find((l) => l.id === params.id);
    if (!launch) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json(launch);
  }),
];
```

**Key testing notes:**
- Mock only the fields the service actually maps — LL2 responses are large; keep fixtures minimal
- Store fixtures in dedicated `__fixtures__/` files for reuse across tests
- Test edge cases: 404 (unknown ID), 429 (rate limited), 500 (server error), empty results

---

## 8. Environment Configuration

```env
# .env
LL2_BASE_URL=https://ll.thespacedevs.com/2.3.0

# For development (no rate limits, stale data):
# LL2_BASE_URL=https://lldev.thespacedevs.com/2.3.0
```

Injected via NestJS `ConfigModule` so it can be overridden per environment and in tests.

---

## 9. Rate Limit Summary

| Environment | Base URL | Rate Limit | Notes |
|-------------|----------|------------|-------|
| **Production** | `ll.thespacedevs.com` | 15 req/hour | Consider caching |
| **Development** | `lldev.thespacedevs.com` | Unlimited | Stale/limited data |
| **Component Tests** | N/A | N/A | All calls mocked with MSW |

> Since all LL2 calls are mocked via MSW in component tests, rate limits are irrelevant for the course exercises.

---

*This document is a companion to `Course_Plan_Node_Component_Testing.md`*
