import React, { useState } from "react";
import type { AlertChannel, CreateSubscriptionPayload } from "../types";
import { useSubscription } from "../hooks/useSubscription";

const CHANNELS: { value: AlertChannel; label: string; desc: string }[] = [
  { value: "sms", label: "SMS", desc: "Text message to your phone" },
  { value: "voice", label: "Voice call", desc: "Automated voice call" },
  { value: "push", label: "Push notification", desc: "Browser or app notification" },
];

export const OptInForm: React.FC = () => {
  const { subscribe } = useSubscription();
  const [phone, setPhone] = useState("");
  const [channels, setChannels] = useState<AlertChannel[]>(["sms"]);
  const [zipCodes, setZipCodes] = useState("");
  const [consented, setConsented] = useState(false);
  const [success, setSuccess] = useState(false);

  function toggleChannel(ch: AlertChannel) {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consented) return;

    const payload: CreateSubscriptionPayload = {
      phoneNumber: phone,
      alertChannels: channels,
      region: zipCodes.split(",").map((z) => z.trim()).filter(Boolean),
    };

    await subscribe.mutateAsync(payload);
    setSuccess(true);
  }

  if (success) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-green-300 bg-green-50 p-6 text-green-800"
      >
        <p className="font-semibold text-lg">You're signed up!</p>
        <p className="mt-1 text-sm">
          You'll receive flood alerts via your selected channels. Reply{" "}
          <strong>STOP</strong> to any SMS to opt out at any time.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* Phone */}
      <div>
        <label htmlFor="opt-phone" className="block text-sm font-medium text-gray-700">
          Mobile phone number <span aria-hidden="true">*</span>
        </label>
        <input
          id="opt-phone"
          type="tel"
          autoComplete="tel"
          required
          placeholder="+1 555 000 0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>

      {/* Alert channels */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700">Alert channels</legend>
        <div className="mt-2 flex flex-col gap-2">
          {CHANNELS.map(({ value, label, desc }) => (
            <label key={value} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={channels.includes(value)}
                onChange={() => toggleChannel(value)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                aria-describedby={`ch-desc-${value}`}
              />
              <span>
                <span className="text-sm font-medium text-gray-800">{label}</span>
                <span id={`ch-desc-${value}`} className="block text-xs text-gray-500">
                  {desc}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* Region (ZIP codes) */}
      <div>
        <label htmlFor="opt-zips" className="block text-sm font-medium text-gray-700">
          ZIP codes to monitor{" "}
          <span className="text-gray-400 font-normal">(comma-separated)</span>
        </label>
        <input
          id="opt-zips"
          type="text"
          placeholder="77001, 77002, 77003"
          value={zipCodes}
          onChange={(e) => setZipCodes(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>

      {/* Consent */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          required
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-describedby="consent-text"
        />
        <span id="consent-text" className="text-xs text-gray-600 leading-relaxed">
          I consent to receive automated flood-alert messages at the number above.
          Message and data rates may apply. You may opt out at any time by replying{" "}
          <strong>STOP</strong> to any message or visiting the opt-out page.
        </span>
      </label>

      <button
        type="submit"
        disabled={!consented || !phone || channels.length === 0 || subscribe.isPending}
        className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 transition-colors"
      >
        {subscribe.isPending ? "Signing up…" : "Sign up for alerts"}
      </button>

      {subscribe.isError && (
        <p role="alert" className="text-sm text-red-600">
          Something went wrong. Please try again.
        </p>
      )}
    </form>
  );
};
