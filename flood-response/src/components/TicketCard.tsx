import React from "react";
import type { Ticket } from "../types";
import { ClassificationBadge } from "./ClassificationBadge";
import { STATUS_TAILWIND } from "../lib/classificationColors";
import { useFlagTicket, useResolveTicket } from "../hooks/useTickets";

interface Props {
  ticket: Ticket;
  onClose: () => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export const TicketCard: React.FC<Props> = ({ ticket, onClose }) => {
  const flag = useFlagTicket();
  const resolve = useResolveTicket();

  return (
    <aside
      aria-label="Ticket details"
      className="flex flex-col gap-4 h-full overflow-y-auto p-4"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          <ClassificationBadge classification={ticket.classification} />
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${STATUS_TAILWIND[ticket.status]}`}
            aria-label={`Status: ${ticket.status}`}
          >
            {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Close ticket details"
          className="rounded p-1 text-gray-400 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          ✕
        </button>
      </div>

      {/* Message */}
      <p className="text-gray-800 text-sm leading-relaxed">{ticket.message}</p>

      {/* Metadata */}
      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-500">
        <dt className="font-semibold">Reported</dt>
        <dd>{formatDate(ticket.createdAt)}</dd>

        <dt className="font-semibold">Channel</dt>
        <dd className="capitalize">{ticket.reporter.channel}</dd>

        <dt className="font-semibold">Location source</dt>
        <dd>{ticket.location.source.replace("_", " ")}</dd>

        <dt className="font-semibold">Verified by</dt>
        <dd>{ticket.verifiedBy?.length ? ticket.verifiedBy.join(", ") : "—"}</dd>

        <dt className="font-semibold">Flags</dt>
        <dd>{ticket.flaggedCount}</dd>
      </dl>

      {/* Actions */}
      <div className="flex gap-3 mt-auto">
        <button
          onClick={() => flag.mutate(ticket.id)}
          disabled={flag.isPending || ticket.status === "resolved"}
          aria-label="Flag this report as suspicious"
          className="flex-1 rounded-lg border border-orange-400 px-3 py-2 text-sm font-medium text-orange-700 hover:bg-orange-50 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 transition-colors"
        >
          {flag.isPending ? "Flagging…" : "Flag"}
        </button>
        <button
          onClick={() => resolve.mutate(ticket.id)}
          disabled={resolve.isPending || ticket.status === "resolved"}
          aria-label="Mark this report as resolved"
          className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 transition-colors"
        >
          {resolve.isPending ? "Resolving…" : "Mark Resolved"}
        </button>
      </div>
    </aside>
  );
};
