import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Sparkles, FileText, Rocket, Layout, Send, Settings, Upload, Image as ImageIcon, Play, ToggleLeft, ToggleRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AgentThoughtLog, { ThoughtStep } from "./AgentThoughtLog";
import BrandUploader from "./BrandUploader";
import DemoDashboard from "./DemoDashboard";

const StudioDashboard = () => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [model, setModel] = useState("gemini-2.0-flash-exp");
  const [temperature, setTemperature] = useState([0.7]);
  const [activeNav, setActiveNav] = useState("new-project");

  // New state for agentic orchestration
  const [thoughts, setThoughts] = useState<ThoughtStep[]>([]);
  const [isAgentActive, setIsAgentActive] = useState(false);
  const [brandImage, setBrandImage] = useState<File | null>(null);
  const [brandImagePreview, setBrandImagePreview] = useState<string>("");
  const [location, setLocation] = useState("Canada");
  const [targetAudience, setTargetAudience] = useState("General consumers");
  const [campaignResult, setCampaignResult] = useState<any>(null);
  const [brandAnalysis, setBrandAnalysis] = useState<any>(null);
  const [isAnalyzingBrand, setIsAnalyzingBrand] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [showDemoDashboard, setShowDemoDashboard] = useState(false);

  const responseEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (responseEndRef.current) {
      responseEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [response]);

  const handleQuickStart = (type: string) => {
    const prompts = {
      "landing-page": "Create a modern landing page for a SaaS product with hero section, features, pricing, and CTA. Focus on conversion optimization and professional design.",
      "ad-creative": "Generate a compelling ad campaign for a premium leather goods brand launching in Toronto. Create headline, subheadline, body copy, and call-to-action that resonates with luxury shoppers.",
      "mvp-builder": "Design an MVP specification for a Canadian coffee subscription service with core features, user flows, and market positioning."
    };
    setPrompt(prompts[type as keyof typeof prompts] || "");
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({
          title: "File too large",
          description: "Please select an image under 5MB.",
          variant: "destructive",
        });
        return;
      }

      setBrandImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setBrandImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBrandAnalyzed = (analysis: any, imageData: string) => {
    setBrandAnalysis(analysis);
    setBrandImagePreview(imageData);
    toast({
      title: "Brand DNA extracted!",
      description: `Found ${analysis.primaryColor} and ${analysis.secondaryColor}`,
    });
  };

  const loadDemoAssets = () => {
    // Load Aurora Coffee Roasters demo assets
    setPrompt("Create a premium coffee subscription campaign for Aurora Coffee Roasters, a Toronto-based roastery specializing in sustainable, single-origin Canadian coffee. Focus on their commitment to Canadian terroir and community-driven sourcing.");

    setLocation("Toronto");
    setTargetAudience("Coffee enthusiasts");

    // Mock brand analysis for Aurora Coffee
    const demoAnalysis = {
      primaryColor: '#2c241b', // Rich coffee brown
      secondaryColor: '#d4af37', // Gold accents
      fontVibe: 'Heritage-Serif',
      brandArchetype: 'The Artisan',
      canadianElements: ['Canadian terroir', 'Northern landscapes', 'Artisan craftsmanship', 'Community focus']
    };

    setBrandAnalysis(demoAnalysis);

    // Mock coffee shop image (base64 placeholder)
    const demoImage = 'data:image/svg+xml;base64,' + btoa(`
      <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
        <rect width="400" height="300" fill="#2c241b"/>
        <text x="200" y="150" text-anchor="middle" fill="#d4af37" font-family="serif" font-size="24" font-weight="bold">Aurora Coffee Co.</text>
        <text x="200" y="180" text-anchor="middle" fill="#ffffff" font-family="serif" font-size="14">Toronto • Artisan Coffee</text>
      </svg>
    `);

    setBrandImagePreview(demoImage);

    toast({
      title: "Demo mode activated!",
      description: "Aurora Coffee Roasters campaign assets loaded",
    });
  };

  const toggleDemoMode = () => {
    setDemoMode(!demoMode);
    if (!demoMode) {
      loadDemoAssets();
    } else {
      // Reset to empty state
      setPrompt("");
      setLocation("Canada");
      setTargetAudience("General consumers");
      setBrandAnalysis(null);
      setBrandImagePreview("");
      setThoughts([]);
      setCampaignResult(null);
      toast({
        title: "Demo mode deactivated",
        description: "Ready for live generation",
      });
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty prompt",
        description: "Please enter a campaign description.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setIsAgentActive(true);
    setThoughts([]);
    setResponse("");
    setCampaignResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Authentication required");
      }

      // Convert image to base64 if provided
      let brandImageBase64 = undefined;
      if (brandImage && brandImagePreview) {
        brandImageBase64 = brandImagePreview;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/adgen-orchestrator`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          prompt,
          brandImage: brandImageBase64,
          location,
          targetAudience,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No response body");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.thought) {
                // Handle thought streaming
                const thought: ThoughtStep = {
                  id: crypto.randomUUID(),
                  agent: data.thought.agent,
                  action: data.thought.action,
                  status: "thinking",
                  timestamp: data.thought.timestamp,
                  details: data.thought.details,
                  citations: data.thought.citations,
                  metadata: data.thought.metadata,
                };

                setThoughts(prev => {
                  // Update existing thought if it exists, otherwise add new one
                  const existingIndex = prev.findIndex(t => t.agent === thought.agent && t.action === thought.action);
                  if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = thought;
                    return updated;
                  } else {
                    return [...prev, thought];
                  }
                });
              } else if (data.result) {
                // Handle final result
                setCampaignResult(data.result);
                const visualStatus = data.result.visualAssets?.heroImage
                  ? '🎨 **AI-Generated Hero Image:** Available (using extracted brand colors)'
                  : data.result.visualAssets?.error
                  ? '🎨 **Visual Generation:** Skipped due to technical limitations'
                  : '🎨 **Brand Intelligence:** Extracted for manual application';

                setResponse(`🎯 **Campaign Generated Successfully!**

**Headline:** ${data.result.adCopy.headline}
**Subheadline:** ${data.result.adCopy.subheadline}
**Body:** ${data.result.adCopy.body}
**CTA:** ${data.result.adCopy.callToAction}

**Brand DNA Extracted:**
• Primary Color: ${data.result.brandAnalysis.primaryColor}
• Secondary Color: ${data.result.brandAnalysis.secondaryColor}
• Archetype: ${data.result.brandAnalysis.brandArchetype}
• Typography: ${data.result.brandAnalysis.fontVibe}
• Canadian Elements: ${data.result.brandAnalysis.canadianElements.join(', ')}

${visualStatus}

**Research Summary:** ${data.result.researchSummary.substring(0, 200)}...

**Compliance Status:**
${data.result.compliance.canadianStandards ? '✅ Canadian Standards Compliant' : '❌ Compliance Issues'}
${data.result.compliance.legalClearance ? '✅ Legal Clearance Approved' : '❌ Legal Review Required'}
**Accessibility Score:** ${data.result.compliance.accessibilityScore}/100

**Targeting:** ${data.result.targeting.location} | ${data.result.targeting.demographics.join(', ')} | ${data.result.targeting.interests.join(', ')}`);

                // Mark all thoughts as completed
                setThoughts(prev => prev.map(thought => ({ ...thought, status: "completed" })));
              } else if (data.error) {
                throw new Error(data.error);
              }
            } catch (e) {
              console.warn("Failed to parse streaming data:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Generation error:", error);

      // Mark current thought as error
      setThoughts(prev => prev.map(thought =>
        thought.status === "thinking"
          ? { ...thought, status: "error" }
          : thought
      ));

      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate campaign",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setIsAgentActive(false);
    }
  };

  return (
    <div className="h-screen flex bg-[#0f0f10] text-white overflow-hidden">
      {/* Left Sidebar - Leather Texture */}
      <aside className="w-64 flex-shrink-0 border-r border-[#FFD966]/20" 
        style={{
          backgroundColor: '#2c241b',
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '4px 4px'
        }}>
        <div className="h-full flex flex-col p-6">
          <h2 className="text-xl font-serif mb-8 text-[#FFD966] font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>Studio</h2>
          
          <nav className="space-y-2">
            <button
              onClick={() => setActiveNav("new-project")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all relative ${
                activeNav === "new-project"
                  ? "bg-[#FFD966]/10 text-[#FFD966]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {activeNav === "new-project" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD966] rounded-r" />
              )}
              <div className="flex items-center gap-3">
                <Sparkles className="w-4 h-4" />
                <span className="font-medium">New Project</span>
              </div>
            </button>
            
            <button
              onClick={() => setActiveNav("library")}
              className={`w-full text-left px-4 py-3 rounded-lg transition-all relative ${
                activeNav === "library"
                  ? "bg-[#FFD966]/10 text-[#FFD966]"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              {activeNav === "library" && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FFD966] rounded-r" />
              )}
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4" />
                <span className="font-medium">Library</span>
              </div>
            </button>
          </nav>
        </div>
      </aside>

      {/* Center Stage */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-2 gap-8 h-full">
            {/* Left: Main Content */}
            <div className="space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-5xl text-[#FFD966] mb-2 font-bold" style={{ fontFamily: 'Playfair Display, serif' }}>
                    What will we create?
                  </h1>
                  <p className="text-white/60 mb-4 text-lg">
                    Your AI-powered creative workspace
                  </p>
                </div>

                {/* Demo Controls */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={toggleDemoMode}
                    className={`flex items-center gap-2 ${demoMode ? 'bg-voyageur-gold/20 border-voyageur-gold text-voyageur-gold' : 'bg-white/5 border-white/10 hover:border-voyageur-gold/50'}`}
                  >
                    {demoMode ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                    <Play className="w-4 h-4" />
                    <span className="text-sm">Demo Mode</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowDemoDashboard(!showDemoDashboard)}
                    className={`flex items-center gap-2 ${showDemoDashboard ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 hover:border-blue-500/50'}`}
                  >
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">Live Dashboard</span>
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => window.open('/mission-control', '_blank')}
                    className="flex items-center gap-2 bg-gradient-to-r from-voyageur-gold/20 to-yellow-600/20 border-voyageur-gold/50 text-voyageur-gold hover:bg-voyageur-gold/30"
                  >
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">Mission Control</span>
                  </Button>
                </div>
              </div>

              {/* Demo Dashboard - Full Width When Active */}
              {showDemoDashboard && (
                <div className="mb-8">
                  <DemoDashboard showLiveData={true} />
                </div>
              )}

              {/* Quick Start Cards */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <Card
                  className="bg-white/5 backdrop-blur-md border border-white/10 cursor-pointer hover:border-[#FFD966]/50 transition-all group"
                  onClick={() => handleQuickStart("landing-page")}
                >
                  <CardContent className="p-6">
                    <Layout className="w-8 h-8 mb-4 text-[#FFD966] group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-semibold mb-2">Landing Page</h3>
                    <p className="text-white/60 text-sm">
                      Create stunning landing pages with AI
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="bg-white/5 backdrop-blur-md border border-white/10 cursor-pointer hover:border-[#FFD966]/50 transition-all group"
                  onClick={() => handleQuickStart("ad-creative")}
                >
                  <CardContent className="p-6">
                    <Rocket className="w-8 h-8 mb-4 text-[#FFD966] group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-semibold mb-2">Ad Creative</h3>
                    <p className="text-white/60 text-sm">
                      Generate compelling ad campaigns
                    </p>
                  </CardContent>
                </Card>

                <Card
                  className="bg-white/5 backdrop-blur-md border border-white/10 cursor-pointer hover:border-[#FFD966]/50 transition-all group"
                  onClick={() => handleQuickStart("mvp-builder")}
                >
                  <CardContent className="p-6">
                    <Sparkles className="w-8 h-8 mb-4 text-[#FFD966] group-hover:scale-110 transition-transform" />
                    <h3 className="text-xl font-semibold mb-2">MVP Builder</h3>
                    <p className="text-white/60 text-sm">
                      Design and prototype MVPs quickly
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Brand DNA Extractor */}
              <div className="mb-8">
                <BrandUploader
                  onBrandAnalyzed={handleBrandAnalyzed}
                  currentAnalysis={brandAnalysis}
                  isAnalyzing={isAnalyzingBrand}
                />
              </div>

              {/* Campaign Settings */}
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Location
                  </label>
                  <Select value={location} onValueChange={setLocation}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Toronto">Toronto</SelectItem>
                      <SelectItem value="Vancouver">Vancouver</SelectItem>
                      <SelectItem value="Montreal">Montreal</SelectItem>
                      <SelectItem value="Calgary">Calgary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Target Audience
                  </label>
                  <Select value={targetAudience} onValueChange={setTargetAudience}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General consumers">General consumers</SelectItem>
                      <SelectItem value="Young professionals">Young professionals</SelectItem>
                      <SelectItem value="Small business owners">Small business owners</SelectItem>
                      <SelectItem value="Luxury shoppers">Luxury shoppers</SelectItem>
                      <SelectItem value="Tech enthusiasts">Tech enthusiasts</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Response Area */}
              {response && (
                <Card className="bg-white/5 backdrop-blur-md border border-white/10 mb-6">
                  <CardContent className="p-6">
                    <div className="prose prose-invert max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-white/90">
                        {response}
                      </pre>
                    </div>
                    <div ref={responseEndRef} />
                  </CardContent>
                </Card>
              )}

              {/* Campaign Result Display */}
              {campaignResult && (
                <Card className="bg-white/5 backdrop-blur-md border border-white/10 mb-6">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-voyageur-gold mb-4">Campaign Summary</h3>

                    {/* Visual Assets Display */}
                    {campaignResult.visualAssets?.heroImage && (
                      <div className="mb-6">
                        <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-voyageur-gold" />
                          AI-Generated Hero Image
                        </h4>
                        <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/20">
                          <img
                            src={campaignResult.visualAssets.heroImage}
                            alt="AI-generated campaign hero"
                            className="w-full h-auto max-h-64 object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                            <div className="flex items-center gap-2 text-xs text-white/80">
                              <Badge variant="outline" className="text-xs">
                                Imagen 3
                              </Badge>
                              <span>Brand colors: {campaignResult.visualAssets.brandColors?.join(', ')}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-white/80 mb-2">Compliance Status</h4>
                        <div className="space-y-1">
                          <Badge variant={campaignResult.compliance.canadianStandards ? "default" : "destructive"}>
                            Canadian Standards: {campaignResult.compliance.canadianStandards ? "✓" : "✗"}
                          </Badge>
                          <Badge variant={campaignResult.compliance.legalClearance ? "default" : "destructive"}>
                            Legal Clearance: {campaignResult.compliance.legalClearance ? "✓" : "✗"}
                          </Badge>
                          <Badge variant="outline">
                            Accessibility: {campaignResult.compliance.accessibilityScore}/100
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-white/80 mb-2">Brand Intelligence</h4>
                        <div className="space-y-1 text-sm">
                          <p><span className="text-voyageur-gold">Primary:</span> {campaignResult.brandAnalysis.primaryColor}</p>
                          <p><span className="text-voyageur-gold">Secondary:</span> {campaignResult.brandAnalysis.secondaryColor}</p>
                          <p><span className="text-voyageur-gold">Archetype:</span> {campaignResult.brandAnalysis.brandArchetype}</p>
                          <p><span className="text-voyageur-gold">Typography:</span> {campaignResult.brandAnalysis.fontVibe}</p>
                        </div>
                      </div>
                    </div>

                    {/* Visual Assets Metadata */}
                    {campaignResult.visualAssets && (
                      <div className="mt-4 pt-4 border-t border-white/10">
                        <h4 className="text-sm font-medium text-white/80 mb-2">Visual Generation Details</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs text-white/60">
                          <div>
                            <p><strong>Model:</strong> {campaignResult.visualAssets.model || 'Not generated'}</p>
                            <p><strong>Colors Applied:</strong> {campaignResult.visualAssets.brandColors?.join(', ') || 'N/A'}</p>
                          </div>
                          <div>
                            <p><strong>Typography:</strong> {campaignResult.visualAssets.typography || 'N/A'}</p>
                            <p><strong>Status:</strong> {campaignResult.visualAssets.error ? 'Failed' : 'Success'}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right: Agent Thought Log */}
            <div className="h-full">
              <AgentThoughtLog
                thoughts={thoughts}
                isActive={isAgentActive}
                onStepClick={(step) => console.log('Clicked step:', step)}
              />
            </div>
          </div>
        </div>

        {/* Input Capsule - Sticky Bottom */}
        <div className="border-t border-white/10 p-6 bg-[#0f0f10]/80 backdrop-blur-md">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-4 items-end">
              <div className="flex-1 relative">
                <Input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleGenerate();
                    }
                  }}
                  placeholder="Describe what you want to create..."
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-full px-6 py-6 pr-14 focus:border-[#FFD966] focus:ring-2 focus:ring-[#FFD966]/20 h-auto"
                  disabled={isGenerating}
                />
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#FFD966] hover:bg-[#FFD966]/90 text-[#0f0f10] rounded-full px-4 h-10 shadow-lg shadow-[#FFD966]/20"
                >
                  {isGenerating ? (
                    <div className="w-5 h-5 border-2 border-[#0f0f10] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Right Settings Panel */}
      <aside className="w-80 flex-shrink-0 border-l border-white/10 bg-[#1a1a1a] p-6">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="w-5 h-5 text-[#FFD966]" />
          <h3 className="text-lg font-semibold">Settings</h3>
        </div>

        <div className="space-y-6">
          {/* Model Selection */}
          <div>
            <label className="text-sm font-medium text-white/80 mb-2 block">
              Model
            </label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-white/10">
                <SelectItem value="gemini-2.0-flash-exp" className="text-white">
                  Gemini 2.0 Flash
                </SelectItem>
                <SelectItem value="gemini-1.5-pro" className="text-white">
                  Gemini 1.5 Pro
                </SelectItem>
                <SelectItem value="gemini-1.5-flash" className="text-white">
                  Gemini 1.5 Flash
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Temperature Slider */}
          <div>
            <label className="text-sm font-medium text-white/80 mb-2 block">
              Temperature: {temperature[0].toFixed(1)}
            </label>
            <Slider
              value={temperature}
              onValueChange={setTemperature}
              min={0}
              max={1}
              step={0.1}
              className="[&_[role=slider]]:bg-[#FFD966] [&_[role=slider]]:border-[#FFD966]"
            />
            <div className="flex justify-between text-xs text-white/60 mt-1">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default StudioDashboard;
