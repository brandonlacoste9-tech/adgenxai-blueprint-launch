import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import {
  Loader2,
  Copy,
  Instagram,
  Youtube,
  MessageCircle,
  Sparkles,
  Calendar,
  TrendingUp,
  Users,
  Briefcase,
  History,
  Search,
  Filter,
  Trash2,
  RefreshCw,
  Eye,
  X,
  FileText,
  Download,
  Code,
  Globe,
  FileCode,
  CheckSquare,
  Square,
  ChevronDown,
} from "lucide-react";
import { BRAND_IDENTITY } from "@/lib/constants";
import { useAuth } from "@/hooks/useAuth";
import { templates, getTemplatesByCategory, TemplateCategory, isTemplateInSeason } from "@/lib/templates";
import {
  HistoryEntry,
  getHistoryEntries,
  saveHistoryEntry,
  deleteHistoryEntry,
  clearAllHistory,
  filterHistoryEntries,
  formatRelativeTime,
  ContentFormat,
} from "@/lib/history";
import {
  exportEntry,
  exportMultipleAsSingle,
  exportMultipleAsZip,
  copyAsFormat,
  estimateFileSize,
  formatFileSize,
  ExportFormat,
} from "@/lib/exportUtils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

const CreatorStudio = () => {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("creative");
  const [tone, setTone] = useState("professional");
  const [language, setLanguage] = useState<"en" | "fr">("en");
  const [generatedContent, setGeneratedContent] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedContent, setExportedContent] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | "All">("All");
  const [templateSearch, setTemplateSearch] = useState("");
  const [activeTab, setActiveTab] = useState<string>("templates");
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyFilters, setHistoryFilters] = useState<{
    language?: "en" | "fr";
    format?: ContentFormat;
    search?: string;
  }>({});
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<HistoryEntry | null>(null);
  const [viewFullOpen, setViewFullOpen] = useState(false);
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [batchExportDialogOpen, setBatchExportDialogOpen] = useState(false);
  const [exportAllDialogOpen, setExportAllDialogOpen] = useState(false);
  const [batchExportProgress, setBatchExportProgress] = useState<{ current: number; total: number } | null>(null);
  const [batchExportFormat, setBatchExportFormat] = useState<ExportFormat>("md");
  const [batchExportAsZip, setBatchExportAsZip] = useState(false);
  const [exportAllFormat, setExportAllFormat] = useState<ExportFormat>("md");
  const [exportAllAsZip, setExportAllAsZip] = useState(false);
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

      // Save to history
      saveHistoryEntry(prompt, data.content, language, style, tone, format);
      
      // Refresh history if history tab is active
      if (activeTab === "history") {
        const entries = getHistoryEntries();
        setHistoryEntries(entries);
      }

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

  // Filter templates based on category and search
  const filteredTemplates = useMemo(() => {
    let filtered = selectedCategory === "All" ? templates : getTemplatesByCategory(selectedCategory);
    
    if (templateSearch.trim()) {
      const searchLower = templateSearch.toLowerCase();
      filtered = filtered.filter(
        (template) =>
          template.name.en.toLowerCase().includes(searchLower) ||
          template.name.fr.toLowerCase().includes(searchLower) ||
          template.description.en.toLowerCase().includes(searchLower) ||
          template.description.fr.toLowerCase().includes(searchLower)
      );
    }
    
    return filtered;
  }, [selectedCategory, templateSearch]);

  const handleApplyTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (!template) return;

    const templatePrompt = template.prompt[language];
    const templateStyle = template.suggestedStyle;
    const templateTone = template.suggestedTone;

    setPrompt(templatePrompt);
    setStyle(templateStyle);
    setTone(templateTone);

    toast({
      title: "Template Applied!",
      description: `${template.name[language]} template has been applied. You can customize and generate content now.`,
    });

    // Switch to generate tab
    setActiveTab("generate");
  };

  const getCategoryIcon = (category: TemplateCategory) => {
    switch (category) {
      case "Holidays":
        return <Calendar className="h-4 w-4" />;
      case "Business":
        return <Briefcase className="h-4 w-4" />;
      case "Marketing":
        return <TrendingUp className="h-4 w-4" />;
      case "Social":
        return <Users className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const categoryColors: Record<TemplateCategory, string> = {
    Holidays: "from-amber-500/20 to-orange-500/20 border-amber-500/30",
    Business: "from-blue-500/20 to-indigo-500/20 border-blue-500/30",
    Marketing: "from-pink-500/20 to-purple-500/20 border-pink-500/30",
    Social: "from-green-500/20 to-emerald-500/20 border-green-500/30",
  };

  // Load history when component mounts or when history tab is active
  useEffect(() => {
    if (activeTab === "history") {
      setHistoryLoading(true);
      // Simulate loading state for smooth UX
      setTimeout(() => {
        const entries = getHistoryEntries();
        setHistoryEntries(entries);
        setHistoryLoading(false);
      }, 300);
    }
  }, [activeTab]);

  // Global keyboard shortcuts for copy features
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only work if content is visible (history tab or generated content visible)
      const isContentVisible = activeTab === "history" || generatedContent;
      
      if (!isContentVisible) return;

      // Ctrl/Cmd+C - Copy as plain text
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && !e.shiftKey && !e.altKey) {
        const target = e.target as HTMLElement;
        // Don't intercept if user is selecting text in an input/textarea
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
          return;
        }
        
        // If history tab is active and entry is focused, copy that
        // Otherwise copy generated content if available
        if (generatedContent) {
          e.preventDefault();
          handleCopyAsFormat(generatedContent, "plain");
        }
      }

      // Ctrl/Cmd+Shift+C - Copy as markdown
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
          return;
        }
        
        if (generatedContent) {
          e.preventDefault();
          handleCopyAsFormat(generatedContent, "markdown");
        }
      }

      // Ctrl/Cmd+Alt+C - Copy as HTML
      if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === "c") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
          return;
        }
        
        if (generatedContent) {
          e.preventDefault();
          handleCopyAsFormat(generatedContent, "html");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, generatedContent]);

  // Filter history entries
  const filteredHistoryEntries = useMemo(() => {
    return filterHistoryEntries(historyEntries, historyFilters);
  }, [historyEntries, historyFilters]);

  // Handle history actions
  const handleViewFull = (entry: HistoryEntry) => {
    setSelectedHistoryEntry(entry);
    setViewFullOpen(true);
  };

  const handleCopyHistory = (content: string) => {
    copyToClipboard(content);
  };

  const handleCopyAsFormat = async (content: string, format: "plain" | "markdown" | "html") => {
    try {
      await copyAsFormat(content, format);
      const formatNames = {
        plain: "Plain Text",
        markdown: "Markdown",
        html: "HTML",
      };
      toast({
        title: "Copied!",
        description: `Copied as ${formatNames[format]} ✨`,
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportEntry = (entry: HistoryEntry, format: ExportFormat) => {
    try {
      exportEntry(entry, format);
      const formatNames = {
        txt: "Plain Text",
        md: "Markdown",
        json: "JSON",
        html: "HTML",
      };
      toast({
        title: "Exported!",
        description: `Exported as ${formatNames[format]} 📄`,
      });
    } catch (error) {
      console.error("Export error:", error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = async (entry: HistoryEntry) => {
    // Set the prompt, style, tone, and language from history entry
    setPrompt(entry.prompt);
    setStyle(entry.style);
    setTone(entry.tone);
    setLanguage(entry.language);

    // Switch to generate tab
    setActiveTab("generate");

    toast({
      title: "Loaded from History",
      description: "Prompt loaded from history. Click generate to regenerate content.",
    });
  };

  const handleDeleteHistory = (id: string) => {
    deleteHistoryEntry(id);
    setHistoryEntries(getHistoryEntries());
    toast({
      title: "Deleted",
      description: "History entry deleted successfully",
    });
  };

  const handleClearAllHistory = () => {
    clearAllHistory();
    setHistoryEntries([]);
    setClearAllDialogOpen(false);
    toast({
      title: "History Cleared",
      description: "All history entries have been cleared",
    });
  };

  const getContentPreview = (content: string, maxLength: number = 100): string => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + "...";
  };

  // Batch export handlers
  const toggleSelectionMode = () => {
    setSelectionMode(!selectionMode);
    if (selectionMode) {
      setSelectedEntries(new Set());
    }
  };

  const toggleEntrySelection = (entryId: string) => {
    const newSelected = new Set(selectedEntries);
    if (newSelected.has(entryId)) {
      newSelected.delete(entryId);
    } else {
      newSelected.add(entryId);
    }
    setSelectedEntries(newSelected);
  };

  const selectAllEntries = () => {
    setSelectedEntries(new Set(filteredHistoryEntries.map((e) => e.id)));
  };

  const clearSelection = () => {
    setSelectedEntries(new Set());
  };

  const handleBatchExport = async () => {
    if (selectedEntries.size === 0) {
      toast({
        title: "No Selection",
        description: "Please select at least one entry to export",
        variant: "destructive",
      });
      return;
    }

    try {
      const entriesToExport = filteredHistoryEntries.filter((e) => selectedEntries.has(e.id));
      const format = batchExportFormat;
      const asZip = batchExportAsZip;
      
      if (asZip) {
        setBatchExportProgress({ current: 0, total: entriesToExport.length });
        await exportMultipleAsZip(entriesToExport, format, (current, total) => {
          setBatchExportProgress({ current, total });
        });
        setBatchExportProgress(null);
        toast({
          title: "Exported!",
          description: `Exported ${entriesToExport.length} entries as ${format.toUpperCase()} archive 📦`,
        });
      } else {
        const combinedContent = exportMultipleAsSingle(entriesToExport, format);
        const filename = `kolony-batch-export-${Date.now()}.${format}`;
        const mimeTypes: Record<ExportFormat, string> = {
          txt: "text/plain;charset=utf-8",
          md: "text/markdown;charset=utf-8",
          json: "application/json;charset=utf-8",
          html: "text/html;charset=utf-8",
        };
        
        // Add UTF-8 BOM for text files
        const content = (format === "txt" || format === "md") ? "\uFEFF" + combinedContent : combinedContent;
        
        // Create Blob and download
        const blob = new Blob([content], { type: mimeTypes[format] });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        toast({
          title: "Exported!",
          description: `Exported ${entriesToExport.length} entries as single ${format.toUpperCase()} file 📄`,
        });
      }
      
      setBatchExportDialogOpen(false);
      setSelectionMode(false);
      setSelectedEntries(new Set());
      setBatchExportProgress(null);
    } catch (error) {
      console.error("Batch export error:", error);
      setBatchExportProgress(null);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExportAll = async () => {
    try {
      const entriesToExport = historyEntries;
      
      if (entriesToExport.length === 0) {
        toast({
          title: "No History",
          description: "No entries to export",
          variant: "destructive",
        });
        return;
      }

      const format = exportAllFormat;
      const asZip = exportAllAsZip;

      if (asZip) {
        setBatchExportProgress({ current: 0, total: entriesToExport.length });
        await exportMultipleAsZip(entriesToExport, format, (current, total) => {
          setBatchExportProgress({ current, total });
        });
        setBatchExportProgress(null);
        toast({
          title: "Exported!",
          description: `Exported all ${entriesToExport.length} entries as ${format.toUpperCase()} archive 📦`,
        });
      } else {
        const combinedContent = exportMultipleAsSingle(entriesToExport, format);
        const filename = `kolony-all-history-${Date.now()}.${format}`;
        const mimeTypes: Record<ExportFormat, string> = {
          txt: "text/plain;charset=utf-8",
          md: "text/markdown;charset=utf-8",
          json: "application/json;charset=utf-8",
          html: "text/html;charset=utf-8",
        };
        
        // Add UTF-8 BOM for text files
        const content = (format === "txt" || format === "md") ? "\uFEFF" + combinedContent : combinedContent;
        
        const blob = new Blob([content], { type: mimeTypes[format] });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        toast({
          title: "Exported!",
          description: `Exported all ${entriesToExport.length} entries as single ${format.toUpperCase()} file 📄`,
        });
      }
      
      setExportAllDialogOpen(false);
      setBatchExportProgress(null);
    } catch (error) {
      console.error("Export all error:", error);
      setBatchExportProgress(null);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : "Failed to export. Please try again.",
        variant: "destructive",
      });
    }
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 glass-card">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="generate">Generate Content</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="export">Export to Social</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-teal via-cyan to-pink bg-clip-text text-transparent">
                Canadian Content Templates
              </CardTitle>
              <CardDescription>
                Choose from pre-made bilingual templates tailored for Canadian audiences. One-click apply to get started!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search and Category Filters */}
              <div className="space-y-4">
                <Input
                  placeholder="Search templates..."
                  value={templateSearch}
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className="bg-background/40 backdrop-blur-xl border-white/10"
                />
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={selectedCategory === "All" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory("All")}
                    className={selectedCategory === "All" ? "bg-gradient-to-r from-teal to-cyan" : "border-white/10"}
                  >
                    All Templates
                  </Button>
                  {(["Holidays", "Business", "Marketing", "Social"] as TemplateCategory[]).map((category) => (
                    <Button
                      key={category}
                      variant={selectedCategory === category ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={selectedCategory === category ? "bg-gradient-to-r from-teal to-cyan" : "border-white/10"}
                    >
                      {getCategoryIcon(category)}
                      <span className="ml-2">{category}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Template Grid */}
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12 text-foreground/60">
                  <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No templates found. Try adjusting your search or category filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTemplates.map((template) => {
                    const isInSeason = isTemplateInSeason(template);
                    return (
                      <Card
                        key={template.id}
                        className={`glass-card border-2 transition-all hover:scale-105 hover:shadow-lg cursor-pointer ${
                          isInSeason ? categoryColors[template.category] : "opacity-75"
                        }`}
                        onClick={() => handleApplyTemplate(template.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl">{template.icon}</span>
                              <Badge variant="outline" className="text-xs border-white/20">
                                {template.category}
                              </Badge>
                            </div>
                            {isInSeason && (
                              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                                In Season
                              </Badge>
                            )}
                          </div>
                          <CardTitle className="text-lg font-semibold text-teal">
                            {template.name[language]}
                          </CardTitle>
                          <CardDescription className="text-sm text-foreground/70 line-clamp-2">
                            {template.description[language]}
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-background/30 border border-white/10">
                              <p className="text-xs text-foreground/60 mb-1">Preview ({language === "en" ? "English" : "Français"})</p>
                              <p className="text-sm text-foreground/80 line-clamp-2 italic">
                                {template.preview[language]}
                              </p>
                            </div>
                            <div className="flex items-center justify-between text-xs text-foreground/60">
                              <span>Style: {template.suggestedStyle}</span>
                              <span>Tone: {template.suggestedTone}</span>
                            </div>
                            <Button
                              className="w-full bg-gradient-to-r from-teal to-cyan hover:opacity-90"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApplyTemplate(template.id);
                              }}
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              Apply Template
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="generate" className="space-y-6">
          <Card className="glass-card">
            <CardContent className="pt-6 space-y-4">
              <Textarea
                placeholder="Describe the content you want to create..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-32 bg-background/40 backdrop-blur-xl border-white/10"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Language</label>
                  <Select value={language} onValueChange={(value: "en" | "fr") => setLanguage(value)}>
                    <SelectTrigger className="bg-background/40 backdrop-blur-xl border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français Québec</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
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

        <TabsContent value="history" className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-teal via-cyan to-pink bg-clip-text text-transparent flex items-center gap-2">
                    <History className="h-6 w-6 text-teal" />
                    Content History
                  </CardTitle>
                  <CardDescription className="mt-2">
                    View and manage all your generated content. Search, filter, and regenerate anytime.
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {historyEntries.length > 0 && (
                    <>
                      <Button
                        variant={selectionMode ? "default" : "outline"}
                        size="sm"
                        onClick={toggleSelectionMode}
                        className={selectionMode ? "bg-gradient-to-r from-teal to-cyan" : "border-white/10"}
                      >
                        {selectionMode ? (
                          <>
                            <X className="h-4 w-4 mr-2" />
                            Exit Selection
                          </>
                        ) : (
                          <>
                            <CheckSquare className="h-4 w-4 mr-2" />
                            Select Mode
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExportAllDialogOpen(true)}
                        className="border-white/10"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export All
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setClearAllDialogOpen(true)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Filters and Search */}
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-foreground/50" />
                  <Input
                    placeholder="Search content or prompts..."
                    value={historyFilters.search || ""}
                    onChange={(e) =>
                      setHistoryFilters({ ...historyFilters, search: e.target.value || undefined })
                    }
                    className="pl-10 bg-background/40 backdrop-blur-xl border-white/10"
                  />
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  <Filter className="h-4 w-4 text-foreground/60" />
                  <span className="text-sm text-foreground/60 mr-2">Filters:</span>
                  
                  <Select
                    value={historyFilters.language || "all"}
                    onValueChange={(value) =>
                      setHistoryFilters({
                        ...historyFilters,
                        language: value === "all" ? undefined : (value as "en" | "fr"),
                      })
                    }
                  >
                    <SelectTrigger className="w-[140px] bg-background/40 backdrop-blur-xl border-white/10">
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Languages</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select
                    value={historyFilters.format || "all"}
                    onValueChange={(value) =>
                      setHistoryFilters({
                        ...historyFilters,
                        format: value === "all" ? undefined : (value as ContentFormat),
                      })
                    }
                  >
                    <SelectTrigger className="w-[140px] bg-background/40 backdrop-blur-xl border-white/10">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Formats</SelectItem>
                      <SelectItem value="longcat">LongCat</SelectItem>
                      <SelectItem value="emu">Emu</SelectItem>
                    </SelectContent>
                  </Select>

                  {(historyFilters.language || historyFilters.format || historyFilters.search) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setHistoryFilters({})}
                      className="text-foreground/60 hover:text-foreground"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear Filters
                    </Button>
                  )}
                </div>
              </div>

              {/* History Timeline */}
              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-teal" />
                  <span className="ml-3 text-foreground/60">Loading history...</span>
                </div>
              ) : filteredHistoryEntries.length === 0 ? (
                <div className="text-center py-12 text-foreground/60">
                  <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">
                    {historyEntries.length === 0
                      ? "No history yet"
                      : "No entries match your filters"}
                  </p>
                  <p className="text-sm">
                    {historyEntries.length === 0
                      ? "Generate content to see it here"
                      : "Try adjusting your search or filters"}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectionMode && selectedEntries.size > 0 && (
                    <div className="glass-card border-2 border-teal/30 p-4 rounded-lg flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-teal">
                          {selectedEntries.size} {selectedEntries.size === 1 ? "entry" : "entries"} selected
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={selectAllEntries}
                          className="h-8 text-foreground/70 hover:text-foreground"
                        >
                          Select All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearSelection}
                          className="h-8 text-foreground/70 hover:text-foreground"
                        >
                          Clear Selection
                        </Button>
                      </div>
                      <Button
                        onClick={() => setBatchExportDialogOpen(true)}
                        className="bg-gradient-to-r from-teal to-cyan hover:opacity-90"
                        size="sm"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Selected ({selectedEntries.size})
                      </Button>
                    </div>
                  )}
                  
                  {filteredHistoryEntries.map((entry) => (
                    <Card
                      key={entry.id}
                      className={`glass-card border-2 transition-all hover:shadow-lg hover:scale-[1.01] ${
                        selectionMode && selectedEntries.has(entry.id)
                          ? "border-teal/50 bg-teal/5"
                          : "border-white/10 hover:border-teal/30"
                      }`}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-4 gap-4">
                          {selectionMode && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleEntrySelection(entry.id)}
                              className="h-8 w-8 p-0 mt-1"
                            >
                              {selectedEntries.has(entry.id) ? (
                                <CheckSquare className="h-5 w-5 text-teal" />
                              ) : (
                                <Square className="h-5 w-5 text-foreground/40" />
                              )}
                            </Button>
                          )}
                          <div className="flex items-center gap-2 flex-wrap flex-1">
                            <Badge
                              variant="outline"
                              className={
                                entry.language === "en"
                                  ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                                  : "border-purple-500/30 bg-purple-500/10 text-purple-400"
                              }
                            >
                              {entry.language === "en" ? "English" : "Français"}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={
                                entry.format === "longcat"
                                  ? "border-teal/30 bg-teal/10 text-teal"
                                  : "border-pink/30 bg-pink/10 text-pink"
                              }
                            >
                              {entry.format === "longcat" ? "LongCat 📱" : "Emu ⚡"}
                            </Badge>
                            <Badge variant="outline" className="border-white/20 text-foreground/60">
                              {entry.style}
                            </Badge>
                            <Badge variant="outline" className="border-white/20 text-foreground/60">
                              {entry.tone}
                            </Badge>
                            <span className="text-xs text-foreground/50">
                              {formatRelativeTime(entry.timestamp)}
                            </span>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm text-foreground/60 mb-1">Prompt:</p>
                          <p className="text-sm text-foreground/80 line-clamp-2 italic mb-3">
                            {entry.prompt}
                          </p>
                          <p className="text-sm text-foreground/60 mb-1">Content:</p>
                          <p className="text-sm text-foreground/90 line-clamp-3">
                            {getContentPreview(entry.content)}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-white/10">
                          <div className="flex items-center gap-4 text-xs text-foreground/60">
                            <span>{entry.characterCount} chars</span>
                            <span>•</span>
                            <span>{entry.wordCount} words</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewFull(entry)}
                              className="h-8 text-foreground/70 hover:text-foreground hover:bg-background/40"
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              View Full
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-foreground/70 hover:text-foreground hover:bg-background/40"
                                >
                                  <Copy className="h-3.5 w-3.5 mr-1.5" />
                                  Copy
                                  <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass-card border-white/10">
                                <DropdownMenuLabel>Copy as</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem
                                  onClick={() => handleCopyAsFormat(entry.content, "plain")}
                                  className="cursor-pointer"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Plain Text
                                  <span className="ml-auto text-xs text-foreground/50">Simple text file</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCopyAsFormat(entry.content, "markdown")}
                                  className="cursor-pointer"
                                >
                                  <Code className="h-4 w-4 mr-2" />
                                  Markdown
                                  <span className="ml-auto text-xs text-foreground/50">Markdown format</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleCopyAsFormat(entry.content, "html")}
                                  className="cursor-pointer"
                                >
                                  <Globe className="h-4 w-4 mr-2" />
                                  HTML
                                  <span className="ml-auto text-xs text-foreground/50">HTML format</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 text-foreground/70 hover:text-foreground hover:bg-background/40"
                                >
                                  <Download className="h-3.5 w-3.5 mr-1.5" />
                                  Export
                                  <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass-card border-white/10">
                                <DropdownMenuLabel>Export format</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem
                                  onClick={() => handleExportEntry(entry, "txt")}
                                  className="cursor-pointer"
                                >
                                  <FileText className="h-4 w-4 mr-2" />
                                  Plain Text (.txt)
                                  <span className="ml-auto text-xs text-foreground/50">Simple text</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleExportEntry(entry, "md")}
                                  className="cursor-pointer"
                                >
                                  <FileCode className="h-4 w-4 mr-2" />
                                  Markdown (.md)
                                  <span className="ml-auto text-xs text-foreground/50">Markdown</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleExportEntry(entry, "json")}
                                  className="cursor-pointer"
                                >
                                  <Code className="h-4 w-4 mr-2" />
                                  JSON (.json)
                                  <span className="ml-auto text-xs text-foreground/50">Structured</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleExportEntry(entry, "html")}
                                  className="cursor-pointer"
                                >
                                  <Globe className="h-4 w-4 mr-2" />
                                  HTML (.html)
                                  <span className="ml-auto text-xs text-foreground/50">Web page</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRegenerate(entry)}
                              className="h-8 text-foreground/70 hover:text-foreground hover:bg-background/40"
                            >
                              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                              Regenerate
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteHistory(entry.id)}
                              className="h-8 text-red-400/70 hover:text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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

      {/* View Full Content Dialog */}
      <Dialog open={viewFullOpen} onOpenChange={setViewFullOpen}>
        <DialogContent className="glass-card max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-teal" />
              Full Content
            </DialogTitle>
            <DialogDescription>
              {selectedHistoryEntry && (
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <Badge
                    variant="outline"
                    className={
                      selectedHistoryEntry.language === "en"
                        ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                        : "border-purple-500/30 bg-purple-500/10 text-purple-400"
                    }
                  >
                    {selectedHistoryEntry.language === "en" ? "English" : "Français"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={
                      selectedHistoryEntry.format === "longcat"
                        ? "border-teal/30 bg-teal/10 text-teal"
                        : "border-pink/30 bg-pink/10 text-pink"
                    }
                  >
                    {selectedHistoryEntry.format === "longcat" ? "LongCat" : "Emu"}
                  </Badge>
                  <Badge variant="outline" className="border-white/20">
                    {selectedHistoryEntry.style} • {selectedHistoryEntry.tone}
                  </Badge>
                  <span className="text-xs text-foreground/60">
                    {formatRelativeTime(selectedHistoryEntry.timestamp)}
                  </span>
                  <span className="text-xs text-foreground/60">
                    • {selectedHistoryEntry.characterCount} chars • {selectedHistoryEntry.wordCount} words
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedHistoryEntry && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold mb-2 text-foreground/80">Prompt:</h4>
                <div className="p-4 rounded-lg bg-background/40 backdrop-blur-xl border border-white/10">
                  <p className="text-sm text-foreground/90 italic whitespace-pre-wrap">
                    {selectedHistoryEntry.prompt}
                  </p>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-2 text-foreground/80">Generated Content:</h4>
                <div className="p-4 rounded-lg bg-background/40 backdrop-blur-xl border border-white/10">
                  <pre className="text-sm text-foreground/90 whitespace-pre-wrap font-sans">
                    {selectedHistoryEntry.content}
                  </pre>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setViewFullOpen(false)}
              className="border-white/10"
            >
              Close
            </Button>
            {selectedHistoryEntry && (
              <Button
                onClick={() => {
                  handleCopyHistory(selectedHistoryEntry.content);
                }}
                className="bg-gradient-to-r from-teal to-cyan hover:opacity-90"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Content
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clear All History Confirmation Dialog */}
      <AlertDialog open={clearAllDialogOpen} onOpenChange={setClearAllDialogOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-400" />
              Clear All History?
            </AlertDialogTitle>
            <AlertDialogDescription className="pt-2">
              This will permanently delete all {historyEntries.length} history entries. This action
              cannot be undone. Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-white/10">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllHistory}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Batch Export Dialog */}
      <Dialog open={batchExportDialogOpen} onOpenChange={(open) => {
        setBatchExportDialogOpen(open);
        if (!open) {
          setBatchExportProgress(null);
        }
      }}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-teal" />
              Export Selected Entries
            </DialogTitle>
            <DialogDescription>
              Export {selectedEntries.size} selected {selectedEntries.size === 1 ? "entry" : "entries"} in your preferred format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Export Format</label>
              <Select
                value={batchExportFormat}
                onValueChange={(value) => setBatchExportFormat(value as ExportFormat)}
              >
                <SelectTrigger className="bg-background/40 backdrop-blur-xl border-white/10">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="txt">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Plain Text (.txt)
                    </div>
                  </SelectItem>
                  <SelectItem value="md">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4" />
                      Markdown (.md)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      JSON (.json)
                    </div>
                  </SelectItem>
                  <SelectItem value="html">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      HTML (.html)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Export Type</label>
              <div className="flex gap-2">
                <Button
                  variant={!batchExportAsZip ? "default" : "outline"}
                  className={`flex-1 ${!batchExportAsZip ? "bg-gradient-to-r from-teal to-cyan" : "border-white/10"}`}
                  onClick={() => setBatchExportAsZip(false)}
                  disabled={!!batchExportProgress}
                >
                  Single File
                </Button>
                <Button
                  variant={batchExportAsZip ? "default" : "outline"}
                  className={`flex-1 ${batchExportAsZip ? "bg-gradient-to-r from-teal to-cyan" : "border-white/10"}`}
                  onClick={() => setBatchExportAsZip(true)}
                  disabled={!!batchExportProgress}
                >
                  Zip Archive
                </Button>
              </div>
              <p className="text-xs text-foreground/60 mt-2">
                Single File: Combines all entries into one file
                <br />
                Zip Archive: Separate files organized in a zip folder
              </p>
            </div>

            {batchExportProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/70">Exporting...</span>
                  <span className="text-teal">
                    {batchExportProgress.current} / {batchExportProgress.total}
                  </span>
                </div>
                <div className="h-2 bg-background/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal to-cyan transition-all duration-300"
                    style={{
                      width: `${(batchExportProgress.current / batchExportProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setBatchExportDialogOpen(false);
                setBatchExportProgress(null);
              }}
              className="border-white/10"
              disabled={!!batchExportProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBatchExport}
              className="bg-gradient-to-r from-teal to-cyan hover:opacity-90"
              disabled={!!batchExportProgress || selectedEntries.size === 0}
            >
              {batchExportProgress ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export All Dialog */}
      <Dialog open={exportAllDialogOpen} onOpenChange={(open) => {
        setExportAllDialogOpen(open);
        if (!open) {
          setBatchExportProgress(null);
        }
      }}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-teal" />
              Export All History
            </DialogTitle>
            <DialogDescription>
              Export all {historyEntries.length} history entries in your preferred format.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Export Format</label>
              <Select
                value={exportAllFormat}
                onValueChange={(value) => setExportAllFormat(value as ExportFormat)}
              >
                <SelectTrigger className="bg-background/40 backdrop-blur-xl border-white/10">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="txt">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Plain Text (.txt)
                    </div>
                  </SelectItem>
                  <SelectItem value="md">
                    <div className="flex items-center gap-2">
                      <FileCode className="h-4 w-4" />
                      Markdown (.md)
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center gap-2">
                      <Code className="h-4 w-4" />
                      JSON (.json)
                    </div>
                  </SelectItem>
                  <SelectItem value="html">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      HTML (.html)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Export Type</label>
              <div className="flex gap-2">
                <Button
                  variant={!exportAllAsZip ? "default" : "outline"}
                  className={`flex-1 ${!exportAllAsZip ? "bg-gradient-to-r from-teal to-cyan" : "border-white/10"}`}
                  onClick={() => setExportAllAsZip(false)}
                  disabled={!!batchExportProgress}
                >
                  Single File
                </Button>
                <Button
                  variant={exportAllAsZip ? "default" : "outline"}
                  className={`flex-1 ${exportAllAsZip ? "bg-gradient-to-r from-teal to-cyan" : "border-white/10"}`}
                  onClick={() => setExportAllAsZip(true)}
                  disabled={!!batchExportProgress}
                >
                  Zip Archive
                </Button>
              </div>
              <p className="text-xs text-foreground/60 mt-2">
                Single File: Combines all entries into one file
                <br />
                Zip Archive: Separate files organized in a zip folder
              </p>
            </div>

            {batchExportProgress && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-foreground/70">Exporting...</span>
                  <span className="text-teal">
                    {batchExportProgress.current} / {batchExportProgress.total}
                  </span>
                </div>
                <div className="h-2 bg-background/40 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal to-cyan transition-all duration-300"
                    style={{
                      width: `${(batchExportProgress.current / batchExportProgress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setExportAllDialogOpen(false);
                setBatchExportProgress(null);
              }}
              className="border-white/10"
              disabled={!!batchExportProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExportAll}
              className="bg-gradient-to-r from-teal to-cyan hover:opacity-90"
              disabled={!!batchExportProgress || historyEntries.length === 0}
            >
              {batchExportProgress ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export All ({historyEntries.length})
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreatorStudio;
