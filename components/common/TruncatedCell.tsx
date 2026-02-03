import { cn } from "@/lib/utils";

interface TruncatedCellProps {
  text: string | number;
  maxWidth?: string;
  className?: string;
}

export function TruncatedCell({ text, maxWidth = "200px", className }: TruncatedCellProps) {
  const content = String(text || "");
  
  return (
    <div 
      className={cn("truncate", className)} 
      style={{ maxWidth }} 
      title={content}
    >
      {content || "—"}
    </div>
  );
}
