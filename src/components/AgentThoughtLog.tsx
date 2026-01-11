import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Search, Palette, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export interface ThoughtStep {
  id: string;
  agent: "planner" | "researcher" | "creative" | "auditor";
  action: string;
  status: "thinking" | "completed" | "error";
  timestamp: number;
  details?: string;
  citations?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  metadata?: Record<string, any>;
}

interface AgentThoughtLogProps {
  thoughts: ThoughtStep[];
  isActive: boolean;
  onStepClick?: (step: ThoughtStep) => void;
}

const AgentThoughtLog = ({ thoughts, isActive, onStepClick }: AgentThoughtLogProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [thoughts]);

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case "planner": return <Brain className="w-4 h-4" />;
      case "researcher": return <Search className="w-4 h-4" />;
      case "creative": return <Palette className="w-4 h-4" />;
      case "auditor": return <CheckCircle className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case "planner": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "researcher": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "creative": return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      case "auditor": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      default: return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "thinking": return <Loader2 className="w-4 h-4 animate-spin" />;
      case "completed": return <CheckCircle className="w-4 h-4" />;
      case "error": return <AlertCircle className="w-4 h-4" />;
      default: return <Loader2 className="w-4 h-4" />;
    }
  };

  const toggleExpanded = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  return (
    <Card className="bg-white/5 backdrop-blur-md border border-white/10 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-voyageur-gold" />
          Agent Thought Process
          {isActive && <Loader2 className="w-4 h-4 animate-spin text-voyageur-gold" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-4rem)]">
        <ScrollArea className="h-full px-6 pb-6" ref={scrollAreaRef}>
          <div className="space-y-3">
            {thoughts.length === 0 ? (
              <div className="text-center py-8 text-white/60">
                <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Agent is ready to begin...</p>
              </div>
            ) : (
              thoughts.map((step) => (
                <div
                  key={step.id}
                  className={`rounded-lg border transition-all cursor-pointer ${
                    expandedSteps.has(step.id)
                      ? "bg-white/10 border-white/20"
                      : "bg-white/5 border-white/10 hover:bg-white/8"
                  }`}
                  onClick={() => onStepClick?.(step)}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg border ${getAgentColor(step.agent)}`}>
                        {getAgentIcon(step.agent)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-xs ${getAgentColor(step.agent)}`}>
                            {step.agent}
                          </Badge>
                          <span className="text-xs text-white/60">
                            {new Date(step.timestamp).toLocaleTimeString()}
                          </span>
                          {getStatusIcon(step.status)}
                        </div>

                        <p className="text-sm text-white/90 font-medium mb-1">
                          {step.action}
                        </p>

                        {step.details && (
                          <p className="text-xs text-white/70 line-clamp-2">
                            {step.details}
                          </p>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpanded(step.id);
                        }}
                        className="text-white/60 hover:text-white transition-colors"
                      >
                        {expandedSteps.has(step.id) ? "−" : "+"}
                      </button>
                    </div>

                    {expandedSteps.has(step.id) && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        {step.citations && step.citations.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-semibold text-voyageur-gold mb-2 uppercase tracking-wide">
                              Research Citations
                            </h4>
                            <div className="space-y-2">
                              {step.citations.map((citation, idx) => (
                                <div key={idx} className="bg-white/5 rounded p-3">
                                  <a
                                    href={citation.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm font-medium text-voyageur-gold hover:text-yellow-300 transition-colors"
                                  >
                                    {citation.title}
                                  </a>
                                  <p className="text-xs text-white/70 mt-1 line-clamp-2">
                                    {citation.snippet}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {step.metadata && Object.keys(step.metadata).length > 0 && (
                          <div>
                            <h4 className="text-xs font-semibold text-voyageur-gold mb-2 uppercase tracking-wide">
                              Technical Details
                            </h4>
                            <div className="bg-black/20 rounded p-3 font-mono text-xs">
                              <pre className="text-white/80 overflow-x-auto">
                                {JSON.stringify(step.metadata, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AgentThoughtLog;