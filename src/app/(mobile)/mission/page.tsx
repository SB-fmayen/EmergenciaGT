
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/layout';
import { firestore } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, Timestamp, getDocs } from 'firebase/firestore';
import type { AlertData, MedicalData } from '@/lib/types';
import { Loader2, LogOut, Check, Hospital, Siren, Stethoscope, Truck, UserCheck, Wind, MapPin, User, FileText, HeartPulse, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { MobileAppContainer } from '@/components/MobileAppContainer';
import { Separator } from '@/components/ui/separator';

const MissionMap = dynamic(() => import('@/components/admin/AlertsMap'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-800 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
});

interface EnrichedMissionAlert extends AlertData {
    userInfo?: MedicalData;
}

export default function MissionPage() {
    const { user, userRole, unitId, loading: authLoading } = useAuth();
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

    const fetchMission = useCallback(async () => {
        if (!user || !unitId) {
            setLoading(false);
            return;
        }
        setLoading(true);

        const alertsRef = collection(firestore, "alerts");
        const missionQuery = query(
            alertsRef,
            where("assignedUnitId", "==", unitId),
            where("status", "in", ["assigned", "en_route", "on_scene", "attending", "transporting"])
        );
        
        try {
            const snapshot = await getDocs(missionQuery);
            if (snapshot.docs.length > 0) {
                const activeMissionDoc = snapshot.docs[0];
                const missionData = { id: activeMissionDoc.id, ...activeMissionDoc.data() } as AlertData;
                await fetchMissionDetails(missionData);
            } else {
                setMission(null);
            }
        } catch (error) {
            console.error("Error fetching mission on refresh:", error);
            toast({ title: "Error de Conexión", description: "No se pudo sincronizar con la central.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }, [user, unitId, fetchMissionDetails, toast]);


    useEffect(() => {
        if (authLoading) return;
        
        if (!user) {
            // Layout handles redirection
            return;
        }
        
        if (userRole !== 'unit') {
            // Layout handles redirection
            return;
        }
        
        if (!unitId) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, userRole, unitId, fetchMissionDetails, toast, authLoading, router]);
    
    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({ title: "Sesión cerrada" });
            router.push('/auth');
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
    
    const handleRefresh = () => {
        fetchMission();
    }

    if (authLoading || (loading && !mission)) {
        return (
            <MobileAppContainer className="bg-slate-900 justify-center items-center">
                <Loader2 className="w-12 h-12 text-white animate-spin" />
                <p className="mt-4 text-lg text-slate-300">Buscando misiones asignadas...</p>
            </MobileAppContainer>
        );
    }
    
    return (
        <MobileAppContainer className="bg-slate-900 text-white">
             <header className="bg-slate-800 p-4 flex justify-between items-center border-b border-slate-700 flex-shrink-0">
                <div>
                    <h1 className="text-lg font-bold">Panel de Misión</h1>
                    <p className="text-sm text-slate-400">{mission ? `Unidad: ${mission.assignedUnitName}` : 'Sin misión activa'}</p>
                </div>
                <div className="flex items-center gap-1">
                    <Button onClick={handleRefresh} variant="ghost" size="icon" className="text-slate-300 hover:bg-slate-700/50 hover:text-white" disabled={loading}>
                        <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                    </Button>
                    <Button onClick={handleLogout} variant="ghost" size="icon" className="text-red-400 hover:bg-red-500/10 hover:text-red-400">
                        <LogOut className="h-5 w-5"/>
                    </Button>
                </div>
            </header>

            {mission ? (
                <div className="flex-1 flex flex-col">
                    <div className="h-1/3 flex-shrink-0 border-b-4 border-red-500">
                        <MissionMap alerts={[mission]} selectedAlert={mission} theme="dark" />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        <div className="bg-slate-800/50 p-4 rounded-xl space-y-3">
                            <h2 className="text-red-500 font-bold text-lg">Misión Activa: {mission.type}</h2>
                            <p className="text-slate-300 flex items-center gap-2"><MapPin className="h-4 w-4"/> {mission.location.latitude.toFixed(5)}, {mission.location.longitude.toFixed(5)}</p>
                            <Button asChild variant="outline" className="w-full bg-blue-500/10 border-blue-400/50 text-blue-300 hover:bg-blue-500/20 hover:text-blue-300">
                                <a href={`https://www.google.com/maps?q=${mission.location.latitude},${mission.location.longitude}`} target="_blank" rel="noopener noreferrer">
                                    Navegar con Google Maps
                                </a>
                            </Button>
                        </div>
                        
                        <div className="bg-slate-800/50 p-4 rounded-xl space-y-2">
                             <h3 className="font-bold text-lg flex items-center gap-2 text-slate-300"><HeartPulse/> Info. Paciente</h3>
                             <Separator className="bg-slate-700"/>
                             <p><strong>Nombre:</strong> {mission.userInfo?.fullName || 'No disponible'}</p>
                             <p><strong>Edad:</strong> {mission.userInfo?.age || 'No disponible'}</p>
                             <p><strong>Condiciones:</strong> {mission.userInfo?.conditions?.join(', ') || 'Ninguna'}</p>
                             <p><strong>Notas:</strong> {mission.userInfo?.additionalNotes || 'Ninguna'}</p>
                        </div>

                         <div className="bg-slate-800/50 p-4 rounded-xl space-y-3">
                             <h3 className="font-bold text-lg flex items-center gap-2 text-slate-300"><FileText/> Actualizar Estado</h3>
                             <Separator className="bg-slate-700"/>
                             <div className="grid grid-cols-2 gap-2">
                                <Button onClick={() => handleUpdateStatus('en_route')} disabled={updatingStatus || mission.status === 'en_route'} className="bg-yellow-600 hover:bg-yellow-700 h-auto py-2.5">
                                    {mission.status === 'en_route' ? <Check className="mr-2"/> : <Truck className="mr-2"/>} En Ruta
                                </Button>
                                <Button onClick={() => handleUpdateStatus('on_scene')} disabled={updatingStatus || mission.status === 'on_scene'} className="bg-orange-600 hover:bg-orange-700 h-auto py-2.5">
                                    {mission.status === 'on_scene' ? <Check className="mr-2"/> : <Siren className="mr-2"/>} En Lugar
                                </Button>
                                <Button onClick={() => handleUpdateStatus('attending')} disabled={updatingStatus || mission.status === 'attending'} className="bg-fuchsia-600 hover:bg-fuchsia-700 h-auto py-2.5">
                                    {mission.status === 'attending' ? <Check className="mr-2"/> : <Stethoscope className="mr-2"/>} Atendiendo
                                </Button>
                                <Button onClick={() => handleUpdateStatus('transporting')} disabled={updatingStatus || mission.status === 'transporting'} className="bg-sky-600 hover:bg-sky-700 h-auto py-2.5">
                                    {mission.status === 'transporting' ? <Check className="mr-2"/> : <Hospital className="mr-2"/>} Trasladando
                                </Button>
                             </div>
                             <Separator className="bg-slate-700"/>
                             <div className="grid grid-cols-2 gap-2">
                                <Button onClick={() => handleUpdateStatus('patient_attended')} disabled={updatingStatus} className="bg-teal-600 hover:bg-teal-700 h-auto py-2.5 text-xs">
                                     <UserCheck className="mr-2"/> Atendido en Lugar
                                </Button>
                                <Button onClick={() => handleUpdateStatus('resolved')} disabled={updatingStatus} className="bg-green-600 hover:bg-green-700 h-auto py-2.5 text-xs">
                                     <Check className="mr-2"/> Finalizada en Hospital
                                </Button>
                             </div>
                        </div>

                    </div>
                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
                    <Wind className="mx-auto h-16 w-16 text-slate-500 mb-4" />
                    <h2 className="text-2xl font-bold">En Espera de Asignación</h2>
                    <p className="text-slate-400 mt-2">La pantalla se actualizará automáticamente al recibir una nueva misión.</p>
                </div>
            )}
        </MobileAppContainer>
    );
}
