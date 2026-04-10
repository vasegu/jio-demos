import { useState } from "react";
import SignalFeed from "./views/SignalFeed";
import DecisionInspector from "./views/DecisionInspector";
import ExposureLadder from "./views/ExposureLadder";
import PipelineHealth from "./views/PipelineHealth";

const NAV = [
  { id: "signals", label: "Signal Feed" },
  { id: "decisions", label: "Decisions" },
  { id: "exposure", label: "Exposure" },
  { id: "health", label: "Health" },
];

export default function App() {
  const [view, setView] = useState("signals");
  const [selectedDecision, setSelectedDecision] = useState(null);

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <nav className="w-56 bg-jio-card border-r border-jio-border flex flex-col">
        <div className="p-4 border-b border-jio-border">
          <h1 className="text-lg font-bold text-white">Jio Spine</h1>
          <p className="text-xs text-jio-muted mt-1">Control Plane</p>
        </div>
        <div className="flex-1 py-2">
          {NAV.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full text-left px-4 py-3 text-sm flex items-center gap-3 transition-colors ${
                view === item.id
                  ? "bg-jio-purple/20 text-white border-r-2 border-jio-purple"
                  : "text-jio-muted hover:text-jio-text hover:bg-white/5"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="p-4 border-t border-jio-border text-xs text-jio-muted">
          Agent Engine: live
          <br />
          RAG: 17 files indexed
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {view === "signals" && (
          <SignalFeed
            onSelectDecision={(d) => {
              setSelectedDecision(d);
              setView("decisions");
            }}
          />
        )}
        {view === "decisions" && (
          <DecisionInspector selected={selectedDecision} />
        )}
        {view === "exposure" && <ExposureLadder />}
        {view === "health" && <PipelineHealth />}
      </main>
    </div>
  );
}
