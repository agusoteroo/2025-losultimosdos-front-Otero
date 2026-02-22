"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import { Building2, Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { Separator } from "./ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar";
import { Button } from "./ui/button";
import { useStore } from "@/store/useStore";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import apiService, { ApiValidationError } from "@/services/api.service";
import { Sede } from "@/types";
import { Skeleton } from "./ui/skeleton";
import { SedeForm, SedeFormValues } from "./forms/sede";
import toast from "react-hot-toast";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useUser } from "@/hooks/use-user";

export function SedesSwitcher({ isAdmin }: { isAdmin: boolean }) {
  const { selectedSede, setSelectedSede } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const { userId, isLoaded: isAuthLoaded } = useAuth();
  const { user } = useClerk();
  const queryClient = useQueryClient();
  const { data: sedes, isLoading } = useQuery({
    queryKey: ["sedes"],
    enabled: !!userId,
    queryFn: async () => {
      const data = await apiService.get("/sedes");
      const fetchedSedes = data.sedes as Sede[];

      // Only set sede from user metadata if no valid sede is persisted
      const persistedSedeExists = fetchedSedes.some(
        (sede: Sede) => sede.id === selectedSede?.id
      );

      if (!persistedSedeExists) {
        const userSede = fetchedSedes.find(
          (sede: Sede) => sede.id === Number(user?.publicMetadata.sede)
        );
        if (userSede) {
          setSelectedSede(userSede);
        }
      }

      return fetchedSedes;
    },
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCreateSede = async (values: SedeFormValues) => {
    try {
      await apiService.post("/admin/sedes", values);
      toast.success("Sede creada correctamente");
      setIsModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["sedes"] });
    } catch (error) {
      console.error(error);
      if (error instanceof ApiValidationError) {
        toast.error(error.details[0].message);
      } else {
        toast.error("Error al crear la sede");
      }
    }
  };

  const handleAddSedeClick = () => {
    setIsModalOpen(true);
  };

  const handleSedeSelect = (sede: Sede) => {
    setSelectedSede(sede);
  };

  if (!mounted || !isAuthLoaded || isLoading) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <Skeleton className="h-10 w-full rounded-md" />
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        {isAdmin ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between hover:bg-accent hover:text-accent-foreground transition-colors"
                aria-label="Seleccionar sede"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 opacity-70" />
                  <span className="font-medium">
                    {selectedSede?.name || "Seleccionar sede"}
                  </span>
                </div>
                <ChevronsUpDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-[--radix-dropdown-menu-trigger-width] min-w-[200px]"
              align="start"
            >
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Sedes disponibles
              </DropdownMenuLabel>
              {sedes && sedes.length > 0 ? (
                sedes.map((sede) => (
                  <DropdownMenuItem
                    key={sede.id}
                    onSelect={() => handleSedeSelect(sede)}
                    className="cursor-pointer"
                  >
                    <Building2 className="mr-2 h-4 w-4 opacity-70" />
                    <span className="flex-1">{sede.name}</span>
                    {sede.id === selectedSede?.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  No hay sedes disponibles
                </DropdownMenuItem>
              )}
              <Separator className="my-1" />
              <DropdownMenuItem
                onSelect={handleAddSedeClick}
                className="cursor-pointer text-primary"
                tabIndex={0}
                aria-label="Agregar nueva sede"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                <span className="font-medium">Agregar sede</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground">Sede actual</span>
              <span className="text-sm font-medium">
                {selectedSede?.name || "Sin sede asignada"}
              </span>
            </div>
          </div>
        )}
      </SidebarMenuItem>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Agregar nueva sede
            </DialogTitle>
            <DialogDescription>
              Completa los datos de la nueva sede y selecciona su ubicación en
              el mapa.
            </DialogDescription>
          </DialogHeader>
          <SedeForm onSubmit={handleCreateSede} existingSedes={sedes || []} />
        </DialogContent>
      </Dialog>
    </SidebarMenu>
  );
}
