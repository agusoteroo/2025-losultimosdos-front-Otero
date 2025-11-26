"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/store/useStore";
import {
  useUserLeaderboard,
  useSedeLeaderboard,
} from "@/hooks/use-leaderboard";
import { LeaderboardPeriod } from "@/types";

import { UserLeaderboard } from "@/components/gamification/user-leaderboard";
import { SedeLeaderboard } from "@/components/gamification/sede-leaderboard";

import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Card, CardContent } from "@/components/ui/card";
import TableSkeleton from "@/components/skeletons/table-skeleton";
import { cn } from "@/lib/utils";

const periods: LeaderboardPeriod[] = ["7d", "30d", "all"];

const periodLabel: Record<LeaderboardPeriod, string> = {
  "7d": "7 días",
  "30d": "30 días",
  all: "Histórico",
};

const periodDescription: Record<LeaderboardPeriod, string> = {
  "7d": "Ideal para ver quién viene on fire esta semana.",
  "30d": "Visión de consistencia en el último mes.",
  all: "Puntaje acumulado de toda la historia.",
};

const AdminLeaderboardPage = () => {
  const { selectedSede } = useStore();
  const [period, setPeriod] = useState<LeaderboardPeriod>("30d");
  const [onlyCurrentSede, setOnlyCurrentSede] = useState(true);

  const sedeFilterId = onlyCurrentSede ? selectedSede.id : undefined;

  const {
    data: userItems,
    isLoading: loadingUsers,
    isFetching: fetchingUsers,
  } = useUserLeaderboard({
    period,
    sedeId: sedeFilterId,
  });

  const {
    data: sedeItems,
    isLoading: loadingSedes,
    isFetching: fetchingSedes,
  } = useSedeLeaderboard({ period });

  const userLeaderboardData = userItems ?? [];
  const sedeLeaderboardData = sedeItems ?? [];

  const isLoading = loadingUsers || loadingSedes;
  const isUpdating = fetchingUsers || fetchingSedes;

  const sedeSubtitle = useMemo(() => {
    if (onlyCurrentSede) return selectedSede?.name;
    return undefined;
  }, [onlyCurrentSede, selectedSede]);

  return (
    <div className="container mx-auto space-y-4 p-4">
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Gamificación & Leaderboards
          </h1>
          <p className="text-sm text-muted-foreground">
            Mirá cómo se mueven los puntos entre usuarios y sedes.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <ToggleGroup
            type="single"
            value={period}
            onValueChange={(value) => {
              if (!value) return;
              setPeriod(value as LeaderboardPeriod);
            }}
            className="flex gap-1"
          >
            {periods.map((p) => (
              <ToggleGroupItem
                key={p}
                value={p}
                className={cn(
                  "px-2 py-1 text-xs sm:text-sm",
                  "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                )}
              >
                {periodLabel[p]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="flex gap-2">
            <Button
              size="sm"
              variant={onlyCurrentSede ? "default" : "outline"}
              onClick={() => setOnlyCurrentSede(true)}
              className="text-xs"
            >
              Sede actual ({selectedSede?.name})
            </Button>
            <Button
              size="sm"
              variant={!onlyCurrentSede ? "default" : "outline"}
              onClick={() => setOnlyCurrentSede(false)}
              className="text-xs"
            >
              Todas las sedes
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          <div className="lg:col-span-2 space-y-2">
            {isUpdating && (
              <p className="text-xs text-muted-foreground mb-1">
                Actualizando datos...
              </p>
            )}
            <UserLeaderboard
              items={userLeaderboardData}
              period={period}
              sedeName={sedeSubtitle}
            />
          </div>

          <div className="lg:col-span-1">
            <SedeLeaderboard items={sedeLeaderboardData} period={period} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLeaderboardPage;
