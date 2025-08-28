
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Loader2, RefreshCw, ShieldCheck, ShieldOff } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { getUsers, setUserRole, type UserRecordWithRole } from "./actions";
import { Badge } from "@/components/ui/badge";

export default function UsersPage() {
  const [users, setUsers] = useState<UserRecordWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const result = await getUsers();
    if (result.success && result.users) {
      setUsers(result.users);
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (uid: string, newRole: 'admin' | 'operator') => {
    setUpdatingId(uid);
    const result = await setUserRole(uid, newRole);
    if (result.success) {
      toast({ title: "Éxito", description: `Rol de usuario actualizado a ${newRole}.` });
      fetchUsers(); // Refresh the list after updating
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" });
    }
    setUpdatingId(null);
  };

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
            <CardDescription>Lista de todos los usuarios registrados en el panel de emergencias.</CardDescription>
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
                    <TableHead>Rol Actual</TableHead>
                    <TableHead>Último Inicio de Sesión</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? users.map((user) => (
                    <TableRow key={user.uid}>
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'} className={user.role === 'admin' ? 'bg-green-600' : ''}>
                          {user.role === 'admin' ? <ShieldCheck className="mr-1 h-3 w-3"/> : null}
                          <span className="capitalize">{user.role}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.lastSignInTime ? new Date(user.lastSignInTime).toLocaleString('es-GT') : 'Nunca'}
                      </TableCell>
                      <TableCell className="text-right">
                        {updatingId === user.uid ? (
                          <Button size="sm" disabled>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Actualizando...
                          </Button>
                        ) : user.role === 'admin' ? (
                          <Button size="sm" variant="secondary" onClick={() => handleRoleChange(user.uid, 'operator')}>
                            <ShieldOff className="mr-2 h-4 w-4" />
                            Quitar Admin
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleRoleChange(user.uid, 'admin')}>
                            <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />
                            Hacer Admin
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No se encontraron usuarios o no se pudieron cargar.
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

    