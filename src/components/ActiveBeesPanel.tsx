import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Clock } from "lucide-react";

interface Bee {
  bee_id: string;
  bee_type: string;
  status: string;
  model_capabilities: string[];
  version: string | null;
  metadata: Record<string, any>;
  registered_at: string;
  last_heartbeat: string;
}

interface BeesResponse {
  bees: Bee[];
  count: number;
}

const ActiveBeesPanel = () => {
  const [bees, setBees] = useState<Bee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBees = async () => {
    try {
      const response = await fetch("http://localhost:8000/api/v1/bees");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: BeesResponse = await response.json();
      setBees(data.bees);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch bees");
      setBees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBees();
    const interval = setInterval(fetchBees, 5000);
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

  const getStatusColor = (status: string) => {
    return status === "ACTIVE" ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300";
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Active Bees ({bees.length})
            </CardTitle>
            <CardDescription>Real-time bee colony status</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading bees...</div>
        ) : error ? (
          <div className="text-center py-8 text-red-400">Error: {error}</div>
        ) : bees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No active bees. Register one to get started.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bees.map((bee) => (
              <div
                key={bee.bee_id}
                className="p-4 rounded-lg border border-slate-700 bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <div className="space-y-3">
                  {/* Bee ID and Type */}
                  <div>
                    <p className="font-semibold text-foreground truncate">{bee.bee_id}</p>
                    <p className="text-sm text-muted-foreground capitalize">{bee.bee_type.replace(/_/g, " ")}</p>
                  </div>

                  {/* Status Badge */}
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(bee.status)}>{bee.status}</Badge>
                    {bee.version && <Badge variant="secondary" className="text-xs">{bee.version}</Badge>}
                  </div>

                  {/* Capabilities */}
                  {bee.model_capabilities.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {bee.model_capabilities.slice(0, 3).map((cap) => (
                        <Badge key={cap} variant="outline" className="text-xs bg-blue-500/10 text-blue-300 border-blue-500/30">
                          {cap}
                        </Badge>
                      ))}
                      {bee.model_capabilities.length > 3 && (
                        <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-300 border-blue-500/30">
                          +{bee.model_capabilities.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Last Heartbeat */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span>Last heartbeat: {formatTime(bee.last_heartbeat)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActiveBeesPanel;
