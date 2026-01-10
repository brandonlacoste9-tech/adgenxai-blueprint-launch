import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { Loader2, Copy, Instagram, Youtube, MessageCircle } from "lucide-react";
import { BRAND_IDENTITY } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";

const CreatorStudio = () => {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("creative");
  const [tone, setTone] = useState("professional");
    const [language, setLanguage] = useState("en");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedContent, setExportedContent] = useState("");
  const { toast } = useToast();
  const { user, session } = useAuth();

  const ensureSupabase = () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel env.");
    }
    return supabase;
  };

  const handleGenerate = async (format: "longcat" | "emu") => {
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to use the content generator",
        variant: "destructive",
      });
      return;
    }

    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a content prompt",
        variant: "destructive",
      });
      return;
    }

    if (!isSupabaseConfigured) {
      toast({
        title: "Supabase not configured",
        description: "Add the Supabase env vars to generate content.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      const client = ensureSupabase();
      const functionName = format === "longcat" ? "generate-longcat" : "generate-emu";
      const { data, error } = await client.functions.invoke(functionName, {
        body: { prompt, style, tone, language },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setGeneratedContent(data.content);
      toast({
        title: "Success!",
        description: `${format === "longcat" ? "LongCat" : "Emu"} content generated`,
      });
    } catch (error) {
      console.error("Generation error:", error);
      const message = error instanceof Error ? error.message : "Failed to generate content";
      toast({
        title: "Generation Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExport = async (platform: string) => {
    if (!generatedContent.trim()) {
      toast({
        title: "Error",
        description: "Please generate content first",
        variant: "destructive",
      });
      return;
    }

    if (!isSupabaseConfigured) {
      toast({
        title: "Supabase not configured",
        description: "Add the Supabase env vars to export content.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const client = ensureSupabase();
      const { data, error } = await client.functions.invoke("export-social", {
        body: { content: generatedContent, platform },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setExportedContent(data.formattedContent);
      toast({
        title: "Success!",
        description: `Content formatted for ${platform}`,
      });
    } catch (error) {
      console.error("Export error:", error);
      const message = error instanceof Error ? error.message : "Failed to export content";
      toast({
        title: "Export Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-teal via-cyan to-pink bg-clip-text text-transparent">
          {BRAND_IDENTITY.name} Creator Studio
        </h1>
        <p className="text-foreground/80 text-lg">
          AI-powered content creation for every platform {BRAND_IDENTITY.emoji}
        </p>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-6 rounded-lg border border-amber-300/40 bg-amber-500/10 px-4 py-3 text-amber-100 glass-card">
          Supabase is not configured. Add <code className="font-mono">VITE_SUPABASE_URL</code> and{" "}
          <code className="font-mono">VITE_SUPABASE_PUBLISHABLE_KEY</code> in the Vercel project env vars to enable
          generation and export.
        </div>
      )}

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 glass-card">
          <TabsTrigger value="generate">Generate Content</TabsTrigger>
          <TabsTrigger value="export">Export to Social</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6">
          <Card className="glass-card">
            <CardContent className="pt-6 space-y-4">
              <Textarea
                placeholder="Describe the content you want to create..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-32 bg-background/40 backdrop-blur-xl border-white/10"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">                <div>
                  <label className="text-sm font-medium mb-2 block">Style</label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="bg-background/40 backdrop-blur-xl border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="creative">Creative</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="humorous">Humorous</SelectItem>
                      <SelectItem value="educational">Educational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tone</label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger className="bg-background/40 backdrop-blur-xl border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                                      </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Language</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="bg-background/40 backdrop-blur-xl border-white/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français (Québec)</SelectItem>
                  </SelectContent>
                                  </Select>
              </div>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="energetic">Energetic</SelectItem>
                      <SelectItem value="informative">Informative</SelectItem>
                      <SelectItem value="persuasive">Persuasive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={() => handleGenerate("longcat")}
                  disabled={isGenerating}
                  className="flex-1 bg-gradient-to-r from-teal to-cyan hover:opacity-90"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate LongCat 📱"
                  )}
                </Button>

                <Button
                  onClick={() => handleGenerate("emu")}
                  disabled={isGenerating}
                  className="flex-1 bg-gradient-to-r from-cyan to-pink hover:opacity-90"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Emu ⚡"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {generatedContent && (
            <Card className="glass-card">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold text-teal">Generated Content</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedContent)}
                    className="border-white/10"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <div className="prose prose-invert max-w-none bg-background/40 backdrop-blur-xl border border-white/10 rounded-lg p-6">
                  <pre className="whitespace-pre-wrap font-sans">{generatedContent}</pre>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card className="glass-card">
            <CardContent className="pt-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-cyan">Export to Platform</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <Button
                    onClick={() => handleExport("instagram")}
                    disabled={isExporting || !generatedContent}
                    variant="outline"
                    className="h-24 flex flex-col gap-2 border-white/10 hover:bg-pink/20"
                  >
                    <Instagram className="h-8 w-8" />
                    Instagram
                  </Button>

                  <Button
                    onClick={() => handleExport("youtube")}
                    disabled={isExporting || !generatedContent}
                    variant="outline"
                    className="h-24 flex flex-col gap-2 border-white/10 hover:bg-red-500/20"
                  >
                    <Youtube className="h-8 w-8" />
                    YouTube
                  </Button>

                  <Button
                    onClick={() => handleExport("tiktok")}
                    disabled={isExporting || !generatedContent}
                    variant="outline"
                    className="h-24 flex flex-col gap-2 border-white/10 hover:bg-cyan/20"
                  >
                    <MessageCircle className="h-8 w-8" />
                    TikTok
                  </Button>

                  <Button
                    onClick={() => handleExport("twitter")}
                    disabled={isExporting || !generatedContent}
                    variant="outline"
                    className="h-24 flex flex-col gap-2 border-white/10 hover:bg-blue-400/20"
                  >
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    X (Twitter)
                  </Button>

                  <Button
                    onClick={() => handleExport("facebook")}
                    disabled={isExporting || !generatedContent}
                    variant="outline"
                    className="h-24 flex flex-col gap-2 border-white/10 hover:bg-blue-600/20"
                  >
                    <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </Button>
                </div>
              </div>

              {exportedContent && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-teal">Formatted Content</h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(exportedContent)}
                      className="border-white/10"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                  <div className="prose prose-invert max-w-none bg-background/40 backdrop-blur-xl border border-white/10 rounded-lg p-6">
                    <pre className="whitespace-pre-wrap font-sans">{exportedContent}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CreatorStudio;
