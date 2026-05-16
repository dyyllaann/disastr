/**
 * Typed API client — all calls go through this module.
 * In local development, MSW intercepts every request.
 * In production, set VITE_API_BASE_URL to the FastAPI service base URL.
 */

import type {
  Ticket,
  TicketsQuery,
  CreateTicketPayload,
  Subscription,
  CreateSubscriptionPayload,
} from "../types";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

// ─── Tickets ──────────────────────────────────────────────────────────────────

/** GET /tickets?status=&bbox= */
export function getTickets(query?: TicketsQuery): Promise<Ticket[]> {
  const params = new URLSearchParams();
  if (query?.status) params.set("status", query.status);
  if (query?.bbox) params.set("bbox", query.bbox);
  const qs = params.toString();
  return request<Ticket[]>(`/tickets${qs ? `?${qs}` : ""}`);
}

/** GET /tickets/:id */
export function getTicket(id: string): Promise<Ticket> {
  return request<Ticket>(`/tickets/${id}`);
}

/** POST /tickets */
export function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  return request<Ticket>("/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** POST /tickets/:id/flag */
export function flagTicket(id: string): Promise<Ticket> {
  return request<Ticket>(`/tickets/${id}/flag`, { method: "POST" });
}

/** POST /tickets/:id/resolve */
export function resolveTicket(id: string): Promise<Ticket> {
  return request<Ticket>(`/tickets/${id}/resolve`, { method: "POST" });
}

// ─── Subscriptions ────────────────────────────────────────────────────────────

/** POST /subscriptions */
export function createSubscription(
  payload: CreateSubscriptionPayload
): Promise<Subscription> {
  return request<Subscription>("/subscriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** DELETE /subscriptions/:id */
export function deleteSubscription(id: string): Promise<void> {
  return request<void>(`/subscriptions/${id}`, { method: "DELETE" });
}
