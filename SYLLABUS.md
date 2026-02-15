# Syllabus: Component Testing – Nest.js

## Prerequisites

- TypeScript
- Jest
- Nest.js

## Meeting 1 — Foundations and Testing Strategy (~3hr)

- Why unit tests are not enough
- Test pyramid vs. modern testing strategy (UT + component + integration)
- Different layers of component tests (API, database, messaging, external services)
- What is a "component" in Nest.js applications
- When to use unit vs. component tests in Node.js/Nest.js projects

## Meeting 2 — Nest.js Component Testing Basics (~3hr)

- Nest.js testing modules: TestingModule, dependency overrides, providers
- Component test setup patterns for controllers, services, modules
- Contract testing as a component test style (e.g., controller validations with mocked dependencies)
- API mocking example with MSW (Mock Service Worker)

## Meeting 3 — Component Tests with External Dependencies (~3hr)

- Testcontainers basics for Node.js
- Container scope decisions (beforeAll, beforeEach, per-test) + test data management and isolation strategies
- Reusing test containers for faster suites
- Event-based flow component testing example (Kafka/Event Hub/etc.)
- Observability in tests (logs, traces, assertions on emitted events/metrics)
- Flaky test prevention and suite stability
