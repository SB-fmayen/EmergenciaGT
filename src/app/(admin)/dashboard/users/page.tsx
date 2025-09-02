
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, RefreshCw, ShieldCheck, HardHat, Ambulance } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { getUsers, updateUser, type UserRecordWithRole } from "./actions";
import { Badge } from "@/components/ui/badge";
import { auth, firestore } from "@/lib/firebase";
import { collection, onSnapshot, query } from "firebase/firestore";
import type { StationData, UserRole } from "@/lib/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


export default function UsersPage() {
  const [users, setUsers] = useState<UserRecordWithRole[]>([]);
  const [stations, setStations] = useState<StationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const idToken = await auth.currentUser?.getIdToken();
    const result = await getUsers(idToken);
    
    if (result.success && result.users) {
      setUsers(result.users);
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        fetchUsers();
      } else {
        setLoading(false); // No user, stop loading
      }
    });

    // Fetch stations for the dropdown
    const stationsRef = collection(firestore, "stations");
    const q = query(stationsRef);
    const unsubscribeStations = onSnapshot(q, (snapshot) => {
        const stationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as StationData[];
        setStations(stationsData);
    });

    return () => {
      unsubscribe();
      unsubscribeStations();
    };
  }, [fetchUsers]);


  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    setUpdatingId(uid);
    const idToken = await auth.currentUser?.getIdToken();
    const result = await updateUser(uid, idToken, { role: newRole });

    if (result.success) {
      toast({ title: "Éxito", description: `Rol de usuario actualizado a ${newRole}.` });
      if (auth.currentUser?.uid === uid) {
          toast({ title: "Acción Requerida", description: "Cierra y vuelve a iniciar sesión para que tus nuevos permisos tomen efecto.", duration: 5000})
      }
      fetchUsers(); // Refresh the list
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setUpdatingId(null);
  };

  const handleStationChange = async (uid: string, newStationId: string | null) => {
    setUpdatingId(uid);
    const idToken = await auth.currentUser?.getIdToken();
    const result = await updateUser(uid, idToken, { stationId: newStationId });

    if(result.success) {
        toast({ title: "Éxito", description: "Estación del usuario actualizada."});
        fetchUsers(); // Refresh list
    } else {
        toast({ title: "Error", description: result.error, variant: "destructive"});
    }
    setUpdatingId(null);
  }

  const getRoleBadge = (role: UserRole) => {
      switch(role) {
          case 'admin':
              return <Badge className="bg-green-600 hover:bg-green-700"><ShieldCheck className="mr-1 h-3 w-3"/>Admin</Badge>;
          case 'operator':
              return <Badge variant="secondary"><HardHat className="mr-1 h-3 w-3"/>Operador</Badge>
          case 'unit':
              return <Badge className="bg-blue-600 hover:bg-blue-700"><Ambulance className="mr-1 h-3 w-3"/>Unidad</Badge>
          default:
              return <Badge variant="outline">Desconocido</Badge>
      }
  }

  const isStationAssignmentDisabled = (role: UserRole) => {
      return role === 'admin';
  }

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
              <h1 className="text-2xl font-bold text-foreground">Gestión de Usuarios</h1>
            </div>
            <Button onClick={fetchUsers} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 p-6 container mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Operadores y Administradores</CardTitle>
            <CardDescription>
                Asigna roles y estaciones a los usuarios. Los operadores y unidades solo verán las alertas de su estación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && users.length === 0 ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Correo Electrónico</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estación Asignada</TableHead>
                    <TableHead>Último Inicio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? users.map((user) => (
                    <TableRow key={user.uid} className={updatingId === user.uid ? "opacity-50" : ""}>
                      <TableCell className="font-medium">{user.email || 'N/A'}</TableCell>
                      <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user.uid, value as UserRole)}
                            disabled={updatingId === user.uid || auth.currentUser?.uid === user.uid}
                          >
                            <SelectTrigger className="w-[150px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">
                                    <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-500"/>Admin</div>
                                </SelectItem>
                                <SelectItem value="operator">
                                    <div className="flex items-center gap-2"><HardHat className="h-4 w-4"/>Operador</div>
                                </SelectItem>
                                 <SelectItem value="unit">
                                    <div className="flex items-center gap-2"><Ambulance className="h-4 w-4 text-blue-500"/>Unidad</div>
                                </SelectItem>
                            </SelectContent>
                          </Select>
                      </TableCell>
                      <TableCell>
                           <Select 
                            value={user.stationId || ''} 
                            onValueChange={(value) => handleStationChange(user.uid, value === 'none' ? null : value)}
                            disabled={updatingId === user.uid || isStationAssignmentDisabled(user.role)}
                           >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Asignar estación..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">
                                    <span className="text-muted-foreground">Ninguna</span>
                                </SelectItem>
                                {stations.map(station => (
                                    <SelectItem key={station.id} value={station.id}>{station.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleString('es-GT') : 'Nunca'}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground">
                        No se encontraron usuarios.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
