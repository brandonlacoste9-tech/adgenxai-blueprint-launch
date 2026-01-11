import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import {
  Loader2,
  Sparkles,
  Globe,
  Eye,
  Download,
  CheckCircle2,
  XCircle,
  Play,
  Pause,
  Smartphone,
  Tablet,
  Monitor,
  Languages,
  Info,
  HelpCircle,
  Zap,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { downloadLandingPageHTML } from "@/lib/landingPageExport";
import { LandingPagePreview } from "./LandingPagePreview";
import { saveLandingPageHistory } from "@/lib/landingPageHistory";
import { BRAND_IDENTITY } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import {
  landingPageTemplates,
  getTemplatesByCategory,
  getTemplateById,
  type LandingPageCategory,
  type LandingPageTemplate,
} from "@/lib/landingPageTemplates";
import {
  generateLandingPage,
  generateSingleSection,
  type LandingPageData,
  type SectionContent,
} from "@/lib/landingPageGenerators";

const LandingPageStudio = () => {
  const [activeTab, setActiveTab] = useState<string>("templates");
  const [selectedCategory, setSelectedCategory] = useState<LandingPageCategory | "All">("All");
  const [templateSearch, setTemplateSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<LandingPageTemplate | null>(null);
  
  // Generation state
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [language, setLanguage] = useState<"en" | "fr" | "bilingual">("bilingual");
  const [style, setStyle] = useState("professional");
  const [tone, setTone] = useState("professional");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);
  
  // Generated page data
  const [landingPageData, setLandingPageData] = useState<LandingPageData | null>(null);
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewLanguage, setPreviewLanguage] = useState<"en" | "fr">("en");
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);
  
  const { toast } = useToast();
  const { user, session } = useAuth();

  const ensureSupabase = () => {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in Vercel env.");
    }
    return supabase;
  };

  // Filter templates
  const filteredTemplates = useMemo(() => {
    let templates = getTemplatesByCategory(selectedCategory);
    
    if (templateSearch.trim()) {
      const searchLower = templateSearch.toLowerCase();
      templates = templates.filter(template =>
        template.name.en.toLowerCase().includes(searchLower) ||
        template.name.fr.toLowerCase().includes(searchLower) ||
        template.description.en.toLowerCase().includes(searchLower) ||
        template.description.fr.toLowerCase().includes(searchLower)
      );
    }
    
    return templates;
  }, [selectedCategory, templateSearch]);

  // Handle template selection
  const handleSelectTemplate = (template: LandingPageTemplate) => {
    setSelectedTemplate(template);
    setActiveTab("builder");
    toast({
      title: "Template selected",
      description: `You've selected the ${template.name.en} template. Fill in your business details to get started.`,
    });
  };

  // Handle generate landing page
  const handleGenerate = async () => {
    if (!session) {
      toast({
        title: "Authentication required",
        description: "Please sign in to generate landing pages",
        variant: "destructive",
      });
      return;
    }

    if (!selectedTemplate) {
      toast({
        title: "No template selected",
        description: "Please select a template first",
        variant: "destructive",
      });
      return;
    }

    if (!businessName.trim() || !businessDescription.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide your business name and description",
        variant: "destructive",
      });
      return;
    }

    if (!isSupabaseConfigured) {
      toast({
        title: "Supabase not configured",
        description: "Please configure Supabase environment variables",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setGenerationProgress({ current: 0, total: selectedTemplate.sections.filter(s => s.required).length });

    try {
      const client = ensureSupabase();
      
      const generatedPage = await generateLandingPage(
        selectedTemplate.id,
        businessName,
        businessDescription,
        language,
        selectedTemplate,
        style,
        tone,
        undefined,
        (current, total) => {
          setGenerationProgress({ current, total });
        }
      );

      setLandingPageData(generatedPage);
      setActiveTab("preview");
      
      // Save to history
      if (selectedTemplate) {
        saveLandingPageHistory(generatedPage, selectedTemplate);
      }
      
      toast({
        title: "Landing page generated!",
        description: "Your landing page is ready. Check out the preview tab.",
      });
    } catch (error) {
      console.error("Error generating landing page:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate landing page. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
      setGenerationProgress(null);
    }
  };

  // Handle generate single section
  const handleGenerateSection = async (sectionId: string) => {
    if (!selectedTemplate || !landingPageData) return;

    const section = selectedTemplate.sections.find(s => s.id === sectionId);
    if (!section) return;

    setIsGenerating(true);

    try {
      const sectionContent = await generateSingleSection(
        sectionId,
        section.type,
        businessDescription,
        language,
        businessName,
        style,
        tone
      );

      setLandingPageData({
        ...landingPageData,
        sections: {
          ...landingPageData.sections,
          [sectionId]: sectionContent,
        },
      });

      toast({
        title: "Section generated",
        description: `${section.type} section has been updated.`,
      });
    } catch (error) {
      console.error("Error generating section:", error);
      toast({
        title: "Generation failed",
        description: error instanceof Error ? error.message : "Failed to generate section. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <TooltipProvider>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-teal via-cyan to-pink bg-clip-text text-transparent animate-in fade-in slide-in-from-top-4 duration-500">
            Landing Page Studio
          </h1>
          <p className="text-foreground/70 text-lg animate-in fade-in slide-in-from-top-6 duration-700">
            Create stunning bilingual Canadian landing pages in minutes
          </p>
        </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass-card mb-6">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Builder
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="export" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="glass-card"
                />
              </div>
              <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as LandingPageCategory | "All")}>
                <SelectTrigger className="w-full md:w-[200px] glass-card">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Categories</SelectItem>
                  <SelectItem value="saas">SaaS</SelectItem>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="canadian-business">Canadian Business</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template) => (
                <Card
                  key={template.id}
                  className="glass-card hover:border-teal/50 transition-all cursor-pointer group"
                  onClick={() => handleSelectTemplate(template)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-3xl">{template.icon}</span>
                      <Badge variant="outline" className="text-xs">
                        {template.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">{template.name.en}</CardTitle>
                    <CardDescription className="text-sm mt-1">
                      {template.name.fr}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground/70 mb-4 line-clamp-2">
                      {template.description.en}
                    </p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.bilingual && (
                        <Badge variant="secondary" className="text-xs">
                          <Languages className="h-3 w-3 mr-1" />
                          Bilingual
                        </Badge>
                      )}
                      {template.canadianFeatures.slice(0, 2).map((feature) => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature.replace(/-/g, " ")}
                        </Badge>
                      ))}
                    </div>
                    <Button className="w-full group-hover:bg-teal transition-colors">
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12 text-foreground/50">
                <p>No templates found. Try a different search.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Builder Tab */}
        <TabsContent value="builder" className="space-y-6">
          {!selectedTemplate ? (
            <Card className="glass-card p-8 text-center">
              <p className="text-foreground/70 mb-4">
                Please select a template from the Templates tab to get started.
              </p>
              <Button onClick={() => setActiveTab("templates")}>
                Browse Templates
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card className="glass-card p-6">
                  <CardHeader>
                    <CardTitle>Business Information</CardTitle>
                    <CardDescription>
                      Tell us about your business
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor="businessName">Business Name</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-foreground/50 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>The name of your business or organization</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        id="businessName"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="e.g., Montreal Tech Solutions"
                        className="mt-1 transition-all focus:ring-2 focus:ring-teal/50"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor="businessDescription">Business Description</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-foreground/50 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Describe what your business does, your products, services, or value proposition</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Textarea
                        id="businessDescription"
                        value={businessDescription}
                        onChange={(e) => setBusinessDescription(e.target.value)}
                        placeholder="Describe your business, products, or services..."
                        className="mt-1 min-h-[120px] transition-all focus:ring-2 focus:ring-teal/50"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor="language">Language</Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-foreground/50 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Choose the language for your landing page. Bilingual includes both English and Quebec French.</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Select value={language} onValueChange={(value) => setLanguage(value as "en" | "fr" | "bilingual")}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bilingual">
                            <div className="flex items-center gap-2">
                              <Languages className="h-4 w-4" />
                              Bilingual (English & French)
                            </div>
                          </SelectItem>
                          <SelectItem value="en">English Only</SelectItem>
                          <SelectItem value="fr">French Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Label htmlFor="style">Style</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-foreground/50 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The visual and writing style of your content</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Select value={style} onValueChange={setStyle}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="creative">Creative</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="formal">Formal</SelectItem>
                            <SelectItem value="playful">Playful</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Label htmlFor="tone">Tone</Label>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="h-3.5 w-3.5 text-foreground/50 cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>The emotional tone and voice of your content</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <Select value={tone} onValueChange={setTone}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="friendly">Friendly</SelectItem>
                            <SelectItem value="formal">Formal</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="enthusiastic">Enthusiastic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {generationProgress && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-foreground/70">
                              Generating sections...
                            </span>
                            <span className="text-teal font-medium">
                              {generationProgress.current} / {generationProgress.total}
                            </span>
                          </div>
                          <Progress 
                            value={(generationProgress.current / generationProgress.total) * 100} 
                            className="h-2"
                          />
                        </div>
                      )}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            onClick={handleGenerate}
                            disabled={isGenerating || !businessName.trim() || !businessDescription.trim()}
                            className="w-full transition-all hover:scale-[1.02] active:scale-[0.98]"
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
                        </TooltipTrigger>
                        {(!businessName.trim() || !businessDescription.trim()) && (
                          <TooltipContent>
                            <p>Please fill in your business name and description</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>

                {landingPageData && (
                  <Card className="glass-card p-6">
                    <CardHeader>
                      <CardTitle>Generated Sections</CardTitle>
                      <CardDescription>
                        Regenerate individual sections if needed
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {selectedTemplate.sections
                        .sort((a, b) => a.order - b.order)
                        .map((section) => (
                          <div
                            key={section.id}
                            className="flex items-center justify-between p-3 rounded-lg bg-background/30"
                          >
                            <div className="flex items-center gap-3">
                              <CheckCircle2 className="h-4 w-4 text-teal" />
                              <span className="text-sm font-medium capitalize">
                                {section.type}
                              </span>
                              {section.required && (
                                <Badge variant="outline" className="text-xs">Required</Badge>
                              )}
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleGenerateSection(section.id)}
                                  disabled={isGenerating}
                                  className="transition-all hover:bg-teal/10"
                                >
                                  <Sparkles className="h-3 w-3 mr-1" />
                                  Regenerate
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Regenerate this section with AI</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        ))}
                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                <Card className="glass-card p-6">
                  <CardHeader>
                    <CardTitle>Selected Template</CardTitle>
                    <CardDescription>{selectedTemplate.name.en}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-foreground/70 mb-2">Description:</p>
                        <p className="text-sm">{selectedTemplate.description.en}</p>
                      </div>
                      <div>
                        <p className="text-sm text-foreground/70 mb-2">Sections:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate.sections
                            .sort((a, b) => a.order - b.order)
                            .map((section) => (
                              <Badge key={section.id} variant="outline" className="text-xs">
                                {section.type}
                              </Badge>
                            ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-foreground/70 mb-2">Canadian Features:</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplate.canadianFeatures.map((feature) => (
                            <Badge key={feature} variant="secondary" className="text-xs">
                              {feature.replace(/-/g, " ")}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          {!landingPageData ? (
            <Card className="glass-card p-8 text-center">
              <p className="text-foreground/70 mb-4">
                Generate a landing page first to see the preview.
              </p>
              <Button onClick={() => setActiveTab("builder")}>
                Go to Builder
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between glass-card p-4 rounded-lg">
                <div className="flex items-center gap-2">
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
                {landingPageData.language === "bilingual" && (
                  <div className="flex items-center gap-2">
                    <Languages className="h-4 w-4" />
                    <Button
                      variant={previewLanguage === "en" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewLanguage("en")}
                    >
                      EN
                    </Button>
                    <Button
                      variant={previewLanguage === "fr" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreviewLanguage("fr")}
                    >
                      FR
                    </Button>
                  </div>
                )}
              </div>

              {selectedTemplate && (
                <LandingPagePreview
                  landingPageData={landingPageData}
                  template={selectedTemplate}
                  previewMode={previewMode}
                  previewLanguage={previewLanguage}
                  onPreviewModeChange={setPreviewMode}
                  onLanguageChange={setPreviewLanguage}
                />
              )}
            </div>
          )}
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          {!landingPageData ? (
            <Card className="glass-card p-8 text-center">
              <p className="text-foreground/70 mb-4">
                Generate a landing page first to export it.
              </p>
              <Button onClick={() => setActiveTab("builder")}>
                Go to Builder
              </Button>
            </Card>
          ) : (
            <Card className="glass-card p-6">
              <CardHeader>
                <CardTitle>Export Landing Page</CardTitle>
                <CardDescription>
                  Download your landing page or deploy it to a platform
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        className="h-auto p-6 flex flex-col items-start transition-all hover:border-teal/50 hover:bg-teal/5"
                        onClick={() => {
                          if (landingPageData && selectedTemplate) {
                            downloadLandingPageHTML(landingPageData, selectedTemplate, previewLanguage);
                            toast({
                              title: "Download started",
                              description: "Your landing page HTML file is downloading.",
                            });
                          }
                        }}
                      >
                        <Download className="h-5 w-5 mb-2 text-teal" />
                        <span className="font-semibold">Download HTML</span>
                        <span className="text-xs text-foreground/60 mt-1">
                          Standalone HTML file
                        </span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Download a complete, standalone HTML file ready to deploy</p>
                    </TooltipContent>
                  </Tooltip>
                  <Button variant="outline" className="h-auto p-6 flex flex-col items-start" disabled>
                    <Globe className="h-5 w-5 mb-2" />
                    <span className="font-semibold">Deploy to GitHub</span>
                    <span className="text-xs text-foreground/60 mt-1">
                      Coming soon
                    </span>
                  </Button>
                  <Button variant="outline" className="h-auto p-6 flex flex-col items-start" disabled>
                    <Globe className="h-5 w-5 mb-2" />
                    <span className="font-semibold">Deploy to Vercel</span>
                    <span className="text-xs text-foreground/60 mt-1">
                      Coming soon
                    </span>
                  </Button>
                  <Button variant="outline" className="h-auto p-6 flex flex-col items-start" disabled>
                    <Globe className="h-5 w-5 mb-2" />
                    <span className="font-semibold">Deploy to Netlify</span>
                    <span className="text-xs text-foreground/60 mt-1">
                      Coming soon
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </TooltipProvider>
  );
};

export default LandingPageStudio;
