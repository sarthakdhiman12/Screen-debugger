import { Textarea } from "@/components/ui/textarea";
import { Code } from "lucide-react";

interface CodeInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  icon?: React.ReactNode;
}

export function CodeInput({ value, onChange, placeholder, label, icon }: CodeInputProps) {
  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        {icon || <Code className="w-4 h-4 text-primary" />}
        {label}
      </label>
      <div className="glass-panel glow-border rounded-lg overflow-hidden">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="min-h-[180px] bg-transparent border-0 font-mono text-sm resize-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50 scrollbar-thin"
        />
      </div>
    </div>
  );
}
