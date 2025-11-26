"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiService from "@/services/api.service";
import { useStore } from "@/store/useStore";
import { ChallengeFrequency } from "@/types/index";
import { toast } from "react-hot-toast";
import { useAuth } from "@clerk/nextjs";

type CompleteChallengeOptions = {
  challengeId: number;
  frequency: ChallengeFrequency;
};
export const useCompleteChallenge = () => {
  const { selectedSede } = useStore();
  const sedeId = selectedSede?.id;

  const queryClient = useQueryClient();
  const { getToken } = useAuth();

  const mutation = useMutation<void, Error, CompleteChallengeOptions>({
    mutationFn: async ({ challengeId }) => {
      if (!sedeId) throw new Error("Sede no seleccionada");

      const token = await getToken(); // 🔐

      await apiService.post(
        `/user/challenges/${challengeId}/complete?sedeId=${sedeId}`,
        {},
        token! // 🔐 tercer argumento requerido
      );
    },

    onSuccess: (_data, variables) => {
      toast.success("Desafío completado, sumaste puntos 💪");

      queryClient.invalidateQueries({
        queryKey: ["challenges", variables.frequency, sedeId],
      });

      queryClient.invalidateQueries({
        queryKey: ["my-gamification", sedeId],
      });
    },

    onError: (err: any) => {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        "No se pudo completar el desafío";
      toast.error(msg);
    },
  });

  return {
    completeChallenge: mutation.mutate,
    isLoading: mutation.isPending,
  };
};
