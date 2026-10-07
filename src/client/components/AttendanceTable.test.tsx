import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AttendanceTable, type Entry } from "./AttendanceTable";

const base: Entry = {
  id: "w1:2026-10-07",
  date: "2026-10-07",
  state: "PRESENT",
  source: "INTEGRATION",
  jobTitle: "Food server",
  worker: { id: "w1", name: "Tom Reyes", externalId: "RO-1042" },
  record: { id: "r1", checkInAt: "2026-10-07T08:00:00.000Z", checkOutAt: null, note: null },
  request: null,
};

describe("AttendanceTable", () => {
  it("renders a record row with worker, date, state and source", () => {
    render(<AttendanceTable entries={[base]} />);
    const row = screen.getByTestId("attendance-row");
    expect(within(row).getByText("Tom Reyes")).toBeInTheDocument();
    expect(within(row).getByText("RO-1042 · Food server")).toBeInTheDocument();
    expect(within(row).getByText("Wed, Oct 7")).toBeInTheDocument();
    expect(within(row).getByText("Present")).toBeInTheDocument();
    expect(within(row).getByText("Integration")).toBeInTheDocument();
  });

  it("renders a pending request as 'on approval' with its note and actions", () => {
    const pending: Entry = {
      ...base,
      id: "w1:2026-10-09",
      date: "2026-10-09",
      state: "OFF",
      source: null,
      record: null,
      request: { id: "q1", status: "PENDING", type: "OFF", note: "Family event out of town.", createdAt: "2026-10-01T10:00:00Z", reviewedAt: null, reviewedBy: null },
    };
    render(<AttendanceTable entries={[pending]} renderActions={() => <button>Approve</button>} />);
    expect(screen.getByText("— (on approval)")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Family event out of town.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Approve" })).toBeInTheDocument();
  });

  it("shows who decided an approved request", () => {
    const approved: Entry = {
      ...base,
      state: "OFF",
      source: "WORKER_REQUEST",
      request: { id: "q2", status: "APPROVED", type: "OFF", note: "Moving", createdAt: "2026-10-01T10:00:00Z", reviewedAt: "2026-10-05T12:00:00Z", reviewedBy: { id: "m1", name: "Megan Garcia" } },
    };
    render(<AttendanceTable entries={[approved]} />);
    expect(screen.getByText(/Approved by Megan Garcia/)).toBeInTheDocument();
    expect(screen.getByText("Worker request")).toBeInTheDocument();
  });

  it("shows an empty state", () => {
    render(<AttendanceTable entries={[]} emptyMessage="No attendance yet" />);
    expect(screen.getByText("No attendance yet")).toBeInTheDocument();
  });
});
