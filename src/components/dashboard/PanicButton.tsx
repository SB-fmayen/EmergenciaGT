"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, ShieldAlert } from "lucide-react";

interface PanicButtonProps {
  onActivate: () => void;
}

export function PanicButton({ onActivate }: PanicButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startHold = () => {
    setIsHolding(true);
    
    progressIntervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(progressIntervalRef.current!);
          return 100;
        }
        return p + 1;
      });
    }, 30); // 3000ms / 100 steps = 30ms per step

    timerRef.current = setTimeout(() => {
      onActivate();
      reset();
    }, 3000);
  };

  const cancelHold = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsHolding(false);
    setProgress(0);
  };

  const reset = () => {
    setIsHolding(false);
    setProgress(0);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
  };

  useEffect(() => {
    return () => {
      // Cleanup timers on component unmount
      if (timerRef.current) clearTimeout(timerRef.current);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative mb-8">
        <Button
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={(e) => { e.preventDefault(); startHold(); }}
          onTouchEnd={cancelHold}
          className="w-72 h-72 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-800 text-white flex-col animate-pulse-emergency shadow-2xl shadow-red-500/20 active:scale-95 transition-all duration-300"
        >
          <div className="text-center relative z-10">
            {progress >= 100 ? (
                <Check className="w-20 h-20 mx-auto mb-3" />
            ) : (
                <ShieldAlert className="w-20 h-20 mx-auto mb-3" />
            )}
            <div className="text-3xl font-black mb-1">EMERGENCIA</div>
            <div className="text-lg font-medium opacity-90">PRESIONAR</div>
          </div>
        </Button>
        <div className="absolute inset-0 rounded-full border-4 border-red-400/30 animate-ping -z-10"></div>
      </div>
      
      <p className="text-white text-xl font-medium mb-6">
        Mantén presionado por 3 segundos
      </p>

      <div className="w-72 mx-auto h-8">
        {isHolding && (
          <div className="animate-fade-in">
            <Progress value={progress} className="h-3 bg-white/20 [&>div]:bg-white" />
            <p className="text-white/80 text-sm mt-2 text-center">Activando emergencia...</p>
          </div>
        )}
      </div>
    </div>
  );
}
