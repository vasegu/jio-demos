import { useState, useEffect, useRef } from "react";

const URGENCY_COLORS = {
  critical: "bg-urgency-critical/20 text-urgency-critical border-urgency-critical/30",
  high: "bg-urgency-high/20 text-urgency-high border-urgency-high/30",
  medium: "bg-urgency-medium/20 text-urgency-medium border-urgency-medium/30",
  low: "bg-urgency-low/20 text-urgency-low border-urgency-low/30",
};

const TOPIC_COLORS = {
  billing: "text-blue-400",
  network: "text-orange-400",
  app: "text-green-400",
  device: "text-purple-400",
  decision: "text-jio-purple",
};

export default function SignalFeed({ onSelectDecision }) {
  const [signals, setSignals] = useState([]);
  const [connected, setConnected] = useState(false);
  const [filter, setFilter] = useState("all");
  const bottomRef = useRef(null);

  useEffect(() => {
    // Load initial buffer
    fetch("/api/signals/feed?limit=100")
      .then((r) => r.json())
      .then((data) => setSignals(data.signals || []))
      .catch(() => {});

    // Connect WebSocket
    const ws = new WebSocket(`ws://${window.location.hostname}:3001/ws/signals`);
    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (e) => {
      const event = JSON.parse(e.data);
      setSignals((prev) => [...prev.slice(-199), event]);
    };

    return () => ws.close();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [signals]);

  const filtered =
    filter === "all"
      ? signals
      : signals.filter((s) => s.source_topic === filter || s.type === filter);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b border-jio-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-white">Signal Feed</h2>
          <span
            className={`text-xs px-2 py-0.5 rounded-full ${
              connected
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            {connected ? "live" : "disconnected"}
          </span>
          <span className="text-xs text-jio-muted">{signals.length} events</span>
        </div>
        <div className="flex gap-2">
          {["all", "billing", "network", "app", "device", "decision"].map(
            (f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`text-xs px-3 py-1 rounded ${
                  filter === f
                    ? "bg-jio-purple/30 text-white"
                    : "text-jio-muted hover:text-white"
                }`}
              >
                {f}
              </button>
            )
          )}
        </div>
      </div>

      {/* Signal list */}
      <div className="flex-1 overflow-y-auto px-6 py-2">
        {filtered.length === 0 ? (
          <div className="text-center text-jio-muted py-20">
            <p className="text-lg">No signals yet</p>
            <p className="text-sm mt-2">
              Run the simulator to see events flow:
              <br />
              <code className="text-xs bg-jio-card px-2 py-1 rounded mt-2 inline-block">
                python simulator.py --continuous --interval 5
              </code>
            </p>
          </div>
        ) : (
          filtered.map((signal, i) => (
            <SignalCard
              key={i}
              signal={signal}
              onClick={() => signal.type === "decision" && onSelectDecision(signal)}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function SignalCard({ signal, onClick }) {
  const urgency = signal.urgency || "low";
  const topic = signal.source_topic || signal.type || "unknown";
  const isDecision = signal.type === "decision";

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-4 py-2.5 px-3 rounded-lg mb-1 border border-transparent transition-all ${
        isDecision
          ? "bg-jio-purple/10 border-jio-purple/20 cursor-pointer hover:bg-jio-purple/20"
          : "hover:bg-white/5"
      }`}
    >
      {/* Timestamp */}
      <span className="text-xs text-jio-muted font-mono w-20 shrink-0">
        {signal.timestamp
          ? new Date(signal.timestamp).toLocaleTimeString()
          : "--:--:--"}
      </span>

      {/* Topic badge */}
      <span
        className={`text-xs font-medium uppercase w-16 shrink-0 ${
          TOPIC_COLORS[topic] || "text-jio-muted"
        }`}
      >
        {topic}
      </span>

      {/* Customer */}
      <span className="text-sm text-white w-32 shrink-0 truncate">
        {signal.customer_name || signal.customer_id || "---"}
      </span>

      {/* Signal type / summary */}
      <span className="text-sm text-jio-text flex-1 truncate">
        {signal.signal_type || signal.event_type || signal.agent_decision_preview || "---"}
      </span>

      {/* Urgency badge */}
      {signal.urgency && (
        <span
          className={`text-xs px-2 py-0.5 rounded border ${
            URGENCY_COLORS[urgency]
          }`}
        >
          {urgency}
        </span>
      )}
    </div>
  );
}
