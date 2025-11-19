import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, ChevronDown, ChevronUp } from "lucide-react";

interface TelemetryEvent {
  bee_id: string;
  event: string;
  data: Record<string, any> | null;
  timestamp: string;
}

interface TelemetryResponse {
  events: TelemetryEvent[];
  count: number;
}

const TelemetryDashboard = () => {
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const fetchTelemetry = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/telemetry?limit=50");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: TelemetryResponse = await response.json();
      setEvents(data.events);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch telemetry");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "N/A";
    }
  };

  const getEventColor = (event: string) => {
    if (event.includes("error") || event.includes("failed")) return "bg-red-500/20 text-red-300";
    if (event.includes("success") || event.includes("completed")) return "bg-green-500/20 text-green-300";
    if (event.includes("started") || event.includes("begin")) return "bg-blue-500/20 text-blue-300";
    if (event.includes("warning")) return "bg-yellow-500/20 text-yellow-300";
    return "bg-slate-500/20 text-slate-300";
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Live Telemetry Stream ({events.length})
            </CardTitle>
            <CardDescription>Real-time event monitoring from all bees</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading telemetry...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">Error: {error}</div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No telemetry events yet. Send some to get started.</div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.map((event, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getEventColor(event.event)}>{event.event}</Badge>
                      <span className="text-sm text-muted-foreground">{event.bee_id}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatTime(event.timestamp)}</p>
                  </div>
                  <button className="ml-2 text-muted-foreground hover:text-foreground transition-colors">
                    {expandedIndex === index ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Expandable event data */}
                {expandedIndex === index && event.data && (
                  <div className="mt-3 pt-3 border-t border-slate-700">
                    <pre className="text-xs bg-slate-900/50 p-2 rounded overflow-x-auto text-slate-300">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TelemetryDashboard;
