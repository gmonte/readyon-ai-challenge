import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createTestDb, type TestDb } from "../test/db";
import { addMembership, createUser, seedScenario } from "../test/fixtures";
import { AUTH_COOKIE } from "./context";
import { createGateway } from "./yoga";

let tdb: TestDb;
let yoga: ReturnType<typeof createGateway>;

beforeAll(async () => {
  tdb = await createTestDb();
  yoga = createGateway(tdb.db);
});
afterAll(() => tdb.close());
beforeEach(() => tdb.reset());

type GqlResponse = { data?: Record<string, unknown> | null; errors?: Array<{ message: string; extensions?: { code?: string } }> };

async function gql(query: string, variables: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  const res = await yoga.fetch("http://localhost/api/graphql", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify({ query, variables }),
  });
  return (await res.json()) as GqlResponse;
}
const asUser = (id: string) => ({ cookie: `${AUTH_COOKIE}=${id}` });

describe("gateway", () => {
  it("resolves me from the auth cookie and null when anonymous", async () => {
    const s = await seedScenario(tdb.db);
    const anon = await gql(`{ me { id } }`);
    expect(anon.data).toEqual({ me: null });
    const me = await gql(`{ me { id name role memberships { jobTitle location { name } } } }`, {}, asUser(s.worker.id));
    expect(me.data).toEqual({
      me: { id: s.worker.id, name: "Tom Reyes", role: "WORKER", memberships: [{ jobTitle: "Food server", location: { name: "Test Location" } }] },
    });
  });

  it("runs the worker → manager workflow end to end with typed errors", async () => {
    const s = await seedScenario(tdb.db);
    const submit = await gql(
      `mutation($input: SubmitAttendanceRequestInput!) { submitAttendanceRequest(input: $input) { id status type date } }`,
      { input: { locationId: s.location.id, date: "2026-10-09", type: "OFF", note: "Family" } },
      asUser(s.worker.id),
    );
    const request = submit.data!.submitAttendanceRequest as { id: string; status: string };
    expect(request.status).toBe("PENDING");

    const dup = await gql(
      `mutation($input: SubmitAttendanceRequestInput!) { submitAttendanceRequest(input: $input) { id } }`,
      { input: { locationId: s.location.id, date: "2026-10-09", type: "OFF" } },
      asUser(s.worker.id),
    );
    expect(dup.errors?.[0]?.extensions?.code).toBe("CONFLICT");

    const asWorker = await gql(`mutation($id: ID!) { approveAttendanceRequest(id: $id) { id } }`, { id: request.id }, asUser(s.worker.id));
    expect(asWorker.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");

    const approve = await gql(
      `mutation($id: ID!) { approveAttendanceRequest(id: $id) { status reviewedBy { name } } }`,
      { id: request.id },
      asUser(s.manager.id),
    );
    expect(approve.data).toEqual({ approveAttendanceRequest: { status: "APPROVED", reviewedBy: { name: "Megan Garcia" } } });

    const feed = await gql(
      `query($loc: ID!) { attendanceFeed(locationId: $loc) { counts { all pending off } entries { date state source jobTitle worker { name } request { status } record { source } } } }`,
      { loc: s.location.id },
      asUser(s.manager.id),
    );
    expect(feed.data).toEqual({
      attendanceFeed: {
        counts: { all: 1, pending: 0, off: 1 },
        entries: [
          { date: "2026-10-09", state: "OFF", source: "WORKER_REQUEST", jobTitle: "Food server", worker: { name: "Tom Reyes" }, request: { status: "APPROVED" }, record: { source: "WORKER_REQUEST" } },
        ],
      },
    });
  });

  it("maps zod failures to VALIDATION and bad Date literals to a GraphQL error", async () => {
    const s = await seedScenario(tdb.db);
    const badDate = await gql(
      `mutation { submitAttendanceRequest(input: { locationId: "${s.location.id}", date: "2026/10/09", type: OFF }) { id } }`,
      {},
      asUser(s.worker.id),
    );
    expect(badDate.errors?.[0]?.message).toMatch(/YYYY-MM-DD/);
    const badTimes = await gql(
      `mutation($input: SubmitAttendanceRequestInput!) { submitAttendanceRequest(input: $input) { id } }`,
      { input: { locationId: s.location.id, date: "2026-10-09", type: "PRESENT", checkInAt: "2026-10-09T17:00:00Z", checkOutAt: "2026-10-09T08:00:00Z" } },
      asUser(s.worker.id),
    );
    expect(badTimes.errors?.[0]?.extensions?.code).toBe("VALIDATION");
    expect(badTimes.errors?.[0]?.message).toMatch(/Check-out must be after check-in/);
  });

  it("authenticates integrations by API key and exposes feature flags to super admins only", async () => {
    const s = await seedScenario(tdb.db);
    const noKey = await gql(
      `mutation($input: IntegrationAttendanceInput!) { recordIntegrationAttendance(input: $input) { id } }`,
      { input: { externalId: s.worker.externalId, locationId: s.location.id, date: "2026-10-07", state: "PRESENT" } },
    );
    expect(noKey.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
    const withKey = await gql(
      `mutation($input: IntegrationAttendanceInput!) { recordIntegrationAttendance(input: $input) { source worker { externalId } } }`,
      { input: { externalId: s.worker.externalId, locationId: s.location.id, date: "2026-10-07", state: "PRESENT" } },
      { "x-api-key": "dev-integration-key" },
    );
    expect(withKey.data).toEqual({ recordIntegrationAttendance: { source: "INTEGRATION", worker: { externalId: s.worker.externalId } } });

    const flagsAsManager = await gql(
      `mutation($input: SetLocationFeatureFlagsInput!) { setLocationFeatureFlags(input: $input) { selfCheckInEnabled } }`,
      { input: { locationId: s.location.id, selfCheckInEnabled: true } },
      asUser(s.manager.id),
    );
    expect(flagsAsManager.errors?.[0]?.extensions?.code).toBe("FORBIDDEN");
    const admin = await createUser(tdb.db, "SUPER_ADMIN", { name: "Alex Rivera" });
    const flags = await gql(
      `mutation($input: SetLocationFeatureFlagsInput!) { setLocationFeatureFlags(input: $input) { selfCheckInEnabled workerCount managerCount } }`,
      { input: { locationId: s.location.id, selfCheckInEnabled: true } },
      asUser(admin.id),
    );
    expect(flags.data).toEqual({ setLocationFeatureFlags: { selfCheckInEnabled: true, workerCount: 1, managerCount: 1 } });
  });

  it("lists one persona per role and scopes locations to memberships", async () => {
    const s = await seedScenario(tdb.db);
    const other = await createUser(tdb.db, "WORKER", { name: "Zed" });
    await createUser(tdb.db, "SUPER_ADMIN", { name: "Alex Rivera" });
    await addMembership(tdb.db, other.id, s.location.id, "Cook");
    const personas = await gql(`{ personas { role name } }`);
    expect(personas.data).toEqual({
      personas: [{ role: "WORKER", name: "Tom Reyes" }, { role: "MANAGER", name: "Megan Garcia" }, { role: "SUPER_ADMIN", name: "Alex Rivera" }],
    });
    const asWorker = await gql(`{ locations { name } }`, {}, asUser(other.id));
    expect(asWorker.data).toEqual({ locations: [{ name: "Test Location" }] });
  });
});
