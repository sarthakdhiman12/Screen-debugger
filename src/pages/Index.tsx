import { useState } from "react";
import { ScreenshotUpload } from "@/components/ScreenshotUpload";
import { CodeInput } from "@/components/CodeInput";
import { AnalysisResult } from "@/components/AnalysisResult";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Bug, Terminal, Code, Zap, Loader2, Sparkles } from "lucide-react";

interface AnalysisData {
  rootCause: string;
  errorChain: string[];
  suggestedFixes: Array<{
    title: string;
    description: string;
    code?: string;
  }>;
  testSuggestions: Array<{
    title: string;
    description: string;
    code?: string;
  }>;
  summary: string;
}

const Index = () => {
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [terminalLogs, setTerminalLogs] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);

  const hasInput = screenshot || terminalLogs.trim() || codeSnippet.trim();

  const handleAnalyze = async () => {
    if (!hasInput) {
      toast({
        title: "No input provided",
        description: "Please add at least one: screenshot, terminal logs, or code snippet.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-debug", {
        body: {
          screenshot,
          terminalLogs,
          codeSnippet,
        },
      });

      if (error) throw error;

      if (data.error) {
        throw new Error(data.error);
      }

      setAnalysis(data);
      toast({
        title: "Analysis complete",
        description: "Check out the debugging insights below.",
      });
    } catch (error) {
      console.error("Analysis error:", error);
      toast({
        title: "Analysis failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClear = () => {
    setScreenshot(null);
    setTerminalLogs("");
    setCodeSnippet("");
    setAnalysis(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg">
              <Bug className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">CodeDebugger</h1>
              <p className="text-xs text-muted-foreground">Multimodal AI Analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary" />
            <span>Powered by Gemini Pro</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <section className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Debug Smarter, <span className="text-primary">Not Harder</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload screenshots, paste terminal logs, or share code snippets. 
            AI identifies root causes, explains error chains, and suggests fixes.
          </p>
        </section>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Zap className="w-5 h-5 text-primary" />
                Debug Context
              </h3>
              {hasInput && (
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  Clear all
                </Button>
              )}
            </div>

            {/* Screenshot Upload */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                <span className="w-2 h-2 rounded-full bg-primary" />
                Screenshot
              </label>
              <ScreenshotUpload value={screenshot} onChange={setScreenshot} />
            </div>

            {/* Terminal Logs */}
            <CodeInput
              value={terminalLogs}
              onChange={setTerminalLogs}
              label="Terminal Logs"
              placeholder="Paste your terminal output, error messages, or console logs here..."
              icon={<Terminal className="w-4 h-4 text-warning" />}
            />

            {/* Code Snippet */}
            <CodeInput
              value={codeSnippet}
              onChange={setCodeSnippet}
              label="Code Snippet"
              placeholder="Paste the relevant code that's causing issues..."
              icon={<Code className="w-4 h-4 text-success" />}
            />

            {/* Analyze Button */}
            <Button
              onClick={handleAnalyze}
              disabled={!hasInput || isAnalyzing}
              variant="glow"
              size="lg"
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Bug className="w-5 h-5" />
                  Analyze & Debug
                </>
              )}
            </Button>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Analysis Results
            </h3>

            {analysis ? (
              <AnalysisResult analysis={analysis} />
            ) : (
              <div className="glass-panel glow-border rounded-lg p-12 flex flex-col items-center justify-center min-h-[400px] text-center">
                <div className="p-4 bg-muted rounded-full mb-4">
                  <Bug className="w-10 h-10 text-muted-foreground" />
                </div>
                <h4 className="text-lg font-medium text-foreground mb-2">
                  No analysis yet
                </h4>
                <p className="text-muted-foreground max-w-sm">
                  Add your debugging context on the left and click "Analyze & Debug" to get AI-powered insights.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <section className="mt-16 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Terminal className="w-6 h-6" />,
              title: "Terminal Analysis",
              description: "Paste error logs and stack traces for instant root cause identification"
            },
            {
              icon: <Code className="w-6 h-6" />,
              title: "Code Review",
              description: "Share code snippets to get fix suggestions and best practice recommendations"
            },
            {
              icon: <Bug className="w-6 h-6" />,
              title: "Visual Debugging",
              description: "Upload screenshots of errors for AI to analyze UI issues and error messages"
            }
          ].map((feature, index) => (
            <div 
              key={index}
              className="glass-panel glow-border rounded-lg p-6 text-center hover:bg-muted/30 transition-colors"
            >
              <div className="inline-flex p-3 bg-primary/20 rounded-lg text-primary mb-4">
                {feature.icon}
              </div>
              <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>CodeDebugger — AI-powered debugging assistant</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
