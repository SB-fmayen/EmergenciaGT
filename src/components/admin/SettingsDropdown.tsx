
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, User, Sun, Moon, Volume2, VolumeX, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/app/layout"; // Import useAuth from root layout

interface SettingsDropdownProps {
    theme: string;
    toggleTheme: () => void;
}

export function SettingsDropdown({ 
    theme, 
    toggleTheme, 
}: SettingsDropdownProps) {
    const { user, userRole } = useAuth(); // Get user and role from context

    const isAdmin = userRole === 'admin';

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Settings className="h-5 w-5" />
                    <span className="sr-only">Configuración</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
                <DropdownMenuLabel>Configuración del Panel</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                    <DropdownMenuItem className="focus:bg-transparent cursor-default">
                        <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isAdmin ? 'bg-green-500/10' : 'bg-primary/10'}`}>
                                <User className={`w-5 h-5 ${isAdmin ? 'text-green-500' : 'text-primary'}`} />
                            </div>
                            <div>
                                <p className="font-semibold truncate">{user?.email || "Operador"}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <ShieldCheck className={`w-3 h-3 ${isAdmin ? 'text-green-500' : 'text-muted-foreground'}`} />
                                    <span className="capitalize">{userRole || "Cargando..."}</span>
                                </p>
                            </div>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />

                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <div className="flex items-center justify-between w-full">
                        <Label htmlFor="theme-toggle" className="flex items-center gap-2 cursor-pointer">
                           {theme === 'dark' ? <Moon className="w-4 h-4"/> : <Sun className="w-4 h-4"/>}
                           Modo Oscuro
                        </Label>
                        <Switch
                            id="theme-toggle"
                            checked={theme === 'dark'}
                            onCheckedChange={toggleTheme}
                        />
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
