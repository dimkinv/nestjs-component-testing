# Module 1 Presentation Assessment

> Reviewing `presentations/component-testing-1.html` against the course plan and actual LaunchPad source code.

---

## General Assessment

The presentation has a **solid pedagogical structure** — it motivates the problem, introduces theory, and progressively builds to practical TestingModule examples. The Ariane 5 hook is effective, and the flow from "why test" → "what is a component" → "how to use TestingModule" is logical.

**There are coherence issues between the slide code examples and the actual LaunchPad codebase** — several code snippets reference incorrect method names or omit required providers.

---

## Flow

**Verdict: Good overall, minor pacing concerns**

| Section | Assessment |
|---------|-----------|
| Orbital mechanics intro (4 slides) | Engaging hook but 4 slides before testing content may be heavy for a 2hr session |
| Ariane 5 motivation (3 slides) | Excellent. Gets the point across clearly |
| Test types → pyramid → practical balance | Clean progression |
| "What is a component" → shapes → decision table | Well structured |
| TestingModule intro → 4 patterns → code examples | Core of the talk, good escalation |
| Selective mocking → patterns → mistakes → takeaways | Strong close |

**Gap:** The course plan allocates 10 min (1:50–2:00) for a "LaunchPad app walkthrough" that introduces the architecture, endpoints, and code tour. The presentation has no dedicated slide for this.

---

## Mistakes Found

### 1. Method names don't match actual code

| Slide | Shows | Actual Code |
|-------|-------|-------------|
| "Get a service" example | `service.findAll()` | `service.getLaunches()` |
| "Override a provider" example | `{ findAll: jest.fn()... }` | Should be `{ getLaunches: jest.fn()... }` |
| "Import a feature module" example | `service.add('falcon-9')` | `service.addFavorite('falcon-9', 'user-1')` (requires 2 args) |

### 2. "Get a service" slide is incomplete

The slide shows:
```ts
providers: [LaunchesService, Ll2Service],
```

But `LaunchesService` depends on `@InjectModel(LaunchMilestoneEvent.name)` — this will fail at compile time without providing the Mongoose model token. The actual solution includes:
```ts
{ provide: getModelToken(LaunchMilestoneEvent.name), useValue: {} }
```

This is especially confusing because the **very next slide** ("Why mock Mongoose here?") explains exactly this problem, yet the preceding code example omits the fix.

### 3. Return type mismatch

The "Get a service" slide asserts:
```ts
await expect(service.findAll()).resolves.toHaveLength(3);
```

The actual `getLaunches()` returns `{ data: LaunchSummary[] }`, not an array. Correct assertion would be:
```ts
await expect(service.getLaunches()).resolves.toEqual({ data: expect.any(Array) });
```

### 4. Course plan vs. actual tech stack mismatch

