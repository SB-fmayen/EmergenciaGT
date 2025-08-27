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
        {/* Status Bar */}
        <div className="bg-transparent text-white text-xs px-4 py-1 flex justify-between items-center flex-shrink-0">
            <span className="font-medium">9:41</span>
            <div className="flex items-center space-x-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-reception-4" viewBox="0 0 16 16">
                  <path d="M0 11.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2zm4-3a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-5zm4-3a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v8a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-8zm4-3a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v11a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-11z"/>
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-wifi" viewBox="0 0 16 16">
                  <path d="M15.384 6.115a.485.485 0 0 0-.047-.736A12.444 12.444 0 0 0 8 3C5.259 3 2.723 4.045.663 5.379a.485.485 0 0 0-.048.736.518.518 0 0 0 .732.047 11.448 11.448 0 0 1 13.37-.01_z_"/>
                  <path d="M13.229 8.271a.482.482 0 0 0-.063-.745A9.456 9.456 0 0 0 8 6c-1.905 0-3.68.56-5.166 1.526a.48.48 0 0 0-.063.745.525.525 0 0 0 .75.063A8.46 8.46 0 0 1 8 7a8.46 8.46 0 0 1 4.479 1.334.525.525 0 0 0 .75-.063_z_"/>
                  <path d="M10.706 10.42a.478.478 0 0 0-.079-.763A6.463 6.463 0 0 0 8 9c-1.263 0-2.427.362-3.374.996a.478.478 0 0 0-.08.763.543.543 0 0 0 .764.08A5.46 5.46 0 0 1 8 10c1.132 0 2.18.346 3.024.96.275.16.622.1.765-.079_z_"/>
                  <path d="M8.5 12.5a.5.5 0 0 1-1 0 .5.5 0 0 1 1 0_z_"/>
                </svg>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-battery-half" viewBox="0 0 16 16">
                  <path d="M2 6h5v4H2V6z"/>
                  <path d="M2 4a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H2zm10 1a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h10zm4 3a1.5 1.5 0 0 1-1.5 1.5v-3A1.5 1.5 0 0 1 16 8z"/>
                </svg>
            </div>
        </div>
        <div className={cn("flex-1 flex flex-col", className)}>
          {children}
        </div>
      </main>
    </div>
  );
}
