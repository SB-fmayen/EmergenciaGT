
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Check, ShieldAlert } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

interface PanicButtonProps {
  /** Función a ejecutar cuando el botón se activa completamente. */
  onActivate: () => void;
}

/**
 * Componente del botón de pánico principal.
 * El usuario debe mantenerlo presionado durante 2 segundos para activar la alerta.
 * Muestra una barra de progreso durante la pulsación.
 * @param {PanicButtonProps} props - Propiedades del componente.
 */
export function PanicButton({ onActivate }: PanicButtonProps) {
  const [isHolding, setIsHolding] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isOnline = useOnlineStatus();

  /**
   * Limpia todos los temporizadores y estados.
   */
  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  /**
   * Reinicia el estado del botón a su estado inicial.
   */
  const reset = useCallback(() => {
    clearTimers();
    setIsHolding(false);
    setIsActivated(false);
    setProgress(0);
  }, []);


  /**
   * Inicia el proceso de mantener presionado.
   * Activa un temporizador de 2 segundos y un intervalo para la barra de progreso.
   */
  const startHold = () => {
    if (isActivated) return;
    
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
      onActivate();
      setIsActivated(true);
      setIsHolding(false); // Dejar de mostrar la barra de progreso
      clearTimers();
      // Espera 2s antes de volver al estado inicial para que el usuario vea la confirmación
      setTimeout(() => reset(), 2000); 
    }, 2000);
  };

  /**
   * Cancela el proceso si el usuario suelta el botón antes de tiempo.
   */
  const cancelHold = () => {
    if (isActivated) return;
    reset();
  };

  /**
   * Hook de efecto para limpiar los temporizadores cuando el componente se desmonta,
   * para evitar fugas de memoria.
   */
  useEffect(() => {
    return () => clearTimers();
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
          disabled={isActivated}
          className="w-72 h-72 rounded-full bg-gradient-to-br from-red-500 via-red-600 to-red-800 text-white flex-col animate-pulse-emergency shadow-2xl shadow-red-500/20 active:scale-95 transition-all duration-300 disabled:opacity-80 disabled:cursor-not-allowed"
        >
          <div className="text-center relative z-10">
            {isActivated ? (
                <Check className="w-20 h-20 mx-auto mb-3 animate-fade-in" />
            ) : (
                <ShieldAlert className="w-20 h-20 mx-auto mb-3" />
            )}
            <div className="text-3xl font-black mb-1">{isActivated ? "ENVIADO" : "EMERGENCIA"}</div>
            <div className="text-lg font-medium opacity-90">{isActivated ? "" : "PRESIONAR"}</div>
          </div>
        </Button>
        <div className="absolute inset-0 rounded-full border-4 border-red-400/30 animate-ping -z-10"></div>
      </div>
      
      <p className="text-white text-xl font-medium mb-6">
        {isActivated
          ? isOnline ? "La ayuda está en camino" : "Alerta guardada, se enviará al reconectar"
          : "Mantén presionado por 2 segundos"}
      </p>

      <div className="w-72 mx-auto h-8">
        {isHolding && !isActivated && (
          <div className="animate-fade-in">
            <Progress value={progress} className="h-3 bg-white/20 [&>div]:bg-white" />
            <p className="text-white/80 text-sm mt-2 text-center">Activando emergencia...</p>
          </div>
        )}
      </div>
    </div>
  );
}
