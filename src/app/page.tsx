"use client";

import { useState } from "react";

type Evidence = {
  text: string;
  source: string;
  url: string;
};

type Pain = {
  title: string;
  score: number;
  description: string;

  frequencyScore: number;
  severityScore: number;
  willingnessToPayScore: number;
  automationFitScore: number;
  evidenceScore: number;

  supportingConversations: number;

  evidence: Evidence[];

  opportunity: string;
  customer: string;
  whyTheyWouldPay: string;
  validationExperiment: string;

  uniqueSources: number;
};

export default function Home() {
  const [market, setMarket] = useState("");
  const [pains, setPains] = useState<Pain[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationsAnalyzed, setConversationsAnalyzed] = useState(0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!market.trim()) {
      return;
    }

    setLoading(true);
    setPains([]);
    setConversationsAnalyzed(0);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          market: market,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error(data.error);
        setPains([]);
        setConversationsAnalyzed(0);
        return;
      }

      setPains(data.pains);
      setConversationsAnalyzed(data.conversationsAnalyzed);
    } catch (error) {
      console.error("Request failed:", error);
      setPains([]);
      setConversationsAnalyzed(0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-24">
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-widest text-gray-500">
            PainMiner
          </p>

          <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
            Find problems worth solving.
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-gray-600">
            Discover recurring problems, frustrations and unmet needs hidden in
            online conversations.
          </p>

          <form onSubmit={handleSubmit} className="mt-10">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={market}
                onChange={(event) => setMarket(event.target.value)}
                placeholder="Try recruiters, dentists, property managers..."
                className="flex-1 rounded-xl border border-gray-300 px-5 py-4 text-base outline-none focus:border-black"
              />

              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-black px-6 py-4 font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? "Analyzing..." : "Find Problems"}
              </button>
            </div>
          </form>

          <p className="mt-4 text-sm text-gray-500">
            Try: recruiters · dentists · accountants · property managers
          </p>
        </div>

        {pains.length > 0 && (
          <div className="mt-16">
            <div className="mb-6 flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-widest text-gray-500">
                  Analysis
                </p>

                <h2 className="mt-2 text-2xl font-semibold">
                  Problems worth investigating
                </h2>
              </div>

              <p className="text-sm text-gray-500">
                {conversationsAnalyzed} conversations analyzed
              </p>
            </div>

            <div className="space-y-6">
              {pains.map((pain) => (
                <article
                  key={pain.title}
                  className="rounded-2xl border border-gray-200 bg-white p-7 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div>
                      <h3 className="text-xl font-semibold">{pain.title}</h3>

                      <p className="mt-3 leading-7 text-gray-600">
                        {pain.description}
                      </p>
                    </div>

                    <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold">
                      {pain.score}/100
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-3 border-t border-gray-100 pt-6 sm:grid-cols-5">
                    <div className="rounded-xl bg-gray-50 p-3 text-center">
                      <p className="text-lg font-semibold">
                        {pain.frequencyScore}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Frequency
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3 text-center">
                      <p className="text-lg font-semibold">
                        {pain.severityScore}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Severity
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3 text-center">
                      <p className="text-lg font-semibold">
                        {pain.willingnessToPayScore}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Willingness
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3 text-center">
                      <p className="text-lg font-semibold">
                        {pain.automationFitScore}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Automation
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-3 text-center">
                      <p className="text-lg font-semibold">
                        {pain.evidenceScore}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Evidence
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-sm text-gray-500">
                    Supported by {pain.supportingConversations} independent conversations
                    {" "}across {pain.uniqueSources} sources
                  </p>

                  <div className="mt-6 border-t border-gray-100 pt-6">
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Evidence
                    </p>

                    <div className="mt-3 space-y-3">
                      {pain.evidence.map((item, index) => (
                        <a
                          key={index}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-xl bg-gray-50 px-4 py-4 transition hover:bg-gray-100"
                        >
                          <p className="text-sm leading-6 text-gray-700">
                            {item.text}
                          </p>

                          <p className="mt-2 text-xs font-medium text-gray-500">
                            {item.source} ↗
                          </p>
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 border-t border-gray-100 pt-6">
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Business opportunity
                    </p>

                    <p className="mt-3 leading-7 text-gray-700">
                      {pain.opportunity}
                    </p>
                  </div>

                  <div className="mt-6 grid gap-4 border-t border-gray-100 pt-6 sm:grid-cols-2">
                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Who pays
                      </p>

                      <p className="mt-2 font-medium text-gray-900">
                        {pain.customer}
                      </p>
                    </div>

                    <div className="rounded-xl bg-gray-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Why they pay
                      </p>

                      <p className="mt-2 text-sm leading-6 text-gray-700">
                        {pain.whyTheyWouldPay}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 border-t border-gray-100 pt-6">
                    <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                      Validation experiment
                    </p>

                    <p className="mt-3 leading-7 text-gray-700">
                      {pain.validationExperiment}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}