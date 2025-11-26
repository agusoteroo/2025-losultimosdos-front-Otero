"use client";

import { LeaderboardPeriod, SedeLeaderboardItem } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface SedeLeaderboardProps {
  items: SedeLeaderboardItem[];
  period: LeaderboardPeriod;
}

const periodLabel: Record<LeaderboardPeriod, string> = {
  all: "Histórico",
  "30d": "Últimos 30 días",
  "7d": "Última semana",
};

export function SedeLeaderboard({ items, period }: SedeLeaderboardProps) {
  const maxPoints = items[0]?.totalPoints ?? 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            Ranking de sedes
          </CardTitle>
          <CardDescription>{periodLabel[period]}</CardDescription>
        </div>
        <Badge variant="outline" className="text-xs">
          {items.length} sedes
        </Badge>
      </CardHeader>
      <CardContent className="pt-0">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Todavía no hay puntos registrados para este período.
          </p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => {
              const pct =
                maxPoints > 0
                  ? Math.round((item.totalPoints / maxPoints) * 100)
                  : 0;

              return (
                <div
                  key={item.sedeId}
                  className={cn(
                    "rounded-lg border dark:border-gray-800 p-3",
                    item.rank === 1 &&
                      "border-amber-400/80 bg-amber-50/60 dark:bg-amber-950/30"
                  )}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-muted-foreground w-5 text-center">
                        #{item.rank}
                      </span>
                      <span className="text-sm font-semibold">
                        {item.sedeName}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {item.totalPoints.toLocaleString("es-AR")} pts
                    </span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
