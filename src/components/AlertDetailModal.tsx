import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from "@radix-ui/react-dialog";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useAuth } from "@/app/layout";
import { AlertData, UnitData, StationData, UserRole } from "@/lib/types";
import { firestore } from "@/lib/firebase";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@radix-ui/react-select";

interface AlertDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  alert: AlertData;
  stations: StationData[];
  onCenterMap: (lat: number, lng: number) => void;
  onUpdate: () => void;
  userRole: UserRole | null;
}

export default function AlertDetailModal({
  isOpen,
  onClose,
  alert,
  stations,
  onCenterMap,
  onUpdate,
  userRole,
}: AlertDetailModalProps) {
  const { stationId: operatorStationId } = useAuth(); // Renombrar para evitar conflicto
  const [units, setUnits] = useState<UnitData[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(alert.assignedStationId || null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(alert.assignedUnitId || null);
  const [loading, setLoading] = useState(false);

  // Cargar unidades cuando la estación seleccionada cambie
  useEffect(() => {
    if (!isOpen || !selectedStationId) {
      setUnits([]);
      setSelectedUnitId(null);
      return;
    }

    const fetchUnits = async () => {
      setLoading(true);
      try {
        const unitsRef = collection(firestore, "stations", selectedStationId, "unidades");
        const q = query(unitsRef, where("stationId", "==", selectedStationId));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as UnitData));
        setUnits(data);
        // Si la unidad asignada a la alerta no está en la nueva lista de unidades, deseleccionarla
        if (alert.assignedUnitId && !data.some(u => u.id === alert.assignedUnitId)) {
          setSelectedUnitId(null);
        }
      } catch (e) {
        console.error("Error fetching units:", e);
        window.alert("No se pudieron verificar las unidades disponibles");
      } finally {
        setLoading(false);
      }
    };
    fetchUnits();
  }, [isOpen, selectedStationId, alert.assignedUnitId]);

  // Establecer la estación por defecto del operador si no hay una asignada a la alerta
  useEffect(() => {
    if (userRole === 'operator' && operatorStationId && !alert.assignedStationId) {
      setSelectedStationId(operatorStationId);
    }
  }, [userRole, operatorStationId, alert.assignedStationId]);

  const handleAssign = async () => {
    if (!selectedStationId || !selectedUnitId) return;
    const station = stations.find((s) => s.id === selectedStationId);
    const unit = units.find((u) => u.id === selectedUnitId);
    if (!station || !unit) return;

    try {
      const alertRef = doc(firestore, "alerts", alert.id);
      await updateDoc(alertRef, {
        assignedStationId: station.id,
        assignedStationName: station.name,
        assignedUnitId: unit.id,
        assignedUnitName: unit.nombre,
        status: 'assigned' // Cambiar estado a 'assigned' al asignar
      });
      onUpdate();
      onClose();
    } catch (e) {
      console.error("Error assigning unit:", e);
      window.alert("Error al asignar la unidad");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogTitle>Detalle de la alerta</DialogTitle>
        <DialogDescription>
          ID: {alert.id}
          <br />
          Ubicación: {alert.location.latitude.toFixed(4)}, {alert.location.longitude.toFixed(4)}
        </DialogDescription>
        <div className="mt-4">
          <p className="mb-2">Estado: {alert.status}</p>
          <p className="mb-2">Tipo: {alert.type ?? "N/A"}</p>
          <p className="mb-2">Asignado a estación: {alert.assignedStationName ?? "Sin asignar"}</p>
          <p className="mb-2">Unidad asignada: {alert.assignedUnitName ?? "Sin asignar"}</p>
        </div>

        {userRole === 'operator' && (
          <div className="mt-4 p-4 bg-red-50/50 border border-red-200 rounded-lg">
            <h3 className="text-lg font-bold text-red-700 mb-4 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M8.25 10.875a2.25 2.25 0 1 1 4.5 0 2.25 2.25 0 0 1-4.5 0Z" />
                <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 6a.75.75 0 0 0-1.5 0v.75c0 .414.336.75.75.75h.75V6ZM11.25 16.5a.75.75 0 0 0 1.5 0v-3.75a.75.75 0 0 0-.75-.75h-.75v4.5Z" clipRule="evenodd" />
              </svg>
              Asignar Unidad
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="select-station" className="block text-sm font-medium text-gray-700 mb-1">1. Seleccionar Estación</label>
                <Select value={selectedStationId ?? ""} onValueChange={setSelectedStationId} disabled={loading || userRole !== 'operator'}>
                  <SelectTrigger id="select-station" className="w-full">
                    <SelectValue placeholder="Selecciona una estación" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="select-unit" className="block text-sm font-medium text-gray-700 mb-1">2. Seleccionar Unidad</label>
                <Select value={selectedUnitId ?? ""} onValueChange={setSelectedUnitId} disabled={loading || !selectedStationId || units.length === 0 || userRole !== 'operator'}>
                  <SelectTrigger id="select-unit" className="w-full">
                    <SelectValue placeholder="Seleccionar unidad..." />
                  </SelectTrigger>
                  <SelectContent>
                    {units.length === 0 ? (
                      <SelectItem value="no-units" disabled>
                        No hay unidades disponibles
                      </SelectItem>
                    ) : (
                      units.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nombre} ({u.tipo})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={handleAssign} disabled={!selectedStationId || !selectedUnitId || loading || userRole !== 'operator'}>
                Asignar y Notificar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
