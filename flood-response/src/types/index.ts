// ─── Classification ───────────────────────────────────────────────────────────

export type Classification =
  | "medical"
  | "hazard"
  | "food_water"
  | "transportation"
  | "other";

// ─── Ticket ───────────────────────────────────────────────────────────────────

export interface TicketLocation {
  lat: number;
  lng: number;
  source: "gps" | "sms_geocoded" | "landline_lookup";
}

export interface TicketReporter {
  channel: "smartphone" | "dumbphone" | "landline";
  /** SHA-256 hash of the phone number — never store raw PII */
  contactHash: string;
}

export interface Ticket {
  id: string;
  createdAt: string; // ISO 8601
  status: "active" | "pending" | "resolved";
  classification: Classification;
  location: TicketLocation;
  reporter: TicketReporter;
  message: string;
  verifiedBy?: string[];
  flaggedCount: number;
}

// ─── Subscription ─────────────────────────────────────────────────────────────

export type AlertChannel = "sms" | "voice" | "push";

export interface Subscription {
  id: string;
  /** E.164 phone number */
  phoneNumber: string;
  optIn: boolean;
  alertChannels: AlertChannel[];
  /** GeoJSON polygon or array of ZIP codes */
  region: GeoJSONPolygon | string[];
  createdAt: string;
}

export interface GeoJSONPolygon {
  type: "Polygon";
  coordinates: number[][][];
}

// ─── API shapes ───────────────────────────────────────────────────────────────

export interface TicketsQuery {
  status?: Ticket["status"];
  /** "minLng,minLat,maxLng,maxLat" */
  bbox?: string;
}

export interface CreateTicketPayload {
  classification: Classification;
  location: TicketLocation;
  message: string;
  reporter: TicketReporter;
}

export interface CreateSubscriptionPayload {
  phoneNumber: string;
  alertChannels: AlertChannel[];
  region: GeoJSONPolygon | string[];
}

// ─── Guidance content ─────────────────────────────────────────────────────────

export interface GuidanceSection {
  id: string;
  phase: "before" | "during" | "after";
  title: string;
  body: string;
  tips: string[];
}

export interface GuidanceContent {
  lastUpdated: string;
  sections: GuidanceSection[];
}

// ─── i18n stub ────────────────────────────────────────────────────────────────

export type Locale = "en" | "es";
