# ReadyOn · Workforce Management

A workforce management system for one company with many locations: workers submit attendance requests, managers decide them and mark attendance, super admins run locations and feature flags. Built for the ReadyOn interview exercise; the full brief and mock-ups are in [REQUIREMENTS.md](./REQUIREMENTS.md).

- **GraphQL gateway** (GraphQL Yoga) served from a Next.js route handler at `/api/graphql`. The frontend talks to nothing else.
- **PostgreSQL** via Drizzle ORM, with migrations in `drizzle/`.
- **Zod** validates every input and every entity leaving a service.
- **Vitest**: service and gateway tests run on an in-memory Postgres (PGlite) with the real migrations; component tests run in jsdom.

## Run it

Requirements: Node 20.9+, pnpm 11, a local PostgreSQL.

```bash
pnpm install
createdb readyon_dev                       # or any name; put its URL in .env
cp .env.example .env                       # DATABASE_URL, INTEGRATION_API_KEY
pnpm db:setup                              # migrate + seed demo data
pnpm dev                                   # http://localhost:3000
```

Use the **Viewing as** switcher in the header to act as the worker (Tom Reyes), the manager (Megan Garcia) or the super admin (Alex Rivera). Authentication is simulated with a cookie. GraphiQL is at `/api/graphql`.

Other scripts: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm codegen` (after changing `.graphql` files or client documents), `pnpm db:generate` (after changing `src/server/db/schema.ts`).

Third-party integration example:

```bash
curl http://localhost:3000/api/graphql -H 'content-type: application/json' -H 'x-api-key: dev-integration-key' \
  -d '{"query":"mutation { recordIntegrationAttendance(input:{externalId:\"RO-1043\", locationId:\"<id>\", date:\"2026-10-07\", state:PRESENT}) { id source } }"}'
```

## Layout

```
app/                      Next.js shell: thin pages, the /api/graphql route, a Server Action that sets the auth cookie
src/client/               React UI (client components, urql, generated typed documents in gql/)
src/server/
  db/                     Drizzle schema, Postgres client, seed
  auth/                   Actor model and the authorization policy (one file, every rule location-scoped)
  graphql/                Gateway assembly: context, loaders, scalars, error mapping, generated resolver types
  modules/
    identity/             users, roles, memberships
    locations/            locations and feature flags
    attendance/           records, requests, approvals, balance
  test/                   PGlite harness and fixtures
REQUIREMENTS.md           The interview brief, verbatim, with mock-ups
CONTEXT.md                Domain glossary (ubiquitous language)
docs/adr/                 Architecture decision records
docs/mockups/             Reference screens from the brief
```

Each module owns its tables, Zod schemas, GraphQL SDL and resolvers. Resolvers are one-liners that delegate to services; services take `(db, actor, input)` so they run identically on Postgres and PGlite.

## Domain rules implemented

- Exactly one **attendance record** per worker per date (location is an attribute; ADR 0001). Writes are upserts on that key.
- One **open** request (PENDING or APPROVED) per worker per date, enforced by a partial unique index. Rejected or cancelled requests leave room for a new one.
- **Approval** creates or overwrites the record for that date with source `WORKER_REQUEST`. Rejection leaves attendance untouched. Both happen in one transaction.
- **Self check-in** flag: a PRESENT request is approved on the spot; OFF always waits for a manager.
- **Manager attendance marking** flag: gates direct marking; approvals still work when it is off.
- Manager marking leaves a pending request pending; the row shows both the actual state and the open ask.
- **OFF balance** is informational: location allowance minus OFF records in the year. It never blocks a request.
- Integrations identify workers by **external identifier** and authenticate with an API key.
- Authorization: workers see and act only on their own data at their locations; managers only at locations they manage; super admins everywhere. Every rule lives in `src/server/auth/policy.ts`.

## Discussion notes

**Service boundaries.** A modular monolith with three modules behind one GraphQL schema. Records and requests live together in `attendance` because approval is a single transaction across both; splitting them would turn that into a saga for no product benefit. Federation is the obvious next step if teams split: each module already has its own SDL and could become a subgraph, with `User` and `Location` as entities.

**Data consistency.** Invariants are in the database (unique indexes, FKs, enums), not only in code, so a second writer can't break them. Approval is transactional. Balance is computed, never stored, so there is nothing to drift.

**Why the Next.js server is only a host.** All pages are client components fetching from the gateway (ADR 0002). Server Components reading the database directly would be idiomatic Next.js but would bypass the gateway the exercise asks for.

**Tradeoffs made.** Simulated auth via cookie rather than a real IdP. One time zone for all locations. Personas are fixed per role. No audit log beyond `source`, `markedBy`, `reviewedBy`. People management (adding workers, assigning job titles) is seeded, not editable.

**What I'd build next.** Real authentication and per-location roles (a person managing one site and working at another). Time zones per location. Audit history on records. A `checkOut` mutation for the live clock-in flow. Pagination and date-range filters on the feed. Federation or a standalone gateway when a second team appears. Idempotency keys on the integration mutation.
