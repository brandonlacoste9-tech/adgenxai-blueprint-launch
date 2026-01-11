import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { 
  Loader2, Download, Globe, Github, Upload, 
  Smartphone, Monitor, Tablet, Eye, Code, Sparkles 
} from "lucide-react";
import { LANDING_PAGE_TEMPLATES, type LandingPageTemplate, type GeneratedLandingPage } from "@/lib/landing-templates";
import { deployLandingPage, generateStandaloneHTML, type DeploymentConfig } from "@/lib/deployment";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

const LandingPageStudio = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<LandingPageTemplate | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [language, setLanguage] = useState<"en" | "fr" | "bilingual">("en");
  const [generatedPage, setGeneratedPage] = useState<GeneratedLandingPage | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [isDeploying, setIsDeploying] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const filteredTemplates = LANDING_PAGE_TEMPLATES.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleGeneratePage = async () => {
    if (!selectedTemplate) {
      toast({
        title: "No template selected",
        description: "Please select a template first",
        variant: "destructive",
      });
      return;
    }

    if (!businessName.trim()) {
      toast({
        title: "Business name required",
        description: "Please enter your business name",
        variant: "destructive",
      });
      return;
    }

    if (!isSupabaseConfigured) {
      toast({
        title: "Configuration required",
        description: "Supabase is not configured. Please add environment variables.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke("generate-landing-page", {
        body: {
          templateId: selectedTemplate.id,
          businessName,
          businessDescription,
          industry,
          targetAudience,
          language,
          sections: selectedTemplate.sections,
        },
      });

      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      const generatedPage: GeneratedLandingPage = {
        id: crypto.randomUUID(),
        templateId: selectedTemplate.id,
        businessName,
        language,
        sections: data.sections,
        createdAt: new Date().toISOString(),
        metadata: {
          industry,
          targetAudience,
        },
      };

      setGeneratedPage(generatedPage);

      toast({
        title: "Success!",
        description: "Landing page generated successfully",
      });
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate landing page",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setTimeout(() => setGenerationProgress(0), 1000);
    }
  };

  const handleExportHTML = () => {
    if (!generatedPage) {
      toast({
        title: "Nothing to export",
        description: "Please generate a landing page first",
        variant: "destructive",
      });
      return;
    }

    const html = generateStandaloneHTML(generatedPage.sections, {
      businessName: generatedPage.businessName,
      language: generatedPage.language,
      description: businessDescription,
    });

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${businessName.toLowerCase().replace(/\s+/g, "-")}-landing-page.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Exported!",
      description: "HTML file downloaded successfully",
    });
  };

  const handleDeploy = async (platform: "github" | "vercel" | "netlify") => {
    if (!generatedPage) {
      toast({
        title: "Nothing to deploy",
        description: "Please generate a landing page first",
        variant: "destructive",
      });
      return;
    }

    setIsDeploying(true);

    try {
      const html = generateStandaloneHTML(generatedPage.sections, {
        businessName: generatedPage.businessName,
        language: generatedPage.language,
        description: businessDescription,
      });

      const config: DeploymentConfig = {
        platform,
        html,
        repositoryName: `${businessName.toLowerCase().replace(/\s+/g, "-")}-landing`,
        projectName: `${businessName.toLowerCase().replace(/\s+/g, "-")}-landing`,
        metadata: {
          businessName: generatedPage.businessName,
          description: businessDescription,
        },
      };

      const result = await deployLandingPage(config);

      if (result.success) {
        toast({
          title: `Deployed to ${platform}!`,
          description: result.url ? `Live at: ${result.url}` : "Deployment successful",
        });
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error("Deployment error:", error);
      toast({
        title: "Deployment failed",
        description: error instanceof Error ? error.message : `Failed to deploy to ${platform}`,
        variant: "destructive",
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const getPreviewWidth = () => {
    switch (previewMode) {
      case "mobile": return "375px";
      case "tablet": return "768px";
      case "desktop": return "100%";
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan to-teal bg-clip-text text-transparent">
            Landing Page Studio
          </h1>
          <p className="text-foreground/70">
            Create stunning, conversion-optimized landing pages with AI
          </p>
        </div>

        <Tabs defaultValue="templates" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="builder">Builder</TabsTrigger>
            <TabsTrigger value="preview" disabled={!generatedPage}>Preview</TabsTrigger>
            <TabsTrigger value="export" disabled={!generatedPage}>Export & Deploy</TabsTrigger>
          </TabsList>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="mb-4">
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className={`cursor-pointer transition-all hover:shadow-lg ${
                    selectedTemplate?.id === template.id ? "ring-2 ring-cyan" : ""
                  }`}
                  onClick={() => setSelectedTemplate(template)}
                >
                  <CardHeader>
                    <img
                      src={template.preview}
                      alt={template.name}
                      className="w-full h-40 object-cover rounded-md mb-3"
                    />
                    <CardTitle>{template.name}</CardTitle>
                    <CardDescription>{template.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {template.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-cyan/10 text-cyan rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Builder Tab */}
          <TabsContent value="builder" className="space-y-6">
            {!selectedTemplate ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-foreground/70">
                    Please select a template from the Templates tab first
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                    <CardDescription>
                      Tell us about your business to generate a customized landing page
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="businessName">Business Name *</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Input
                            id="businessName"
                            placeholder="e.g., Acme Inc."
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Your company or product name</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="businessDescription">Business Description</Label>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Textarea
                            id="businessDescription"
                            placeholder="Describe what your business does..."
                            value={businessDescription}
                            onChange={(e) => setBusinessDescription(e.target.value)}
                            rows={4}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>A brief description to help AI understand your business</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="industry">Industry</Label>
                        <Input
                          id="industry"
                          placeholder="e.g., SaaS, E-commerce"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="targetAudience">Target Audience</Label>
                        <Input
                          id="targetAudience"
                          placeholder="e.g., Small businesses"
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
                        <SelectTrigger id="language">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fr">Français (Quebec)</SelectItem>
                          <SelectItem value="bilingual">Bilingual (EN/FR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {isGenerating && generationProgress > 0 && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Generating your landing page...</span>
                        <span>{generationProgress}%</span>
                      </div>
                      <Progress value={generationProgress} />
                    </div>
                  )}

                  <Button
                    onClick={handleGeneratePage}
                    disabled={isGenerating || !businessName.trim()}
                    className="w-full"
                    size="lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Landing Page
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Preview Tab */}
          <TabsContent value="preview" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  variant={previewMode === "desktop" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Monitor className="h-4 w-4 mr-2" />
                  Desktop
                </Button>
                <Button
                  variant={previewMode === "tablet" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("tablet")}
                >
                  <Tablet className="h-4 w-4 mr-2" />
                  Tablet
                </Button>
                <Button
                  variant={previewMode === "mobile" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreviewMode("mobile")}
                >
                  <Smartphone className="h-4 w-4 mr-2" />
                  Mobile
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                <div className="flex justify-center bg-muted p-4">
                  <div
                    style={{ width: getPreviewWidth(), maxWidth: "100%" }}
                    className="bg-white shadow-xl transition-all duration-300"
                  >
                    {generatedPage && (
                      <iframe
                        srcDoc={generateStandaloneHTML(generatedPage.sections, {
                          businessName: generatedPage.businessName,
                          language: generatedPage.language,
                          description: businessDescription,
                        })}
                        className="w-full border-0"
                        style={{ height: "600px" }}
                        title="Landing Page Preview"
                      />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Export & Deploy Tab */}
          <TabsContent value="export" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Export Options</CardTitle>
                <CardDescription>
                  Download your landing page or deploy it to a hosting platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={handleExportHTML} className="w-full" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download HTML
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or deploy to
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleDeploy("github")}
                        disabled={isDeploying}
                        variant="outline"
                        className="w-full"
                      >
                        {isDeploying ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Github className="mr-2 h-4 w-4" />
                        )}
                        GitHub Pages
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Deploy to GitHub Pages with automatic repository creation</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleDeploy("vercel")}
                        disabled={isDeploying}
                        variant="outline"
                        className="w-full"
                      >
                        {isDeploying ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Globe className="mr-2 h-4 w-4" />
                        )}
                        Vercel
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Deploy to Vercel with instant global CDN</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={() => handleDeploy("netlify")}
                        disabled={isDeploying}
                        variant="outline"
                        className="w-full"
                      >
                        {isDeploying ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        Netlify
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Deploy to Netlify with continuous deployment</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default LandingPageStudio;
