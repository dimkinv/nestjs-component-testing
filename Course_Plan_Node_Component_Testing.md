# Course Creation Plan: Node.js Component Testing

> **Status:** Draft v3 — decisions locked in  
> **Date:** 2026-06-09  
> **Author:** Danny Vernovsky  

---

## 1. Course Overview

An **interactive, hands-on course** on component testing in Node.js (using Nest.js). Students work with a pre-built backend application — **"LaunchPad"** — that displays SpaceX current, past, and scheduled launches. The app integrates with an external API, a database, and Azure Event Hub, giving students a rich surface to practice writing component tests across all integration boundaries.

> **Important:** The LaunchPad app is **fully pre-implemented by the instructor**. Students receive the complete working application and focus exclusively on writing component tests.

---

## 2. Syllabus

### Prerequisites
- TypeScript  
- Jest  
- Nest.js  

### Meeting 1 — Foundations and Testing Strategy in Node.js (~2 hr)
- Why unit tests are not enough  
- Test pyramid vs. modern testing strategy (UT + component + integration)  
- Different layers of component tests (API, database, messaging, external services)  
- What is a "component" in Node.js / Nest.js applications  
- When to use unit vs. component tests in Node.js projects  
- Nest.js testing modules: `TestingModule`, dependency overrides, providers  
- Component test setup patterns for controllers, services, modules  

### Meeting 2 — Node.js Component Testing — Hands-On (~2 hr)
- API mocking example with MSW (Mock Service Worker)  
- Testcontainers basics for Node.js  
- Container scope decisions (`beforeAll`, `beforeEach`, per-test) + test data management and isolation strategies  
- Reusing test containers for faster suites  
- Flaky test prevention and suite stability  

---

## 3. Decisions Made

| # | Decision | Choice | Rationale |
|---|----------|--------|-----------|
| 1 | External API | **SpaceX API v4** | No auth, rich data, simple REST, great fit for space theme. |
| 2 | Event System | **Azure Event Hub** | Aligns with team's cloud stack. Emulator available as Docker container. |
| 3 | Event Hub Client | **`@azure/event-hubs`** (official npm) | Official Azure SDK — same library used in production. |
| 4 | ORM | **TypeORM** | Nest.js native integration, well-documented, sufficient for the course. |
| 5 | Student Starting Point | **Pre-built app + skeleton test files** | Backend is fully implemented by instructor. Students write tests only. |
| 6 | User Identity | **`x-user-id` header** | Simple approach — authentication is out of scope for this course. |
| 7 | Homework | **None** | No homework between meetings. Students set up locally before Meeting 2. |

---

## 4. Integration Research

### 4.1 External Launch API — SpaceX API v4 ✅

| Field | Details |
|-------|---------|
| **URL** | `api.spacexdata.com/v4` |
| **Auth** | None required |
| **Status** | ✅ Operational |
| **Data** | Past launches, upcoming launches, latest launch, rockets, cores, capsules, launchpads |
| **Notes** | Repo archived but API is live and stable. Rich JSON responses, simple REST endpoints. |

**Key endpoints used in the app:**
- `GET /v4/launches` — all launches  
- `GET /v4/launches/:id` — single launch  
- `GET /v4/launches/upcoming` — upcoming launches  
- `GET /v4/launches/past` — past launches  
- `GET /v4/rockets/:id` — rocket details  

### 4.2 Azure Event Hub — Emulator & Testcontainers

**Production client:** `@azure/event-hubs` (official Azure SDK for Node.js)

**Testing approach — Testcontainers with GenericContainer:**

