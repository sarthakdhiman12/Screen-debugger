import { AlertCircle, CheckCircle, Lightbulb, TestTube, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

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

interface AnalysisResultProps {
  analysis: AnalysisData;
}

function CollapsibleSection({ 
  title, 
  icon, 
  children, 
  defaultOpen = true,
  accentColor = "primary"
}: { 
  title: string; 
  icon: React.ReactNode; 
  children: React.ReactNode;
  defaultOpen?: boolean;
  accentColor?: "primary" | "warning" | "success" | "destructive";
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const colorClasses = {
    primary: "text-primary",
    warning: "text-warning",
    success: "text-success",
    destructive: "text-destructive"
  };

  return (
    <div className="glass-panel glow-border rounded-lg overflow-hidden animate-fade-in">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors"
      >
        <span className={colorClasses[accentColor]}>{icon}</span>
        <span className="font-medium text-foreground flex-1 text-left">{title}</span>
        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4 pt-0">{children}</div>}
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group mt-3">
      <pre className="bg-terminal rounded-lg p-4 overflow-x-auto font-mono text-sm text-foreground/90 scrollbar-thin">
        <code>{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 bg-muted/80 hover:bg-muted rounded-md transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Copy code"
      >
        {copied ? (
          <Check className="w-4 h-4 text-success" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
    </div>
  );
}

export function AnalysisResult({ analysis }: AnalysisResultProps) {
  return (
    <div className="space-y-4">
      {/* Summary Banner */}
      <div className="bg-gradient-to-r from-primary/20 to-primary/5 border border-primary/30 rounded-lg p-4 animate-fade-in">
        <p className="text-foreground font-medium">{analysis.summary}</p>
      </div>

      {/* Root Cause */}
      <CollapsibleSection 
        title="Root Cause" 
        icon={<AlertCircle className="w-5 h-5" />}
        accentColor="destructive"
      >
        <p className="text-foreground/80 leading-relaxed">{analysis.rootCause}</p>
      </CollapsibleSection>

      {/* Error Chain */}
      {analysis.errorChain.length > 0 && (
        <CollapsibleSection 
          title="Error Chain" 
          icon={<ChevronRight className="w-5 h-5" />}
          accentColor="warning"
        >
          <ol className="space-y-2">
            {analysis.errorChain.map((step, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-warning/20 text-warning text-xs font-medium flex items-center justify-center">
                  {index + 1}
                </span>
                <span className="text-foreground/80 pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </CollapsibleSection>
      )}

      {/* Suggested Fixes */}
      {analysis.suggestedFixes.length > 0 && (
        <CollapsibleSection 
          title="Suggested Fixes" 
          icon={<Lightbulb className="w-5 h-5" />}
          accentColor="success"
        >
          <div className="space-y-4">
            {analysis.suggestedFixes.map((fix, index) => (
              <div key={index} className="border-l-2 border-success/50 pl-4">
                <h4 className="font-medium text-foreground">{fix.title}</h4>
                <p className="text-foreground/70 text-sm mt-1">{fix.description}</p>
                {fix.code && <CodeBlock code={fix.code} />}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Test Suggestions */}
      {analysis.testSuggestions.length > 0 && (
        <CollapsibleSection 
          title="Validation Tests" 
          icon={<TestTube className="w-5 h-5" />}
          accentColor="primary"
          defaultOpen={false}
        >
          <div className="space-y-4">
            {analysis.testSuggestions.map((test, index) => (
              <div key={index} className="border-l-2 border-primary/50 pl-4">
                <h4 className="font-medium text-foreground">{test.title}</h4>
                <p className="text-foreground/70 text-sm mt-1">{test.description}</p>
                {test.code && <CodeBlock code={test.code} />}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
