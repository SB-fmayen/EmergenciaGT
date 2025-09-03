
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/(mobile)/layout';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, Timestamp } from 'firebase/firestore';
import type { AlertData, MedicalData, UserRole } from '@/lib/types';
import { Loader2, LogOut, Check, Hospital, Siren, Stethoscope, Truck, UserCheck, Wind, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const MissionMap = dynamic(() => import('@/components/admin/AlertsMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
});

interface EnrichedMissionAlert extends AlertData {
    userInfo?: MedicalData;
}

export default function MissionPage() {
    const { user, unitId } = useAuth(); // Usamos unitId del hook
    const { toast } = useToast();
    const router = useRouter();

    const [mission, setMission] = useState<EnrichedMissionAlert | null>(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    const fetchMissionDetails = useCallback(async (alertData: AlertData) => {
        let userInfo: MedicalData | undefined = undefined;
        if (alertData.userId && !alertData.isAnonymous) {
            const userDocRef = doc(firestore, "medicalInfo", alertData.userId);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                userInfo = userDocSnap.data() as MedicalData;
            }
        }
        setMission({ ...alertData, userInfo });
    }, []);

    useEffect(() => {
        if (!user || !unitId) { // Esperamos a que unitId esté disponible
            setLoading(false);
            return;
        }

        const alertsRef = collection(firestore, "alerts");
        const missionQuery = query(
            alertsRef,
            where("assignedUnitId", "==", unitId),
            where("status", "in", ["assigned", "en_route", "on_scene", "attending", "transporting"])
        );

        const unsubscribe = onSnapshot(missionQuery, (snapshot) => {
            setLoading(false);
            if (snapshot.docs.length > 0) {
                const activeMissionDoc = snapshot.docs[0];
                const missionData = { id: activeMissionDoc.id, ...activeMissionDoc.data() } as AlertData;
                fetchMissionDetails(missionData);
            } else {
                setMission(null);
            }
        }, (error) => {
            console.error("Error fetching mission:", error);
            toast({ title: "Error de Conexión", description: "No se pudo sincronizar con la central.", variant: "destructive" });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, unitId, fetchMissionDetails, toast]);
    
    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({ title: "Sesión cerrada" });
            router.push('/login');
        } catch (error) {
            toast({ title: "Error al cerrar sesión", variant: "destructive" });
        }
    };
    
    const handleUpdateStatus = async (newStatus: AlertData['status']) => {
        if (!mission) return;
        setUpdatingStatus(true);
        try {
            const alertRef = doc(firestore, "alerts", mission.id);
            await updateDoc(alertRef, { status: newStatus });
            toast({ title: "Estado Actualizado", description: `Estado cambiado a: ${newStatus}` });
        } catch (error) {
            toast({ title: "Error", description: "No se pudo actualizar el estado.", variant: "destructive" });
        } finally {
            setUpdatingStatus(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-gray-900 min-h-screen flex flex-col justify-center items-center text-white">
                <Loader2 className="w-12 h-12 animate-spin" />
                <p className="mt-4 text-lg">Buscando misiones asignadas...</p>
            </div>
        );
    }
    
    function StatusButton({ newStatus, currentStatus, children, icon, className = '' }: { newStatus: AlertData['status'], currentStatus: AlertData['status'], children: React.ReactNode, icon: React.ReactNode, className?: string}) {
      return (
        <Button 
            className={`h-auto py-3 text-base flex-1 ${className}`}
            onClick={() => handleUpdateStatus(newStatus)}
            disabled={updatingStatus || newStatus === currentStatus}
        >
            {newStatus === currentStatus ? <Check className="mr-2 h-5 w-5"/> : icon}
            {children}
        </Button>
      );
    }

    return (
        <div className="bg-slate-900 text-white min-h-screen">
            <header className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700">
                <div>
                    <h1 className="text-xl font-bold">Panel de Misión</h1>
                    <p className="text-sm text-slate-400">{mission ? `Unidad: ${mission.assignedUnitName}` : 'Sin misión activa'}</p>
                </div>
                <Button onClick={handleLogout} variant="destructive" size="sm">
                    <LogOut className="mr-2 h-4 w-4"/> Salir
                </Button>
            </header>

            <main className="p-4">
                {mission ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Mission Details */}
                        <div className="space-y-4">
                            <Card className="bg-slate-800 border-slate-700">
                                <CardHeader>
                                    <CardTitle className="text-red-500">¡Misión Activa!</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <p><strong>Tipo de Alerta:</strong> {mission.type}</p>
                                    <p><strong>Ubicación:</strong></p>
                                    <Button asChild variant="outline">
                                        <a href={`https://www.google.com/maps?q=${mission.location.latitude},${mission.location.longitude}`} target="_blank" rel="noopener noreferrer">
                                            <MapPin className="mr-2"/> Abrir en Google Maps
                                        </a>
                                    </Button>
                                </CardContent>
                            </Card>

                             <Card className="bg-slate-800 border-slate-700">
                                <CardHeader>
                                    <CardTitle className="text-lg">Información del Paciente</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <p><strong>Nombre:</strong> {mission.userInfo?.fullName || 'No disponible'}</p>
                                    <p><strong>Edad:</strong> {mission.userInfo?.age || 'No disponible'}</p>
                                    <p><strong>Condiciones:</strong> {mission.userInfo?.conditions?.join(', ') || 'Ninguna'}</p>
                                    <p><strong>Notas:</strong> {mission.userInfo?.additionalNotes || 'Ninguna'}</p>
                                </CardContent>
                            </Card>

                             <Card className="bg-slate-800 border-slate-700">
                                <CardHeader>
                                    <CardTitle className="text-lg">Actualizar Estado</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    <div className="flex gap-2">
                                        <StatusButton newStatus="en_route" currentStatus={mission.status} icon={<Truck className="mr-2"/>} className="bg-yellow-600 hover:bg-yellow-700">En Ruta</StatusButton>
                                        <StatusButton newStatus="on_scene" currentStatus={mission.status} icon={<Siren className="mr-2"/>} className="bg-orange-600 hover:bg-orange-700">En el Lugar</StatusButton>
                                    </div>
                                     <div className="flex gap-2">
                                        <StatusButton newStatus="attending" currentStatus={mission.status} icon={<Stethoscope className="mr-2"/>} className="bg-fuchsia-600 hover:bg-fuchsia-700">Atendiendo</StatusButton>
                                        <StatusButton newStatus="transporting" currentStatus={mission.status} icon={<Hospital className="mr-2"/>} className="bg-sky-600 hover:bg-sky-700">Trasladando</StatusButton>
                                    </div>
                                    <hr className="border-slate-700 my-3"/>
                                     <div className="flex gap-2">
                                        <StatusButton newStatus="patient_attended" currentStatus={mission.status} icon={<UserCheck className="mr-2"/>} className="bg-teal-600 hover:bg-teal-700">Atendido en Lugar</StatusButton>
                                        <StatusButton newStatus="resolved" currentStatus={mission.status} icon={<Check className="mr-2"/>} className="bg-green-600 hover:bg-green-700">Finalizada en Hospital</StatusButton>
                                    </div>
                                </CardContent>
                            </Card>

                        </div>

                        {/* Map */}
                        <div className="h-[80vh] rounded-lg overflow-hidden border border-slate-700">
                           <MissionMap alerts={[mission]} selectedAlert={mission} theme="dark" />
                        </div>

                    </div>
                ) : (
                    <div className="text-center py-20">
                        <Wind className="mx-auto h-16 w-16 text-slate-500 mb-4" />
                        <h2 className="text-2xl font-bold">En Espera de Asignación</h2>
                        <p className="text-slate-400">La pantalla se actualizará automáticamente al recibir una nueva misión.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
