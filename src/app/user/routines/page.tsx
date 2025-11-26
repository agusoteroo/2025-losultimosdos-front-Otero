"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import RoutineService from "@/services/routine.service";
import { useQuery } from "@tanstack/react-query";
import { DataTable } from "@/components/ui/data-table";
import TableSkeleton from "@/components/skeletons/table-skeleton";
import { useAuth, useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { columns } from "@/components/routines/columns";
import { ICONS } from "@/components/forms/routine";
import { Routine } from "@/types";
import { ColumnDef } from "@tanstack/react-table";

const RoutinesPage = () => {
  const { getToken } = useAuth();
  const { user } = useUser();
  const { data: routines, isLoading } = useQuery({
    queryKey: ["userRoutines"],
    queryFn: async () => {
      const routines = await RoutineService.getUserRoutines(
        user?.id as string,
        await getToken()
      );
      return routines;
    },
  });

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (!routines) {
    return (
      <DataTable
        data={[]}
        columns={columns}
        noDataMessage="No tienes rutinas registradas, por favor contacta al administrador"
      />
    );
  }

  const extraColumns: ColumnDef<Routine>[] = [
    {
      header: "Acciones",
      accessorKey: "actions",
      cell: ({ row }) => (
        <div className="flex gap-2 justify-end">
          <Button asChild variant="outline" size="sm">
            <Link href={`/user/routines/${row.original.id}`}>Ver</Link>
          </Button>
          <Button asChild size="sm">
            <Link href={`/user/routines/${row.original.id}/play`}>
              Comenzar
            </Link>
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="container mx-auto space-y-4 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-lg font-bold">Mis Rutinas</h1>
      </div>
      <>
        <div className="hidden sm:block">
          <DataTable
            columns={columns}
            data={routines}
            extraColumns={extraColumns}
          />
        </div>

        <div className="sm:hidden space-y-3">
          {routines.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-gray-500 dark:text-gray-400">
                  No hay rutinas disponibles.
                </p>
              </CardContent>
            </Card>
          ) : (
            routines.map((rt) => (
              <Card key={rt.id} className="overflow-hidden">
                <CardHeader className="pb-2 items-center">
                  <CardTitle className="text-base flex  gap-2 ">
                    {(() => {
                      const key = (rt.icon ?? "").toString().toLowerCase();
                      const IconCmp = ICONS[key as keyof typeof ICONS];
                      return IconCmp ? (
                        <IconCmp className="h-4 w-4" aria-hidden />
                      ) : null;
                    })()}
                    <span>{rt.name ?? "Rutina sin nombre"}</span>
                  </CardTitle>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-500 dark:text-gray-400">
                      Descripción
                    </div>
                    <div className="text-right text-gray-900 dark:text-gray-100">
                      {rt.description ?? "-"}
                    </div>

                    <div className="text-gray-500 dark:text-gray-400">
                      Nivel
                    </div>
                    <div className="text-right text-gray-900 dark:text-gray-100">
                      {rt.level ?? "-"}
                    </div>

                    <div className="text-gray-500 dark:text-gray-400">
                      Duración
                    </div>
                    <div className="text-right text-gray-900 dark:text-gray-100">
                      {rt.duration ?? "-"}
                    </div>
                  </div>

                  {rt.description ? (
                    <p className="mt-3 text-xs text-gray-600 dark:text-gray-300 line-clamp-4">
                      {rt.description}
                    </p>
                  ) : null}

                  <div className="mt-4 flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="flex-1"
                    >
                      <Link href={`/user/routines/${rt.id}`}>Ver</Link>
                    </Button>
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/user/routines/${rt.id}/play`}>
                        Comenzar
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </>
    </div>
  );
};

export default RoutinesPage;
