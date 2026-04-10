import { useState, useEffect } from "react";

export default function PipelineHealth() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    const fetchHealth = () =>
      fetch("/api/health")
        .then((r) => r.json())
        .then(setHealth)
        .catch(() => {});

    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!health) return <div className="p-6 text-jio-muted">Loading...</div>;

  const cards = [
    { label: "Status", value: health.status, color: health.status === "healthy" ? "text-green-400" : "text-red-400" },
    { label: "Signal Buffer", value: health.signal_buffer_size, color: "text-blue-400" },
    { label: "Decisions Logged", value: health.decisions_logged, color: "text-purple-400" },
    { label: "WS Clients", value: health.ws_clients_connected, color: "text-orange-400" },
  ];

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-white mb-6">Pipeline Health</h2>

      <div className="grid grid-cols-4 gap-4 max-w-4xl mb-8">
        {cards.map((card) => (
          <div key={card.label} className="bg-jio-card rounded-lg border border-jio-border p-5">
            <p className="text-xs text-jio-muted uppercase tracking-wider">{card.label}</p>
            <p className={`text-2xl font-bold mt-2 ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <h3 className="text-white font-medium mb-3">Exposure State</h3>
      <div className="bg-jio-card rounded-lg border border-jio-border p-4 max-w-4xl">
        <pre className="text-sm text-jio-text font-mono">
          {JSON.stringify(health.exposure, null, 2)}
        </pre>
      </div>

      <div className="mt-6 text-xs text-jio-muted">
        <p>Auto-refreshes every 5 seconds</p>
        <p className="mt-1">
          Pipeline: Simulator -> Pub/Sub -> Processor -> Agent Trigger -> Agent Engine
        </p>
      </div>
    </div>
  );
}
