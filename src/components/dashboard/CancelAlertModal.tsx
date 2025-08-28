
"use client"

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CancelAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

const cancellationReasons = [
    { id: "reason-1", label: "El herido se dirige al hospital" },
    { id: "reason-2", label: "Ya no será necesaria la unidad" },
]

export function CancelAlertModal({ isOpen, onClose, onConfirm }: CancelAlertModalProps) {
    const [selectedReason, setSelectedReason] = useState<string | null>(null);
    const [isCancelling, setIsCancelling] = useState(false);
    const { toast } = useToast();

    // Reset state when dialog opens
    useEffect(() => {
        if (isOpen) {
            setSelectedReason(null);
            setIsCancelling(false);
        }
    }, [isOpen]);

    const handleConfirm = async () => {
        if (!selectedReason) {
            toast({
                title: "Selecciona un motivo",
                description: "Debes elegir un motivo para cancelar la alerta.",
                variant: "destructive"
            });
            return;
        }

        setIsCancelling(true);
        await onConfirm(selectedReason);
        // El estado de cancelación se resetea en el useEffect o al cerrar
    }

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
        }
    }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-slate-900 border-yellow-500 text-white max-w-sm w-full p-0">
        <DialogHeader className="p-6">
            <DialogTitle className="text-xl font-bold text-yellow-400">Cancelar Alerta</DialogTitle>
            <DialogDescription className="text-slate-400">
                Por favor, selecciona el motivo de la cancelación. Esta acción no se puede deshacer.
            </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6">
            <RadioGroup onValueChange={setSelectedReason} value={selectedReason || ''} className="space-y-3">
                {cancellationReasons.map(reason => (
                    <div key={reason.id} className="flex items-center space-x-3 p-4 bg-slate-800 rounded-lg">
                        <RadioGroupItem value={reason.label} id={reason.id} className="text-yellow-400 border-slate-500" />
                        <Label htmlFor={reason.id} className="text-slate-200 text-base">
                            {reason.label}
                        </Label>
                    </div>
                ))}
            </RadioGroup>
        </div>
        <DialogFooter className="p-4 bg-slate-800/50 flex-row gap-2">
            <Button onClick={onClose} variant="outline" className="w-full border-slate-500 text-slate-300 hover:bg-slate-700 hover:text-white" disabled={isCancelling}>
                Volver
            </Button>
            <Button onClick={handleConfirm} className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 font-bold" disabled={isCancelling || !selectedReason}>
                {isCancelling ? <Loader2 className="animate-spin" /> : "Confirmar Cancelación"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
