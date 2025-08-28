
"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Settings, User, Sun, Moon, Volume2, VolumeX, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface SettingsDropdownProps {
    theme: string;
    toggleTheme: () => void;
    isSoundOn: boolean;
    setIsSoundOn: (isOn: boolean) => void;
    operatorName: string;
    operatorRole: string;
}

export function SettingsDropdown({ 
    theme, 
    toggleTheme, 
    isSoundOn, 
    setIsSoundOn,
    operatorName,
    operatorRole
}: SettingsDropdownProps) {

    const handleSoundToggle = (checked: boolean) => {
        setIsSoundOn(checked);
        localStorage.setItem("sound", checked ? "on" : "off");
    };

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
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <p className="font-semibold truncate">{operatorName}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                    <ShieldCheck className="w-3 h-3 text-green-500" />
                                    <span className="capitalize">{operatorRole}</span>
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
                 <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <div className="flex items-center justify-between w-full">
                        <Label htmlFor="sound-toggle" className="flex items-center gap-2 cursor-pointer">
                           {isSoundOn ? <Volume2 className="w-4 h-4"/> : <VolumeX className="w-4 h-4"/>}
                           Sonido de Alerta
                        </Label>
                        <Switch
                            id="sound-toggle"
                            checked={isSoundOn}
                            onCheckedChange={handleSoundToggle}
                        />
                    </div>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

    