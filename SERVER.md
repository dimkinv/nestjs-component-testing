# SpaceX Mission Server

## Overview

A minimal Nest.js backend server for managing SpaceX launches and user favorites. Designed as a practical application for learning component testing patterns in Nest.js.

**Role in Course:** Students will write component tests for this server. The server is implemented by the instructor.

---

## Architecture

```
┌──────────────────────────────────────┐
│         REST API Layer               │
│   (Controllers - responds to client) │
└────────────────┬─────────────────────┘
                 │
┌────────────────▼─────────────────────┐
│       Services Layer                 │
│  • LaunchService                     │
│  • FavoriteService                   │
│  • EventService                      │
└────────────────┬─────────────────────┘
                 │
      ┌──────────┼──────────┬───────────┐
      │          │          │           │
  ┌───▼──┐   ┌───▼──┐   ┌───▼──┐    ┌───▼──────┐
  │  DB  │   │SpaceX│   │Event │    │Queue     │
  │      │   │ API  │   │Store │    │Simulator │
  └──────┘   └──────┘   └──────┘    └──────────┘
```

---

## Database Schema

### Launches Table
```typescript
{
  id: string (primary key),
  spaceXId: string (unique, from SpaceX API),
  name: string,
  rocketName: string,
  launchDate: Date,
  status: 'upcoming' | 'success' | 'failed' | 'unknown',
  createdAt: Date,
  updatedAt: Date
}
```

### Favorites Table
```typescript
{
  id: string (primary key),
  launchId: string (foreign key),
  userId: string,
  createdAt: Date
}
```

---

## REST APIs

### Launches Endpoints

**GET /launches**
- Returns paginated list of all launches
- Query params: `limit`, `offset`, `status` (optional filter)
- Response: `Launch[]`

**GET /launches/:id**
- Returns specific launch by ID
- Response: `Launch`

### Favorites Endpoints

**POST /favorites**
- Add launch to user favorites
- Body: `{ launchId: string, userId: string }`
- Response: `Favorite`

**GET /favorites**
- Get user's favorite launches
- Query param: `userId` (required)
- Response: `Favorite[]` with expanded launch data

**DELETE /favorites/:id**
- Remove favorite
- Response: `{ success: true }`

---

## External API Integration

### SpaceX Public API

Used to fetch real launch data. Server integrates with:
- `GET /launches` - List upcoming/past launches
- `GET /launches/:id` - Get specific launch details

**Integration points:**
- Pull launches on-demand or scheduled sync
- Update launch status
- Handle API errors gracefully (rate limits, timeouts, invalid data)

---

## Event Hub / Queue

Optional but recommended for realistic testing scenarios.

### Events Published by Server

```typescript
{
  type: 'launch.added' | 'favorite.created' | 'favorite.deleted',
  payload: { launchId, userId, timestamp }
}
```

### Events Consumed by Server

```typescript
{
  type: 'spacex.launch.updated',
  payload: { spaceXId, status, launchDate }
}
```

### Queue Implementation
- Use Azure Event Hub or RabbitMQ (abstracted via interfaces)
- EventService handles publishing/subscribing
- Can be mocked entirely in tests

---

## Simulator / Test Helper

Optional CLI tool or utility to:
- Manually publish events to queue
- Update launch statuses
- Seed test data
- Useful for manual testing and exercise scenarios

---

## Modules Organization

```
src/
├── launches/
│   ├── launches.controller.ts
│   ├── launches.service.ts
│   ├── launches.module.ts
│   └── dto/
├── favorites/
│   ├── favorites.controller.ts
│   ├── favorites.service.ts
│   ├── favorites.module.ts
│   └── dto/
├── events/
│   ├── events.service.ts
│   └── events.module.ts
├── external-apis/
│   ├── spacex.client.ts
│   └── spacex.module.ts
└── app.module.ts
```

---

## Testing Scenarios for Students

### Meeting 2 Examples (API & Service Layer)

- Mock SpaceX API client, test controller responses
- Test service logic with mocked database
- Validate request/response contracts
- Test error handling (API failures, invalid data)

### Meeting 3 Examples (External Dependencies)

- Test with real database (Testcontainers)
- Test event publishing/consuming
- Verify data persistence after queue events
- Test event-driven state updates

---

## Technology Stack

- **Framework:** Nest.js
- **Database:** PostgreSQL (or in-memory for dev)
- **Queue:** Azure Event Hub / RabbitMQ (abstracted)
- **External API:** SpaceX Public API (free, no auth required)
- **Testing:** Jest, MSW (API mocking), Testcontainers
- **Runtime:** Node.js 24+

---

## Implementation Notes

- Interfaces and abstractions for easy mocking in tests
- Dependency injection throughout (Nest.js providers)
- No complex business logic—focus on integration patterns
- Error handling for all external dependencies
- Clean separation of concerns (controllers → services → repositories)

---

**Created:** February 2026  
**Purpose:** Reference architecture for Nest.js component testing course
