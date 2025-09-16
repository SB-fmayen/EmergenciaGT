
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, ShieldAlert } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface PanicButtonProps {
  /** Función a ejecutar cuando el botón se activa completamente. */
  onActivate: () => Promise<boolean>; // Cambiado para devolver una promesa booleana
  /** Indica si el botón debe estar deshabilitado. */
  disabled?: boolean;
}

/**
 * Componente del botón de pánico principal.
 * El usuario debe mantenerlo presionado durante 2 segundos para activar la alerta.
 * Muestra una barra de progreso durante la pulsación.
 * @param {PanicButtonProps} props - Propiedades del componente.
 */
export function PanicButton({ onActivate, disabled }: PanicButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isOnline = useOnlineStatus();

  /**
   * Limpia todos los temporizadores y estados.
   */
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

  /**
   * Reinicia el estado del botón a su estado inicial.
   */
  const reset = useCallback(() => {
    clearTimers();
    setIsHolding(false);
    setProgress(0);
  }, [clearTimers]);

  const handleActivation = useCallback(async () => {
    const success = await onActivate();
    // No se hace nada en caso de éxito, el componente padre maneja el estado
    // de carga y el modal. En caso de fallo, se resetea.
    if (!success) {
      reset();
    }
  }, [onActivate, reset]);

  /**
   * Inicia el proceso de mantener presionado.
   * Activa un temporizador de 2 segundos y un intervalo para la barra de progreso.
   */
  const startHold = () => {
    if (disabled) return;
    
    setIsHolding(true);
    setProgress(0); // Empezar siempre desde 0
    
    progressIntervalRef.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(progressIntervalRef.current!);
          return 100;
        }
        return p + (100 / (2000 / 30)); // 2s total duration
      });
    }, 30);

    timerRef.current = setTimeout(() => {
      handleActivation();
      // No reseteamos inmediatamente. El padre controla el estado `disabled`
      // a través de `isActivating`. Si la activación falla, el reset se llama.
    }, 2000);
  };

  /**
   * Cancela el proceso si el usuario suelta el botón antes de tiempo.
   */
  const cancelHold = () => {
    if (disabled || !isHolding) return;
    reset();
  };
  
  useEffect(() => {
      if (disabled) {
          reset();
      }
  }, [disabled, reset]);


  /**
   * Hook de efecto para limpiar los temporizadores cuando el componente se desmonta,
   * para evitar fugas de memoria.
   */
  useEffect(() => {
    return () => clearTimers();
  }, [clearTimers]);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative mb-4">
        <Button
          onMouseDown={startHold}
          onMouseUp={cancelHold}
          onMouseLeave={cancelHold}
          onTouchStart={(e) => { e.preventDefault(); startHold(); }}
          onTouchEnd={cancelHold}
          disabled={disabled}
          className="w-56 h-56 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-800 text-white flex-col animate-pulse-emergency shadow-2xl shadow-red-500/20 active:scale-95 transition-all duration-300 disabled:opacity-80 disabled:cursor-not-allowed"
        >
          <div className="text-center relative z-10">
            {disabled && isHolding ? ( // Muestra un check mientras se procesa
                <Check className="w-16 h-16 mx-auto mb-2 animate-fade-in" />
            ) : (
                <ShieldAlert className="w-16 h-16 mx-auto mb-2" />
            )}
            <div className="text-2xl font-black mb-1">{disabled && isHolding ? "ENVIADO" : "EMERGENCIA"}</div>
            <div className="text-base font-medium opacity-90">{disabled ? "" : "PRESIONAR"}</div>
          </div>
        </Button>
        <div className="absolute inset-0 rounded-full border-4 border-red-400/30 animate-ping -z-10"></div>
      </div>
      
      <p className="text-white text-base font-medium mb-4 h-5">
        {isHolding ? "Mantén presionado..." : "Mantén presionado por 2 segundos"}
      </p>

      <div className="w-56 mx-auto h-6">
        {isHolding && (
          <div className="animate-fade-in">
            <Progress value={progress} className="h-2 bg-white/20 [&>div]:bg-white" />
          </div>
        )}
      </div>
    </div>
  );
}
