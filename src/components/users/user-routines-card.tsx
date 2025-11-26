"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@clerk/nextjs";
import apiService from "@/services/api.service";
import { Plus } from "lucide-react";
import { toast } from "react-hot-toast";
import { Routine } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RoutineExercise } from "@/types";
import routineService from "@/services/routine.service";
import React from "react";
import { ICON_OPTIONS } from "../forms/routine";
import { Activity } from "lucide-react";
import AvailableRoutinesModal from "../routines/routines-modal";
import { User } from "@/types";

interface UserRoutine {
  id: number;
  name: string;
  category: string;
  exercises: number;
  createdAt: string;
}

interface UserRoutinesCardProps {
  user: User;
}

const useIsMobile = (query = "(max-width: 640px)") => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent | MediaQueryList) =>
      setIsMobile("matches" in e ? e.matches : (e as MediaQueryList).matches);
    onChange(mql);
    mql.addEventListener?.("change", onChange as any);
    return () => mql.removeEventListener?.("change", onChange as any);
  }, [query]);
  return isMobile;
};

const UserRoutinesCard = ({ user }: UserRoutinesCardProps) => {
  const isMobile = useIsMobile();
  const { id: userId, sedeId } = user;
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  const { data: routines = [], isLoading: isLoadingRoutines } = useQuery<
    (Routine & { exercises: RoutineExercise[] })[]
  >({
    queryKey: ["routines", sedeId],
    queryFn: async () => {
      const token = await getToken();
      const response = await apiService.get(
        `/routines?sedeId=${sedeId}`,
        token!
      );

      return response.items || [];
    },
  });
  const userRoutines = routines.filter((rt: any) => rt.users?.includes(userId));

  const { mutate: unassignRoutine } = useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken();
      await routineService.unassignRoutine(userId, id, token!);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["routines"] });
      const prevRoutines = queryClient.getQueryData<Routine[]>(["routines"]);
      queryClient.setQueryData<Routine[]>(["routines"], (old = []) =>
        old.map((r) =>
          r.id === id ? { ...r, users: r.users.filter((u) => u !== userId) } : r
        )
      );
      toast.success("Rutina desasignada correctamente", {
        id: "unassign-routine",
      });
      return { prevRoutines };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routines"] });
    },
    onError: (error, id, context) => {
      if (context?.prevRoutines) {
        queryClient.setQueryData(["routines"], context.prevRoutines);
      }
      toast.error("Error desasignando la rutina", { id: "unassign-routine" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", sedeId] });
    },
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Rutinas del Usuario</CardTitle>
          <AvailableRoutinesModal routines={routines} userId={userId} />
        </div>
      </CardHeader>
      <CardContent>
        {userRoutines.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-center py-8">
            No hay rutinas registradas para este usuario
          </p>
        ) : isMobile ? (
          // ===== MOBILE: CARDS =====
          <div className="space-y-3">
            {userRoutines.map((rt) => (
              <div
                className="rounded-lg border p-3 text-sm grid grid-cols-2 gap-2"
                key={rt.id}
              >
                <div className="text-gray-500 dark:text-gray-400">Rutina</div>
                <div className="text-right text-gray-900 dark:text-gray-100">
                  {rt.name}
                </div>

                <div className="text-gray-500 dark:text-gray-400">Nivel</div>
                <div className="text-right">{rt.level}</div>

                <div className="text-gray-500 dark:text-gray-400">
                  Ejercicios
                </div>
                <div className="text-right text-gray-900 dark:text-gray-100">
                  {rt.exercises.length}
                </div>
                <div className="col-span-2 pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => unassignRoutine(rt.id)}
                  >
                    Desasignar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b dark:border-gray-700">
                <tr>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400 w-10" />
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">
                    Rutina
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">
                    Ejercicios
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">
                    Nivel
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400">
                    Duración
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-gray-500 dark:text-gray-400 " />
                </tr>
              </thead>
              <tbody>
                {userRoutines.map((routine) => (
                  <tr
                    key={routine.id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      {React.createElement(
                        ICON_OPTIONS.find((icon) => icon.value === routine.icon)
                          ?.Icon ?? Activity
                      )}
                    </td>
                    <td className="py-3 px-4 font-medium text-gray-900 dark:text-gray-100">
                      {routine.name}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                      {routine.exercises.length}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                      {routine.level}
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                      {routine.duration} semanas
                    </td>
                    <td className="py-3 px-4 text-gray-600 dark:text-gray-300">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="cursor-pointer w-24"
                        onClick={() => unassignRoutine(routine.id)}
                      >
                        Desasignar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserRoutinesCard;
