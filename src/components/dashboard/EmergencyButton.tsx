
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

interface EmergencyButtonProps {
  title: string;
  onActivate: () => Promise<boolean>;
  className?: string;
  disabled?: boolean;
}

/**
 * Un botón de emergencia que requiere ser mantenido presionado por 2 segundos para activarse.
 * Muestra una barra de progreso circular durante la pulsación.
 */
export function EmergencyButton({ title, onActivate, className, disabled }: EmergencyButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const HOLD_DURATION = 2000; // 2 segundos

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimers();
    setIsHolding(false);
    setProgress(0);
  }, [clearTimers]);

  const handleActivation = useCallback(async () => {
      const success = await onActivate();
      // El reset se maneja después de que 'onActivate' resuelva, 
      // y 'isActivating' en el padre deshabilita el botón.
      if (!success) {
        reset();
      }
  }, [onActivate, reset]);

  const startHold = () => {
    if (disabled) return;
    
    setIsHolding(true);
    setProgress(0);
    
    progressIntervalRef.current = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(progressIntervalRef.current!);
          return 100;
        }
        return p + (100 / (HOLD_DURATION / 30));
      });
    }, 30);

    timerRef.current = setTimeout(() => {
      handleActivation();
      // No reseteamos inmediatamente, esperamos a que el padre nos deshabilite
      // a través de `disabled` (isActivating). El reset se llamará si falla onActivate.
    }, HOLD_DURATION);
  };

  const cancelHold = () => {
    if (disabled || !isHolding) return;
    reset();
  };

  useEffect(() => {
    // Si el botón se deshabilita desde el padre mientras se está manteniendo presionado,
    // (por ejemplo, porque otra alerta se está activando), resetea su estado.
    if (disabled) {
        reset();
    }
  }, [disabled, reset]);

  // Limpieza al desmontar
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  const progressStyle = {
    background: `conic-gradient(white ${progress * 3.6}deg, rgba(255, 255, 255, 0.2) 0deg)`
  };

  return (
    <button
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={(e) => { e.preventDefault(); startHold(); }}
      onTouchEnd={cancelHold}
      disabled={disabled}
      className={cn(
        "relative min-h-24 rounded-2xl p-2 shadow-lg flex items-center justify-center text-white transition-transform transform active:scale-95 hover:scale-105 overflow-hidden disabled:opacity-75 disabled:cursor-not-allowed",
        className
      )}
    >
      {isHolding && (
        <div 
          className="absolute inset-0 transition-opacity duration-300 opacity-50"
          style={progressStyle}
        ></div>
      )}
      <span className="font-bold text-sm text-center relative z-10 p-2">
        {title}
      </span>
    </button>
  );
}
