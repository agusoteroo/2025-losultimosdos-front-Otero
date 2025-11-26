"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import RoutineService from "@/services/routine.service";

export function useBestPerformances(routineId: number) {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["bestPerformances", routineId],
    enabled: !!routineId,
    queryFn: async () => {
      const token = await getToken();
      return RoutineService.getBestPerformances(routineId, token);
    },
  });
}
