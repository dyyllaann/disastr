import React from "react";
import guidanceData from "../data/guidance.json";
import type { GuidanceContent } from "../types";

const content = guidanceData as GuidanceContent;

const PHASE_LABELS: Record<string, string> = {
  before: "Before a Flood",
  during: "During a Flood",
  after: "After a Flood",
};

const PHASE_COLORS: Record<string, string> = {
  before: "border-blue-400 bg-blue-50",
  during: "border-red-400 bg-red-50",
  after: "border-green-400 bg-green-50",
};

const PHASE_HEADING_COLORS: Record<string, string> = {
  before: "text-blue-800",
  during: "text-red-800",
  after: "text-green-800",
};

const phases = ["before", "during", "after"] as const;

export default function GuidancePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Emergency Flood Guidance</h1>
        <p className="mt-1 text-sm text-gray-500">
          Last updated: {content.lastUpdated}
        </p>
        <p className="mt-3 text-gray-700 text-sm leading-relaxed">
          Use the sections below to prepare for, respond to, and recover from flood
          events. This page is available offline once the app is cached.
        </p>
      </header>

      {phases.map((phase) => {
        const sections = content.sections.filter((s) => s.phase === phase);
        return (
          <section key={phase} className="mb-10" aria-labelledby={`heading-${phase}`}>
            <h2
              id={`heading-${phase}`}
              className={`mb-4 text-xl font-bold ${PHASE_HEADING_COLORS[phase]}`}
            >
              {PHASE_LABELS[phase]}
            </h2>

            <div className="flex flex-col gap-4">
              {sections.map((sec) => (
                <article
                  key={sec.id}
                  className={`rounded-xl border-l-4 p-4 ${PHASE_COLORS[phase]}`}
                  aria-labelledby={`section-${sec.id}`}
                >
                  <h3
                    id={`section-${sec.id}`}
                    className="font-semibold text-gray-900"
                  >
                    {sec.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-700 leading-relaxed">
                    {sec.body}
                  </p>
                  <ul className="mt-3 space-y-1 pl-4 list-disc text-sm text-gray-700">
                    {sec.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
