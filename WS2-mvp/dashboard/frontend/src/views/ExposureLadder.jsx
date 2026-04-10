import { useState, useEffect } from "react";

const MODES = ["shadow", "advisory", "controlled"];
const MODE_DESCRIPTIONS = {
  shadow: "Agent decides, nothing sent. Logged only.",
  advisory: "Agent recommends, human approves here.",
  controlled: "Agent acts within caps, human monitors.",
};

export default function ExposureLadder() {
  const [exposure, setExposure] = useState({});

  useEffect(() => {
    fetch("/api/exposure")
      .then((r) => r.json())
      .then(setExposure)
      .catch(() => {});
  }, []);

  const updateMode = async (hypothesis, mode) => {
    await fetch(`/api/exposure/${hypothesis}?mode=${mode}`, { method: "POST" });
    setExposure((prev) => ({
      ...prev,
      [hypothesis]: { ...prev[hypothesis], mode },
    }));
  };

  const hypotheses = {
    H1_onboarding: { label: "H1: Ambient Onboarding", desc: "Nudge new customers through first 90 days" },
    H2_risk_guardian: { label: "H2: Risk Guardian", desc: "Proactive churn/bill-shock intervention" },
    H3_voice_concierge: { label: "H3: Voice Concierge", desc: "Voice-first multilingual support" },
    H4_network_resolution: { label: "H4: Network Resolution", desc: "Diagnose and resolve 'data not working'" },
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-white mb-2">Exposure Ladder</h2>
      <p className="text-sm text-jio-muted mb-6">
        Control the autonomy level per hypothesis. Each starts in shadow mode.
      </p>

      <div className="grid grid-cols-2 gap-4 max-w-4xl">
        {Object.entries(hypotheses).map(([key, { label, desc }]) => {
          const state = exposure[key] || { mode: "shadow", decisions_today: 0 };
          return (
            <div key={key} className="bg-jio-card rounded-lg border border-jio-border p-5">
              <h3 className="text-white font-medium">{label}</h3>
              <p className="text-xs text-jio-muted mt-1 mb-4">{desc}</p>

              {/* Mode selector */}
              <div className="flex gap-2 mb-3">
                {MODES.map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateMode(key, mode)}
                    className={`text-xs px-3 py-1.5 rounded transition-all ${
                      state.mode === mode
                        ? mode === "shadow"
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : mode === "advisory"
                          ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                          : "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "text-jio-muted hover:text-white border border-transparent"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              <p className="text-xs text-jio-muted">
                {MODE_DESCRIPTIONS[state.mode]}
              </p>
              <p className="text-xs text-jio-muted mt-2">
                Decisions today: {state.decisions_today}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
