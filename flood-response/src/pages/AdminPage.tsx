import React, { useState } from "react";
import { useTickets, useFlagTicket, useResolveTicket } from "../hooks/useTickets";
import { ClassificationBadge } from "../components/ClassificationBadge";
import { STATUS_TAILWIND } from "../lib/classificationColors";
import type { Ticket } from "../types";

// TODO: Gate this route behind an auth check before shipping to production.
// The admin panel should only be accessible to authenticated moderators.

export default function AdminPage() {
  const { data: allTickets = [], isLoading } = useTickets();
  const flag = useFlagTicket();
  const resolve = useResolveTicket();

  const [filter, setFilter] = useState<Ticket["status"] | "all">("pending");

  const shown =
    filter === "all" ? allTickets : allTickets.filter((t) => t.status === filter);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moderator Queue</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review, approve, resolve, or flag tickets as malicious.
          </p>
        </div>
        {/* Status filter */}
        <div className="flex gap-2" role="group" aria-label="Filter by status">
          {(["pending", "active", "resolved", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              aria-pressed={filter === s}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                filter === s
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}

      {!isLoading && shown.length === 0 && (
        <p className="text-sm text-gray-500">No tickets match this filter.</p>
      )}

      <ul className="flex flex-col gap-3">
        {shown.map((ticket) => (
          <AdminTicketRow
            key={ticket.id}
            ticket={ticket}
            onFlag={() => flag.mutate(ticket.id)}
            onResolve={() => resolve.mutate(ticket.id)}
            flagPending={flag.isPending}
            resolvePending={resolve.isPending}
          />
        ))}
      </ul>
    </main>
  );
}

interface RowProps {
  ticket: Ticket;
  onFlag: () => void;
  onResolve: () => void;
  flagPending: boolean;
  resolvePending: boolean;
}

function AdminTicketRow({ ticket, onFlag, onResolve, flagPending, resolvePending }: RowProps) {
  return (
    <li className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start gap-2 justify-between">
        <div className="flex flex-wrap gap-2 items-center">
          <ClassificationBadge classification={ticket.classification} size="sm" />
          <span
            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_TAILWIND[ticket.status]}`}
          >
            {ticket.status}
          </span>
          <span className="text-xs text-gray-400">#{ticket.id}</span>
        </div>
        <span className="text-xs text-gray-400">
          {new Date(ticket.createdAt).toLocaleString(undefined, {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </span>
      </div>

      <p className="mt-2 text-sm text-gray-800">{ticket.message}</p>

      <div className="mt-2 flex flex-wrap gap-4 text-xs text-gray-500">
        <span>Channel: <strong className="capitalize">{ticket.reporter.channel}</strong></span>
        <span>Flags: <strong>{ticket.flaggedCount}</strong></span>
        <span>
          Lat {ticket.location.lat.toFixed(4)}, Lng {ticket.location.lng.toFixed(4)}
        </span>
      </div>

      {/* Moderator actions */}
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={`Actions for ticket ${ticket.id}`}>
        <button
          onClick={onResolve}
          disabled={resolvePending || ticket.status === "resolved"}
          className="rounded-lg border border-green-400 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 transition-colors"
        >
          Resolve
        </button>
        <button
          onClick={onFlag}
          disabled={flagPending}
          className="rounded-lg border border-orange-400 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 transition-colors"
        >
          Flag as suspicious
        </button>
        {/* TODO: "Approve" action — transitions pending → active after mod review */}
        <button
          disabled
          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-400 cursor-not-allowed"
          title="Approve: coming soon — requires moderator auth"
        >
          Approve (stub)
        </button>
      </div>
    </li>
  );
}
