// src/hooks/use-challenges.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import apiService from "@/services/api.service";
import { useStore } from "@/store/useStore";
import { Challenge, ChallengeFrequency } from "@/types/index";
import { useAuth } from "@clerk/nextjs";

type ChallengeResponse = {
  challenges: Challenge[];
};

export function useChallenges(frequency: ChallengeFrequency) {
  const { selectedSede } = useStore();
  const sedeId = selectedSede?.id;
  const { getToken } = useAuth();

  const enabled = !!sedeId;

  const { data, isLoading, isFetching, error } = useQuery<ChallengeResponse>({
    queryKey: ["challenges", frequency, sedeId],
    queryFn: async () => {
      if (!sedeId) throw new Error("Sede no seleccionada");

      const token = await getToken();
      const freqParam = frequency.toLowerCase(); // "daily" | "weekly"

      const res = await apiService.get(
        `/user/challenges?frequency=${freqParam}&sedeId=${sedeId}`,
        token!
      );

      return res as ChallengeResponse;
    },
    enabled,
  });

  return {
    challenges: data?.challenges ?? [],
    isLoading,
    isFetching,
    error,
  };
}
