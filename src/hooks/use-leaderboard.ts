"use client";

import { useQuery } from "@tanstack/react-query";
import GamificationService from "@/services/gamification.service";
import {
  LeaderboardPeriod,
  UserLeaderboardItem,
  SedeLeaderboardItem,
} from "@/types";

export function useUserLeaderboard(params: {
  period: LeaderboardPeriod;
  sedeId?: number;
}) {
  const { period, sedeId } = params;

  return useQuery<UserLeaderboardItem[]>({
    queryKey: ["leaderboard-users", { period, sedeId }],
    queryFn: () =>
      GamificationService.getUserLeaderboard({
        period,
        sedeId,
      }),
  });
}

export function useSedeLeaderboard(params: { period: LeaderboardPeriod }) {
  const { period } = params;

  return useQuery<SedeLeaderboardItem[]>({
    queryKey: ["leaderboard-sedes", { period }],
    queryFn: () =>
      GamificationService.getSedeLeaderboard({
        period,
      }),
  });
}
