import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  Sparkles,
  Zap,
  Brain,
  Target,
  Palette,
  Code,
  Rocket,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Download,
  Share,
  Eye,
  Wand2,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  Terminal,
  Activity
} from "lucide-react";
import AgentThoughtLog from "@/components/AgentThoughtLog";

interface ThoughtStep {
  id: string;
  agent: "planner" | "researcher" | "creative" | "auditor";
  action: string;
  details?: string;
  timestamp: number;
  status?: "pending" | "active" | "completed" | "error";
  citations?: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  metadata?: Record<string, any>;
}

const Index = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [location, setLocation] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [platform, setPlatform] = useState<"website" | "mobile" | "webapp">("website");
  const [isGenerating, setIsGenerating] = useState(false);
  const [thoughts, setThoughts] = useState<ThoughtStep[]>([]);
  const [progress, setProgress] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("create");

  const addThought = (thought: Omit<ThoughtStep, "id" | "timestamp">) => {
    const newThought: ThoughtStep = {
      ...thought,
      id: Date.now().toString(),
      timestamp: Date.now(),
      status: thought.status || "active"
    };
    setThoughts(prev => [...prev, newThought]);
  };

  const updateThought = (id: string, updates: Partial<ThoughtStep>) => {
    setThoughts(prev => prev.map(thought =>
      thought.id === id ? { ...thought, ...updates } : thought
    ));
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Missing Prompt",
        description: "Please describe what you want to create.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setThoughts([]);

    try {
      // Start with planning phase
      addThought({
        agent: "planner",
        action: "Analyzing project requirements",
        details: `Planning ${platform} for: "${prompt.substring(0, 50)}..."`
      });

      setProgress(10);

      // Simulate planning phase
      setTimeout(() => {
        updateThought(thoughts[thoughts.length - 1].id, { status: "completed" });
        addThought({
          agent: "researcher",
          action: "Researching design trends",
          details: `Finding inspiration for ${platform} in ${location || "global market"}`
        });
        setProgress(30);
      }, 1000);

      // Simulate research phase
      setTimeout(() => {
        updateThought(thoughts[thoughts.length - 1].id, { status: "completed" });
        addThought({
          agent: "creative",
          action: "Generating design concepts",
          details: `Creating ${platform} mockups and wireframes`
        });
        setProgress(60);
      }, 2000);

      // Simulate creative phase
      setTimeout(() => {
        updateThought(thoughts[thoughts.length - 1].id, { status: "completed" });
        addThought({
          agent: "auditor",
          action: "Validating design quality",
          details: "Checking accessibility, performance, and best practices"
        });
        setProgress(90);
      }, 3000);

      // Complete generation
      setTimeout(() => {
        updateThought(thoughts[thoughts.length - 1].id, { status: "completed" });
        setProgress(100);
        setIsGenerating(false);

        // Mock generated content
        setGeneratedContent({
          type: platform,
          title: prompt,
          description: `A beautiful ${platform} created with AI assistance`,
          features: [
            "Responsive design",
            "Modern UI/UX",
            "Fast loading",
            "SEO optimized",
            "Mobile friendly"
          ],
          tech: platform === "website" ? ["React", "Tailwind", "Vite"] :
                platform === "mobile" ? ["React Native", "Expo"] :
                ["Next.js", "Supabase", "Stripe"]
        });

        toast({
          title: "Generation Complete!",
          description: `Your ${platform} has been created successfully.`,
        });
      }, 4000);

    } catch (error) {
      setIsGenerating(false);
      toast({
        title: "Generation Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a1a] to-[#0a1a1a]">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/20 backdrop-blur-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">AdGenXAI Studio</h1>
                <p className="text-sm text-white/60">Autonomous Creative Director</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-white/70">{user.email}</span>
                </div>
              ) : (
                <div className="text-sm text-white/70">AI Studio</div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/20 border border-white/10">
            <TabsTrigger value="create" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Wand2 className="w-4 h-4 mr-2" />
              Create Project
            </TabsTrigger>
            <TabsTrigger value="preview" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
            <TabsTrigger value="export" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
              <Download className="w-4 h-4 mr-2" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Input Panel */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="bg-black/20 border-white/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Target className="w-5 h-5 text-purple-400" />
                      Project Description
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="prompt" className="text-white">What do you want to create?</Label>
                      <Textarea
                        id="prompt"
                        placeholder="Describe your website, app, or landing page... e.g., 'A modern SaaS landing page for a project management tool'"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="mt-2 bg-black/20 border-white/20 text-white placeholder:text-white/40 min-h-[100px]"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="platform" className="text-white">Platform</Label>
                        <Select value={platform} onValueChange={(value: any) => setPlatform(value)}>
                          <SelectTrigger className="bg-black/20 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="website">
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                Website
                              </div>
                            </SelectItem>
                            <SelectItem value="webapp">
                              <div className="flex items-center gap-2">
                                <Monitor className="w-4 h-4" />
                                Web App
                              </div>
                            </SelectItem>
                            <SelectItem value="mobile">
                              <div className="flex items-center gap-2">
                                <Smartphone className="w-4 h-4" />
                                Mobile App
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="location" className="text-white">Target Location</Label>
                        <Input
                          id="location"
                          placeholder="e.g., Canada, USA, Global"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="bg-black/20 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>

                      <div>
                        <Label htmlFor="audience" className="text-white">Target Audience</Label>
                        <Input
                          id="audience"
                          placeholder="e.g., Developers, Businesses"
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          className="bg-black/20 border-white/20 text-white placeholder:text-white/40"
                        />
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                        size="lg"
                      >
                        {isGenerating ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Generate with AI
                          </>
                        )}
                      </Button>

                      {generatedContent && (
                        <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Regenerate
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Progress */}
                {isGenerating && (
                  <Card className="bg-black/20 border-white/10">
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">AI Generation Progress</span>
                          <span className="text-white/60">{progress}%</span>
                        </div>
                        <Progress value={progress} className="bg-black/20" />
                        <div className="text-sm text-white/60">
                          Our AI agents are working together to create your project...
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Agent Thought Log */}
              <div className="space-y-6">
                <AgentThoughtLog thoughts={thoughts} />

                {/* Quick Stats */}
                <Card className="bg-black/20 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-sm">AI Agents Active</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span className="text-white/80 text-sm">Planner</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-blue-400" />
                        <span className="text-white/80 text-sm">Researcher</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Palette className="w-4 h-4 text-pink-400" />
                        <span className="text-white/80 text-sm">Creative</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">Ready</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Settings className="w-4 h-4 text-yellow-400" />
                        <span className="text-white/80 text-sm">Auditor</span>
                      </div>
                      <Badge variant="secondary" className="bg-green-500/20 text-green-400">Ready</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {generatedContent ? (
              <Card className="bg-black/20 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-400" />
                    Project Preview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">{generatedContent.title}</h3>
                      <p className="text-white/70 mb-4">{generatedContent.description}</p>

                      <div className="space-y-2">
                        <h4 className="text-white font-medium">Features:</h4>
                        <ul className="space-y-1">
                          {generatedContent.features.map((feature: string, index: number) => (
                            <li key={index} className="text-white/60 text-sm flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-purple-400 rounded-full"></div>
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-6 space-y-2">
                        <h4 className="text-white font-medium">Technology Stack:</h4>
                        <div className="flex flex-wrap gap-2">
                          {generatedContent.tech.map((tech: string, index: number) => (
                            <Badge key={index} variant="secondary" className="bg-purple-500/20 text-purple-300">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center border border-white/10">
                        <div className="text-center">
                          <Monitor className="w-12 h-12 text-white/40 mx-auto mb-2" />
                          <p className="text-white/60">Preview Coming Soon</p>
                          <p className="text-white/40 text-sm">AI-generated mockup</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="bg-black/20 border-white/10">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Eye className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Project to Preview</h3>
                    <p className="text-white/60 mb-6">Create a project first to see the preview.</p>
                    <Button onClick={() => setActiveTab("create")} className="bg-gradient-to-r from-purple-500 to-blue-500">
                      Start Creating
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            {generatedContent ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-black/20 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Code className="w-5 h-5 text-purple-400" />
                      Export Code
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-white/70 text-sm">
                      Download the complete codebase for your {platform}.
                    </p>
                    <Button className="w-full bg-gradient-to-r from-purple-500 to-blue-500">
                      <Download className="w-4 h-4 mr-2" />
                      Download Source Code
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-black/20 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Rocket className="w-5 h-5 text-purple-400" />
                      Deploy to Vercel
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-white/70 text-sm">
                      Deploy your project directly to Vercel with one click.
                    </p>
                    <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                      <Rocket className="w-4 h-4 mr-2" />
                      Deploy Now
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-black/20 border-white/10">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Download className="w-12 h-12 text-white/40 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Project to Export</h3>
                    <p className="text-white/60 mb-6">Create and preview a project first to export it.</p>
                    <Button onClick={() => setActiveTab("create")} className="bg-gradient-to-r from-purple-500 to-blue-500">
                      Start Creating
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;