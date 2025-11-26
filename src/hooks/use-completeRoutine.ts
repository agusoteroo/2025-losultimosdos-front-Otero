"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import RoutineService from "@/services/routine.service";
import { useAuth } from "@clerk/nextjs";
import { useStore } from "@/store/useStore";
import { useEvaluateChallenges } from "@/hooks/use-evaluate-challenge"; // 👈 nuevo import

export function useCompleteRoutine(routineId: number) {
  const { getToken, userId } = useAuth();
  const queryClient = useQueryClient();
  const { selectedSede } = useStore();
  const { mutate: evaluateChallenges } = useEvaluateChallenges(); // 👈 lo usamos luego

  return useMutation({
    mutationFn: async (
      performances: {
        exerciseId: number;
        completed: boolean;
        weight: string;
        reps: string;
      }[]
    ) => {
      const cleanPerformances = performances
        .filter((ex) => ex.completed && ex.weight && ex.reps)
        .map((ex) => ({
          exerciseId: ex.exerciseId,
          weight: Number(ex.weight),
          reps: Number(ex.reps),
        }));

      const token = await getToken();
      return RoutineService.completeRoutine(
        routineId,
        cleanPerformances,
        token!
      );
    },

    onSuccess: () => {
      if (!userId) return;

      // invalidate routines
      queryClient.invalidateQueries({ queryKey: ["userRoutines", userId] });

      // invalidate best performances for this routine
      queryClient.invalidateQueries({
        queryKey: ["routineBestPerformances", routineId],
      });

      // invalidate badges
      queryClient.invalidateQueries({ queryKey: ["userBadges", userId] });

      // invalidate leaderboard
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

      // 👇 acá se evalúan desafíos (daily/weekly) y si hay nuevos,
      // el propio hook useEvaluateChallenges muestra el toast y
      // hace invalidate de ["challenges", ...] y ["my-gamification", ...]
      evaluateChallenges();
    },
  });
}
