import React from "react";
import { Map } from "../components/Map";
import { useTickets } from "../hooks/useTickets";

export default function MapPage() {
  return (
    <main className="h-[calc(100dvh-3.5rem)] w-full">
      <Map loading={false} />
    </main>
  );
}
