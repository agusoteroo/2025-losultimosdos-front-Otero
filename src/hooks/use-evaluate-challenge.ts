// src/hooks/use-evaluate-challenges.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiService from "@/services/api.service";
import { useAuth } from "@clerk/nextjs";
import { useStore } from "@/store/useStore";
import { toast } from "react-hot-toast";

type EvaluateResponseItem = {
  challengeId: number;
  title: string;
  frequency: "DAILY" | "WEEKLY";
  pointsAwarded: number;
};

type EvaluateResponse = {
  items: EvaluateResponseItem[];
};

export function useEvaluateChallenges() {
  const { getToken } = useAuth();
  const { selectedSede } = useStore();
  const sedeId = selectedSede?.id;
  const queryClient = useQueryClient();

  const mutation = useMutation<EvaluateResponse>({
    mutationFn: async () => {
      const token = await getToken();
      const res = await apiService.post(
        "/user/challenges/evaluate",
        {},
        token!
      );
      return res as EvaluateResponse;
    },
    onSuccess: (data) => {
      if (data.items.length > 0) {
        const totalPoints = data.items.reduce(
          (acc, item) => acc + (item.pointsAwarded ?? 0),
          0
        );
        toast.success(
          `¡Completaste ${data.items.length} desafío(s) y ganaste ${totalPoints} puntos! 🎯`
        );
      }

      // refrescar desafíos y gamificación
      if (sedeId) {
        queryClient.invalidateQueries({
          queryKey: ["challenges", "DAILY", sedeId],
        });
        queryClient.invalidateQueries({
          queryKey: ["challenges", "WEEKLY", sedeId],
        });
        queryClient.invalidateQueries({
          queryKey: ["my-gamification", sedeId],
        });
      }
    },
  });

  return mutation;
}
