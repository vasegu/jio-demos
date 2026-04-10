import { useState, useEffect } from "react";

const OODA_STEPS = [
  { key: "observe", label: "OBSERVE", color: "text-green-400", bg: "bg-green-400/10" },
  { key: "orient", label: "ORIENT", color: "text-blue-400", bg: "bg-blue-400/10" },
  { key: "decide", label: "DECIDE", color: "text-purple-400", bg: "bg-purple-400/10" },
  { key: "act", label: "ACT", color: "text-orange-400", bg: "bg-orange-400/10" },
];

export default function DecisionInspector({ selected }) {
  const [decisions, setDecisions] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    fetch("/api/decisions?limit=20")
      .then((r) => r.json())
      .then((data) => setDecisions(data.decisions || []))
      .catch(() => {});
  }, []);

  const decision = active || selected;

  return (
    <div className="flex h-full">
      {/* Decision list */}
      <div className="w-80 border-r border-jio-border overflow-y-auto">
        <div className="px-4 py-3 border-b border-jio-border">
          <h2 className="text-lg font-semibold text-white">Decisions</h2>
          <p className="text-xs text-jio-muted mt-1">{decisions.length} logged</p>
        </div>
        {decisions.length === 0 ? (
          <p className="text-sm text-jio-muted p-4">
            No decisions yet. Run the full pipeline to see them.
          </p>
        ) : (
          decisions.map((d, i) => (
            <button
              key={i}
              onClick={() => setActive(d)}
              className={`w-full text-left px-4 py-3 border-b border-jio-border/50 hover:bg-white/5 ${
                active === d ? "bg-jio-purple/10" : ""
              }`}
            >
              <div className="text-sm text-white truncate">
                {d.signal?.signal_type || "unknown signal"}
              </div>
              <div className="text-xs text-jio-muted mt-1">
                {d.signal?.customer_name || "unknown"} - {d.signal?.urgency || "?"}
              </div>
            </button>
          ))
        )}
      </div>

      {/* OODA detail */}
      <div className="flex-1 overflow-y-auto p-6">
        {!decision ? (
          <div className="text-center text-jio-muted py-20">
            <p className="text-lg">Select a decision to inspect</p>
            <p className="text-sm mt-2">
              Click a decision from the list or from the signal feed
            </p>
          </div>
        ) : (
          <div className="max-w-3xl">
            <h3 className="text-xl font-bold text-white mb-6">
              {decision.signal?.signal_type || "Decision"} - {decision.signal?.customer_name}
            </h3>

            {/* OODA panels */}
            <div className="space-y-4">
              {/* OBSERVE */}
              <OodaPanel
                step={OODA_STEPS[0]}
                content={
                  decision.signal
                    ? `Signal: ${decision.signal.signal_type}\nUrgency: ${decision.signal.urgency}\nSummary: ${decision.signal.raw_event_summary}`
                    : "No signal data"
                }
              />

              {/* ORIENT */}
              <OodaPanel
                step={OODA_STEPS[1]}
                content={
                  decision.signal
                    ? `Customer: ${decision.signal.customer_name} (${decision.signal.customer_id})\nPlan: ${decision.signal.customer_plan}\nTenure: ${decision.signal.customer_tenure_days} days\nNPS: ${decision.signal.customer_nps}\nRisk: ${decision.signal.customer_risk}\nLanguage: ${decision.signal.customer_language}\nChannel: ${decision.signal.customer_channel}\nComplaints: ${decision.signal.customer_complaints}`
                    : "No context"
                }
              />

              {/* DECIDE */}
              <OodaPanel
                step={OODA_STEPS[2]}
                content={decision.decision || "No decision recorded"}
              />

              {/* ACT */}
              <OodaPanel
                step={OODA_STEPS[3]}
                content={`Exposure mode: ${decision.signal?.exposure_mode || "shadow"}\nTools used: ${(decision.tools_used || []).join(" -> ") || "none"}`}
              />
            </div>

            {/* LangFuse trace link (when wired) */}
            <div className="mt-6 p-4 bg-jio-card rounded-lg border border-jio-border">
              <p className="text-xs text-jio-muted">
                Full model trace available in LangFuse (link TBD)
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OodaPanel({ step, content }) {
  return (
    <div className={`rounded-lg border border-jio-border overflow-hidden`}>
      <div className={`px-4 py-2 ${step.bg} border-b border-jio-border`}>
        <span className={`text-xs font-bold tracking-wider ${step.color}`}>
          {step.label}
        </span>
      </div>
      <div className="px-4 py-3">
        <pre className="text-sm text-jio-text whitespace-pre-wrap font-mono leading-relaxed">
          {content}
        </pre>
      </div>
    </div>
  );
}
