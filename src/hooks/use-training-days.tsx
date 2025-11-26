// src/hooks/use-training-days.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import apiService from "@/services/api.service";
import { useAuth } from "@clerk/nextjs";

type TrainingDaysResponse = {
  year: number;
  month: number;
  trainingDays: string[]; // ["2025-11-03", ...]
};

export function useTrainingDays(viewDate: Date) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth() + 1;
  const { getToken } = useAuth();

  const { data, isLoading, isFetching, error } = useQuery<TrainingDaysResponse>({
    queryKey: ["training-days", year, month],
    queryFn: async () => {
      const token = await getToken();
      const res = await apiService.get(
        `/user/training-days?year=${year}&month=${month}`,
        token!
      );
      return res as TrainingDaysResponse;
    },
  });

  return {
    year,
    month,
    trainingDays: data?.trainingDays ?? [],
    isLoading,
    isFetching,
    error,
  };
}
