
"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Clock, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';


const alertsByDayData = [
  { name: 'Lunes', alertas: 12 },
  { name: 'Martes', alertas: 19 },
  { name: 'Miércoles', alertas: 8 },
  { name: 'Jueves', alertas: 15 },
  { name: 'Viernes', alertas: 25 },
  { name: 'Sábado', alertas: 31 },
  { name: 'Domingo', alertas: 22 },
];

const alertsByTypeData = [
  { type: 'Accidente', count: 45, fill: 'hsl(var(--chart-1))' },
  { type: 'Emerg. Médica', count: 32, fill: 'hsl(var(--chart-2))' },
  { type: 'Incendio', count: 12, fill: 'hsl(var(--chart-3))' },
  { type: 'Otro', count: 18, fill: 'hsl(var(--chart-4))' },
];


export default function AnalyticsPage() {

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
             <header className="bg-card border-b border-border shadow-md">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <Link href="/dashboard/admin">
                               <Button variant="outline" size="icon">
                                 <ArrowLeft className="h-4 w-4" />
                               </Button>
                            </Link>
                            <h1 className="text-2xl font-bold text-foreground">Dashboard de Analíticas</h1>
                        </div>
                        <Select defaultValue="last_7_days">
                             <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Seleccionar rango" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="today">Hoy</SelectItem>
                                <SelectItem value="last_7_days">Últimos 7 días</SelectItem>
                                <SelectItem value="last_30_days">Últimos 30 días</SelectItem>
                                <SelectItem value="this_month">Este mes</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </header>

            <main className="flex-1 p-6 container mx-auto">
                {/* KPIs */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Alertas</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">127</div>
                            <p className="text-xs text-muted-foreground">+15% vs mes anterior</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Tiempo Prom. de Respuesta</CardTitle>
                            <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">11.2 min</div>
                            <p className="text-xs text-muted-foreground">-5% vs mes anterior</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Tipo de Alerta Más Común</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">Accidentes</div>
                            <p className="text-xs text-muted-foreground">45 de 127 alertas</p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Nuevos Usuarios</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+214</div>
                             <p className="text-xs text-muted-foreground">En los últimos 30 días</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                     <Card>
                        <CardHeader>
                            <CardTitle>Actividad de Alertas (Últimos 7 días)</CardTitle>
                             <CardDescription>Volumen de emergencias reportadas por día.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={alertsByDayData}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <Line type="monotone" dataKey="alertas" stroke="hsl(var(--primary))" activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle>Distribución por Tipo de Alerta</CardTitle>
                             <CardDescription>Clasificación de todas las emergencias reportadas.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={alertsByTypeData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis type="category" dataKey="type" width={100} />
                                    <Tooltip cursor={{fill: 'hsl(var(--muted))'}} />
                                    <Legend />
                                    <Bar dataKey="count" name="Número de Alertas" fill="hsl(var(--primary))" background={{ fill: 'hsl(var(--background))' }} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}

