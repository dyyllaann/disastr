import { http, HttpResponse } from "msw";
import type { Ticket, Subscription } from "../types";
import seedTickets from "../data/seedTickets.json";
import { parseBbox, isInBbox } from "../lib/geo";

// ─── In-memory store ──────────────────────────────────────────────────────────

let tickets: Ticket[] = seedTickets as Ticket[];
const subscriptions: Subscription[] = [];

// ─── Rate-limit stub ──────────────────────────────────────────────────────────
// TODO: implement per-hash rate limiting (e.g., max 5 tickets / 10 min / contactHash)
// const rateLimitMap = new Map<string, number[]>();

// ─── Flag threshold stub ──────────────────────────────────────────────────────
// TODO: auto-hide tickets where flaggedCount >= FLAG_THRESHOLD
// const FLAG_THRESHOLD = 5;

const BASE = "/api";

export const handlers = [
  // GET /tickets?status=&bbox=
  http.get(`${BASE}/tickets`, ({ request }) => {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as Ticket["status"] | null;
    const bboxStr = url.searchParams.get("bbox");
    const bbox = bboxStr ? parseBbox(bboxStr) : null;

    let results = tickets;
    if (status) results = results.filter((t) => t.status === status);
    if (bbox) results = results.filter((t) => isInBbox(t.location, bbox));

    // TODO: exclude auto-hidden tickets once flag threshold is implemented
    return HttpResponse.json(results);
  }),

  // GET /tickets/:id
  http.get(`${BASE}/tickets/:id`, ({ params }) => {
    const ticket = tickets.find((t) => t.id === params.id);
    if (!ticket) return new HttpResponse(null, { status: 404 });
    return HttpResponse.json(ticket);
  }),

  // POST /tickets
  http.post(`${BASE}/tickets`, async ({ request }) => {
    const body = await request.json();
    // TODO: validate contactHash rate limit here
    const newTicket: Ticket = {
      id: `tkt-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: "pending",
      flaggedCount: 0,
      verifiedBy: [],
      ...(body as object),
    } as Ticket;
    tickets = [newTicket, ...tickets];
    return HttpResponse.json(newTicket, { status: 201 });
  }),

  // POST /tickets/:id/flag
  http.post(`${BASE}/tickets/:id/flag`, ({ params }) => {
    const idx = tickets.findIndex((t) => t.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    tickets[idx] = {
      ...tickets[idx],
      flaggedCount: tickets[idx].flaggedCount + 1,
    };
    // TODO: if flaggedCount >= FLAG_THRESHOLD move to pending / hide from public map
    return HttpResponse.json(tickets[idx]);
  }),

  // POST /tickets/:id/resolve
  http.post(`${BASE}/tickets/:id/resolve`, ({ params }) => {
    const idx = tickets.findIndex((t) => t.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    tickets[idx] = { ...tickets[idx], status: "resolved" };
    return HttpResponse.json(tickets[idx]);
  }),

  // POST /subscriptions
  http.post(`${BASE}/subscriptions`, async ({ request }) => {
    const body = await request.json();
    const sub: Subscription = {
      id: `sub-${Date.now()}`,
      createdAt: new Date().toISOString(),
      optIn: true,
      ...(body as object),
    } as Subscription;
    subscriptions.push(sub);
    return HttpResponse.json(sub, { status: 201 });
  }),

  // DELETE /subscriptions/:id
  http.delete(`${BASE}/subscriptions/:id`, ({ params }) => {
    const idx = subscriptions.findIndex((s) => s.id === params.id);
    if (idx === -1) return new HttpResponse(null, { status: 404 });
    subscriptions.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
