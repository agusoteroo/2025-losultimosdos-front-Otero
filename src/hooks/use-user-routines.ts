"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import RoutineService from "@/services/routine.service";

export function useUserRoutines() {
  const { userId, getToken } = useAuth();

  return useQuery({
    queryKey: ["userRoutines", userId],
    enabled: !!userId,
    queryFn: async () => {
      const token = await getToken();
      return RoutineService.getUserRoutines(userId!, token);
    },
  });
}
