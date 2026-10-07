"use client";

import { useState } from "react";
import { useMutation } from "urql";
import { combineDateTime, todayString } from "../format";
import type { AttendanceState } from "../gql/graphql";
import { SubmitRequestDocument } from "../queries";
import { Button, ErrorText, Field, Modal, inputClass } from "./ui";

export function RequestAttendanceDialog({
  locationId,
  selfCheckInEnabled,
  onClose,
  onDone,
}: {
  locationId: string;
  selfCheckInEnabled: boolean;
  onClose: () => void;
  onDone: () => void;
}) {
  const [date, setDate] = useState(todayString());
  const [type, setType] = useState<AttendanceState>("PRESENT");
  const [note, setNote] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [{ fetching, error }, submit] = useMutation(SubmitRequestDocument);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const result = await submit({
      input: {
        locationId,
        date,
        type,
        note: note || null,
        checkInAt: type === "PRESENT" ? combineDateTime(date, checkIn) : null,
        checkOutAt: type === "PRESENT" ? combineDateTime(date, checkOut) : null,
      },
    });
    if (!result.error) onDone();
  }

  return (
    <Modal title="Request attendance" onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label="Date" hint="Requests may be for past or future dates.">
          <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Request">
          <div className="grid grid-cols-2 gap-2">
            {(["PRESENT", "OFF"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold ${type === t ? "border-primary bg-primary-soft text-primary" : "border-line"}`}
              >
                {t === "PRESENT" ? "Check in / Check out" : "OFF day"}
              </button>
            ))}
          </div>
        </Field>
        {type === "PRESENT" ? (
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
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className={inputClass} placeholder="Why, in a sentence." />
        </Field>
        <p className="text-xs text-muted">
          {type === "PRESENT" && selfCheckInEnabled
            ? "Self check-in is enabled here: this will be approved immediately."
            : "A manager of this location will review your request."}
        </p>
        <ErrorText>{error?.graphQLErrors[0]?.message ?? error?.message}</ErrorText>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={fetching}>{fetching ? "Submitting…" : "Submit request"}</Button>
        </div>
      </form>
    </Modal>
  );
}
