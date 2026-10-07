import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "urql";
import { fromValue } from "wonka";
import { describe, expect, it, vi } from "vitest";
import { AttendancePage } from "./AttendancePage";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  usePathname: () => "/attendance",
  useSearchParams: () => new URLSearchParams("location=11111111-1111-4111-8111-111111111111"),
}));

const LOC = "11111111-1111-4111-8111-111111111111";

const feed = {
  counts: { all: 2, pending: 1, present: 1, off: 1 },
  entries: [
    {
      __typename: "AttendanceEntry",
      id: "w1:2026-10-09",
      date: "2026-10-09",
      state: "OFF",
      source: null,
      jobTitle: "Food server",
      worker: { __typename: "User", id: "w1", name: "Tom Reyes", externalId: "RO-1042" },
      record: null,
      request: { __typename: "AttendanceRequest", id: "q1", status: "PENDING", type: "OFF", note: "Family event", createdAt: "2026-10-01T00:00:00Z", reviewedAt: null, reviewedBy: null },
    },
    {
      __typename: "AttendanceEntry",
      id: "w2:2026-10-07",
      date: "2026-10-07",
      state: "PRESENT",
      source: "MANAGER",
      jobTitle: "Cook",
      worker: { __typename: "User", id: "w2", name: "Lin Huang", externalId: "RO-1043" },
      record: { __typename: "AttendanceRecord", id: "r1", checkInAt: null, checkOutAt: null, note: null },
      request: null,
    },
  ],
};

/** A fake urql client: answers each operation by name so the page can be exercised without a server. */
function fakeClient(mutations: { approve: (variables: Record<string, unknown>) => void }) {
  const respond = (name: string | undefined, variables: Record<string, unknown>) => {
    switch (name) {
      case "Me":
        return { me: { __typename: "User", id: "m1", name: "Megan Garcia", role: "MANAGER", externalId: null, memberships: [] } };
      case "LocationHeader":
        return { location: { __typename: "Location", id: LOC, name: "Aramark Boulder CO", selfCheckInEnabled: true, managerMarkingEnabled: true } };
      case "AttendanceFeed":
        return { attendanceFeed: { __typename: "AttendanceFeed", ...feed } };
      case "Approve":
        mutations.approve(variables);
        return { approveAttendanceRequest: { __typename: "AttendanceRequest", id: "q1", status: "APPROVED" } };
      default:
        throw new Error(`Unexpected operation ${name}`);
    }
  };
  const run = (op: { query: { definitions: Array<{ kind: string; name?: { value: string } }> }; variables: Record<string, unknown> }) => {
    const def = op.query.definitions.find((d) => d.kind === "OperationDefinition");
    return fromValue({ operation: op, data: respond(def?.name?.value, op.variables), stale: false, hasNext: false });
  };
  return { executeQuery: run, executeMutation: run, executeSubscription: run } as unknown as React.ComponentProps<typeof Provider>["value"];
}

describe("AttendancePage", () => {
  it("renders the manager's feed and approves a pending request", async () => {
    const approve = vi.fn();
    render(
      <Provider value={fakeClient({ approve })}>
        <AttendancePage />
      </Provider>,
    );

    expect(await screen.findByRole("heading", { name: "Attendance" })).toBeInTheDocument();
    expect(screen.getByText("1 pending approval · Aramark Boulder CO")).toBeInTheDocument();
    expect(screen.getAllByTestId("attendance-row")).toHaveLength(2);
    expect(screen.getByText("— (on approval)")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Pending/ })).toHaveTextContent("1");

    await userEvent.click(screen.getByRole("button", { name: "Approve" }));
    await waitFor(() => expect(approve).toHaveBeenCalledWith({ id: "q1" }));
  });
});
