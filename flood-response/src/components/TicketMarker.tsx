import React from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Ticket } from "../types";
import { CLASSIFICATION_COLORS, CLASSIFICATION_LABELS } from "../lib/classificationColors";

interface Props {
  ticket: Ticket;
  onSelect: (ticket: Ticket) => void;
}

function buildIcon(color: string): L.DivIcon {
  return L.divIcon({
    className: "",
    iconAnchor: [12, 24],
    popupAnchor: [0, -24],
    html: `<div aria-hidden="true" style="
      width:24px;height:24px;border-radius:50% 50% 50% 0;
      background:${color};border:2px solid white;
      transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.4);"
    ></div>`,
  });
}

export const TicketMarker: React.FC<Props> = ({ ticket, onSelect }) => {
  const color = CLASSIFICATION_COLORS[ticket.classification];
  const icon = buildIcon(color);
  const label = `${CLASSIFICATION_LABELS[ticket.classification]} report – ${ticket.status}. ${ticket.message.slice(0, 60)}`;

  return (
    <Marker
      position={[ticket.location.lat, ticket.location.lng]}
      icon={icon}
      alt={label}
      aria-label={label}
      eventHandlers={{ click: () => onSelect(ticket) }}
    >
      <Popup>
        <div className="min-w-[180px]">
          <p className="font-semibold text-sm">{CLASSIFICATION_LABELS[ticket.classification]}</p>
          <p className="text-xs text-gray-600 mt-1 line-clamp-3">{ticket.message}</p>
          <button
            onClick={() => onSelect(ticket)}
            className="mt-2 text-xs text-blue-600 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            View details →
          </button>
        </div>
      </Popup>
    </Marker>
  );
};
