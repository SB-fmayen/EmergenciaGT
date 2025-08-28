
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { LogOut, RefreshCw, Bell, Zap, CheckCircle, Clock, MapPin, Building } from "lucide-react";
import dynamic from 'next/dynamic';

const AlertsMap = dynamic(() => import('@/components/admin/AlertsMap'), { 
  ssr: false,
  loading: () => <p className="text-center text-gray-500">Cargando mapa...</p>
});

const mockAlerts = [
    {
        id: 'EMG-001',
        type: 'Accidente de Tránsito',
        description: 'Colisión múltiple en Zona 10',
        status: 'Activa',
        severity: 'Crítica',
        time: '11:27 p. m.',
        location: '14.6349, -90.5069',
        station: 'Estación Central',
        statusClass: 'status-active',
        severityClass: 'severity-critical'
    },
    {
        id: 'EMG-002',
        type: 'Emergencia Médica',
        description: 'Dolor en el pecho, dificultad respiratoria',
        status: 'En Curso',
        severity: 'Alta',
        time: '11:22 p. m.',
        location: '14.6211, -90.5269',
        station: 'Estación Norte',
        statusClass: 'status-in-progress',
        severityClass: 'severity-high'
    },
    {
        id: 'EMG-003',
        type: 'Incendio',
        description: 'Incendio en edificio residencial',
        status: 'Activa',
        severity: 'Crítica',
        time: '11:17 p. m.',
        location: '14.6505, -90.5138',
        station: 'Estación Este',
        statusClass: 'status-active',
        severityClass: 'severity-critical'
    }
];

export default function AdminDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            toast({ title: "Sesión cerrada" });
            router.push('/login');
        } catch (error) {
            toast({ title: "Error al cerrar sesión", variant: "destructive" });
        }
    };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-900">
      <header className="bg-red-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                        <span className="text-red-600 font-bold text-xl">🚨</span>
                    </div>
                    <h1 className="text-2xl font-bold">Consola de Emergencias - EmergenciaGT</h1>
                </div>
                <div className="flex items-center space-x-4">
                     <div className="text-right">
                        <div className="font-semibold">María González</div>
                        <div className="text-sm text-red-200">Administrador</div>
                    </div>
                     <Button onClick={handleLogout} variant="destructive" size="sm" className="bg-red-700 hover:bg-red-800">
                        <LogOut className="mr-2 h-4 w-4"/>
                        Cerrar Sesión
                    </Button>
                </div>
            </div>
        </div>
      </header>
      
      <main className="flex-1 p-6 container mx-auto">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Alertas Activas</CardTitle>
                    <Bell className="h-5 w-5 text-red-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-red-600">2</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">En Curso</CardTitle>
                    <Zap className="h-5 w-5 text-yellow-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-yellow-600">2</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Finalizadas</CardTitle>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-green-600">1</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-gray-600">Tiempo Promedio</CardTitle>
                    <Clock className="h-5 w-5 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-blue-600">12m</div>
                </CardContent>
            </Card>
        </div>
        
        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Alerts Panel */}
            <div className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800">Alertas de Emergencia</h2>
                        <Button className="bg-blue-600 text-white hover:bg-blue-700">
                            <RefreshCw className="mr-2 h-4 w-4"/>
                            Actualizar
                        </Button>
                    </div>
                     <div className="flex space-x-4">
                        <Input type="text" placeholder="Buscar por ID o tipo..." className="flex-1"/>
                        <Select>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Todos los estados" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos los estados</SelectItem>
                                <SelectItem value="active">Activas</SelectItem>
                                <SelectItem value="in-progress">En Curso</SelectItem>
                                <SelectItem value="completed">Finalizadas</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="max-h-[60vh] overflow-y-auto">
                    {mockAlerts.map((alert) => (
                        <div key={alert.id} className={`p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors ${alert.severityClass} ${alert.statusClass}`}>
                             <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-gray-800">{alert.id}</span>
                                    <span className={`px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-800`}>{alert.status}</span>
                                    <span className={`px-2 py-0.5 text-xs rounded-full bg-orange-100 text-orange-800`}>{alert.severity}</span>
                                </div>
                                <span className="text-sm text-gray-500">{alert.time}</span>
                            </div>
                            <div className="mb-3">
                                <p className="font-medium text-gray-800">{alert.type}</p>
                                <p className="text-sm text-gray-600">{alert.description}</p>
                            </div>
                             <div className="flex items-center justify-between text-sm">
                                <div className="text-gray-500 flex items-center gap-2">
                                    <MapPin className="h-4 w-4"/>
                                    <span>{alert.location}</span>
                                </div>
                                <div className="text-gray-600 flex items-center gap-2">
                                     <Building className="h-4 w-4"/>
                                    <span>{alert.station}</span>
                                </div>
                                <Button variant="link" className="p-0 h-auto text-blue-600">Ver Detalle</Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Map Panel */}
             <div className="bg-white rounded-lg shadow-md border border-gray-200 flex flex-col">
                 <div className="p-6 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-800">Mapa de Incidentes</h2>
                    <p className="text-gray-600 text-sm">Guatemala - Tiempo Real</p>
                </div>
                <div className="flex-1 p-4">
                    <div className="w-full h-[70vh] rounded-lg overflow-hidden">
                        <AlertsMap />
                    </div>
                </div>
            </div>
        </div>

      </main>
    </div>
  );
}

    