"use client";

import { X } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { avatarColor, initials } from "../format";

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <span className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full font-semibold text-white ${avatarColor(name)}`}>
      {initials(name)}
    </span>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "danger" | "ghost" };
export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";
  const styles = {
    primary: "bg-primary text-white hover:bg-blue-700",
    secondary: "border border-line bg-white text-ink hover:bg-canvas",
    danger: "border border-line bg-white text-pending hover:bg-pending-soft",
    ghost: "text-muted hover:text-ink",
  }[variant];
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}

export function Pill({ tone, children }: { tone: "present" | "off" | "pending" | "approved" | "neutral"; children: ReactNode }) {
  const styles = {
    present: "bg-present-soft text-present",
    off: "bg-off-soft text-off",
    pending: "bg-pending-soft text-pending",
    approved: "bg-present-soft text-present",
    neutral: "bg-canvas text-muted",
  }[tone];
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${styles}`}>{children}</span>;
}

export function StatePill({ state }: { state: "PRESENT" | "OFF" }) {
  const tone = state === "PRESENT" ? "present" : "off";
  return (
    <Pill tone={tone}>
      <span className={`h-1.5 w-1.5 rounded-full ${state === "PRESENT" ? "bg-present" : "bg-off"}`} />
      {state === "PRESENT" ? "Present" : "Off"}
    </Pill>
  );
}

export function Toggle({ checked, onChange, disabled, label }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition disabled:opacity-50 ${checked ? "bg-primary" : "bg-gray-300"}`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${checked ? "translate-x-6" : "translate-x-1"}`} />
    </button>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-full p-1 text-muted hover:bg-canvas">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-xs text-muted">{hint}</span> : null}
    </label>
  );
}

export const inputClass = "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-primary";

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p role="alert" className="rounded-lg bg-pending-soft px-3 py-2 text-sm text-pending">{children}</p>;
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <div className="px-6 py-16 text-center text-sm text-muted">{children}</div>;
}