| Course Plan Says | Code Actually Uses |
|------------------|--------------------|
| TypeORM (Decision #4) | Mongoose (`@nestjs/mongoose`) |
| PostgreSQL | MongoDB |
| Azure Event Hub with `@azure/event-hubs` | In-memory events saved to MongoDB |
| Testcontainers PostgreSQL module | `@testcontainers/mongodb` in devDependencies |

The **presentation correctly reflects the code** (mentions Mongoose, `getModelToken`), but the course plan document is out of sync with reality. This should be reconciled.

---

## Missing Content

### Must-add (from course plan timeslots)

1. **LaunchPad Architecture Slide** — Course plan allocates 10 min (1:50–2:00) for "Intro to LaunchPad app: walkthrough of app architecture, endpoints, code tour." No such slide exists. Students need to see the app structure before they write tests.

2. **Endpoint Overview Slide** — A quick reference showing the 7 endpoints, which layers they exercise, and which tool tests them (MSW, Testcontainers, etc.)

3. **Setup / "What to do before Meeting 2" Slide** — Course plan says students should clone the repo and run `docker-compose up` before Meeting 2. There's no call-to-action slide.

### Suggested additions

4. **Architecture Diagram Slide** — The course plan has a nice ASCII diagram of the three integration layers (API → MSW, DB → Testcontainers, Events → Testcontainers). This visual would anchor the app context.

5. **"What we'll build in Meeting 2" Preview Slide** — Brief teaser of MSW, Testcontainers, and Event Hub testing to build anticipation.

6. **Transition slide between theory and practice** — The jump from "Examples from a Nest app" (pure lecture) to "TestingModule is the core tool" (practical) could use a clear "Now let's see how" marker.

---

## Slides to Add

| # | After Slide | Suggested New Slide | Rationale |
|---|-------------|--------------------| ----------|
| 1 | "Takeaways" (or before it) | **LaunchPad App Tour** — show architecture diagram, endpoint table, tech stack (Nest + Mongoose + LL2 + Event Hub) | Course plan requires it; students need app context |
| 2 | LaunchPad App Tour | **Endpoint Map** — 7 endpoints with their testing layer highlighted | Gives students a roadmap of what they'll test |
| 3 | After Endpoint Map | **Before Next Time** — setup instructions (clone, docker-compose up, verify) | Course plan transition step |
| 4 | Between "Examples from a Nest app" and "TestingModule is the core tool" | **Transition: "Let's build this"** — one sentence bridge slide | Smoother pacing |

---

## Slides to Remove

| Slide | Reason |
|-------|--------|
| None recommended for removal | All slides serve a purpose. The orbital mechanics intro is long but thematically strong. Consider *condensing* the 2 orbital mechanics explanation slides into 1 if time is tight. |

---

## Slides to Change

### 1. "Example: get a service" — Fix code

**Current:**
```ts
const moduleRef = await Test.createTestingModule({
  providers: [LaunchesService, Ll2Service],
}).compile();

const service = moduleRef.get(LaunchesService);
await expect(service.findAll()).resolves.toHaveLength(3);
```

**Should be:**
```ts
const moduleRef = await Test.createTestingModule({
  providers: [
    LaunchesService,
    { provide: Ll2Service, useValue: { getLaunches: jest.fn().mockResolvedValue([]) } },
    { provide: getModelToken(LaunchMilestoneEvent.name), useValue: {} },
  ],
}).compile();

const service = moduleRef.get(LaunchesService);
await expect(service.getLaunches()).resolves.toEqual({ data: [] });
```

Or keep it minimal but fix the method name and add the model token (which also creates a natural lead-in to the Mongoose explanation slide that follows).

### 2. "Example: create an app" — Add model token override

The slide correctly imports `LaunchesModule` (which now exists), but needs to show overriding the Mongoose model token since `LaunchesModule` uses `MongooseModule.forFeature()` which requires a DB connection:
```ts
const moduleRef = await Test.createTestingModule({
  imports: [LaunchesModule],
})
  .overrideProvider(Ll2Service)
  .useValue(mockLl2Service)
  .overrideProvider(getModelToken(LaunchMilestoneEvent.name))
  .useValue({})
  .compile();
```

### 3. "Example: import a feature module" — Fix method call

**Current:** `imports: [FavouritesModule]` ✅ (now exists) and `service.add('falcon-9')`

**Should be:** Use correct method signature:
```ts
const moduleRef = await Test.createTestingModule({
  imports: [FavouritesModule],
})
  .overrideProvider(getModelToken(FavoriteLaunch.name))
  .useValue(mockModel)
  .compile();

const service = moduleRef.get(FavouritesService);
await service.addFavorite('falcon-9', 'user-1');
```

### 4. "Example: override a provider" — Fix method name

**Current:** `{ findAll: jest.fn().mockResolvedValue([mockLaunch]) }`

**Should be:** `{ getLaunches: jest.fn().mockResolvedValue([mockLaunch]) }`

### 5. "Why mock Mongoose here?" slide — Adjust narrative order

This slide **explains** the model token problem, but the preceding "get a service" slide **hides** it. Either:
- Add the model token to the "get a service" slide and let the Mongoose slide explain why, or
- Keep the "get a service" slide intentionally broken and frame the Mongoose slide as "here's why the previous example would fail" (but this risks confusing students copying code)

**Recommendation:** Show the complete working code in examples; use the Mongoose slide to explain the *why* rather than the *fix*.

### 6. "LaunchPad as an Example" — Minor content update

The slide mentions `controller -> service -> persistence layer` which is correct. Consider also mentioning the launches/LL2 flow to foreshadow both integration boundaries students will encounter.

---

## Summary of Priority Fixes

| Priority | Item |
|----------|------|
| 🔴 High | Fix `findAll()` → `getLaunches()` across all slides |
| 🔴 High | Add missing Mongoose model token to "get a service" example |
| 🔴 High | Fix `service.add()` → `service.addFavorite(launchId, userId)` |
| 🟡 Medium | Add LaunchPad architecture/endpoints slide(s) |
| 🟡 Medium | Add "Before Meeting 2" setup slide |
| 🟡 Medium | Show model token override in "create an app" and "import a feature module" examples |
| 🟢 Low | Reconcile course plan document (TypeORM→Mongoose, PostgreSQL→MongoDB) |
| 🟢 Low | Consider condensing orbital mechanics to 1 slide |
