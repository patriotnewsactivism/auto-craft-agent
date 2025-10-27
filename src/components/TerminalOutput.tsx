import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Terminal } from "lucide-react";

interface TerminalLine {
  text: string;
  type: "command" | "output" | "error" | "success";
}

interface TerminalOutputProps {
  lines: TerminalLine[];
}

export const TerminalOutput = ({ lines }: TerminalOutputProps) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  const getLineColor = (type: TerminalLine["type"]) => {
    switch (type) {
      case "command":
        return "text-accent";
      case "error":
        return "text-destructive";
      case "success":
        return "text-accent";
      default:
        return "text-foreground";
    }
  };

  return (
    <Card className="bg-card border-border overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-secondary/50">
        <Terminal className="h-4 w-4 text-primary" />
        <span className="text-sm font-semibold">Terminal</span>
      </div>
      <div className="p-4 h-64 overflow-y-auto bg-background/50">
        <div className="space-y-1 code-font text-sm">
          {lines.map((line, index) => (
            <div key={index} className={getLineColor(line.type)}>
              {line.type === "command" && <span className="text-muted-foreground">$ </span>}
              {line.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
    </Card>
  );
};
