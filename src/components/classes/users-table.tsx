"use client";

import { DataTable } from "../ui/data-table";
import { Row, type ColumnDef } from "@tanstack/react-table";
import { type GymClass } from "@/types";
import { columns } from "./columns";
import { Button } from "../ui/button";
import { ClerkLoaded, ClerkLoading, useAuth } from "@clerk/nextjs";
import apiService from "@/services/api.service";
import { toast } from "react-hot-toast";
import { useEffect, useState } from "react";
import { Skeleton } from "../ui/skeleton";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import { useEvaluateChallenges } from "@/hooks/use-evaluate-challenge"; 

const UsersActionColumn = ({
  row,
  onClassesChanged,
}: {
  row: Row<GymClass>;
  onClassesChanged?: () => void;
}) => {
  const { userId, getToken } = useAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const queryClient = useQueryClient();
  const { selectedSede } = useStore();
  const { mutate: evaluateChallenges } = useEvaluateChallenges(); 

  useEffect(() => {
    if (userId) {
      setEnrolled(row.original.users.includes(userId));
    }
  }, [userId, row.original.users]);

  const handleEnroll = async (classId: number) => {
    try {
      setIsLoading(true);
      const token = await getToken();
      await apiService.post(
        enrolled ? "/user/unenroll" : "/user/enroll",
        { classId },
        token!
      );

      const wasEnrolled = enrolled;
      setEnrolled(!enrolled);

      toast.success(
        enrolled
          ? "Inscripción cancelada con éxito"
          : "Inscripción realizada con éxito",
        { id: "enroll-class" }
      );

      // refresca la lista de clases vía React Query (refetch en page.tsx)
      onClassesChanged?.();

      // refresca progreso gamificado (leaderboards "all" y "30d")
      queryClient.invalidateQueries({
        queryKey: [
          "leaderboard-users",
          { period: "all", sedeId: selectedSede.id },
        ],
      });
      queryClient.invalidateQueries({
        queryKey: [
          "leaderboard-users",
          { period: "30d", sedeId: selectedSede.id },
        ],
      });

      // refresca los badges del usuario
      if (userId) {
        queryClient.invalidateQueries({
          queryKey: ["userBadges", userId],
        });
      }

      // 🔥 si el usuario se ACABA de inscribir (antes no lo estaba),
      // evaluamos desafíos. Si se completa alguno, el propio hook
      // useEvaluateChallenges muestra el toast y refresca gamificación.
      if (!wasEnrolled) {
        evaluateChallenges();
      }

      // por si lo usás en server components
      router.refresh();
    } catch (error: any) {
      if (error?.status === 403) {
        toast.error("Con el plan básico solo puedes inscribirte en 3 clases", {
          id: "enroll-class",
        });
      } else {
        toast.error("Hubo un error al procesar tu solicitud", {
          id: "enroll-class",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className=" px-4 py-2 flex gap-2 items-center justify-end">
      <ClerkLoading>
        <Skeleton className="w-[150px] h-[36px]" />
      </ClerkLoading>
      <ClerkLoaded>
        {enrolled ? (
          <Button
            variant="destructive"
            onClick={() => handleEnroll(row.original.id)}
            disabled={isLoading}
            className="w-[150px]"
          >
            {isLoading ? "Cancelando..." : "Cancelar inscripción"}
          </Button>
        ) : (
          <Button
            variant="default"
            onClick={() => handleEnroll(row.original.id)}
            disabled={isLoading}
            className="w-[150px]"
          >
            {isLoading ? "Inscribiendo..." : "Inscribirse"}
          </Button>
        )}
      </ClerkLoaded>
    </div>
  );
};

export const UsersClassesTable = ({
  classes,
  onClassesChanged,
}: {
  classes: GymClass[];
  onClassesChanged?: () => void;
}) => {
  const usersColumns: ColumnDef<GymClass>[] = [
    ...columns,
    {
      accessorKey: "actions",
      header: () => (
        <div className="w-min px-4 py-2 flex gap-2 items-center justify-center">
          Acciones
        </div>
      ),
      cell: ({ row }) => (
        <UsersActionColumn row={row} onClassesChanged={onClassesChanged} />
      ),
    },
  ];

  return (
    <DataTable
      columns={usersColumns}
      data={classes.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      )}
      headerClassName="last:items-center last:justify-end last:w-min last:w-[100px] last:min-w-[100px]"
    />
  );
};
