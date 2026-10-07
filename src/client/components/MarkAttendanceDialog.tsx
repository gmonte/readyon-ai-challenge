"use client";

import { useState } from "react";
import { useMutation, useQuery } from "urql";
import { combineDateTime, todayString } from "../format";
import type { AttendanceState } from "../gql/graphql";
import { LocationWorkersDocument, MarkAttendanceDocument } from "../queries";
import { Button, ErrorText, Field, Modal, inputClass } from "./ui";

export function MarkAttendanceDialog({ locationId, onClose, onDone }: { locationId: string; onClose: () => void; onDone: () => void }) {
  const [{ data: workersData }] = useQuery({ query: LocationWorkersDocument, variables: { locationId } });
  const workers = workersData?.locationWorkers ?? [];
  const [workerId, setWorkerId] = useState("");
  const [date, setDate] = useState(todayString());
  const [state, setState] = useState<AttendanceState>("PRESENT");
  const [note, setNote] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [{ fetching, error }, mark] = useMutation(MarkAttendanceDocument);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await mark({
      input: {
        locationId,
        workerId,
        date,
        state,
        note: note || null,
        checkInAt: state === "PRESENT" ? combineDateTime(date, checkIn) : null,
        checkOutAt: state === "PRESENT" ? combineDateTime(date, checkOut) : null,
      },
    });
    if (!result.error) onDone();
  }

  return (
    <Modal title="Mark attendance" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Worker">
          <select required value={workerId} onChange={(e) => setWorkerId(e.target.value)} className={inputClass}>
            <option value="" disabled>Select a worker…</option>
            {workers.map((w) => (
              <option key={w.user.id} value={w.user.id}>
                {w.user.name} · {w.user.externalId}{w.jobTitle ? ` · ${w.jobTitle}` : ""}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date" hint="Overwrites whatever is recorded for this worker on this date.">
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Status">
          <div className="grid grid-cols-2 gap-2">
            {(["PRESENT", "OFF"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setState(s)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold ${state === s ? "border-primary bg-primary-soft text-primary" : "border-line"}`}
              >
                {s === "PRESENT" ? "Present" : "Off"}
              </button>
            ))}
          </div>
        </Field>
        {state === "PRESENT" ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-in time">
              <input type="time" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Check-out time">
              <input type="time" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className={inputClass} />
            </Field>
          </div>
        ) : null}
        <Field label="Note (optional)">
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </Field>
        <ErrorText>{error?.graphQLErrors[0]?.message ?? error?.message}</ErrorText>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={fetching || !workerId}>{fetching ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </Modal>
  );
}
