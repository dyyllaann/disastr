import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTicket } from "../api/client";
import type { Classification, CreateTicketPayload } from "../types";
import { ClassificationBadge } from "../components/ClassificationBadge";
import { CLASSIFICATION_LABELS } from "../lib/classificationColors";
import { useGeolocation } from "../hooks/useGeolocation";

const CLASSIFICATIONS: Classification[] = [
  "medical",
  "hazard",
  "food_water",
  "transportation",
  "other",
];

export default function ReportPage() {
  const qc = useQueryClient();
  const geo = useGeolocation();

  const [classification, setClassification] = useState<Classification>("other");
  const [message, setMessage] = useState("");
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submit = useMutation({
    mutationFn: createTicket,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets"] });
      setSubmitted(true);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const lat = geo.lat ?? parseFloat(manualLat);
    const lng = geo.lng ?? parseFloat(manualLng);

    if (!lat || !lng) return;

    const payload: CreateTicketPayload = {
      classification,
      message,
      location: {
        lat,
        lng,
        source: geo.lat ? "gps" : "sms_geocoded",
      },
      reporter: {
        channel: "smartphone",
        // TODO: in production derive this from an authenticated session; never store raw PII
        contactHash: "anonymous-web-user",
      },
    };

    submit.mutate(payload);
  }

  if (submitted) {
    return (
      <main className="mx-auto max-w-lg px-4 py-8">
        <div role="alert" className="rounded-xl border border-green-300 bg-green-50 p-6 text-green-800">
          <p className="text-lg font-semibold">Report submitted!</p>
          <p className="mt-1 text-sm">
            Your report has been received and will appear on the map once a
            moderator reviews it.
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setMessage("");
            }}
            className="mt-4 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
          >
            Submit another report
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Submit a Report</h1>
      <p className="mt-2 text-sm text-gray-600">
        Use this form to report a flood-related situation. This mirrors the SMS
        reply flow for smartphone users.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
        {/* Classification */}
        <fieldset>
          <legend className="text-sm font-medium text-gray-700">
            Category <span aria-hidden="true">*</span>
          </legend>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CLASSIFICATIONS.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={classification === c}
                onClick={() => setClassification(c)}
                className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  classification === c
                    ? "border-blue-600 bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <ClassificationBadge classification={c} size="sm" />
              </button>
            ))}
          </div>
        </fieldset>

        {/* Message */}
        <div>
          <label htmlFor="report-msg" className="block text-sm font-medium text-gray-700">
            Describe the situation <span aria-hidden="true">*</span>
          </label>
          <textarea
            id="report-msg"
            required
            rows={4}
            maxLength={500}
            placeholder="e.g. Power line down in 3 feet of water at the corner of Oak and Elm"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          />
          <p className="mt-1 text-right text-xs text-gray-400">{message.length}/500</p>
        </div>

        {/* Location */}
        <fieldset className="rounded-lg border border-gray-200 p-4">
          <legend className="px-1 text-sm font-medium text-gray-700">Location</legend>
          <button
            type="button"
            onClick={geo.fetch}
            disabled={geo.loading}
            className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            {geo.loading
              ? "Getting location…"
              : geo.lat
              ? `📍 ${geo.lat.toFixed(5)}, ${geo.lng!.toFixed(5)}`
              : "Use my current location"}
          </button>
          {geo.error && (
            <p className="mt-1 text-xs text-orange-600">{geo.error}</p>
          )}
          {!geo.lat && (
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="lat" className="block text-xs font-medium text-gray-600">Latitude</label>
                <input
                  id="lat"
                  type="number"
                  step="any"
                  placeholder="29.7604"
                  value={manualLat}
                  onChange={(e) => setManualLat(e.target.value)}
                  className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="lng" className="block text-xs font-medium text-gray-600">Longitude</label>
                <input
                  id="lng"
                  type="number"
                  step="any"
                  placeholder="-95.3698"
                  value={manualLng}
                  onChange={(e) => setManualLng(e.target.value)}
                  className="mt-1 block w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                />
              </div>
            </div>
          )}
        </fieldset>

        {submit.isError && (
          <p role="alert" className="text-sm text-red-600">
            Failed to submit:{" "}
            {submit.error instanceof Error ? submit.error.message : "Unknown error"}
          </p>
        )}

        <button
          type="submit"
          disabled={submit.isPending || !message || (!geo.lat && (!manualLat || !manualLng))}
          className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
        >
          {submit.isPending ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </main>
  );
}
