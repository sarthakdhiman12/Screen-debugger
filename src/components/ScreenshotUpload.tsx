import { useState, useCallback } from "react";
import { Upload, X, Image } from "lucide-react";

interface ScreenshotUploadProps {
  value: string | null;
  onChange: (base64: string | null) => void;
}

export function ScreenshotUpload({ value, onChange }: ScreenshotUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      onChange(base64);
    };
    reader.readAsDataURL(file);
  }, [onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFile(file);
    };
    input.click();
  }, [handleFile]);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) handleFile(file);
        break;
      }
    }
  }, [handleFile]);

  if (value) {
    return (
      <div className="relative group">
        <div className="glass-panel glow-border rounded-lg overflow-hidden">
          <img 
            src={value} 
            alt="Uploaded screenshot" 
            className="w-full h-48 object-contain bg-terminal"
          />
          <button
            onClick={() => onChange(null)}
            className="absolute top-2 right-2 p-1.5 bg-destructive/90 hover:bg-destructive text-destructive-foreground rounded-md transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Remove screenshot"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">Click the X to remove</p>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onPaste={handlePaste}
      onClick={handleClick}
      tabIndex={0}
      className={`
        glass-panel glow-border rounded-lg p-8 cursor-pointer transition-all duration-200
        flex flex-col items-center justify-center gap-4 min-h-[200px]
        ${isDragOver 
          ? "border-primary bg-primary/10 shadow-glow" 
          : "hover:border-primary/50 hover:bg-card/60"
        }
      `}
    >
      <div className={`
        p-4 rounded-full transition-colors
        ${isDragOver ? "bg-primary/20" : "bg-muted"}
      `}>
        {isDragOver ? (
          <Upload className="w-8 h-8 text-primary animate-pulse" />
        ) : (
          <Image className="w-8 h-8 text-muted-foreground" />
        )}
      </div>
      <div className="text-center">
        <p className="text-foreground font-medium">
          {isDragOver ? "Drop your screenshot" : "Upload Screenshot"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Drag & drop, click to browse, or paste from clipboard
        </p>
      </div>
    </div>
  );
}
