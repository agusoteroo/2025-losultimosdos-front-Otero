"use client";

import { useAuth } from "@clerk/nextjs";
import { useStore } from "@/store/useStore";
import { useUserLeaderboard } from "./use-leaderboard";
import { LeaderboardPeriod } from "@/types";

export function useMyGamification() {
  const { userId } = useAuth();
  const { selectedSede } = useStore();

  const sedeId = selectedSede?.id;

  const allQuery = useUserLeaderboard({
    period: "all" as LeaderboardPeriod,
    sedeId,
  });

  const last30Query = useUserLeaderboard({
    period: "30d" as LeaderboardPeriod,
    sedeId,
  });

  const allItems = allQuery.data ?? [];
  const last30Items = last30Query.data ?? [];

  const myAllRow = allItems.find((i) => i.userId === userId) ?? null;
  const myLast30Row = last30Items.find((i) => i.userId === userId) ?? null;

  const totalPoints = myAllRow?.totalPoints ?? 0;
  const totalRank = myAllRow?.rank ?? null;

  const last30Points = myLast30Row?.totalPoints ?? 0;
  const last30Rank = myLast30Row?.rank ?? null;

  return {
    sede: selectedSede,
    totalPoints,
    totalRank,
    last30Points,
    last30Rank,
    isLoading: allQuery.isLoading || last30Query.isLoading,
    isFetching: allQuery.isFetching || last30Query.isFetching,
  };
}
