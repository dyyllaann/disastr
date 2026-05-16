import React, { useState } from "react";
import { OptInForm } from "../components/OptInForm";

export default function OptInPage() {
  const [mode, setMode] = useState<"optin" | "optout">("optin");

  return (
    <main className="mx-auto max-w-lg px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Alert Preferences</h1>
      <p className="mt-2 text-sm text-gray-600">
        Sign up to receive flood warnings for your area, or opt out to stop all
        messages from this service.
      </p>

      {/* Mode toggle */}
      <div
        role="tablist"
        aria-label="Opt-in or opt-out"
        className="mt-6 flex rounded-lg border border-gray-200 overflow-hidden"
      >
        {(["optin", "optout"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 ${
              mode === m
                ? "bg-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {m === "optin" ? "Sign up" : "Opt out"}
          </button>
        ))}
      </div>

      <div className="mt-6" role="tabpanel">
        {mode === "optin" ? (
          <OptInForm />
        ) : (
          <OptOutSection />
        )}
      </div>
    </main>
  );
}

function OptOutSection() {
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // TODO: DELETE /subscriptions — look up by hashed phone
    setDone(true);
  }

  if (done) {
    return (
      <div role="alert" className="rounded-xl border border-green-300 bg-green-50 p-6 text-green-800">
        <p className="font-semibold">You have been unsubscribed.</p>
        <p className="mt-1 text-sm">
          You will no longer receive alerts. You can re-subscribe at any time.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-gray-600">
        Enter your phone number to remove yourself from all alert lists. You can
        also reply <strong>STOP</strong> to any message from this service.
      </p>
      <div>
        <label htmlFor="optout-phone" className="block text-sm font-medium text-gray-700">
          Phone number
        </label>
        <input
          id="optout-phone"
          type="tel"
          autoComplete="tel"
          required
          placeholder="+1 555 000 0000"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        />
      </div>
      <button
        type="submit"
        disabled={!phone}
        className="rounded-lg bg-red-600 px-4 py-3 text-sm font-semibold text-white shadow hover:bg-red-700 disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 transition-colors"
      >
        Remove me from alerts
      </button>
    </form>
  );
}