> ⚠️ The official Testcontainers Azure Event Hubs module ([testcontainers.com/modules/azure-eventhubs](https://testcontainers.com/modules/azure-eventhubs/)) currently supports **Java, Go, and .NET only** — not Node.js.  
>  
> In Node.js, we use `GenericContainer` from the `testcontainers` npm package to spin up the emulator manually. This is actually a **great teaching moment** — it shows students how to compose multiple containers in tests when no first-class module exists.

**Two containers required (same Docker network):**

| Container | Image | Purpose |
|-----------|-------|---------|
| **Azurite** | `mcr.microsoft.com/azure-storage/azurite` | Checkpoint/blob storage (required dependency for the emulator) |
| **Event Hubs Emulator** | `mcr.microsoft.com/azure-messaging/eventhubs-emulator` | Local Event Hubs service |

**Setup pattern in tests:**
```typescript
// Pseudocode for test setup
const network = await new Network().start();

const azurite = await new GenericContainer("mcr.microsoft.com/azure-storage/azurite:3.33.0")
  .withNetwork(network)
  .withNetworkAliases("azurite")
  .start();

const eventHub = await new GenericContainer("mcr.microsoft.com/azure-messaging/eventhubs-emulator:2.0.1")
  .withNetwork(network)
  .withEnvironment({ ACCEPT_EULA: "Y" })
  .start();

// Connect using @azure/event-hubs SDK with emulator connection string
```

### 4.3 Launch Event Milestones (Simulated)

Launch milestones are **simulated** by the app via an API trigger (`POST /launches/:id/simulate`) that publishes events to Azure Event Hub. The Falcon 9 launch timeline serves as the data model:

| Event | Approx. T+ Time | Description |
|-------|-----------------|-------------|
| `COUNTDOWN` | T-00:10 | Final countdown sequence |
| `LIFTOFF` | T+00:00 | Vehicle clears the pad |
| `MACH_1` | T+01:10 | Passes speed of sound |
| `MAX_Q` | T+01:18 | Peak aerodynamic pressure |
| `MECO` | T+02:55 | Main Engine Cutoff (1st stage) |
| `STAGE_SEPARATION` | T+02:59 | 1st and 2nd stages separate |
| `SES` | T+03:07 | Second Engine Start |
| `FAIRING_JETTISON` | T+03:59 | Payload fairing separates |
| `SECO` | T+08:46 | Second Engine Cutoff |
| `PAYLOAD_DEPLOY` | T+31:15 | Satellite/payload deployed |
| `LANDING` | T+08:30 | 1st stage landing (approx.) |

> **Key insight:** Simulating events is *ideal* for a testing course — students get full control over event data while practicing event-based component testing with Azure Event Hub.

---

## 5. "LaunchPad" App — Architecture

### 5.1 Three Integration Layers

```
┌──────────────────────────────────────────────────────────────────┐
│                     LaunchPad API (Nest.js)                       │
│                                                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────────┐  │
│  │   API Layer   │  │   DB Layer    │  │    Event Layer       │  │
│  │               │  │               │  │                      │  │
│  │  SpaceX API   │  │  PostgreSQL   │  │  Azure Event Hub     │  │
│  │  (external)   │  │  (TypeORM)    │  │  (@azure/event-hubs) │  │
│  └───────┬───────┘  └───────┬───────┘  └──────────┬───────────┘  │
│          │                  │                     │              │
│   Component Test:    Component Test:       Component Test:       │
│      MSW Mock         Testcontainers        Testcontainers       │
│                      (PostgreSQL)       (Azurite + Event Hub     │
│                                           Emulator containers)   │
└──────────────────────────────────────────────────────────────────┘
```

| Layer | Production | Component Test Tool |
|-------|-----------|---------------------|
| **External API** | HTTP calls to SpaceX API v4 | **MSW** (Mock Service Worker) |
| **Database** | PostgreSQL via **TypeORM** | **Testcontainers** (`PostgreSQL` module) |
| **Event Stream** | **Azure Event Hub** via `@azure/event-hubs` SDK | **Testcontainers** (`GenericContainer` — Azurite + Event Hub Emulator) |

### 5.2 Event Flow

```
  POST /launches/:id/simulate
           │
           ▼
  ┌─────────────────┐      ┌──────────────────┐
  │  LaunchPad API  │─────▶│  Azure Event Hub │
  │  (Publisher)    │      │  (topic/stream)  │
  │  @azure/        │      └────────┬─────────┘
  │  event-hubs SDK │               │
  └─────────────────┘               ▼
                           ┌──────────────────┐
                           │  LaunchPad API   │
                           │  (Consumer)      │
                           │  @azure/         │
                           │  event-hubs SDK  │
                           │  stores event &  │
                           │  exposes via API │
                           └──────────────────┘
```

**How it works:**
1. Trigger `POST /launches/:id/simulate` with a list of milestone events  
2. The API publishes each event to Azure Event Hub using `@azure/event-hubs` `EventHubProducerClient`  
3. A consumer in the app reads from Event Hub using `EventHubConsumerClient`, persists events, and exposes them via `GET /launches/:id/events`  

---

## 6. App Endpoints

| # | Endpoint | Method | Description | Testing Layer |
|---|----------|--------|-------------|---------------|
| 1 | `/launches` | GET | List all launches (past + upcoming) from SpaceX API | API mocking (MSW) |
| 2 | `/launches/:id` | GET | Get launch details by ID from SpaceX API | API mocking (MSW) |
| 3 | `/launches/:id/favorite` | POST | Mark a launch as favorite (save to DB). Requires `x-user-id` header. | Database (Testcontainers + PostgreSQL) |
| 4 | `/launches/:id/favorite` | DELETE | Remove a launch from favorites. Requires `x-user-id` header. | Database (Testcontainers + PostgreSQL) |
| 5 | `/favorites` | GET | Get all favorite launches for a user. Requires `x-user-id` header. | Database (Testcontainers + PostgreSQL) |
| 6 | `/launches/:id/simulate` | POST | Trigger simulated launch — publishes milestone events to Azure Event Hub | Event Hub (Testcontainers + GenericContainer) |
| 7 | `/launches/:id/events` | GET | Get launch milestone events (consumed from Event Hub) | Event Hub (Testcontainers + GenericContainer) |

---

## 7. Meeting-by-Meeting Plan

### Meeting 1 — Foundations and Testing Strategy (~2 hr)

| Time | Topic | Activity |
|------|-------|----------|
| 0:00–0:20 | Why unit tests are not enough | Lecture + discussion: gaps in unit testing |
| 0:20–0:40 | Test pyramid vs. modern testing strategy | Lecture: UT + component + integration layers |
| 0:40–0:55 | Different layers of component tests | Lecture: API, DB, messaging, external services |
| 0:55–1:05 | **Break** | |
| 1:05–1:20 | What is a "component" in Node.js / Nest.js | Lecture: modules, controllers, services as components |
| 1:20–1:35 | When to use unit vs. component tests | Discussion: decision framework for Node.js projects |
| 1:35–1:50 | Nest.js `TestingModule` deep dive | Live coding: dependency overrides, providers |
| 1:50–2:00 | **Intro to LaunchPad app** | Walkthrough: app architecture, endpoints, code tour |

> **Setup before Meeting 2:** Students clone the repo and run the app locally via `docker-compose up`.

### Meeting 2 — Hands-On Component Testing (~2 hr)

| Time | Topic | Activity |
|------|-------|----------|
| 0:00–0:10 | Recap + Q&A from Meeting 1 | Discussion |
| 0:10–0:40 | **Exercise 1: API mocking with MSW** | Hands-on: write component tests for `GET /launches` and `GET /launches/:id` — mock SpaceX API responses with MSW |
| 0:40–0:55 | Testcontainers basics for Node.js | Lecture + demo: spinning up PostgreSQL & Event Hub emulator using `GenericContainer` |
| 0:55–1:05 | **Break** | |
| 1:05–1:35 | **Exercise 2: DB testing with Testcontainers** | Hands-on: write component tests for `POST /launches/:id/favorite` and `GET /favorites` — real PostgreSQL via Testcontainers |
| 1:35–1:45 | Container scope & test isolation | Lecture: `beforeAll` vs `beforeEach`, data cleanup, reusing containers |
| 1:45–1:55 | **Exercise 3: Event Hub testing** | Hands-on: write component tests for `POST /launches/:id/simulate` — publish events to Event Hub emulator via Testcontainers (Azurite + Emulator), verify consumption via `GET /launches/:id/events` |
| 1:55–2:00 | Flaky test prevention + wrap-up | Discussion: stability patterns, CI considerations |

---

## 8. Pre-Built Deliverables (Instructor Prep)

| Deliverable | Description | Status |
|-------------|-------------|--------|
| **LaunchPad Nest.js App** | Fully working app with SpaceX API integration, TypeORM + PostgreSQL, Azure Event Hub publisher/consumer via `@azure/event-hubs` | 🔲 To build |
| **`docker-compose.yml`** | Local dev setup: PostgreSQL + Azurite + Azure Event Hub emulator containers | 🔲 To build |
| **Skeleton Test Files** | Test files with `TODO` comments and hints guiding students through each exercise | 🔲 To build |
| **Solution Branch** | Completed tests on a separate Git branch (`solutions`) for instructor reference | 🔲 To build |
| **README** | Setup instructions, prerequisites check, architecture diagram, exercise overview | 🔲 To build |
| **Slide Deck** | Lecture slides for theoretical portions of both meetings | 🔲 To build |
| **SpaceX API Response Fixtures** | Sample JSON responses from SpaceX API for MSW mocking | 🔲 To build |
| **Launch Event Fixtures** | Sample milestone event payloads for Event Hub testing | 🔲 To build |

---

## 9. Remaining Open Questions

| # | Question | Options | Notes |
|---|----------|---------|-------|
| 1 | CI/CD integration? | Include CI pipeline section? | Could show GitHub Actions / Azure DevOps running component tests with Testcontainers |
| 2 | GenericContainer as teaching topic? | Dedicate time vs. just use it | Since Event Hub has no first-class Node.js Testcontainers module, composing `GenericContainer` + `Network` is a valuable transferable skill. Worth highlighting explicitly? |

---

## 10. Next Steps

1. ✅ ~~Research APIs and decide on tech stack~~ — **Done**  
2. ✅ ~~Lock in all major decisions~~ — **Done**  
3. 🔲 **Verify** Azure Event Hub emulator + Azurite work via `GenericContainer` in Node.js tests (proof of concept)  
4. 🔲 **Build** the LaunchPad app (app code + Docker setup)  
5. 🔲 **Create** skeleton test files with TODO exercises  
6. 🔲 **Write** solution tests on a separate branch  
7. 🔲 **Prepare** slide deck for Meeting 1 lecture portions  
8. 🔲 **Dry run** the course with a small group (optional)  

---

*This is a living document. Update as decisions are made.*
