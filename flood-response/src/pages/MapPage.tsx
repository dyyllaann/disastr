import React from "react";
import { Map } from "../components/Map";
import { useTickets } from "../hooks/useTickets";

export default function MapPage() {
  const { data: tickets = [], isLoading, isError } = useTickets();

  return (
    <main className="h-[calc(100dvh-3.5rem)] w-full">
      {isError && (
        <div
          role="alert"
          className="absolute left-1/2 top-20 z-[2000] -translate-x-1/2 rounded-lg bg-red-50 border border-red-300 px-4 py-2 text-sm text-red-700 shadow"
        >
          Could not load reports. Retrying…
        </div>
      )}
      <Map tickets={tickets} loading={isLoading} />
    </main>
  );
}
