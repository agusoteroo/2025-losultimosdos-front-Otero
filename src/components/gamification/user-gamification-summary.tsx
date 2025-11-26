// src/components/gamification/UserGamificationSummary.tsx
"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useMyGamification } from "@/hooks/use-my-gamification";
import { getLevelForPoints } from "@/lib/levels";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function UserGamificationSummary() {
  const { userId } = useAuth();
  const { user } = useUser();
  const {
    sede,
    totalPoints,
    totalRank,
    last30Points,
    last30Rank,
    isLoading,
    isFetching,
  } = useMyGamification();

  if (!userId) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-3 w-full" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const { level, progressToNext, nextLevelPoints } =
    getLevelForPoints(totalPoints);

  const isLegendOrHigher = level.level >= 4; // Nivel 4+ → borde animado

  return (
    <Card
      className={cn(
        "relative overflow-hidden border bg-background",
        isLegendOrHigher &&
          "border-transparent bg-[radial-gradient(circle_at_top,_#a855f733,_transparent_55%),_radial-gradient(circle_at_bottom,_#ec489933,_transparent_55%)] before:absolute before:inset-0 before:-z-10 before:bg-[conic-gradient(at_top,_#a855f7,_#ec4899,_#f97316,_#a855f7)] before:opacity-60 before:animate-[spin_8s_linear_infinite]"
      )}
    >
      <div className="absolute inset-0 pointer-events-none opacity-60 dark:opacity-40 bg-[radial-gradient(circle_at_top,_#3b82f620,_transparent_60%),_radial-gradient(circle_at_bottom,_#22c55e20,_transparent_60%)]" />

      <CardHeader className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            Tu progreso en el gym
          </CardTitle>
          <CardDescription>
            Así vienen tus puntos en la sede{" "}
            <span className="font-semibold">{sede?.name ?? "global"}</span>.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          {user?.firstName && (
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user.firstName} {user.lastName ?? ""}
            </span>
          )}
          {user?.imageUrl && (
            <div
              className={cn(
                "rounded-full p-[2px]",
                isLegendOrHigher &&
                  "bg-[conic-gradient(from_0deg,_#a855f7,_#ec4899,_#f97316,_#a855f7)] animate-[spin_10s_linear_infinite]"
              )}
            >
              <img
                src={user.imageUrl}
                alt="Avatar"
                className={cn(
                  "h-9 w-9 rounded-full border shadow-sm",
                  isLegendOrHigher && "border-transparent"
                )}
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full shadow-md",
                level.colorClass,
                isLegendOrHigher &&
                  "ring-2 ring-offset-2 ring-offset-background ring-purple-400/80 animate-pulse"
              )}
            >
              <span className="text-2xl">{level.icon}</span>
            </div>
            <div>
              <div className="text-xs text-muted-foreground uppercase">
                Nivel actual
              </div>
              <div className="text-lg font-bold">
                Nivel {level.level} · {level.name}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                <Badge
                  variant="secondary"
                  className={cn(
                    "text-[10px] px-2 py-0.5 border-none",
                    level.colorClass
                  )}
                >
                  {totalPoints.toLocaleString("es-AR")} pts
                </Badge>
              </div>
            </div>
          </div>

          <div className="text-sm flex flex-col items-start sm:items-end gap-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase">
                Ranking en tu sede
              </span>
              {isFetching && (
                <span className="text-[11px] text-muted-foreground">
                  Actualizando...
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold">{totalRank ?? "–"}</span>
              <span className="text-xs text-muted-foreground">posición</span>
            </div>
          </div>
        </div>

        {level.perks.length > 0 && (
          <div className="mt-1">
            <div className="text-[11px] text-muted-foreground mb-1">
              Beneficios de tu nivel:
            </div>
            <ul className="text-[11px] text-muted-foreground space-y-0.5">
              {level.perks.map((perk) => (
                <li key={perk} className="flex gap-1">
                  <span>•</span>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Progreso de nivel */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progreso hacia el próximo nivel</span>
            <span>{progressToNext}%</span>
          </div>
          <Progress value={progressToNext} className="h-2" />
          {nextLevelPoints && (
            <p className="text-[11px] text-muted-foreground mt-1">
              Te faltan{" "}
              <span className="font-semibold">
                {Math.max(0, nextLevelPoints - totalPoints)} pts
              </span>{" "}
              para el próximo nivel.
            </p>
          )}
        </div>

        {/* Stats de los últimos 30 días */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg border bg-background/80 backdrop-blur-sm px-3 py-3">
            <div className="text-[11px] font-medium text-muted-foreground uppercase">
              Últimos 30 días
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-semibold">
                {last30Points.toLocaleString("es-AR")}
              </span>
              <span className="text-xs text-muted-foreground">pts</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {last30Points > 0
                ? "Seguí así, estás sumando seguido 💪"
                : "Todavía no sumaste puntos este mes. ¡Momento de arrancar!"}
            </p>
          </div>

          <div className="rounded-lg border bg-background/80 backdrop-blur-sm px-3 py-3">
            <div className="text-[11px] font-medium text-muted-foreground uppercase">
              Ranking mensual
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-semibold">{last30Rank ?? "–"}</span>
              <span className="text-xs text-muted-foreground">posición</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {last30Rank
                ? "Esta es tu posición según los puntos del último mes."
                : "Todavía no entrás al ranking de este mes. Sumá puntos con clases y rutinas asignadas."}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
