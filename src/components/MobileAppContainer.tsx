import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface MobileAppContainerProps {
  children: ReactNode;
  className?: string;
}

export function MobileAppContainer({ children, className }: MobileAppContainerProps) {
  return (
    <div className="bg-slate-900 min-h-screen font-body text-foreground">
      <main className="max-w-sm mx-auto bg-background min-h-screen shadow-2xl relative overflow-hidden flex flex-col">
        <div className={cn("flex-1 flex flex-col", className)}>
          {children}
        </div>
      </main>
    </div>
  );
}
